export interface AssessmentPayloadItem {
    dimension: string;
    dimension_id: string;
    sub_dimension: string;
    sub_dimension_id: string;
    final_result: number;
    expected_level: number;
    assessment_note?: string;
}

export interface AiResultItem {
    sub_dimension_id?: string;
    sub_dimension_name?: string;
    sub_dimension?: string;
    dimension_id?: string;
    dimension_name?: string;
    dimension?: string;
    classification?: string;
    strength_weakness: string;
    opportunity_analysis: string[];
    action_plan: string[];
    meta?: { gap?: number; priority?: string; risk_score?: number; is_strength?: boolean; is_weakness?: boolean };
}

export type AnalysisStatus = "idle" | "running" | "saving" | "saved" | "error" | "save-error";
export interface AnalysisMessage { id: number; role: "user" | "assistant"; text: string; time: number; error?: boolean }
export interface AnalysisSnapshot {
    status: AnalysisStatus;
    results: AiResultItem[];
    history: AnalysisMessage[];
    error: string;
    locked: boolean;
    requestedCount: number;
}

export function readAiResults(value: unknown): AiResultItem[] {
    return Array.isArray(value) ? value.filter((item): item is AiResultItem => item && typeof item === "object" &&
        typeof item.strength_weakness === "string" && Array.isArray(item.opportunity_analysis) &&
        item.opportunity_analysis.every((text: unknown) => typeof text === "string") && Array.isArray(item.action_plan) &&
        item.action_plan.every((text: unknown) => typeof text === "string")) : [];
}

interface Transport {
    analyze: (items: AssessmentPayloadItem[], signal: AbortSignal) => Promise<AiResultItem[]>;
    save: (sessionId: string, items: AiResultItem[], signal: AbortSignal) => Promise<AiResultItem[]>;
    now?: () => number;
}

/** Workspace-owned requests outlive the panel and route that started them. No assessment data is persisted to browser storage. */
export function createAiAnalysisStore(transport: Transport) {
    type Entry = { state: AnalysisSnapshot; listeners: Set<() => void>; task: Promise<void> | null; controller: AbortController | null };
    const entries = new Map<string, Entry>();
    const now = transport.now ?? Date.now;
    function entry(id: string): Entry {
        if (!entries.has(id)) entries.set(id, { state: { status: "idle", results: [], history: [], error: "", locked: false, requestedCount: 0 }, listeners: new Set(), task: null, controller: null });
        return entries.get(id)!;
    }
    function update(value: Entry, patch: Partial<AnalysisSnapshot>, text?: string, role: AnalysisMessage["role"] = "assistant", error = false) {
        value.state = { ...value.state, ...patch, history: text ? [...value.state.history, { id: value.state.history.length + 1, role, text, time: now(), error }] : value.state.history };
        value.listeners.forEach(listener => listener());
    }
    async function saveResults(id: string, value: Entry, signal: AbortSignal) {
        update(value, { status: "saving", error: "" }, "Analysis is ready. Saving the findings to this assessment.");
        try {
            const results = await transport.save(id, value.state.results, signal);
            if (!signal.aborted) update(value, { status: "saved", results, locked: true }, "Findings saved. They are now available in assessment results and monitoring.");
        } catch {
            if (!signal.aborted) {
                const message = "Your findings are ready, but could not be saved. Retry saving; the analysis does not need to run again.";
                update(value, { status: "save-error", error: message }, message, "assistant", true);
            }
        }
    }
    function start(value: Entry, work: (signal: AbortSignal) => Promise<void>) {
        const controller = new AbortController();
        value.controller = controller;
        value.task = Promise.resolve().then(() => work(controller.signal)).finally(() => {
            if (value.controller === controller) { value.task = null; value.controller = null; }
        });
        return value.task;
    }
    return {
        getSnapshot: (id: string) => entry(id).state,
        subscribe(id: string, listener: () => void) { const value = entry(id); value.listeners.add(listener); return () => { value.listeners.delete(listener); }; },
        seed(id: string, results: unknown, locked: boolean) {
            const value = entry(id);
            if (!locked || value.task || value.state.locked) return;
            const items = readAiResults(results);
            update(value, { status: "saved", results: items, locked: true, error: "" }, items.length ? `Loaded the saved analysis for ${items.length} sub-dimensions.` : "This assessment already has a saved analysis.");
        },
        run(id: string, items: AssessmentPayloadItem[]) {
            const value = entry(id);
            if (value.task) return value.task;
            if (value.state.locked || value.state.results.length || !items.length) return Promise.resolve();
            // Snapshot the submitted data so later target edits cannot alter a running request.
            const submitted = items.map(item => ({ ...item }));
            update(value, { status: "running", error: "", requestedCount: submitted.length }, `Analyze ${submitted.length} sub-dimensions: compare final scores with target levels and recommend next steps.`, "user");
            return start(value, async signal => {
                try {
                    const results = await transport.analyze(submitted, signal);
                    if (signal.aborted) return;
                    if (!results.length) throw new Error("Empty analysis");
                    update(value, { results });
                    await saveResults(id, value, signal);
                } catch {
                    if (!signal.aborted) {
                        const message = "The analysis could not finish. Check your connection and try again. Your request history is kept here.";
                        update(value, { status: "error", error: message }, message, "assistant", true);
                    }
                }
            });
        },
        retrySave(id: string) {
            const value = entry(id);
            if (value.task) return value.task;
            if (value.state.locked || !value.state.results.length) return Promise.resolve();
            return start(value, signal => saveResults(id, value, signal));
        },
        cancelAll() {
            entries.forEach(value => {
                value.controller?.abort();
                if (value.task) update(value, { status: value.state.results.length ? "save-error" : "error", error: "The request was interrupted. You can retry it." });
            });
        },
    };
}
