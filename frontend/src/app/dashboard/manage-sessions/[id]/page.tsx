"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Activity, ArrowLeft, BarChart3, Brain, CalendarDays, CheckCircle2, Layers, RefreshCw, TriangleAlert, Users } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import type { AssessmentResponse, AssessmentSession, Dimension, MonitoringRow } from "@/types";
import { Alert, Button, IconButton, LoadingState } from "@/components/ui";
import AiReasoningPanel from "@/components/AiReasoningPanel";
import MonitoringTable from "@/components/MonitoringTable";
import { AssessmentResultsTable } from "@/components/workspace/AssessmentResultsTable";
import { ExpectedLevelDialog, ResultReviewDialog } from "@/components/workspace/ResultDialogs";
import { ResultCharts } from "@/components/workspace/ResultCharts";
import { ConfirmAction, Metric, ResourceError, StatusBadge, WorkspacePage } from "@/components/workspace/WorkspaceUI";
import { assessmentActionGroups, buildSubResults, expectedLevel, finalLevel, type SubResult } from "@/lib/assessment-results";
import { buildMonRows, readMonitoringRows, serializeMonitoringRows, type MonRowData } from "@/lib/monitoring";
import { useAiAnalysis } from "@/hooks/useAiAnalysis";
import { formatWorkspaceDate, requestError } from "@/lib/workspace";
import pageStyles from "@/components/workspace/company-workspace.module.css";
import styles from "@/components/workspace/assessment-detail.module.css";

interface ResultsResponse { session: AssessmentSession; dimensions: Dimension[]; responses: AssessmentResponse[] }

export default function SessionResultsPage() {
    const params = useParams<{ id: string }>();
    return <Suspense fallback={<LoadingState>Loading assessment.</LoadingState>}><AssessmentDetail key={params.id} sessionId={params.id} /></Suspense>;
}

function AssessmentDetail({ sessionId }: { sessionId: string }) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const activeTab = searchParams.get("tab") === "monitoring" ? "monitoring" : "results";
    const [session, setSession] = useState<AssessmentSession | null>(null);
    const [dimensions, setDimensions] = useState<Dimension[]>([]);
    const [responses, setResponses] = useState<AssessmentResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [revision, setRevision] = useState(0);
    const [review, setReview] = useState<SubResult | null>(null);
    const [target, setTarget] = useState<SubResult | null>(null);
    const [showAi, setShowAi] = useState(false);
    const [monitoring, setMonitoring] = useState<Record<string, MonRowData>>({});
    const [savedMonitoring, setSavedMonitoring] = useState("{}");
    const [savingMonitoring, setSavingMonitoring] = useState(false);
    const [monitoringError, setMonitoringError] = useState("");
    const [leaveHref, setLeaveHref] = useState("");
    const saveLock = useRef(false);
    const allowLeave = useRef(false);
    const dirty = JSON.stringify(monitoring) !== savedMonitoring;
    const basePath = `/dashboard/manage-sessions/${sessionId}`;
    const analysis = useAiAnalysis(sessionId, session?.aiAnalysis, session?.aiAnalysisLocked ?? false);
    const analysisBusy = analysis.state.status === "running" || analysis.state.status === "saving";

    useEffect(() => {
        if (analysis.state.status === "saved" && analysis.state.results.length) {
            setSession(previous => previous && previous.aiAnalysis !== analysis.state.results
                ? { ...previous, aiAnalysis: analysis.state.results, aiAnalysisLocked: true } : previous);
        }
    }, [analysis.state.status, analysis.state.results, session?._id, session?.aiAnalysis]);

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true); setError("");
        api.get<ResultsResponse>(`/sessions/company/${sessionId}/results`, { signal: controller.signal })
            .then(({ data }) => {
                if (controller.signal.aborted) return;
                setSession(data.session); setDimensions(data.dimensions ?? []); setResponses(data.responses ?? []);
                const values = readMonitoringRows(data.session.monitoringRows);
                setMonitoring(values); setSavedMonitoring(JSON.stringify(values));
            })
            .catch(cause => { if (!controller.signal.aborted) setError(requestError(cause, "Couldn't load this assessment. Check your connection and try again.")); })
            .finally(() => { if (!controller.signal.aborted) setLoading(false); });
        return () => controller.abort();
    }, [sessionId, revision]);

    // Tab changes keep the draft. Warn before a reload or following another workspace link.
    useEffect(() => {
        if (!dirty) return;
        const unload = (event: BeforeUnloadEvent) => { if (!allowLeave.current) { event.preventDefault(); event.returnValue = ""; } };
        const navigate = (event: MouseEvent) => {
            if (allowLeave.current || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
            const link = (event.target as Element).closest?.("a[href]") as HTMLAnchorElement | null;
            if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
            const url = new URL(link.href, window.location.href);
            if (url.origin === window.location.origin && url.pathname === window.location.pathname) return;
            event.preventDefault(); event.stopPropagation(); setLeaveHref(link.href);
        };
        window.addEventListener("beforeunload", unload);
        document.addEventListener("click", navigate, true);
        return () => { window.removeEventListener("beforeunload", unload); document.removeEventListener("click", navigate, true); };
    }, [dirty]);

    const results = useMemo(() => buildSubResults(dimensions, responses, session?.finalScores), [dimensions, responses, session?.finalScores]);
    const groups = useMemo(() => session ? assessmentActionGroups(session, results) : [], [session, results]);
    const aiAssessments = useMemo(() => results.filter(sub => sub.evaluatorAnswers.length || sub.finalScore).map(sub => ({
        dimension: sub.dimName, dimension_id: sub.dimId, sub_dimension: sub.subName, sub_dimension_id: sub.subId,
        final_result: finalLevel(sub) ?? 0, expected_level: session ? expectedLevel(session, sub) ?? 3 : 3,
        assessment_note: sub.evaluatorAnswers.map(answer => answer.note).filter(Boolean).join(" | ") || undefined,
    })), [results, session]);

    async function saveMonitoring() {
        if (saveLock.current || !dirty) return;
        saveLock.current = true; setSavingMonitoring(true); setMonitoringError("");
        try {
            const monitoringRows = serializeMonitoringRows(buildMonRows(groups, results, dimensions), monitoring);
            const { data } = await api.patch<{ monitoringRows: MonitoringRow[] }>(`/sessions/company/${sessionId}/monitoring-rows`, { monitoringRows });
            const saved = readMonitoringRows(data.monitoringRows);
            setMonitoring(saved); setSavedMonitoring(JSON.stringify(saved));
            setSession(previous => previous ? { ...previous, monitoringRows: data.monitoringRows } : previous);
            toast.success("Monitoring saved");
        } catch (cause) { setMonitoringError(requestError(cause, "Couldn't save monitoring. Your changes are still here; try again.")); }
        finally { saveLock.current = false; setSavingMonitoring(false); }
    }
    async function saveExpected(sub: SubResult, level: number) {
        const { data } = await api.patch(`/sessions/company/${sessionId}/expected-level`, { dimension: sub.dimId, subdimension: sub.subId, expectedLevel: level });
        setSession(previous => previous ? { ...previous, subdimensionAnalysis: data.subdimensionAnalysis } : previous);
        toast.success("Expected level updated");
    }
    async function adjust(sub: SubResult, index: number) {
        const { data } = await api.post(`/sessions/company/${sessionId}/adjust`, { dimension: sub.dimId, subdimension: sub.subId, finalLevelIndex: index });
        setSession(previous => previous ? { ...previous, finalScores: data.session.finalScores } : previous);
        toast.success("Final level saved");
    }

    if (loading || error || !session) return <WorkspacePage title="Assessment detail" description="Review your team's findings and follow through on the action plan.">
        <Link className={styles.back} href="/dashboard/manage-sessions"><ArrowLeft aria-hidden="true" />Back to assessments</Link>
        {loading ? <LoadingState>Loading assessment results.</LoadingState> : <ResourceError message={error || "This assessment is no longer available."} retry={() => setRevision(value => value + 1)} />}
    </WorkspacePage>;

    const scored = results.filter(sub => finalLevel(sub) !== null).length;
    const unresolved = results.filter(sub => sub.isTied && !sub.finalScore).length;
    const submitted = new Set(responses.map(response => response.user._id));
    const assignedRespondents = session.assignedTo.filter(member => submitted.has(member._id)).length;
    return <WorkspacePage title={session.title} eyebrow="Assessment detail" description={session.description || "Review maturity results and turn your findings into action."} actions={<>
        <IconButton aria-label="Refresh assessment" title={dirty ? "Save monitoring changes before refreshing" : "Refresh assessment"} disabled={dirty || savingMonitoring} onClick={() => setRevision(value => value + 1)}><RefreshCw aria-hidden="true" /></IconButton>
        {(aiAssessments.length > 0 || analysis.state.history.length > 0 || session.aiAnalysisLocked) && <Button leadingIcon={<Brain aria-hidden="true" />} onClick={() => setShowAi(true)}>{analysisBusy ? "Analysis running" : analysis.state.results.length || session.aiAnalysisLocked ? "View AI analysis" : "Analyze with AI"}</Button>}
    </>}>
        <Link className={styles.back} href="/dashboard/manage-sessions"><ArrowLeft aria-hidden="true" />Back to assessments</Link>
        <div className={styles.meta}><StatusBadge status={session.status} /><span><CalendarDays aria-hidden="true" />{session.endDate ? `Due ${formatWorkspaceDate(session.endDate)}` : "No due date"}</span><span><Users aria-hidden="true" />{assignedRespondents} of {session.assignedTo.length} assigned members responded</span></div>
        <nav className={styles.tabBar} aria-label="Assessment views"><Link href={basePath} scroll={false} aria-current={activeTab === "results" ? "page" : undefined}><BarChart3 aria-hidden="true" />Assessment results</Link><Link href={`${basePath}?tab=monitoring`} scroll={false} aria-current={activeTab === "monitoring" ? "page" : undefined}><Activity aria-hidden="true" />Monitoring{dirty && <span aria-label="Unsaved changes">*</span>}</Link></nav>
        {activeTab === "results" ? <>
            <section className={pageStyles.metrics} aria-label="Results summary"><Metric label="Sub-dimensions" value={results.length} detail={`${dimensions.length} dimensions in scope`} icon={<Layers />} /><Metric label="Results available" value={scored} detail="Majority or reviewed scores" icon={<CheckCircle2 />} /><Metric label="Need review" value={unresolved} detail="Tied responses to resolve" icon={<TriangleAlert />} /><Metric label="Responses received" value={responses.length} detail="Submitted team assessments" icon={<Users />} /></section>
            {dirty && <Alert>You have unsaved monitoring changes. <Link className={styles.back} href={`${basePath}?tab=monitoring`} scroll={false}>Return to monitoring</Link></Alert>}
            <ResultCharts results={results} />
            <AssessmentResultsTable session={session} dimensions={dimensions} results={results} onReview={setReview} onExpected={setTarget} />
        </> : <MonitoringTable apGroups={groups} subResults={results} dimensions={dimensions} monData={monitoring} subAnalysis={Object.fromEntries(results.map(sub => [sub.subId, { el: String(expectedLevel(session, sub) ?? "") }]))} finalResults={Object.fromEntries(results.map(sub => [sub.subId, finalLevel(sub)]))}
            onChangeRow={(key, value) => { setMonitoring(previous => ({ ...previous, [key]: value })); setMonitoringError(""); }}
            onDeleteRow={key => { setMonitoring(previous => { const next = { ...previous }; delete next[key]; return next; }); setMonitoringError(""); }}
            onSave={saveMonitoring} saving={savingMonitoring} dirty={dirty} error={monitoringError} />}
        {review && <ResultReviewDialog key={review.subId} sub={review} onClose={() => setReview(null)} onAdjust={index => adjust(review, index)} />}
        {target && <ExpectedLevelDialog key={target.subId} sub={target} value={expectedLevel(session, target) ?? 1} onClose={() => setTarget(null)} onSave={level => saveExpected(target, level)} />}
        <AiReasoningPanel open={showAi} state={analysis.state} assessmentCount={aiAssessments.length} onAnalyze={() => void analysis.run(aiAssessments)} onRetrySave={() => void analysis.retrySave()} onClose={() => setShowAi(false)} />
        {leaveHref && <ConfirmAction title="Leave unsaved monitoring changes?" description="Your timeline, owner, and note changes have not been saved. Stay here to save them, or discard them and leave." label="Discard and leave" pending={savingMonitoring} onClose={() => setLeaveHref("")} onConfirm={() => { allowLeave.current = true; const url = new URL(leaveHref); if (url.origin === window.location.origin) router.push(`${url.pathname}${url.search}${url.hash}`); else window.location.assign(leaveHref); }} />}
    </WorkspacePage>;
}
