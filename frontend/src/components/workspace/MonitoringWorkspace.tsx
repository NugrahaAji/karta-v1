"use client";

import { useState, type FormEvent } from "react";
import { CalendarDays, CheckCircle2, Circle, Clock3, Flag, Pencil, RotateCcw, Save, Target, TriangleAlert } from "lucide-react";
import { Alert, Button, IconButton, Modal, SearchField, SelectField, TextAreaField, TextField } from "@/components/ui";
import type { ActionPlanGroup, MonitoringStatus } from "@/types";
import { buildMonRows, emptyMonitoring, hasMonitoringData, mergeMonitoringRows, monthStatuses, MONITORING_MONTHS, MONITORING_STATUSES, STATUS_SHORT, type MonRowData, type MonitoringDisplayRow } from "@/lib/monitoring";
import { EmptyState, SectionHeading } from "./WorkspaceUI";
import styles from "./assessment-detail.module.css";

interface Props {
    apGroups: ActionPlanGroup[];
    subResults: { subId: string; subName: string; dimId: string }[];
    dimensions: { _id: string; name: string }[];
    monData: Record<string, MonRowData>;
    onChangeRow?: (key: string, data: MonRowData) => void;
    onDeleteRow?: (key: string) => void;
    subAnalysis: Record<string, { el: string }>;
    finalResults: Record<string, number | null>;
    saving?: boolean;
    onSave?: () => void;
    dirty?: boolean;
    error?: string;
    saveError?: string;
}

const statusIcons = { Targeted: Target, "Not Started": Circle, Ongoing: Clock3, Completed: CheckCircle2, Delayed: TriangleAlert };
function MonitoringStatusLabel({ status }: { status: MonitoringStatus }) {
    const Icon = statusIcons[status];
    return <span className={styles.state} data-state={status}><Icon aria-hidden="true" />{status}</span>;
}

export default function MonitoringWorkspace({ apGroups, subResults, dimensions, monData, onChangeRow, onDeleteRow, subAnalysis, finalResults, saving = false, onSave, dirty, error, saveError }: Props) {
    const [query, setQuery] = useState("");
    const [status, setStatus] = useState("all");
    const [editor, setEditor] = useState<{ row: MonitoringDisplayRow; month?: number } | null>(null);
    const allRows = buildMonRows(apGroups, subResults, dimensions);
    const search = query.trim().toLowerCase();
    const filtered = allRows.filter(row => {
        const data = monData[row.key] ?? emptyMonitoring(row.sub?.subId);
        return [row.dim?.name, row.sub?.subName, row.item, data.pic, data.checker, data.notes].join(" ").toLowerCase().includes(search) &&
            (status === "all" || status === "unplanned" && !monthStatuses(data).length || monthStatuses(data).some(month => month.status === status));
    });
    const rows = mergeMonitoringRows(filtered);
    const uniqueCount = new Set(allRows.map(row => row.key)).size;
    const shownCount = new Set(rows.map(row => row.key)).size;
    return <section className={styles.stack} aria-label="Action step monitoring">
        <SectionHeading title="Action step monitoring" description="Track the work behind your target levels. Assign owners and review progress across six months." />
        <div className={styles.toolbar}>
            <div className={styles.toolbarSearch}><SearchField label="Search monitoring" hint="Search action steps, dimensions, PIC, checker, or notes." hideLabel hideHint placeholder="Search action steps or owners" value={query} onChange={event => setQuery(event.target.value)} onClear={() => setQuery("")} /></div>
            <div className={styles.toolbarSelect}><SelectField label="Monthly status" hint="Find steps with this status in any month." value={status} onChange={event => setStatus(event.target.value)}><option value="all">All statuses</option><option value="unplanned">No timeline set</option>{MONITORING_STATUSES.map(item => <option key={item} value={item}>{item}</option>)}</SelectField></div>
        </div>
        <div className={styles.legend} aria-label="Timeline legend">{MONITORING_STATUSES.map(item => <span key={item}><MonitoringStatusLabel status={item} /><span>{STATUS_SHORT[item]}</span></span>)}</div>
        {!rows.length ? <EmptyState icon={<CalendarDays />} title={allRows.length ? "No matching action steps" : "No monitoring steps yet"} description={allRows.length ? "Try another search or show all statuses." : "Assessment sub-dimensions and action plans will appear here when they are available."} action={allRows.length ? <Button variant="secondary" onClick={() => { setQuery(""); setStatus("all"); }}>Clear filters</Button> : undefined} /> : <div className={styles.tableShell}>
            <div className={styles.tableHint}><span role="status">{shownCount} of {uniqueCount} monitoring steps</span><span>{onChangeRow ? "Select a month or edit a step. Save changes when you are done." : "Scroll horizontally to view the full timeline."}</span></div>
            <div className={styles.tableViewport} tabIndex={0} role="region" aria-label="Monitoring table, horizontally scrollable">
                <table className={`${styles.dataTable} ${styles.monitoringTable}`}>
                    <caption className="sr-only">Action step monitoring with final results, expected levels, six monthly statuses, PIC, checker, achievement status, and notes.</caption>
                    <colgroup><col style={{ width: "8rem" }} /><col style={{ width: "10rem" }} /><col style={{ width: "5rem" }} /><col style={{ width: "5rem" }} /><col style={{ width: "16rem" }} />{MONITORING_MONTHS.map(month => <col key={month} style={{ width: "4rem" }} />)}<col style={{ width: "10rem" }} /><col style={{ width: "9rem" }} /><col style={{ width: "11rem" }} /><col style={{ width: "13rem" }} />{onChangeRow && <col style={{ width: "4rem" }} />}</colgroup>
                    <thead>
                        <tr>{["Dimension", "Sub-dimension", "Final result", "Expected level", "Action plan"].map(label => <th scope="col" rowSpan={2} key={label}>{label}</th>)}<th scope="colgroup" colSpan={6} className={styles.center}>Timeline (month)</th>{["PIC", "Checker", "Achievement status", "Notes"].map(label => <th scope="col" rowSpan={2} key={label}>{label}</th>)}{onChangeRow && <th scope="col" rowSpan={2}><span className="sr-only">Edit monitoring</span></th>}</tr>
                        <tr>{MONITORING_MONTHS.map(month => <th scope="col" key={month}><span className="sr-only">Month </span>{month}</th>)}</tr>
                    </thead>
                    <tbody>{rows.map((row, index) => {
                        const data = monData[row.key] ?? emptyMonitoring(row.sub?.subId);
                        const months = monthStatuses(data);
                        const used = MONITORING_STATUSES.filter(item => months.some(month => month.status === item));
                        const name = row.item || row.sub?.subName || "Monitoring step";
                        return <tr key={`${row.key}-${index}`}>
                            {row.isFirstDimRow && <th scope="rowgroup" rowSpan={row.dimSpan} className={styles.dimensionCell}>{row.dim?.name ?? "—"}</th>}
                            {row.subSpan > 0 && <><th scope="row" rowSpan={row.subSpan} className={styles.subCell}>{row.sub?.subName ?? "—"}</th><td rowSpan={row.subSpan} className={styles.center}><span className={styles.score}>{finalResults[row.sub?.subId] ?? "—"}</span></td><td rowSpan={row.subSpan} className={styles.center}><span className={styles.score}>{subAnalysis[row.sub?.subId]?.el || "—"}</span></td></>}
                            {row.renderAp && <>
                                <td rowSpan={row.apSpan}>{row.item ? <><span className={styles.cellLabel}>Step {row.itemIdx + 1}{row.grp.label ? ` · ${row.grp.label}` : ""}</span><p>{row.item}</p></> : <span className={styles.muted}>No action plan recorded</span>}</td>
                                {MONITORING_MONTHS.map(month => {
                                    const value = months.find(item => item.month === month)?.status;
                                    const Icon = value ? statusIcons[value] : Circle;
                                    const content = <><Icon aria-hidden="true" /><span>{value ? STATUS_SHORT[value] : "—"}</span></>;
                                    return <td rowSpan={row.apSpan} key={month} className={styles.monthCell}>{onChangeRow ? <button type="button" disabled={saving} className={styles.month} data-state={value} onClick={() => setEditor({ row, month })} aria-label={`${name}, month ${month}: ${value || "Not scheduled"}. Edit timeline.`} title={`Month ${month}: ${value || "Not scheduled"}`}>{content}</button> : <span className={styles.month} data-state={value} aria-label={`Month ${month}: ${value || "Not scheduled"}`} title={`Month ${month}: ${value || "Not scheduled"}`}>{content}</span>}</td>;
                                })}
                                <td rowSpan={row.apSpan}>{data.pic || <span className={styles.muted}>Unassigned</span>}</td>
                                <td rowSpan={row.apSpan}>{data.checker || <span className={styles.muted}>Unassigned</span>}</td>
                                <td rowSpan={row.apSpan}><div className={styles.stateList}>{used.length ? used.map(item => <MonitoringStatusLabel key={item} status={item} />) : data.achievementStatus ? <MonitoringStatusLabel status={data.achievementStatus} /> : <span className={styles.muted}>Not scheduled</span>}</div></td>
                                <td rowSpan={row.apSpan} className={styles.cellText}>{data.notes || <span className={styles.muted}>No notes</span>}</td>
                                {onChangeRow && <td rowSpan={row.apSpan}><IconButton aria-label={`Edit monitoring: ${name}`} title="Edit monitoring step" disabled={saving} onClick={() => setEditor({ row })}><Pencil aria-hidden="true" /></IconButton></td>}
                            </>}
                        </tr>;
                    })}</tbody>
                </table>
            </div>
        </div>}
        {(error || saveError) && <Alert variant="error">{error || saveError}</Alert>}
        {onSave && <div className={styles.saveBar}><div role="status"><strong>{saving ? "Saving monitoring…" : dirty ? "You have unsaved changes" : "Monitoring changes"}</strong><p>{dirty ? "Your changes are kept while you switch between results and monitoring." : "Updates to owners, timelines, and notes are saved together."}</p></div><Button loading={saving} disabled={dirty === false} leadingIcon={<Save aria-hidden="true" />} onClick={onSave}>Save monitoring</Button></div>}
        {editor && onChangeRow && <MonitoringEditor key={`${editor.row.key}-${editor.month ?? "step"}`} row={editor.row} initialValue={monData[editor.row.key] ?? emptyMonitoring(editor.row.sub?.subId)} highlightedMonth={editor.month} onClose={() => setEditor(null)} onApply={value => { onChangeRow(editor.row.key, value); setEditor(null); }} onClear={onDeleteRow ? () => { onDeleteRow(editor.row.key); setEditor(null); } : undefined} />}
    </section>;
}

function MonitoringEditor({ row, initialValue, highlightedMonth, onClose, onApply, onClear }: { row: MonitoringDisplayRow; initialValue: MonRowData; highlightedMonth?: number; onClose: () => void; onApply: (data: MonRowData) => void; onClear?: () => void }) {
    const [value, setValue] = useState(initialValue);
    const [clearing, setClearing] = useState(false);
    const months = monthStatuses(value);
    const update = (patch: Partial<MonRowData>) => setValue(previous => ({ ...previous, ...patch }));
    function changeMonth(month: number, status: MonitoringStatus | "") {
        const timelineStatuses = [...months.filter(item => item.month !== month), ...(status ? [{ month, status }] : [])].sort((a, b) => a.month - b.month);
        update({ timelineStatuses, timeline: timelineStatuses.map(item => item.month), achievementStatus: "" });
    }
    function apply(event: FormEvent) { event.preventDefault(); onApply(value); }
    return <Modal open title="Edit monitoring step" description={`${row.dim?.name ?? "Assessment"} · ${row.sub?.subName ?? "Action plan"}`} icon={<Flag />} onClose={onClose} dismissOnBackdrop={false}>
        <form className={styles.editor} onSubmit={apply}>
            <div className={styles.infoPanel}><strong>{row.item || "No action plan recorded"}</strong><p>Apply the update, then choose Save monitoring to save it to the assessment.</p></div>
            <div className={styles.twoColumns}><TextField label="PIC (person in charge)" hint="Who is responsible for carrying out this step?" value={value.pic} onChange={event => update({ pic: event.target.value })} /><TextField label="Checker" hint="Who will review the progress and outcome?" value={value.checker} onChange={event => update({ checker: event.target.value })} /></div>
            <div><h3>Six-month timeline</h3><p className={styles.caption}>{highlightedMonth ? `You selected month ${highlightedMonth}. ` : ""}Choose a status for each planned month; leave unused months unscheduled.</p></div>
            <div className={styles.monthFields}>{MONITORING_MONTHS.map(month => <SelectField key={month} label={`Month ${month}`} hint={month === highlightedMonth ? "Selected month" : "Monthly progress"} value={months.find(item => item.month === month)?.status ?? ""} onChange={event => changeMonth(month, event.target.value as MonitoringStatus | "")}><option value="">Not scheduled</option>{MONITORING_STATUSES.map(item => <option key={item} value={item}>{item}</option>)}</SelectField>)}</div>
            <TextAreaField label="Notes" hint="Record blockers, review dates, or the next action." value={value.notes} onChange={event => update({ notes: event.target.value })} />
            {clearing && <Alert><div className={styles.stack}><p>Clear the owners, timeline, status, and notes for this step? The action plan stays in place. This is saved only when you save monitoring.</p><div className={styles.formActions}><Button variant="secondary" onClick={() => setClearing(false)}>Keep details</Button><Button onClick={onClear}>Clear step details</Button></div></div></Alert>}
            <div className={styles.formActions}>{onClear && hasMonitoringData(initialValue) && <Button variant="secondary" leadingIcon={<RotateCcw aria-hidden="true" />} onClick={() => setClearing(true)}>Clear details</Button>}<Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit">Apply update</Button></div>
        </form>
    </Modal>;
}
