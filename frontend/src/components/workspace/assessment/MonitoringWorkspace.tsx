"use client";

import { useMemo, useState } from "react";
import { ClipboardList, Pencil, Save, Trash2, UserRound, ShieldCheck } from "lucide-react";
import { Alert, Button, Modal, SearchField, SelectField, TextAreaField, TextField } from "@/components/ui";
import { EmptyState } from "@/components/workspace/WorkspaceUI";
import type { ActionPlanGroup, MonitoringStatus } from "@/types";
import { emptyMonitoring, monitoringEntries, monitoringStatuses, monthlyStatuses, type FlatRow, type MonRowData } from "@/lib/monitoring";
import { DetailMetrics, MonthStatus, monthIcons } from "./AssessmentUI";
import styles from "./assessment.module.css";

export interface MonitoringProps {
    apGroups: ActionPlanGroup[];
    subResults: { subId: string; subName: string; dimId: string }[];
    dimensions: { _id: string; name: string }[];
    monData: Record<string, MonRowData>;
    onChangeRow?: (key: string, data: MonRowData) => void;
    onDeleteRow?: (key: string) => void;
    subAnalysis: Record<string, { el: string }>;
    finalResults: Record<string, number | null>;
    saving?: boolean;
    onSave?: () => void | Promise<unknown>;
    dirty?: boolean;
    saveError?: string;
}

export default function MonitoringWorkspace({ apGroups, subResults, dimensions, monData, onChangeRow, onDeleteRow, subAnalysis, finalResults, saving, onSave, dirty, saveError }: MonitoringProps) {
    const [query, setQuery] = useState("");
    const [dimension, setDimension] = useState("all");
    const [status, setStatus] = useState("all");
    const [editing, setEditing] = useState<{ key: string; month?: number } | null>(null);
    const rows = useMemo(() => monitoringEntries(apGroups, subResults, dimensions), [apGroups, subResults, dimensions]);
    const related = (row: FlatRow) => subResults.filter(sub => row.grp.subdimensions.includes(sub.subId));
    const getData = (row: FlatRow) => monData[row.key] ?? emptyMonitoring(row.sub?.subId ?? row.grp.subdimensions[0]);
    const filtered = rows.filter(row => {
        const data = getData(row);
        const subs = related(row);
        return (dimension === "all" || subs.some(sub => sub.dimId === dimension)) &&
            (status === "all" || (status === "unscheduled" ? monthlyStatuses(data).length === 0 : monthlyStatuses(data).some(month => month.status === status))) &&
            (!query.trim() || [row.item, row.grp.label, ...subs.map(sub => sub.subName), data.pic, data.checker, data.notes].join(" ").toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
    });
    const months = rows.flatMap(row => monthlyStatuses(getData(row)));
    const delayed = rows.filter(row => monthlyStatuses(getData(row)).some(month => month.status === "Delayed")).length;
    const selected = rows.find(row => row.key === editing?.key);

    return <section className={styles.stack}>
        <header className={styles.monitoringHeader}><div><h2>Action plan monitoring</h2><p>Assign responsibility and track each action through six months. Open an action to update its timeline and notes.</p></div>{onSave && <div className={styles.stack}><Button leadingIcon={<Save aria-hidden="true" />} loading={saving} disabled={dirty === false} onClick={onSave}>Save monitoring</Button><span className={styles.saveState} role="status">{saving ? "Saving your changes…" : dirty ? "You have unsaved changes" : dirty === false ? "All changes saved" : "Save after editing your action plans"}</span></div>}</header>
        {saveError && <Alert variant="error">{saveError}</Alert>}
        <DetailMetrics items={[
            { label: "Action steps", value: rows.filter(row => row.item).length, detail: "Across the assessment" },
            { label: "Months completed", value: <>{months.filter(month => month.status === "Completed").length}<small> / {months.length}</small></>, detail: "Of all scheduled monthly updates" },
            { label: "Delayed actions", value: delayed, detail: "At least one month is delayed" },
            { label: "Owner needed", value: rows.filter(row => row.item && !getData(row).pic.trim()).length, detail: "Action steps without a person in charge" },
        ]} />
        <div className={styles.toolbar}>
            <div className={styles.search}><SearchField label="Search action plans" hint="Search by action, subdimension, owner, or note." placeholder="Search actions, owners, or notes" value={query} onChange={event => setQuery(event.target.value)} onClear={() => setQuery("")} /></div>
            <div className={styles.filter}><SelectField label="Dimension" hint="Include all actions covering this dimension." value={dimension} onChange={event => setDimension(event.target.value)}><option value="all">All dimensions</option>{dimensions.map(item => <option key={item._id} value={item._id}>{item.name}</option>)}</SelectField></div>
            <div className={styles.filter}><SelectField label="Monthly status" hint="Match any month in the action timeline." value={status} onChange={event => setStatus(event.target.value)}><option value="all">All statuses</option><option value="unscheduled">Not scheduled</option>{monitoringStatuses.map(item => <option key={item}>{item}</option>)}</SelectField></div>
        </div>
        <div className={styles.legend} aria-label="Monthly status legend">{monitoringStatuses.map(item => { const Icon = monthIcons[item]; return <span key={item} className={styles.inline}><Icon aria-hidden="true" />{item}</span>; })}</div>
        <p className={styles.resultsCount} role="status">{filtered.length} of {rows.length} tracking items · Months are relative to your action plan.</p>
        {filtered.length ? <div className={styles.actionList}>{filtered.map(row => {
            const data = getData(row);
            const statuses = monthlyStatuses(data);
            const subs = related(row);
            return <article key={row.key} className={styles.actionCard}>
                <div><p className={styles.actionContext}>{row.grp.label || row.dim?.name || "Action plan"} · Step {row.itemIdx + 1}</p><h3>{row.item || "Action plan not added yet"}</h3>
                    <p className={styles.actionContext}>{subs.map(sub => sub.subName).join(" · ")}</p>
                    <div className={styles.ownership}><span className={styles.inline}><UserRound aria-hidden="true" />{data.pic || "Owner unassigned"}</span><span className={styles.inline}><ShieldCheck aria-hidden="true" />{data.checker || "Checker unassigned"}</span></div>
                    {data.notes && <p className={styles.notes}>{data.notes}</p>}
                </div>
                <div><p className={styles.actionContext}>Six-month timeline</p><div className={styles.timeline}>{Array.from({ length: 6 }, (_, index) => <MonthStatus key={index} month={index + 1} status={statuses.find(item => item.month === index + 1)?.status} disabled={saving} onClick={onChangeRow ? () => setEditing({ key: row.key, month: index + 1 }) : undefined} />)}</div>
                    <div className={styles.actionFooter}><span className={styles.resultsCount}>{statuses.filter(month => month.status === "Completed").length} of {statuses.length} scheduled months complete</span><Button variant="secondary" leadingIcon={onChangeRow ? <Pencil aria-hidden="true" /> : <ClipboardList aria-hidden="true" />} disabled={saving} onClick={() => setEditing({ key: row.key })}>{onChangeRow ? "Edit action" : "View details"}</Button></div>
                </div>
            </article>;
        })}</div> : <EmptyState icon={<ClipboardList />} title={rows.length ? "No matching actions" : "No action plans to monitor"} description={rows.length ? "Try another search, dimension, or status." : "Assessment subdimensions and action plans will appear here when they are available."} action={rows.length ? <Button variant="secondary" onClick={() => { setQuery(""); setDimension("all"); setStatus("all"); }}>Clear filters</Button> : undefined} />}
        {selected && <MonitoringEditor key={selected.key} row={selected} value={getData(selected)} month={editing?.month} subs={related(selected)} finalResults={finalResults} subAnalysis={subAnalysis} onClose={() => setEditing(null)} onApply={onChangeRow ? value => onChangeRow(selected.key, value) : undefined} onClear={onDeleteRow ? () => onDeleteRow(selected.key) : undefined} />}
    </section>;
}

function MonitoringEditor({ row, value, month, subs, finalResults, subAnalysis, onClose, onApply, onClear }: {
    row: FlatRow; value: MonRowData; month?: number; subs: { subId: string; subName: string }[];
    finalResults: MonitoringProps["finalResults"]; subAnalysis: MonitoringProps["subAnalysis"];
    onClose: () => void; onApply?: (value: MonRowData) => void; onClear?: () => void;
}) {
    const [draft, setDraft] = useState(value);
    const [confirmClear, setConfirmClear] = useState(false);
    const [confirmDiscard, setConfirmDiscard] = useState(false);
    const statuses = monthlyStatuses(draft);
    const changed = JSON.stringify(draft) !== JSON.stringify(value);
    const requestClose = () => changed ? setConfirmDiscard(true) : onClose();
    const updateMonth = (month: number, status: string) => {
        const next = [...statuses.filter(item => item.month !== month), ...(status ? [{ month, status: status as MonitoringStatus }] : [])].sort((a, b) => a.month - b.month);
        setDraft(current => ({ ...current, timeline: next.map(item => item.month), timelineStatuses: next, achievementStatus: "" }));
    };
    return <Modal open title={onApply ? "Update action tracking" : "Action tracking details"} description={row.item || "This subdimension does not have an action plan yet."} onClose={requestClose} dismissOnBackdrop={false} icon={<ClipboardList aria-hidden="true" />}>
        <div className={styles.dialogBody}>
            {confirmDiscard && <Alert variant="notice">You have unapplied changes. Keep editing or discard them to close this action.</Alert>}
            {confirmClear && <Alert variant="notice">Clear the timeline, owner, checker, and notes for this action? The action plan itself stays in place. Save monitoring afterwards to confirm the change.</Alert>}
            <details className={styles.disclosure}><summary>Assessment context · {subs.length} subdimensions</summary><ul className={styles.list}>{subs.map(sub => <li key={sub.subId}><strong>{sub.subName}</strong><p>Current level: {finalResults[sub.subId] ?? "Not scored"} · Target: {subAnalysis[sub.subId]?.el || "Not set"}</p></li>)}</ul></details>
            <fieldset className={styles.fieldset} disabled={!onApply || confirmClear}><legend>Responsibility</legend><div className={styles.formGrid}><TextField label="Person in charge" hint="The person responsible for completing this action." value={draft.pic} onChange={event => setDraft(current => ({ ...current, pic: event.target.value }))} /><TextField label="Checker" hint="The person who reviews the outcome." value={draft.checker} onChange={event => setDraft(current => ({ ...current, checker: event.target.value }))} /></div></fieldset>
            <fieldset className={styles.fieldset} disabled={!onApply || confirmClear}><legend>Monthly progress{month ? ` · Editing month ${month}` : ""}</legend><div className={styles.formGrid}>{Array.from({ length: 6 }, (_, index) => <SelectField key={index} label={`Month ${index + 1}`} hint="Leave unscheduled if this month is not part of the plan." value={statuses.find(item => item.month === index + 1)?.status ?? ""} onChange={event => updateMonth(index + 1, event.target.value)}><option value="">Not scheduled</option>{monitoringStatuses.map(item => <option key={item}>{item}</option>)}</SelectField>)}</div></fieldset>
            <TextAreaField label="Progress notes" hint="Record progress, blockers, and the next step." rows={4} value={draft.notes} disabled={!onApply || confirmClear} onChange={event => setDraft(current => ({ ...current, notes: event.target.value }))} />
            {onClear && !confirmClear && <Button variant="secondary" leadingIcon={<Trash2 aria-hidden="true" />} onClick={() => { setConfirmClear(true); setConfirmDiscard(false); }}>Clear tracking data</Button>}
        </div>
        <footer className={styles.dialogFooter}>{confirmDiscard ? <><Button variant="secondary" onClick={() => setConfirmDiscard(false)}>Keep editing</Button><Button onClick={onClose}>Discard changes</Button></> : confirmClear ? <><Button variant="secondary" onClick={() => setConfirmClear(false)}>Keep tracking data</Button><Button onClick={() => { onClear?.(); onClose(); }}>Clear tracking data</Button></> : <><Button variant="secondary" onClick={requestClose}>{onApply ? "Cancel" : "Close"}</Button>{onApply && <Button disabled={!changed} onClick={() => { onApply(draft); onClose(); }}>Apply changes</Button>}</>}</footer>
    </Modal>;
}
