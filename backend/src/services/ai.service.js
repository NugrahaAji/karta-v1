/**
 * AI Reasoning Service
 * Memanggil HP3M AI Reasoning Engine melalui batch endpoint.
 *
 * ENV:
 *   AI_REASONING    — base URL engine (boleh dengan /docs, akan di-strip)
 *   REASONING_KEYS  — API key (X-API-Key header)
 *
 * Seluruh subdimensi dikirim sekaligus agar engine dapat memprosesnya secara
 * paralel dan mempertahankan urutan hasil sesuai kontrak API.
 */

const REASONING_BASE = (process.env.AI_REASONING ?? "")
  .replace(/\/docs\/?$/, "")
  .replace(/\/$/, "");

const REASONING_KEY = process.env.REASONING_KEYS ?? "";

// ─── Config ───────────────────────────────────────────────────────────────────
const BATCH_TIMEOUT_MS = 590_000;

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

// ─── Kirim seluruh assessment, retry sekali jika network error ───────────────
async function sendBatch(scores, organization, provider) {
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

  const label = `batch (${scores.length} item)`;

  // Attempt 1
  try {
    console.log(`[AI] Mengirim ${label}...`);
    const res = await fetchWithTimeout(url, fetchOpts, BATCH_TIMEOUT_MS);
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
    const res = await fetchWithTimeout(url, fetchOpts, BATCH_TIMEOUT_MS);
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
 * Mengirim seluruh assessment dalam satu request batch.
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

  console.log(`[AI] Mengirim ${allScores.length} item dalam satu batch`);
  const results = await sendBatch(allScores, organization, providerOverride);

  if (!Array.isArray(results)) {
    throw new Error("AI Reasoning Engine mengembalikan response non-array.");
  }
  if (results.length !== assessments.length) {
    throw new Error(`AI Reasoning Engine mengembalikan ${results.length} dari ${assessments.length} hasil.`);
  }

  console.log(`[AI] Batch selesai. Total hasil: ${results.length} item`);
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
