"use client";

import { useState } from "react";
import { Brain, Save } from "lucide-react";
import { Alert, Button, LoadingState, Modal } from "@/components/ui";
import { EmptyState } from "@/components/workspace/WorkspaceUI";
import type { AiAssessmentItem, AssessmentSession } from "@/types";
import type { SavedAnalysis } from "@/lib/assessment-detail";
import { requestError } from "@/lib/workspace";
import api from "@/lib/api";
import styles from "./assessment.module.css";

export function AssessmentAnalysisDialog({ assessments, session, onClose, onSaved }: {
    assessments: AiAssessmentItem[]; session: AssessmentSession; onClose: () => void; onSaved: (items: SavedAnalysis[]) => void;
}) {
    const [items, setItems] = useState<SavedAnalysis[]>(Array.isArray(session.aiAnalysis) ? session.aiAnalysis : []);
    const [busy, setBusy] = useState(false);
    const [saved, setSaved] = useState(Boolean(session.aiAnalysisLocked));
    const [error, setError] = useState("");
    const [saveFailed, setSaveFailed] = useState(false);
    const persist = async (results: SavedAnalysis[]) => {
        await api.post(`/sessions/ai/${session._id}/analysis`, { aiAnalysis: results });
        setSaved(true); setSaveFailed(false); onSaved(results);
    };
    const generate = async () => {
        setBusy(true); setError("");
        try {
            const response = await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ assessments }) });
            const data = await response.json();
            if (!response.ok || !data.success) throw new Error(data.error || "Analysis could not be generated. Try again.");
            const results: SavedAnalysis[] = Array.isArray(data.data) ? data.data : [];
            if (!results.length) throw new Error("The analysis returned no results. Your assessment has not changed; try again.");
            setItems(results);
            try { await persist(results); }
            catch (reason) { setSaveFailed(true); setError(requestError(reason, "The analysis is ready but could not be saved. Retry saving below.")); }
        } catch (reason) { setError(reason instanceof Error ? reason.message : "The analysis service could not be reached. Try again."); }
        finally { setBusy(false); }
    };
    const retrySave = async () => {
        setBusy(true); setError("");
        try { await persist(items); }
        catch (reason) { setError(requestError(reason, "The analysis could not be saved. Try again.")); }
        finally { setBusy(false); }
    };
    return <Modal open title={saved ? "Saved assessment analysis" : "Review AI analysis"} description="Strengths, improvement opportunities, and action recommendations for this assessment." icon={<Brain aria-hidden="true" />} onClose={onClose} closeDisabled={busy} dismissOnBackdrop={false}>
        <div className={styles.dialogBody}>
            {error && <Alert variant="error">{error}</Alert>}
            {!saved && <Alert>Generating analysis uses {assessments.length} subdimension results and saves the recommendations to this assessment. Saved analysis can only be generated once.</Alert>}
            {busy ? <LoadingState>{items.length ? "Saving assessment analysis." : "Generating assessment analysis. This may take a moment."}</LoadingState> : items.length ? items.map((item, index) => <details key={item.sub_dimension_id || index} className={styles.disclosure} open={index === 0}>
                <summary>{item.sub_dimension_name || item.sub_dimension || `Subdimension ${index + 1}`}</summary>
                <div className={styles.stack}><p className={styles.copy}>{item.dimension_name || item.dimension}</p>
                    <section><h3>Strengths and weaknesses</h3><p className={styles.copy}>{item.strength_weakness || "No analysis recorded."}</p></section>
                    <section><h3>Improvement opportunities</h3><ul className={styles.list}>{(item.opportunity_analysis ?? []).map((text, i) => <li key={i}>{text}</li>)}</ul></section>
                    <section><h3>Action plan</h3><ol className={styles.list}>{(item.action_plan ?? []).map((text, i) => <li key={i}>{text}</li>)}</ol></section>
                </div>
            </details>) : <EmptyState title={saved ? "No saved analysis available" : "Ready to review your results"} description={saved ? "This assessment is locked for generation. Review its recorded results or contact your administrator." : "The analysis uses the current scores, target levels, and assessor notes. Review those inputs before generating."} />}
        </div>
        <footer className={styles.dialogFooter}><Button variant="secondary" disabled={busy} onClick={onClose}>Close</Button>{!saved && (saveFailed ? <Button loading={busy} leadingIcon={<Save aria-hidden="true" />} onClick={retrySave}>Retry saving analysis</Button> : <Button loading={busy} disabled={!assessments.length} leadingIcon={<Brain aria-hidden="true" />} onClick={generate}>Generate and save analysis</Button>)}</footer>
    </Modal>;
}
