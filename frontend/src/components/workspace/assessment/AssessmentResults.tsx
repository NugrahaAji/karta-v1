"use client";

import { useState } from "react";
import { ArrowUpRight, ClipboardCheck, Flag } from "lucide-react";
import { Alert, Button, Modal, SearchField, SelectField } from "@/components/ui";
import { EmptyState, SectionHeading } from "@/components/workspace/WorkspaceUI";
import { getSavedAnalysis, resultStatus, selectResults, type AssessmentResult } from "@/lib/assessment-detail";
import type { AssessmentSession, Dimension } from "@/types";
import { ResultStatus } from "./AssessmentUI";
import { CellList, MatrixViewport } from "./MatrixViewport";
import styles from "./assessment.module.css";

type Props = {
    results: AssessmentResult[]; dimensions: Dimension[]; session: AssessmentSession;
    onExpectedLevel?: (result: AssessmentResult, level: number) => Promise<void>;
    onAdjust?: (result: AssessmentResult, levelIndex: number) => Promise<void>;
};

export function AssessmentResults({ results, dimensions, session, onExpectedLevel, onAdjust }: Props) {
    const [query, setQuery] = useState("");
    const [dimension, setDimension] = useState("all");
    const [status, setStatus] = useState("all");
    const [selected, setSelected] = useState<string | null>(null);
    const filtered = selectResults(results, query, dimension, status);
    const result = results.find(item => item.subId === selected);
    return <section className={styles.stack}>
        <SectionHeading title="Subdimension results" description="Review the evidence, resolve tied scores, and set the level you want to reach." />
        <div className={styles.toolbar}>
            <div className={styles.search}><SearchField label="Search subdimensions" hint="Search by subdimension or dimension name." placeholder="Search a subdimension or dimension" value={query} onChange={event => setQuery(event.target.value)} onClear={() => setQuery("")} /></div>
            <div className={styles.filter}><SelectField label="Dimension" hint="Narrow the results by dimension." value={dimension} onChange={event => setDimension(event.target.value)}><option value="all">All dimensions</option>{dimensions.map(item => <option key={item._id} value={item._id}>{item.name}</option>)}</SelectField></div>
            <div className={styles.filter}><SelectField label="Result status" hint="Find results that need attention." value={status} onChange={event => setStatus(event.target.value)}><option value="all">All results</option>{["Needs review", "Awaiting responses", "Majority", "Adjusted"].map(item => <option key={item}>{item}</option>)}</SelectField></div>
        </div>
        <p className={styles.resultsCount} role="status">{filtered.length} of {results.length} subdimensions · Scroll horizontally to see every result column.</p>
        {!filtered.length ? <EmptyState icon={<ClipboardCheck />} title={results.length ? "No matching results" : "No subdimensions yet"} description={results.length ? "Try another search or clear your filters." : "Results will appear when dimensions are included in this assessment."} action={results.length ? <Button variant="secondary" onClick={() => { setQuery(""); setDimension("all"); setStatus("all"); }}>Clear filters</Button> : undefined} /> :
        <MatrixViewport label="Assessment results. Scroll horizontally for analysis and action plans."><table className={`${styles.matrix} ${styles.resultsMatrix}`} aria-label="Subdimension assessment results">
            <colgroup><col className={styles.dimensionColumn} /><col className={styles.subColumn} /><col className={styles.copyColumn} /><col className={styles.scoreColumn} /><col className={styles.copyColumn} /><col className={styles.copyColumn} /><col className={styles.scoreColumn} /><col className={styles.planColumn} /></colgroup>
            <thead><tr><th scope="col" className={styles.pinnedDimension}>Dimension</th><th scope="col" className={styles.pinnedSub}>Subdimension</th><th scope="col">Assessment note</th><th scope="col">Final result</th><th scope="col">Strength / weakness</th><th scope="col">Opportunity analysis</th><th scope="col">Expected level</th><th scope="col">Action plan</th></tr></thead>
            <tbody>{filtered.map((item, index) => {
                const group = filtered.filter(sub => sub.dimId === item.dimId);
                const first = index === 0 || filtered[index - 1].dimId !== item.dimId;
                const manual = session.dimensionAnalysis?.find(entry => entry.dimension === item.dimId);
                const ai = getSavedAnalysis(session, item, results);
                const groupAi = group.map(sub => ({ sub, analysis: getSavedAnalysis(session, sub, results) }));
                const hasStrength = groupAi.some(entry => entry.analysis?.strength_weakness);
                const hasOpportunity = groupAi.some(entry => entry.analysis?.opportunity_analysis?.length);
                const plan = session.actionPlanGroups?.find(entry => entry.subdimensions.includes(item.subId));
                // Only span adjacent rows belonging to the same plan; cross-dimension plans stay aligned.
                const planKey = (sub: AssessmentResult) => session.actionPlanGroups?.find(entry => entry.subdimensions.includes(sub.subId));
                const firstPlan = !plan || index === 0 || planKey(filtered[index - 1]) !== plan;
                let planSpan = 1;
                if (plan && firstPlan) while (index + planSpan < filtered.length && planKey(filtered[index + planSpan]) === plan) planSpan++;
                return <tr key={item.subId}>
                    {first && <th scope="rowgroup" rowSpan={group.length} className={styles.pinnedDimension}>{item.dimensionName}</th>}
                    <th scope="row" className={styles.pinnedSub}><span className={styles.subName}>{item.subName}</span><button className={styles.reviewLink} type="button" onClick={() => setSelected(item.subId)} aria-label={`Review ${item.subName}`}>Review<ArrowUpRight aria-hidden="true" /></button></th>
                    <td><CellList items={item.evaluatorAnswers.flatMap(answer => answer.note?.trim() ? [answer.note] : [])} empty="No assessor notes" /></td>
                    <td className={styles.scoreCell}><span className={styles.level}><strong>{item.finalLevelIndex === null ? "—" : item.finalLevelIndex + 1}</strong><small>{item.finalLevelIndex === null ? "Not scored" : item.levels[item.finalLevelIndex]?.name}</small></span><ResultStatus status={resultStatus(item)} /></td>
                    {first && <td rowSpan={group.length}>{hasStrength ? <div className={styles.groupAnalysis}>{groupAi.filter(entry => entry.analysis?.strength_weakness).map(entry => <div key={entry.sub.subId}><strong>{entry.sub.subName}</strong><p>{entry.analysis?.strength_weakness}</p></div>)}</div> : <CellList items={manual?.strengthWeaknessItems ?? []} />}</td>}
                    {first && <td rowSpan={group.length}>{hasOpportunity ? <div className={styles.groupAnalysis}>{groupAi.filter(entry => entry.analysis?.opportunity_analysis?.length).map(entry => <div key={entry.sub.subId}><strong>{entry.sub.subName}</strong><CellList items={entry.analysis?.opportunity_analysis ?? []} /></div>)}</div> : <CellList items={manual?.opportunityAnalysisItems ?? []} />}</td>}
                    <td className={styles.scoreCell}><span className={styles.level}><strong>{item.expectedLevel}</strong><small>{item.levels[item.expectedLevel - 1]?.name}</small></span>{onExpectedLevel && <button className={styles.reviewLink} type="button" onClick={() => setSelected(item.subId)} aria-label={`Edit expected level for ${item.subName}`}>Edit level</button>}</td>
                    {firstPlan && <td rowSpan={plan ? planSpan : 1}>{plan?.label && <p className={styles.planLabel}>{plan.label}</p>}<CellList items={plan?.items ?? ai?.action_plan ?? []} ordered empty="No action plan recorded" /></td>}
                </tr>;
            })}</tbody>
        </table></MatrixViewport>}
        {result && <ResultReview key={result.subId} result={result} results={results} session={session} onClose={() => setSelected(null)} onExpectedLevel={onExpectedLevel} onAdjust={onAdjust} />}
    </section>;
}

function AnalysisList({ title, items, ordered = false }: { title: string; items: string[]; ordered?: boolean }) {
    const List = ordered ? "ol" : "ul";
    return <section><h3>{title}</h3>{items.length ? <List className={styles.list}>{items.map((item, index) => <li key={index}>{item}</li>)}</List> : <p className={styles.copy}>No {title.toLowerCase()} recorded.</p>}</section>;
}

function ResultReview({ result, results, session, onClose, onExpectedLevel, onAdjust }: Omit<Props, "dimensions"> & { result: AssessmentResult; onClose: () => void }) {
    const [target, setTarget] = useState(result.expectedLevel);
    const [adjustment, setAdjustment] = useState(result.finalLevelIndex ?? 0);
    const [adjusting, setAdjusting] = useState(false);
    const [pending, setPending] = useState(false);
    const [error, setError] = useState("");
    const [confirmDiscard, setConfirmDiscard] = useState(false);
    const analysis = getSavedAnalysis(session, result, results);
    const manual = session.dimensionAnalysis?.find(item => item.dimension === result.dimId);
    const plan = session.actionPlanGroups?.find(group => group.subdimensions.includes(result.subId));
    const targetLevel = result.levels[target - 1];
    const changed = target !== result.expectedLevel;
    const requestClose = () => changed || adjusting ? setConfirmDiscard(true) : onClose();
    const save = async () => {
        setPending(true); setError("");
        try {
            if (adjusting) await onAdjust?.(result, adjustment);
            else if (changed) await onExpectedLevel?.(result, target);
            setAdjusting(false);
        } catch (reason) { setError(reason instanceof Error ? reason.message : "Your changes could not be saved. Try again."); }
        finally { setPending(false); }
    };
    return <Modal open title={result.subName} description={result.dimensionName} onClose={requestClose} closeDisabled={pending} dismissOnBackdrop={false} icon={<ClipboardCheck aria-hidden="true" />}>
        <div className={styles.dialogBody}>
            {error && <Alert variant="error">{error}</Alert>}
            {confirmDiscard && <Alert>You have unsaved changes. Keep editing or discard them to close this review.</Alert>}
            <div className={styles.formGrid}><div><h3>Current result</h3><div className={styles.level}><strong>{result.finalLevelIndex === null ? "Not scored" : `Level ${result.finalLevelIndex + 1}`}</strong><span>{result.finalLevelIndex === null ? "Review the assessor responses below." : result.levels[result.finalLevelIndex]?.name}</span><ResultStatus status={resultStatus(result)} /></div></div>
                <SelectField label="Target level" hint={onExpectedLevel ? "Save the target level to update this assessment." : "The expected maturity level for this subdimension."} value={target} onChange={event => setTarget(Number(event.target.value))} disabled={pending || !onExpectedLevel || adjusting}>{result.levels.map((level, index) => <option key={level._id} value={index + 1}>Level {index + 1}: {level.name}</option>)}</SelectField></div>
            {targetLevel && <details className={styles.disclosure}><summary>What target level {target} means</summary><p className={styles.copy}>{targetLevel.detail || targetLevel.name}</p><ul className={styles.list}>{targetLevel.criteria.map(criterion => <li key={criterion._id}><strong>{criterion.name}</strong>{criterion.detail && <p>{criterion.detail}</p>}</li>)}</ul></details>}
            <section><h3>Assessor evidence · {result.evaluatorAnswers.length} responses</h3>
                {result.evaluatorAnswers.length ? <ul className={styles.evidence}>{result.evaluatorAnswers.map(answer => <li key={answer.userId}><header><strong>{answer.userName}</strong><span>Level {answer.levelIndex + 1}</span></header><p className={styles.copy}>{result.levels[answer.levelIndex]?.name}</p>{answer.criteriaName && <p className={styles.copy}>{answer.criteriaName}</p>}{answer.note && <blockquote>{answer.note}</blockquote>}</li>)}</ul> : <p className={styles.copy}>No assessor responses have been submitted yet.</p>}
                {result.finalScore?.adjustedBy && <p className={styles.copy}>Adjusted by {result.finalScore.adjustedBy.name}.</p>}
            </section>
            {onAdjust && result.isTied && !adjusting && <Button variant="secondary" leadingIcon={<Flag aria-hidden="true" />} disabled={pending || changed} onClick={() => { setAdjusting(true); setError(""); }}>{result.finalScore?.source === "adjusted" ? "Review adjustment" : "Resolve tied score"}</Button>}
            {adjusting && <section className={styles.stack}><SelectField label="Final maturity level" hint="Choose the result supported by the assessor evidence. This overrides the tied score." value={adjustment} disabled={pending} onChange={event => setAdjustment(Number(event.target.value))}>{result.levels.map((level, index) => <option key={level._id} value={index}>Level {index + 1}: {level.name}</option>)}</SelectField><p className={styles.copy}>{result.levels[adjustment]?.detail}</p><ul className={styles.list}>{result.levels[adjustment]?.criteria.map(criterion => <li key={criterion._id}>{criterion.name}</li>)}</ul></section>}
            <AnalysisList title="Strengths and weaknesses" items={analysis?.strength_weakness ? [analysis.strength_weakness] : manual?.strengthWeaknessItems ?? []} />
            <AnalysisList title="Improvement opportunities" items={analysis?.opportunity_analysis?.length ? analysis.opportunity_analysis : manual?.opportunityAnalysisItems ?? []} />
            <AnalysisList title="Action plan" items={(plan?.items ?? analysis?.action_plan ?? []).filter(item => item.trim())} ordered />
        </div>
        <footer className={styles.dialogFooter}>{confirmDiscard ? <><Button variant="secondary" onClick={() => setConfirmDiscard(false)}>Keep editing</Button><Button onClick={onClose}>Discard changes</Button></> : <><Button variant="secondary" disabled={pending} onClick={adjusting ? () => setAdjusting(false) : requestClose}>{adjusting ? "Cancel adjustment" : "Close"}</Button>{(changed || adjusting) && <Button loading={pending} onClick={save}>{adjusting ? "Save final level" : "Save target level"}</Button>}</>}</footer>
    </Modal>;
}
