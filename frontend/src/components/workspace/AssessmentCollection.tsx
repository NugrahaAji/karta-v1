"use client";

import { useState } from "react";
import Link from "next/link";
import { Activity, ArrowUpRight, CalendarDays, ClipboardList, LayoutGrid, List, Pencil, Trash2, Users } from "lucide-react";
import { Button, IconButton, IconLink, LoadingState, SearchField } from "@/components/ui";
import { AvatarGroup, EmptyState, FilterTabs, ResourceError, sessionStatuses, StatusBadge } from "./WorkspaceUI";
import { formatWorkspaceDate, selectAssessments, type AssessmentFilter, type AssessmentSort } from "@/lib/workspace";
import type { AssessmentSession } from "@/types";
import styles from "./company-workspace.module.css";

export function AssessmentCollection({ sessions, loading, error, retry, onEdit, onDelete, initialFilter = "all", compact = false }: {
    sessions: AssessmentSession[]; loading: boolean; error: boolean; retry: () => void;
    onEdit?: (session: AssessmentSession) => void; onDelete?: (session: AssessmentSession) => void;
    initialFilter?: AssessmentFilter; compact?: boolean;
}) {
    const [query, setQuery] = useState("");
    const [status, setStatus] = useState<AssessmentFilter>(initialFilter);
    const [sort, setSort] = useState<AssessmentSort>("updated");
    const [view, setView] = useState<"grid" | "list">("grid");
    const filtered = selectAssessments(sessions, query, status, sort);
    const shown = compact ? filtered.slice(0, 4) : filtered;
    const filters: { value: AssessmentFilter; label: string; count?: number }[] = [
        { value: "all", label: "All", count: sessions.length },
        ...sessionStatuses.map(item => ({ ...item, count: sessions.filter(session => session.status === item.value).length })),
    ];
    const reset = () => { setQuery(""); setStatus("all"); };
    return <div className={styles.collection}>
        <div className={styles.toolbar}>
            <div className={styles.search}><SearchField label="Search assessments" hint="Search by title, description, or team member." hideLabel hideHint placeholder="Search assessments…" value={query} onChange={event => setQuery(event.target.value)} onClear={() => setQuery("")} /></div>
            <div className={styles.viewControls}>
                {!compact && <label className={styles.sort}>Sort<select aria-label="Sort assessments" value={sort} onChange={event => setSort(event.target.value as AssessmentSort)}><option value="updated">Recently updated</option><option value="due">Due date</option><option value="name">Name</option></select></label>}
                <IconButton aria-label="Grid view" title="Grid view" aria-pressed={view === "grid"} onClick={() => setView("grid")}><LayoutGrid aria-hidden="true" /></IconButton>
                <IconButton aria-label="List view" title="List view" aria-pressed={view === "list"} onClick={() => setView("list")}><List aria-hidden="true" /></IconButton>
            </div>
        </div>
        {!loading && !error && <FilterTabs<AssessmentFilter> label="Filter assessments by status" items={filters} value={status} onChange={setStatus} />}
        {loading ? <LoadingState>Loading assessments.</LoadingState> : error ? <ResourceError message="Couldn't load assessments. Try again to see the latest activity." retry={retry} /> : !shown.length ?
            <EmptyState icon={<ClipboardList />} title={sessions.length ? "No matching assessments" : "Your first assessment starts here"} description={sessions.length ? "Try a different search or clear your filters." : "Create an assessment, choose your dimensions, and bring your team together."} action={sessions.length ? <Button variant="secondary" onClick={reset}>Clear filters</Button> : undefined} /> : <>
                {view === "grid" ? <div className={styles.cardGrid}>{shown.map(session => <AssessmentCard key={session._id} session={session} onEdit={onEdit} onDelete={onDelete} />)}</div> :
                    <div className={styles.tableWrap} role="region" aria-label="Assessments table" tabIndex={0}><table className={styles.table}><thead><tr><th scope="col">Assessment</th><th scope="col">Status</th><th scope="col">Team</th><th scope="col">Due date</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead><tbody>{shown.map(session => <tr key={session._id}>
                        <td><Link className={styles.tableTitle} href={`/dashboard/manage-sessions/${session._id}`}>{session.title}</Link><p>{session.dimensions.length ? `${session.dimensions.length} dimensions` : "All dimensions"}</p></td>
                        <td><StatusBadge status={session.status} /></td><td><AvatarGroup people={session.assignedTo} /></td><td className={styles.caption}>{formatWorkspaceDate(session.endDate)}</td>
                        <td><AssessmentActions session={session} onEdit={onEdit} onDelete={onDelete} /></td>
                    </tr>)}</tbody></table></div>}
                <p className={styles.resultsCount} role="status">Showing {shown.length} of {filtered.length} assessment{filtered.length !== 1 ? "s" : ""}{compact && filtered.length > shown.length && <> · <Link href="/dashboard/manage-sessions" className={styles.textLink}>View all assessments</Link></>}</p>
            </>}
    </div>;
}

function AssessmentActions({ session, onEdit, onDelete }: { session: AssessmentSession; onEdit?: (session: AssessmentSession) => void; onDelete?: (session: AssessmentSession) => void }) {
    return <div className={styles.cardActions}>
        <IconLink href={`/dashboard/manage-sessions/${session._id}?tab=monitoring`} aria-label={`Monitor ${session.title}`} title="Open monitoring"><Activity aria-hidden="true" /></IconLink>
        {onEdit && <IconButton onClick={() => onEdit(session)} aria-label={`Edit ${session.title}`} title="Edit assessment"><Pencil aria-hidden="true" /></IconButton>}
        {onDelete && <IconButton onClick={() => onDelete(session)} aria-label={`Delete ${session.title}`} title="Delete assessment"><Trash2 aria-hidden="true" /></IconButton>}
    </div>;
}

function AssessmentCard({ session, onEdit, onDelete }: { session: AssessmentSession; onEdit?: (session: AssessmentSession) => void; onDelete?: (session: AssessmentSession) => void }) {
    return <article className={styles.assessmentCard}>
        <div className={styles.cardTop}><StatusBadge status={session.status} /><IconLink href={`/dashboard/manage-sessions/${session._id}`} aria-label={`Open ${session.title}`} title="Open assessment"><ArrowUpRight aria-hidden="true" /></IconLink></div>
        <div><h3><Link href={`/dashboard/manage-sessions/${session._id}`} className={styles.assessmentTitle}>{session.title}</Link></h3><p className={styles.description}>{session.description || "HP3M maturity assessment"}</p></div>
        <div className={styles.cardMeta}><span><CalendarDays aria-hidden="true" />{session.endDate ? `Due ${formatWorkspaceDate(session.endDate)}` : "No due date"}</span><span><Users aria-hidden="true" />{session.assignedTo.length} member{session.assignedTo.length !== 1 ? "s" : ""}</span></div>
        <footer className={styles.cardFooter}><AvatarGroup people={session.assignedTo} /><AssessmentActions session={session} onEdit={onEdit} onDelete={onDelete} /></footer>
    </article>;
}
