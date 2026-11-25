"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";

/** Abort obsolete reads; a failed request is never presented as an empty result. */
export function useWorkspaceResource<T>(endpoint: string) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [revision, setRevision] = useState(0);
    const refresh = useCallback(() => setRevision(value => value + 1), []);
    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setError(false);
        api.get<T>(endpoint, { signal: controller.signal })
            .then(response => { if (!controller.signal.aborted) setData(response.data); })
            .catch(() => { if (!controller.signal.aborted) setError(true); })
            .finally(() => { if (!controller.signal.aborted) setLoading(false); });
        return () => controller.abort();
    }, [endpoint, revision]);
    return { data, loading, error, refresh };
}
