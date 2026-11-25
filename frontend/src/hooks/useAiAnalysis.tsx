"use client";

import { createContext, useCallback, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import api from "@/lib/api";
import { createAiAnalysisStore, readAiResults } from "@/lib/ai-analysis";

const AnalysisContext = createContext<ReturnType<typeof createAiAnalysisStore> | null>(null);

export function AiAnalysisProvider({ children }: { children: ReactNode }) {
    const [store] = useState(() => createAiAnalysisStore({
        async analyze(assessments, signal) {
            const response = await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ assessments }), signal });
            const data = await response.json();
            if (!response.ok || !data.success) throw new Error("Analysis failed");
            const results = readAiResults(data.data);
            if (results.length !== assessments.length) throw new Error("Incomplete analysis");
            return results;
        },
        async save(sessionId, items, signal) {
            try {
                await api.patch(`/sessions/company/${sessionId}/ai-analysis`, { aiAnalysis: items }, { signal });
                return items;
            } catch (error) {
                // Another tab may have saved first, or the original response may have been lost.
                if ((error as { response?: { status?: number } }).response?.status === 409) {
                    const { data } = await api.get(`/sessions/company/${sessionId}/results`, { signal });
                    const saved = readAiResults(data.session?.aiAnalysis);
                    if (data.session?.aiAnalysisLocked && saved.length) return saved;
                }
                throw error;
            }
        },
    }));
    useEffect(() => () => store.cancelAll(), [store]);
    return <AnalysisContext.Provider value={store}>{children}</AnalysisContext.Provider>;
}

export function useAiAnalysis(sessionId: string, savedResults?: unknown, locked = false) {
    const store = useContext(AnalysisContext);
    if (!store) throw new Error("AI analysis requires the workspace provider");
    const subscribe = useCallback((listener: () => void) => store.subscribe(sessionId, listener), [store, sessionId]);
    const snapshot = useCallback(() => store.getSnapshot(sessionId), [store, sessionId]);
    const state = useSyncExternalStore(subscribe, snapshot, snapshot);
    useEffect(() => { store.seed(sessionId, savedResults, locked); }, [store, sessionId, savedResults, locked]);
    return { state, run: (items: Parameters<typeof store.run>[1]) => store.run(sessionId, items), retrySave: () => store.retrySave(sessionId) };
}
