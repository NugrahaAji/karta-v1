"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Clock3, Gavel, ListChecks } from "lucide-react";
import { Button, SearchField, SelectField } from "@/components/ui";
import type { AssessmentSession, Dimension } from "@/types";
import { assessmentActionGroups, expectedLevel, finalLevel, findSavedAnalysis, resultState, rowSpans, type SubResult } from "@/lib/assessment-results";
import { EmptyState, SectionHeading } from "./WorkspaceUI";
import styles from "./assessment-detail.module.css";

export function ResultState({ sub }: { sub: SubResult }) {
    const state = resultState(sub);
    const Icon = state === "Adjusted" ? Gavel : state === "Needs review" ? AlertTriangle : state === "Majority" ? CheckCircle2 : Clock3;
    return <span className={styles.state} data-state={state}><Icon aria-hidden="true" />{state}</span>;
}

export function AssessmentResultsTable({ session, dimensions, results, onReview, onExpected }: {
    session: AssessmentSession; dimensions: Dimension[]; results: SubResult[];
    onReview: (sub: SubResult) => void; onExpected: (sub: SubResult) => void;
}) {
    const [query, setQuery] = useState("");
    const [dimension, setDimension] = useState("all");
    const search = query.trim().toLowerCase();
    const groups = assessmentActionGroups(session, results);
    const rows = results.filter(sub => (dimension === "all" || sub.dimId === dimension) &&
        [sub.dimName, sub.subName, ...sub.evaluatorAnswers.map(answer => answer.note ?? "")].join(" ").toLowerCase().includes(search));
    const dimensionSpans = rowSpans(rows.map(sub => sub.dimId));
    const plans = rows.map(sub => groups.findLast(group => group.subdimensions.includes(sub.subId)));
    const planSpans = rowSpans(rows.map((sub, index) => plans[index] ? `group-${groups.indexOf(plans[index])}` : `empty-${sub.subId}`));
    const analysis = rows.map(sub => findSavedAnalysis(session, sub, results));
    // Manual analysis is dimension-wide; generated analysis belongs to each sub-dimension.
    const manualSpans = rowSpans(rows.map((sub, index) => analysis[index] ? sub.subId : `manual-${sub.dimId}`));
    const clear = () => { setQuery(""); setDimension("all"); };
    return <section className={styles.stack} aria-label="Assessment results">
        <SectionHeading title="Assessment results" description="Compare findings, review team responses, and set the level you want to reach." />
        <div className={styles.toolbar}>
            <div className={styles.toolbarSearch}><SearchField label="Search results" hint="Search dimensions, sub-dimensions, or assessment notes." hideLabel hideHint placeholder="Search results or notes" value={query} onChange={event => setQuery(event.target.value)} onClear={() => setQuery("")} /></div>
            <div className={styles.toolbarSelect}><SelectField label="Dimension" hint="Choose a dimension or compare all results." value={dimension} onChange={event => setDimension(event.target.value)}><option value="all">All dimensions</option>{dimensions.map(dim => <option key={dim._id} value={dim._id}>{dim.name}</option>)}</SelectField></div>
        </div>
        {!rows.length ? <EmptyState icon={<ListChecks />} title={results.length ? "No matching results" : "No sub-dimensions configured"} description={results.length ? "Try another search or show all dimensions." : "Add assessment criteria to the framework before reviewing maturity scores."} action={results.length ? <Button variant="secondary" onClick={clear}>Clear filters</Button> : undefined} /> : <div className={styles.tableShell}>
            <div className={styles.tableHint}><span role="status">{rows.length} of {results.length} sub-dimensions</span><span>Scroll horizontally for all columns. Select a score to review it.</span></div>
            <div className={styles.tableViewport} tabIndex={0} role="region" aria-label="Assessment results table, horizontally scrollable">
                <table className={`${styles.dataTable} ${styles.resultTable}`}>
                    <caption className="sr-only">Assessment findings, final results, expected levels, and action plans grouped by dimension.</caption>
                    <colgroup>{[9, 11, 16, 9, 15, 15, 9, 16].map((width, index) => <col key={index} style={{ width: `${width}%` }} />)}</colgroup>
                    <thead><tr>{["Dimension", "Sub-dimension", "Assessment note", "Final result", "Strength / weakness", "Opportunity analysis", "Expected level", "Action plan"].map(label => <th scope="col" key={label}>{label}</th>)}</tr></thead>
                    <tbody>{rows.map((sub, index) => {
                        const manual = session.dimensionAnalysis?.find(item => item.dimension === sub.dimId);
                        const ai = analysis[index];
                        const notes = sub.evaluatorAnswers.filter(answer => answer.note?.trim());
                        const score = finalLevel(sub);
                        const target = expectedLevel(session, sub);
                        const plan = plans[index];
                        return <tr key={sub.subId}>
                            {dimensionSpans[index] > 0 && <th scope="rowgroup" rowSpan={dimensionSpans[index]} className={styles.dimensionCell}>{sub.dimName}</th>}
                            <th scope="row" className={styles.subCell}>{sub.subName}<span className={styles.cellLabel}>{sub.levels.length} maturity levels</span></th>
                            <td>{notes.length ? <ul>{notes.map(note => <li key={note.userId}><span className={styles.cellText}>{note.note}</span><span className={styles.cellLabel}>{note.userName}</span></li>)}</ul> : <span className={styles.muted}>No assessment notes yet</span>}</td>
                            <td className={styles.center}><button type="button" className={styles.scoreButton} aria-label={`Review ${sub.subName}: ${score === null ? resultState(sub) : `level ${score}`}`} onClick={() => onReview(sub)}><strong>{score ?? "—"}</strong><span>Review</span></button><ResultState sub={sub} /></td>
                            {manualSpans[index] > 0 && <>
                                <td rowSpan={manualSpans[index]} className={styles.analysisCell}>{ai?.strength_weakness ? <p className={styles.cellText}>{ai.strength_weakness}</p> : <AnalysisList items={manual?.strengthWeaknessItems} empty="No analysis yet" />}</td>
                                <td rowSpan={manualSpans[index]} className={styles.analysisCell}><AnalysisList items={ai?.opportunity_analysis?.length ? ai.opportunity_analysis : manual?.opportunityAnalysisItems} empty="No opportunities recorded" /></td>
                            </>}
                            <td className={styles.center}><button type="button" className={styles.scoreButton} disabled={!sub.levels.length} onClick={() => onExpected(sub)} aria-label={`Set expected level for ${sub.subName}, currently ${target ?? "unavailable"}`}><strong>{target ?? "—"}</strong><span>Set target</span></button></td>
                            {planSpans[index] > 0 && <td rowSpan={planSpans[index]}>{plan?.label && <p><strong>{plan.label}</strong></p>}<AnalysisList ordered items={plan?.items} empty="No action plan yet" /></td>}
                        </tr>;
                    })}</tbody>
                </table>
            </div>
        </div>}
    </section>;
}

function AnalysisList({ items, empty, ordered = false }: { items?: string[]; empty: string; ordered?: boolean }) {
    const values = items?.filter(item => item.trim()) ?? [];
    const Tag = ordered ? "ol" : "ul";
    return values.length ? <Tag>{values.map((item, index) => <li key={index} className={styles.cellText}>{item}</li>)}</Tag> : <span className={styles.muted}>{empty}</span>;
}
