import { NextResponse } from "next/server";
import type { AiAssessmentItem } from "@/types";

// maxDuration: 600 detik (self-hosted / Next.js Enterprise).
// Jika deploy di Vercel Hobby/Pro, turunkan ke 300.
export const maxDuration = 600;
export const dynamic     = "force-dynamic";


// ─── Types ────────────────────────────────────────────────────────────────────
interface DebugStep {
    step: string;
    status: "ok" | "error" | "skip";
    detail?: string;
}

/**
 * POST /api/analyze
 *
 * Server-side proxy ke Reasoning Engine VPS.
 * Menggunakan strategi CHUNKED (CHUNK_SIZE item per request) untuk menghindari
 * 504 Gateway Timeout dari nginx di server reasoning engine.
 *
 * Flow:
 *  1. Terima assessments dari frontend
 *  2. Bagi menjadi chunk CHUNK_SIZE item
 *  3. Kirim tiap chunk secara sekuensial (tunggu selesai sebelum chunk berikutnya)
 *  4. Gabungkan semua hasil, kembalikan ke frontend
 *
 * ENV (.env.local):
 *   REASONING_ENGINE_URL       — URL endpoint batch: https://reasoning.putra-portfolio.cloud/api/v1/reasoning/analyze/batch
 *   REASONING_ENGINE_API_KEY   — X-API-Key untuk engine
 *   AI_PROVIDER_NAME           — (opsional) override provider name
 *   AI_PROVIDER_MODEL          — (opsional) override model
 *   AI_PROVIDER_ENDPOINT       — (opsional) override endpoint
 *   AI_PROVIDER_API_KEY        — (opsional) override api key
 */

const CHUNK_SIZE       = 1;         // 1 item per request — minimal load di engine
const CHUNK_TIMEOUT_MS = 590_000;   // 590 detik per chunk (~10 menit)
const CHUNK_DELAY_MS   = 3_000;     // 3 detik jeda antar chunk

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// ─── Kirim satu chunk ke engine, retry sekali jika gagal ──────────────────────
async function sendChunk(
    url: string,
    headers: Record<string, string>,
    chunkAssessments: AiAssessmentItem[],
    providerConfig: Record<string, string> | null,
    chunkIdx: number,
    totalChunks: number,
): Promise<unknown[]> {
    const label = `chunk ${chunkIdx + 1}/${totalChunks} (${chunkAssessments.length} item)`;

    // Format sesuai panduan resmi: gunakan key "scores", field "score" dan "target_level"
    // Hapus dimension_id / sub_dimension_id — tidak ada di kontrak API panduan
    // Hapus system_prompt — menyebabkan error "looping content" di engine
    const body: Record<string, unknown> = {
        organization: { name: "HP3M Assessment" },
        ...(providerConfig ? { provider: providerConfig } : {}),
        scores: chunkAssessments.map(a => {
            const computedExpected = (() => {
                if (a.expected_level && a.expected_level >= 1 && a.expected_level <= 5) return a.expected_level;
                if (a.final_result === 0) return 3;
                if (a.final_result >= 5) return 5;
                return Math.min(a.final_result + 2, 5);
            })();
            return {
                dimension:       a.dimension,
                sub_dimension:   a.sub_dimension,
                score:           a.final_result,      // sesuai panduan: "score"
                target_level:    computedExpected,     // sesuai panduan: "target_level"
                ...(a.assessment_note ? { assessment_note: a.assessment_note } : {}),
            };
        }),
    };

    const fetchOpts: RequestInit = {
        method:  "POST",
        headers,
        body:    JSON.stringify(body),
        cache:   "no-store",
        signal:  AbortSignal.timeout(CHUNK_TIMEOUT_MS),
    };

    const tryFetch = async (): Promise<unknown[]> => {
        const res = await fetch(url, fetchOpts);
        if (!res.ok) {
            const txt = await res.text().catch(() => "");
            throw new Error(`HTTP ${res.status}: ${txt.slice(0, 200)}`);
        }
        const raw = await res.text();
        // Strip markdown fences & loop detection tag
        const cleaned = raw
            .replace(/^\[ignoring loop detection\]\s*/i, "")
            .replace(/^```json\s*/i, "")
            .replace(/^```\s*/i, "")
            .replace(/\s*```$/i, "")
            .trim();
        const parsed = JSON.parse(cleaned);
        if (!Array.isArray(parsed)) throw new Error("Response bukan array JSON");
        return parsed;
    };

    // Attempt 1
    try {
        console.log(`[API/analyze] Mengirim ${label}...`);
        const result = await tryFetch();
        console.log(`[API/analyze] ✅ ${label} selesai (${result.length} hasil)`);
        return result;
    } catch (err1) {
        const msg1 = (err1 as Error).message;
        // Jika 4xx error, jangan retry
        if (msg1.startsWith("HTTP 4")) throw err1;
        console.warn(`[API/analyze] ⚠️ ${label} gagal: ${msg1} — retry dalam 5 detik...`);
        await sleep(5000);
        // Attempt 2
        const result = await tryFetch();
        console.log(`[API/analyze] ✅ ${label} selesai (retry, ${result.length} hasil)`);
        return result;
    }
}

export async function POST(request: Request) {
    const debugSteps: DebugStep[] = [];

    // ── STEP 1: Parse request body ─────────────────────────────────────────────
    let assessments: AiAssessmentItem[];
    try {
        const body = await request.json();
        assessments = body?.assessments;
        if (!assessments || !Array.isArray(assessments) || assessments.length === 0) {
            debugSteps.push({ step: "1_parse_body", status: "error", detail: "Field 'assessments' tidak ada, bukan array, atau kosong" });
            return NextResponse.json({ success: false, error: "Data assessments tidak valid atau kosong", debug: debugSteps }, { status: 400 });
        }
        debugSteps.push({ step: "1_parse_body", status: "ok", detail: `${assessments.length} item assessment diterima` });
    } catch (e) {
        return NextResponse.json({ success: false, error: "Request body bukan JSON valid", debug: debugSteps }, { status: 400 });
    }

    // ── STEP 2: Cek environment variables ─────────────────────────────────────
    const engineUrl    = process.env.REASONING_ENGINE_URL;
    const engineApiKey = process.env.REASONING_ENGINE_API_KEY;
    const providerName = process.env.AI_PROVIDER_NAME;
    const model        = process.env.AI_PROVIDER_MODEL;
    const endpoint     = process.env.AI_PROVIDER_ENDPOINT;
    const apiKey       = process.env.AI_PROVIDER_API_KEY;

    if (!engineUrl) {
        debugSteps.push({ step: "2_env_check", status: "error", detail: "REASONING_ENGINE_URL tidak ditemukan di .env.local" });
        return NextResponse.json({ success: false, error: "Konfigurasi Reasoning Engine tidak lengkap", debug: debugSteps }, { status: 500 });
    }

    // Provider config bersifat opsional — jika tidak lengkap, tidak dikirim
    // dan server akan pakai model default (Llama-3.3-70B-Instruct)
    const hasProvider = !!(providerName && model && endpoint && apiKey);
    const providerConfig = hasProvider
        ? { name: providerName!, model: model!, endpoint: endpoint!, api_key: apiKey! }
        : null;

    debugSteps.push({
        step: "2_env_check",
        status: "ok",
        detail: `URL: ${engineUrl} | Provider: ${hasProvider ? `${providerName} / ${model}` : "server default"} | Engine Key: ${engineApiKey ? "✓" : "(tidak ada)"}`,
    });

    // ── STEP 3: Hitung chunks ───────────────────────────────────────────────────
    const totalChunks = Math.ceil(assessments.length / CHUNK_SIZE);
    debugSteps.push({
        step: "3_build_payload",
        status: "ok",
        detail: `Payload siap — ${assessments.length} sub-dimensi → ${totalChunks} chunk × ${CHUNK_SIZE} item | format: scores/score/target_level`,
    });

    // ── STEP 4: Kirim ke engine secara chunked ────────────────────────────────
    const reqHeaders: Record<string, string> = { "Content-Type": "application/json" };
    if (engineApiKey) reqHeaders["X-API-Key"] = engineApiKey;

    const allResults: unknown[] = [];
    let chunkErrorDetail = "";

    try {
        for (let i = 0; i < assessments.length; i += CHUNK_SIZE) {
            const chunk    = assessments.slice(i, i + CHUNK_SIZE);
            const chunkIdx = Math.floor(i / CHUNK_SIZE);

            const chunkResults = await sendChunk(
                engineUrl,
                reqHeaders,
                chunk,
                providerConfig,
                chunkIdx,
                totalChunks,
            );

            allResults.push(...chunkResults);

            // Jeda antar chunk
            if (i + CHUNK_SIZE < assessments.length) {
                await sleep(CHUNK_DELAY_MS);
            }
        }
    } catch (e) {
        chunkErrorDetail = (e as Error).message;
        const isTimeout = chunkErrorDetail.includes("504") || chunkErrorDetail.includes("TimeoutError") || chunkErrorDetail.includes("AbortError");
        debugSteps.push({
            step: "4_fetch_engine",
            status: "error",
            detail: chunkErrorDetail,
        });
        return NextResponse.json({
            success: false,
            error: isTimeout
                ? `Reasoning Engine timeout (504). Coba lagi — engine sedang sibuk. Detail: ${chunkErrorDetail}`
                : `Gagal menghubungi Reasoning Engine: ${chunkErrorDetail}`,
            debug: debugSteps,
        }, { status: 502 });
    }

    debugSteps.push({
        step: "4_fetch_engine",
        status: "ok",
        detail: `Semua ${totalChunks} chunk selesai. Total ${allResults.length} hasil diterima.`,
    });

    // ── STEP 5: Validasi & kembalikan hasil ───────────────────────────────────
    if (allResults.length === 0) {
        debugSteps.push({ step: "5_read_response", status: "error", detail: "Engine mengembalikan array kosong" });
        return NextResponse.json({ success: false, error: "Engine tidak menghasilkan data", debug: debugSteps }, { status: 502 });
    }

    debugSteps.push({
        step: "5_read_response",
        status: "ok",
        detail: `${allResults.length} item hasil analisis diterima dari engine`,
    });

    console.log(`[API/analyze] ✅ Selesai — ${allResults.length} item dari ${totalChunks} chunk`);

    return NextResponse.json({ success: true, data: allResults, debug: debugSteps });
}
