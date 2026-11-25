"use client";

import { useCallback, useId, useRef, useState } from "react";
import { Brain, CheckCircle2, ChevronDown, Clock3, History, ListChecks, Save, Search, Sparkles, UserRound } from "lucide-react";
import { Alert, Button, LoadingState, Modal, SearchField } from "@/components/ui";
import type { AiResultItem, AnalysisSnapshot } from "@/lib/ai-analysis";
import styles from "./workspace/ai-analysis.module.css";

export type { AssessmentPayloadItem } from "@/lib/ai-analysis";

interface Props {
    open: boolean;
    onClose: () => void;
    state: AnalysisSnapshot;
    assessmentCount: number;
    onAnalyze: () => void;
    onRetrySave: () => void;
}

type View = "activity" | "findings";
export default function AiReasoningPanel({ open, onClose, state, assessmentCount, onAnalyze, onRetrySave }: Props) {
    const [view, setView] = useState<View | null>(null);
    const [query, setQuery] = useState("");
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const positions = useRef<Record<View, number>>({ activity: 0, findings: 0 });
    const activeView = view ?? (state.results.length ? "findings" : "activity");
    // Restore only the drawer's own scroller. Never scroll the assessment underneath it.
    const restoreScroll = useCallback((node: HTMLDivElement | null) => { if (node) node.scrollTop = positions.current[activeView]; }, [activeView]);
    const busy = state.status === "running" || state.status === "saving";
    const search = query.trim().toLowerCase();
    const results = state.results.map((item, index) => ({ item, index })).filter(({ item }) =>
        [item.dimension_name, item.dimension, item.sub_dimension_name, item.sub_dimension, item.classification, item.strength_weakness, ...item.action_plan].join(" ").toLowerCase().includes(search));
    const summary = state.status === "running" ? "Analyzing your assessment" : state.status === "saving" ? "Saving findings" : state.locked ? "Saved to this assessment" : state.results.length ? "Findings ready to save" : "Turn assessment evidence into next steps";

    return <Modal open={open} placement="right" title="Assessment analysis" description={summary} icon={<Brain aria-hidden="true" />} onClose={onClose} closeLabel="Close analysis panel" dismissOnBackdrop={false}>
        <div className={styles.context}>
            <span><ListChecks aria-hidden="true" />{state.results.length || state.requestedCount || assessmentCount} sub-dimensions</span>
            <span>{state.locked ? <CheckCircle2 aria-hidden="true" /> : <History aria-hidden="true" />}{state.locked ? "Analysis saved" : "Request history kept"}</span>
        </div>
        <div className={styles.viewTabs} role="group" aria-label="Analysis views">
            <button type="button" aria-pressed={activeView === "activity"} onClick={() => setView("activity")}><History aria-hidden="true" />Activity{busy && <span className={styles.liveDot} aria-label="Request in progress" />}</button>
            <button type="button" aria-pressed={activeView === "findings"} onClick={() => setView("findings")}><ListChecks aria-hidden="true" />Findings <span className={styles.count}>{state.results.length}</span></button>
        </div>
        <div key={activeView} ref={restoreScroll} className={styles.content} onScroll={event => { positions.current[activeView] = event.currentTarget.scrollTop; }}>
            {activeView === "activity" ? <>
                {!state.history.length && <div className={styles.intro}>
                    <span className={styles.introIcon}><Sparkles aria-hidden="true" /></span><h3>A clearer path forward</h3>
                    <p>Review strengths, maturity gaps, and practical actions based on your team's assessment evidence.</p>
                    <ul><li>Compare results with expected levels</li><li>Identify improvement opportunities</li><li>Build actions to track in monitoring</li></ul>
                    <p className={styles.hint}>Analysis is saved once for this assessment. Review scores and targets before starting.</p>
                </div>}
                <ol className={styles.history} aria-label="Analysis request history">
                    {state.history.map(message => <li key={message.id} className={styles.message} data-role={message.role} data-error={message.error || undefined}>
                        <div className={styles.messageAuthor}><span>{message.role === "user" ? <UserRound aria-hidden="true" /> : <Brain aria-hidden="true" />}{message.role === "user" ? "You" : "Karta analysis"}</span><time dateTime={new Date(message.time).toISOString()}>{new Date(message.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time></div>
                        <p>{message.text}</p>
                    </li>)}
                </ol>
                {busy && <div className={styles.progress} role="status"><LoadingState inline iconOnly>{summary}</LoadingState><div><strong>{state.status === "running" ? "Reviewing your assessment" : "Saving your findings"}</strong><p>{state.status === "running" ? "This can take a few minutes. You can close the panel and keep working." : "Your analysis is ready. Adding it to results and monitoring."}</p></div></div>}
                {state.results.length > 0 && <Button variant="secondary" trailingIcon={<ListChecks aria-hidden="true" />} onClick={() => setView("findings")}>View {state.results.length} findings</Button>}
            </> : <>
                {state.results.length > 0 ? <>
                    <SearchField label="Search findings" hideLabel hint="Search by dimension, finding, or action." hideHint placeholder="Search findings or actions" value={query} onChange={event => setQuery(event.target.value)} onClear={() => setQuery("")} />
                    <p className={styles.hint} role="status">{results.length} of {state.results.length} findings</p>
                    <div className={styles.findings}>{results.map(({ item, index }) => {
                        const key = item.sub_dimension_id || String(index);
                        return <ResultCard key={key} item={item} index={index} expanded={expanded[key] ?? index === 0} onToggle={() => setExpanded(previous => ({ ...previous, [key]: !(previous[key] ?? index === 0) }))} />;
                    })}</div>
                    {!results.length && <div className={styles.empty}><Search aria-hidden="true" /><h3>No matching findings</h3><p>Try another dimension or action.</p><Button variant="secondary" onClick={() => setQuery("")}>Clear search</Button></div>}
                </> : <div className={styles.empty}><ListChecks aria-hidden="true" /><h3>{busy ? "Your findings are on the way" : state.locked ? "No findings available to display" : "No findings yet"}</h3><p>{busy ? "Your request is still running. Follow its status in Activity." : state.locked ? "The saved analysis could not be displayed. Refresh the assessment to load it again." : "Start an analysis to review strengths, gaps, and recommended actions."}</p><Button variant="secondary" onClick={() => setView("activity")}>View activity</Button></div>}
            </>}
        </div>
        <footer className={styles.footer}>
            {state.error && <Alert variant="error">{state.error}</Alert>}
            <p className={styles.footerHint}><Clock3 aria-hidden="true" />{busy ? "Closing this panel keeps the request running in your workspace." : "Reopen this panel to return to your history and findings."}</p>
            <div className={styles.actions}><Button variant="secondary" onClick={onClose}>Close panel</Button>
                {!state.locked && (state.status === "save-error" ? <Button leadingIcon={<Save aria-hidden="true" />} onClick={onRetrySave}>Retry saving</Button> : <Button loading={busy} disabled={!assessmentCount || state.results.length > 0} leadingIcon={<Sparkles aria-hidden="true" />} onClick={() => { setView("activity"); onAnalyze(); }}>{busy ? state.status === "saving" ? "Saving findings" : "Analyzing" : state.status === "error" ? "Retry analysis" : "Analyze assessment"}</Button>)}
                {state.locked && <span className={styles.saved}><CheckCircle2 aria-hidden="true" />Saved</span>}
            </div>
        </footer>
    </Modal>;
}

function ResultCard({ item, index, expanded, onToggle }: { item: AiResultItem; index: number; expanded: boolean; onToggle: () => void }) {
    const id = useId();
    return <article className={styles.finding}>
        <button type="button" className={styles.findingToggle} aria-expanded={expanded} aria-controls={id} onClick={onToggle}>
            <span className={styles.number}>{index + 1}</span><span className={styles.findingTitle}><strong>{item.sub_dimension_name || item.sub_dimension || `Sub-dimension ${index + 1}`}</strong><span>{item.dimension_name || item.dimension || "Assessment finding"}</span></span><ChevronDown className={styles.chevron} data-expanded={expanded} aria-hidden="true" />
        </button>
        {expanded && <div id={id} className={styles.findingBody}>
            <div className={styles.badges}>{item.classification && <span>{item.classification}</span>}{typeof item.meta?.priority === "string" && item.meta.priority && <span data-priority={item.meta.priority.toLowerCase()}>{item.meta.priority} priority</span>}{typeof item.meta?.gap === "number" && <span>Gap: {item.meta.gap} {item.meta.gap === 1 ? "level" : "levels"}</span>}</div>
            <section><h4>Strength / weakness</h4><p>{item.strength_weakness || "No analysis provided."}</p></section>
            {item.opportunity_analysis.length > 0 && <section><h4>Improvement opportunities</h4><ul>{item.opportunity_analysis.map((text, i) => <li key={i}>{text}</li>)}</ul></section>}
            {item.action_plan.length > 0 && <section><h4>Recommended actions</h4><ol>{item.action_plan.map((text, i) => <li key={i}>{text}</li>)}</ol></section>}
        </div>}
    </article>;
}
