/**
 * AI Reasoning Service
 * Memanggil HP3M AI Reasoning Engine secara CHUNKED untuk menghindari
 * 504 Gateway Timeout dari nginx di server reasoning engine.
 *
 * ENV:
 *   AI_REASONING    — base URL engine (boleh dengan /docs, akan di-strip)
 *   REASONING_KEYS  — API key (X-API-Key header)
 *
 * STRATEGI CHUNKED:
 *   Meskipun panduan menyebut "kirim sekaligus", kenyataannya nginx di server
 *   reasoning engine memiliki batas waktu yang menyebabkan 504 jika terlalu
 *   banyak item dikirim bersamaan. Solusi: kirim CHUNK_SIZE item per request,
 *   kumpulkan semua hasil, urutan dijaga sama dengan input.
 */

const REASONING_BASE = (process.env.AI_REASONING ?? "")
  .replace(/\/docs\/?$/, "")
  .replace(/\/$/, "");

const REASONING_KEY = process.env.REASONING_KEYS ?? "";

// ─── Config ───────────────────────────────────────────────────────────────────
const CHUNK_SIZE        = 1;       // 1 item per request — minimal load di engine
const CHUNK_TIMEOUT_MS  = 590_000; // 590 detik timeout per chunk
const CHUNK_DELAY_MS    = 3_000;   // 3 detik jeda antar chunk
const MAX_RETRIES       = 1;       // 1x retry jika gagal

// ─── Helper: fetch dengan AbortController timeout ─────────────────────────────
async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ─── Kirim satu chunk ke engine, retry sekali jika network error ──────────────
async function sendChunk(scores, organization, provider, chunkIndex, totalChunks) {
  const url = `${REASONING_BASE}/api/v1/reasoning/analyze/batch`;

  // Format sesuai panduan: field "scores", "score", "target_level"
  // Provider: opsional — jika null tidak dikirim (server pakai Llama default)
  const body = {
    ...(organization ? { organization } : {}),
    scores,
    ...(provider ? { provider } : {}),
  };

  const fetchOpts = {
    method:  "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key":    REASONING_KEY,
    },
    body: JSON.stringify(body),
  };

  const label = `chunk ${chunkIndex + 1}/${totalChunks} (${scores.length} item)`;

  // Attempt 1
  try {
    console.log(`[AI] Mengirim ${label}...`);
    const res = await fetchWithTimeout(url, fetchOpts, CHUNK_TIMEOUT_MS);
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      // 4xx = kesalahan data, jangan retry
      if (res.status >= 400 && res.status < 500) {
        throw new Error(`HTTP ${res.status}: ${txt}`);
      }
      throw new Error(`HTTP ${res.status} (server error): ${txt}`);
    }
    const data = await res.json();
    console.log(`[AI] ✅ ${label} selesai`);
    return data;
  } catch (err1) {
    // Jika 4xx atau bukan network/timeout error, lempar langsung
    if (err1.message?.startsWith("HTTP 4")) throw err1;

    console.warn(`[AI] ⚠️ ${label} gagal (${err1.message}), retry dalam 5 detik...`);
    await sleep(5000);

    // Attempt 2
    const res = await fetchWithTimeout(url, fetchOpts, CHUNK_TIMEOUT_MS);
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`AI Reasoning Engine error ${res.status}: ${txt}`);
    }
    const data = await res.json();
    console.log(`[AI] ✅ ${label} selesai (retry)`);
    return data;
  }
}

/**
 * batchAnalyze — entry point utama.
 *
 * Memproses assessments secara chunked (CHUNK_SIZE item per request).
 * Field dikonversi ke format panduan: score, target_level, scores.
 *
 * @param {Array}  assessments      - Array { dimension, sub_dimension, final_result, expected_level, assessment_note, level_definitions }
 * @param {Object} organization     - { name, sector? } untuk konteks LLM (opsional)
 * @param {Object} providerOverride - Override provider config (opsional, null = server default Llama)
 * @returns {Promise<Array>}        - Array AnalysisResultResponse, urutan sama dengan input
 */
export async function batchAnalyze(assessments, organization = null, providerOverride = null) {
  if (!REASONING_BASE) throw new Error("AI_REASONING env variable belum diatur.");
  if (!REASONING_KEY)  throw new Error("REASONING_KEYS env variable belum diatur.");

  // Konversi field ke format panduan resmi
  const allScores = assessments.map(a => ({
    dimension:      a.dimension,
    sub_dimension:  a.sub_dimension,
    score:          a.final_result,     // "score" sesuai panduan
    target_level:   a.expected_level,   // "target_level" sesuai panduan
    ...(a.assessment_note    ? { assessment_note:    a.assessment_note    } : {}),
    ...(a.level_definitions  ? { level_definitions:  a.level_definitions  } : {}),
  }));

  const totalChunks = Math.ceil(allScores.length / CHUNK_SIZE);
  console.log(`[AI] Total ${allScores.length} item → ${totalChunks} chunk(s) × ${CHUNK_SIZE} item`);

  const results = [];

  for (let i = 0; i < allScores.length; i += CHUNK_SIZE) {
    const chunkScores = allScores.slice(i, i + CHUNK_SIZE);
    const chunkIdx    = Math.floor(i / CHUNK_SIZE);

    const chunkResults = await sendChunk(
      chunkScores,
      organization,
      providerOverride,
      chunkIdx,
      totalChunks
    );

    results.push(...chunkResults);

    // Jeda antar chunk agar nginx server tidak kewalahan
    if (i + CHUNK_SIZE < allScores.length) {
      await sleep(CHUNK_DELAY_MS);
    }
  }

  console.log(`[AI] Semua chunk selesai. Total hasil: ${results.length} item`);
  return results;
}

/**
 * healthCheck — test koneksi ke AI Reasoning Engine.
 */
export async function healthCheck() {
  if (!REASONING_BASE) throw new Error("AI_REASONING env variable belum diatur.");
  const res = await fetchWithTimeout(`${REASONING_BASE}/api/v1/health`, { method: "GET" }, 10_000);
  if (!res.ok) throw new Error(`Health check gagal: ${res.status}`);
  return res.json();
}
