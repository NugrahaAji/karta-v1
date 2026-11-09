"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";
import type { AssessmentSession } from "@/types";

export const ASSESSMENTS_CHANGED_EVENT = "karta:assessments-changed";

export function useWorkspaceAssessments(endpoint: string | null, userId: string, pathname: string) {
    const [sessions, setSessions] = useState<AssessmentSession[]>([]);
    const [loading, setLoading] = useState(!!endpoint);
    const [error, setError] = useState(false);
    const [revision, setRevision] = useState(0);
    const refresh = useCallback(() => setRevision(value => value + 1), []);

    useEffect(() => {
        window.addEventListener(ASSESSMENTS_CHANGED_EVENT, refresh);
        window.addEventListener("focus", refresh);
        return () => {
            window.removeEventListener(ASSESSMENTS_CHANGED_EVENT, refresh);
            window.removeEventListener("focus", refresh);
        };
    }, [refresh]);

    useEffect(() => {
        setSessions([]);
    }, [endpoint, userId]);

    useEffect(() => {
        if (!endpoint) {
            setLoading(false);
            setError(false);
            return;
        }
        const controller = new AbortController();
        setLoading(true);
        setError(false);
        api.get<{ sessions: AssessmentSession[] }>(endpoint, { signal: controller.signal })
            .then(({ data }) => {
                if (!controller.signal.aborted) {
                    setSessions([...(data.sessions ?? [])].sort((a, b) =>
                        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
                }
            })
            .catch(() => { if (!controller.signal.aborted) setError(true); })
            .finally(() => { if (!controller.signal.aborted) setLoading(false); });
        return () => controller.abort();
    }, [endpoint, userId, pathname, revision]);

    return { sessions, loading, error, refresh };
}
