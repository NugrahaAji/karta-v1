import { NextResponse } from "next/server";
import type { AiAssessmentItem } from "@/types";

// maxDuration: 300 detik — batas maksimum Vercel Hobby & Pro.
export const maxDuration = 300;
export const dynamic     = "force-dynamic";

// ─── Config ───────────────────────────────────────────────────────────────────
// Jumlah request paralel maksimum ke reasoning engine sekaligus.
// Bynara rate-limit ~3 concurrent — lebih dari itu kena 429.
const CONCURRENCY = 3;

// Timeout per request ke engine — 25s cukup untuk agnes-2.5-flash (~10s avg).
// Jauh di bawah nginx 120s sehingga tidak pernah memicu 504.
const REQUEST_TIMEOUT_MS = 25_000;

// ─── Types ────────────────────────────────────────────────────────────────────
interface DebugStep {
    step:    string;
    status:  "ok" | "error" | "skip";
    detail?: string;
}

/**
 * POST /api/analyze
 *
 * Server-side proxy ke Reasoning Engine VPS.
 * Menggunakan endpoint single `/reasoning/analyze` yang dipanggil secara
 * paralel (maks CONCURRENCY request sekaligus) untuk setiap sub-dimensi.
 *
 * Keunggulan vs batch endpoint:
 *  - Tiap request hanya ~10 detik → tidak pernah timeout (504)
 *  - Satu item gagal tidak menggugurkan seluruh analisis
 *  - Lebih mudah di-debug per sub-dimensi
 *
 * ENV (.env.local):
 *   REASONING_ENGINE_URL     — URL single endpoint: https://.../api/v1/reasoning/analyze
 *   REASONING_ENGINE_API_KEY — X-API-Key untuk engine
 */

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// ─── Format satu assessment item ke format payload single endpoint ────────────
function buildPayload(a: AiAssessmentItem, providerConfig: Record<string, unknown> | null) {
    const computedExpected = (() => {
        if (a.expected_level && a.expected_level >= 1 && a.expected_level <= 5) return a.expected_level;
        if (a.final_result === 0) return 3;
        if (a.final_result >= 5) return 5;
        return Math.min(a.final_result + 2, 5);
    })();

    return {
        ...(providerConfig ? { provider: providerConfig } : {}),
        assessment: {
            dimension:       a.dimension,
            sub_dimension:   a.sub_dimension,
            final_result:    a.final_result,
            expected_level:  computedExpected,
            ...(a.assessment_note ? { assessment_note: a.assessment_note } : {}),
        },
    };
}

// ─── Kirim satu request ke single /analyze endpoint, retry sekali jika 5xx ───
async function analyzeOne(
    url:            string,
    headers:        Record<string, string>,
    assessment:     AiAssessmentItem,
    providerConfig: Record<string, unknown> | null,
    label:          string,
): Promise<unknown> {
    const body = buildPayload(assessment, providerConfig);

    const tryFetch = async (): Promise<unknown> => {
        const res = await fetch(url, {
            method:  "POST",
            headers,
            body:    JSON.stringify(body),
            cache:   "no-store",
            signal:  AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
        if (!res.ok) {
            const txt = await res.text().catch(() => "");
            throw new Error(`HTTP ${res.status}: ${txt.slice(0, 300)}`);
        }
        return await res.json();
    };

    try {
        console.log(`[API/analyze] → ${label}`);
        const result = await tryFetch();
        console.log(`[API/analyze] ✅ ${label}`);
        return result;
    } catch (err1) {
        const msg = (err1 as Error).message;
        const is429 = msg.includes("HTTP 500") && msg.includes("429") || msg.includes("HTTP 429");
        if (msg.startsWith("HTTP 4") && !is429) throw err1; // 4xx non-429: jangan retry
        const backoff = is429 ? 10_000 : 3_000;            // 429: tunggu 10s, lainnya 3s
        console.warn(`[API/analyze] ⚠️ ${label} gagal: ${msg} — retry dalam ${backoff / 1000}s...`);
        await sleep(backoff);
        const result = await tryFetch();
        console.log(`[API/analyze] ✅ ${label} (retry OK)`);
        return result;
    }
}

// ─── Jalankan N fungsi async dengan batas concurrency ────────────────────────
async function withConcurrency<T>(
    tasks: (() => Promise<T>)[],
    limit: number,
): Promise<PromiseSettledResult<T>[]> {
    const results: PromiseSettledResult<T>[] = new Array(tasks.length);
    let next = 0;

    const worker = async () => {
        while (next < tasks.length) {
            const i = next++;
            try {
                results[i] = { status: "fulfilled", value: await tasks[i]() };
            } catch (e) {
                results[i] = { status: "rejected", reason: e };
            }
        }
    };

    await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker));
    return results;
}

// ─── Handler ──────────────────────────────────────────────────────────────────
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
    } catch {
        return NextResponse.json({ success: false, error: "Request body bukan JSON valid", debug: debugSteps }, { status: 400 });
    }

    // ── STEP 2: Cek environment variables ─────────────────────────────────────
    const engineUrl    = process.env.REASONING_ENGINE_URL;
    const engineApiKey = process.env.REASONING_ENGINE_API_KEY;
    const providerName  = process.env.AI_PROVIDER_NAME;
    const model         = process.env.AI_PROVIDER_MODEL;
    const endpoint      = process.env.AI_PROVIDER_ENDPOINT;
    const apiKey        = process.env.AI_PROVIDER_API_KEY;
    const temperature   = process.env.AI_PROVIDER_TEMPERATURE
        ? parseFloat(process.env.AI_PROVIDER_TEMPERATURE)
        : undefined;

    if (!engineUrl) {
        debugSteps.push({ step: "2_env_check", status: "error", detail: "REASONING_ENGINE_URL tidak ditemukan di .env.local" });
        return NextResponse.json({ success: false, error: "Konfigurasi Reasoning Engine tidak lengkap", debug: debugSteps }, { status: 500 });
    }

    const hasProvider = !!(providerName && model && endpoint && apiKey);
    const providerConfig = hasProvider
        ? {
            name:     providerName!,
            model:    model!,
            endpoint: endpoint!,
            api_key:  apiKey!,
            ...(temperature !== undefined ? { temperature } : {}),
          }
        : null;

    debugSteps.push({
        step:   "2_env_check",
        status: "ok",
        detail: `URL: ${engineUrl} | Provider: ${hasProvider ? `${providerName} / ${model}` : "server default (agnes-2.5-flash)"} | Engine Key: ${engineApiKey ? "✓" : "(tidak ada)"}`,
    });

    // ── STEP 3: Siapkan tasks ──────────────────────────────────────────────────
    const reqHeaders: Record<string, string> = { "Content-Type": "application/json" };
    if (engineApiKey) reqHeaders["X-API-Key"] = engineApiKey;

    debugSteps.push({
        step:   "3_build_payload",
        status: "ok",
        detail: `${assessments.length} task siap — paralel maks ${CONCURRENCY} request sekaligus | endpoint: single /analyze`,
    });

    // ── STEP 4: Jalankan semua request secara paralel ─────────────────────────
    console.log(`[API/analyze] Menjalankan ${assessments.length} request (paralel maks ${CONCURRENCY})...`);

    const tasks = assessments.map((a, i) => () =>
        analyzeOne(engineUrl, reqHeaders, a, providerConfig, `[${i + 1}/${assessments.length}] ${a.dimension} / ${a.sub_dimension}`)
    );

    const settled = await withConcurrency(tasks, CONCURRENCY);

    const failures = settled
        .map((r, i) => ({ r, i }))
        .filter(({ r }) => r.status === "rejected");

    if (failures.length > 0) {
        const firstErr = (failures[0].r as PromiseRejectedResult).reason as Error;
        const failList = failures.map(({ r, i }) =>
            `[${i + 1}] ${assessments[i].sub_dimension}: ${(r as PromiseRejectedResult).reason}`
        ).join("; ");
        debugSteps.push({ step: "4_fetch_engine", status: "error", detail: `${failures.length} item gagal: ${failList}` });
        return NextResponse.json({
            success: false,
            error:   `${failures.length} dari ${assessments.length} sub-dimensi gagal dianalisis. Error pertama: ${firstErr.message}`,
            debug:   debugSteps,
        }, { status: 502 });
    }

    const allResults = settled.map(r => (r as PromiseFulfilledResult<unknown>).value);

    debugSteps.push({
        step:   "4_fetch_engine",
        status: "ok",
        detail: `Semua ${allResults.length} item selesai dianalisis secara paralel`,
    });

    // ── STEP 5: Validasi & kembalikan hasil ────────────────────────────────────
    if (allResults.length !== assessments.length) {
        const detail = `Jumlah hasil (${allResults.length}) tidak sesuai input (${assessments.length})`;
        debugSteps.push({ step: "5_read_response", status: "error", detail });
        return NextResponse.json({ success: false, error: detail, debug: debugSteps }, { status: 502 });
    }

    debugSteps.push({
        step:   "5_read_response",
        status: "ok",
        detail: `${allResults.length} item hasil analisis diterima`,
    });

    const enrichedResults = allResults.map((result, index) => {
        const assessment = assessments[index];
        const analysis = result && typeof result === "object" ? result : {};
        return {
            ...analysis,
            dimension_id:       assessment?.dimension_id,
            dimension_name:     assessment?.dimension,
            sub_dimension_id:   assessment?.sub_dimension_id,
            sub_dimension_name: assessment?.sub_dimension,
        };
    });

    console.log(`[API/analyze] ✅ Selesai — ${enrichedResults.length} item`);

    return NextResponse.json({ success: true, data: enrichedResults, debug: debugSteps });
}
