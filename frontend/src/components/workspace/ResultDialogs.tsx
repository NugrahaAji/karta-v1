"use client";

import { useRef, useState, type FormEvent } from "react";
import { Gavel, Target } from "lucide-react";
import { Alert, Button, Modal, SelectField } from "@/components/ui";
import { finalLevel, type SubResult } from "@/lib/assessment-results";
import { requestError } from "@/lib/workspace";
import { ResultState } from "./AssessmentResultsTable";
import styles from "./assessment-detail.module.css";

export function ExpectedLevelDialog({ sub, value, onClose, onSave }: { sub: SubResult; value: number; onClose: () => void; onSave: (value: number) => Promise<void> }) {
    const [selected, setSelected] = useState(value);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const lock = useRef(false);
    const level = sub.levels[selected - 1];
    async function save(event: FormEvent) {
        event.preventDefault();
        if (lock.current) return;
        lock.current = true; setSaving(true); setError("");
        try { await onSave(selected); onClose(); }
        catch (cause) { setError(requestError(cause, "Couldn't save the target level. Your selection is kept; try again.")); }
        finally { lock.current = false; setSaving(false); }
    }
    return <Modal open title={`Expected level · ${sub.subName}`} description="Choose your target and review the criteria before saving." icon={<Target />} onClose={onClose} closeDisabled={saving} dismissOnBackdrop={false}>
        <form className={styles.editor} onSubmit={save} aria-busy={saving}>
            <SelectField label="Expected maturity level" hint="This target is used in analysis and monitoring." value={selected} onChange={event => setSelected(Number(event.target.value))} disabled={saving}>
                {sub.levels.map((item, index) => <option key={item._id} value={index + 1}>Level {index + 1}: {item.name}</option>)}
            </SelectField>
            {level && <><div className={styles.infoPanel}><h3>{level.name}</h3><p>{level.detail || "No description provided for this level."}</p></div><div><h3>Criteria at this level</h3><ul className={styles.criteria}>{level.criteria.map(criterion => <li key={criterion._id}><strong>{criterion.name}</strong>{criterion.detail && <p>{criterion.detail}</p>}</li>)}</ul>{!level.criteria.length && <p className={styles.muted}>No criteria configured for this level.</p>}</div></>}
            {error && <Alert variant="error">{error}</Alert>}
            <div className={styles.formActions}><Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button><Button type="submit" loading={saving} disabled={selected === value}>Save expected level</Button></div>
        </form>
    </Modal>;
}

export function ResultReviewDialog({ sub, onClose, onAdjust }: { sub: SubResult; onClose: () => void; onAdjust: (index: number) => Promise<void> }) {
    const [level, setLevel] = useState(sub.finalScore?.finalLevelIndex ?? 0);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const lock = useRef(false);
    const adjustable = sub.isTied && sub.evaluatorAnswers.length > 0;
    async function save(event: FormEvent) {
        event.preventDefault();
        if (lock.current) return;
        lock.current = true; setSaving(true); setError("");
        try { await onAdjust(level); onClose(); }
        catch (cause) { setError(requestError(cause, "Couldn't save this adjustment. Review your selection and try again.")); }
        finally { lock.current = false; setSaving(false); }
    }
    return <Modal open title={sub.subName} description={`${sub.dimName} · Review the responses behind this result.`} icon={<Gavel />} onClose={onClose} closeDisabled={saving} dismissOnBackdrop={false}>
        <form className={styles.editor} onSubmit={save} aria-busy={saving}>
            <div className={styles.infoPanel}><div className={styles.responseTop}><h3>Final result: {finalLevel(sub) === null ? "Awaiting review" : `Level ${finalLevel(sub)}`}</h3><ResultState sub={sub} /></div><p>{sub.finalScore?.adjustedBy ? `Adjusted by ${sub.finalScore.adjustedBy.name}.` : "The level with the most responses becomes the final result. Tied responses need a company review."}</p></div>
            <div><h3>Team responses ({sub.evaluatorAnswers.length})</h3><ul className={styles.responses}>{sub.evaluatorAnswers.map(answer => <li key={answer.userId}>
                <div className={styles.responseTop}><strong>{answer.userName}</strong><span className={styles.state}>Level {answer.levelIndex + 1}</span></div>
                <p>{answer.criteriaName ?? sub.levels[answer.levelIndex]?.name}</p>{answer.note && <blockquote>{answer.note}</blockquote>}
            </li>)}</ul>{!sub.evaluatorAnswers.length && <p className={styles.muted}>No team responses have been submitted for this sub-dimension.</p>}</div>
            {adjustable && <><SelectField label="Final maturity level" hint="Resolve the tied responses by choosing the level that reflects your evidence." value={level} onChange={event => setLevel(Number(event.target.value))} disabled={saving}>{sub.levels.map((item, index) => <option key={item._id} value={index}>Level {index + 1}: {item.name}</option>)}</SelectField><ul className={styles.criteria}>{sub.levels[level]?.criteria.map(criterion => <li key={criterion._id}>{criterion.name}</li>)}</ul></>}
            {error && <Alert variant="error">{error}</Alert>}
            <div className={styles.formActions}><Button variant="secondary" disabled={saving} onClick={onClose}>{adjustable ? "Cancel" : "Close review"}</Button>{adjustable && <Button type="submit" loading={saving}>Save final level</Button>}</div>
        </form>
    </Modal>;
}
