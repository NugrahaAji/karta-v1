"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight, CalendarClock, CheckCircle2, ChevronRight, CircleDashed, Clock3, HelpCircle, RefreshCw, XCircle } from "lucide-react";
import { Alert, Button, IconLink, Modal } from "@/components/ui";
import type { SessionStatus } from "@/types";
import styles from "./company-workspace.module.css";

export function WorkspacePage({ title, description, eyebrow, actions, children }: {
    title: string; description: string; eyebrow?: string; actions?: ReactNode; children: ReactNode;
}) {
    return <div className={styles.page}>
        <div className={styles.topbar}>
            <nav aria-label="Breadcrumb"><Link href="/dashboard">Company workspace</Link><ChevronRight aria-hidden="true" /><span aria-current="page">{eyebrow ?? title}</span></nav>
            <IconLink href="/docs" aria-label="Workspace help" title="Workspace help"><HelpCircle aria-hidden="true" /></IconLink>
        </div>
        <div className={styles.pageBody}>
            <header className={styles.pageHeader}><div><h1>{title}</h1><p>{description}</p></div>{actions && <div className={styles.actions}>{actions}</div>}</header>
            {children}
        </div>
    </div>;
}

export function SectionHeading({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
    return <div className={styles.sectionHeading}><div><h2>{title}</h2>{description && <p>{description}</p>}</div>{action}</div>;
}

export function Metric({ label, value, detail, icon, href }: { label: string; value: ReactNode; detail: string; icon: ReactNode; href?: string }) {
    const content = <><div className={styles.metricLabel}>{label}<span>{icon}</span></div><strong className={styles.metricValue}>{value}</strong><span className={styles.metricDetail}>{detail}{href && <ArrowUpRight aria-hidden="true" />}</span></>;
    return href ? <Link className={styles.metric} href={href}>{content}</Link> : <div className={styles.metric}>{content}</div>;
}

export const sessionStatuses: { value: SessionStatus; label: string }[] = [
    { value: "active", label: "Active" }, { value: "scheduled", label: "Scheduled" },
    { value: "draft", label: "Draft" }, { value: "completed", label: "Completed" }, { value: "cancelled", label: "Cancelled" },
];
const statusIcons = { active: Clock3, scheduled: CalendarClock, draft: CircleDashed, completed: CheckCircle2, cancelled: XCircle };

export function StatusBadge({ status }: { status: SessionStatus }) {
    const Icon = statusIcons[status] ?? CircleDashed;
    return <span className={styles.status} data-status={status}><Icon aria-hidden="true" />{sessionStatuses.find(item => item.value === status)?.label ?? status}</span>;
}

/** Filters, not ARIA tabs: every button filters the same collection. */
export function FilterTabs<T extends string>({ label, items, value, onChange }: { label: string; items: { value: T; label: string; count?: number }[]; value: T; onChange: (value: T) => void }) {
    return <div className={styles.filters} role="group" aria-label={label}>{items.map(item => <button key={item.value} type="button" aria-pressed={value === item.value} onClick={() => onChange(item.value)}>{item.label}{item.count !== undefined && <span>{item.count}</span>}</button>)}</div>;
}

export function EmptyState({ title, description, icon, action }: { title: string; description: string; icon?: ReactNode; action?: ReactNode }) {
    return <div className={styles.empty}>{icon && <span className={styles.emptyIcon}>{icon}</span>}<h3>{title}</h3><p>{description}</p>{action}</div>;
}

export function ResourceError({ message, retry }: { message: string; retry: () => void }) {
    return <Alert variant="error"><div className={styles.errorContent}><p>{message}</p><Button variant="secondary" onClick={retry} leadingIcon={<RefreshCw aria-hidden="true" />}>Try again</Button></div></Alert>;
}

export function AvatarGroup({ people }: { people: { _id: string; name: string }[] }) {
    return <span className={styles.avatarGroup} aria-label={people.length ? people.map(person => person.name).join(", ") : "No members assigned"}>
        {people.slice(0, 3).map(person => <span key={person._id} className={styles.avatar} title={person.name} aria-hidden="true">{initials(person.name)}</span>)}
        {people.length > 3 && <span className={styles.avatar} aria-hidden="true">+{people.length - 3}</span>}
        {!people.length && <span className={styles.muted}>Unassigned</span>}
    </span>;
}

export function initials(name: string) { return name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase(); }

export function ConfirmAction({ title, description, label, pending, error, onClose, onConfirm }: {
    title: string; description: string; label: string; pending: boolean; error?: string; onClose: () => void; onConfirm: () => void;
}) {
    return <Modal open title={title} description={description} onClose={onClose} closeDisabled={pending}>
        <div className={styles.form}>{error && <Alert variant="error">{error}</Alert>}<div className={styles.formActions}><Button variant="secondary" disabled={pending} onClick={onClose}>Cancel</Button><Button loading={pending} onClick={onConfirm}>{label}</Button></div></div>
    </Modal>;
}
