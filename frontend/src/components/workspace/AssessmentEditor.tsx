"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { Alert, Button, CheckboxChoice, ChoiceGroup, LoadingState, Modal, SelectField, TextAreaField, TextField } from "@/components/ui";
import { useWorkspaceResource } from "@/hooks/useWorkspaceResource";
import api from "@/lib/api";
import { requestError, toLocalDateTime } from "@/lib/workspace";
import type { AssessmentSession, CompanyMember, Dimension, SessionStatus } from "@/types";
import { ResourceError, sessionStatuses } from "./WorkspaceUI";
import styles from "./company-workspace.module.css";

export function AssessmentEditor({ session, onClose, onSaved }: { session?: AssessmentSession; onClose: () => void; onSaved: () => void }) {
    const members = useWorkspaceResource<{ members: CompanyMember[] }>("/company/members");
    const dimensions = useWorkspaceResource<{ dimensions: Dimension[] }>("/dimensions");
    const [title, setTitle] = useState(session?.title ?? "");
    const [description, setDescription] = useState(session?.description ?? "");
    const [status, setStatus] = useState<SessionStatus>(session?.status ?? "draft");
    const [startDate, setStartDate] = useState(toLocalDateTime(session?.startDate));
    const [endDate, setEndDate] = useState(toLocalDateTime(session?.endDate));
    const [assignedTo, setAssignedTo] = useState(session?.assignedTo.map(member => member._id) ?? []);
    const [selectedDimensions, setSelectedDimensions] = useState(session?.dimensions ?? []);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [dateError, setDateError] = useState("");
    const endRef = useRef<HTMLInputElement>(null);
    const requestLock = useRef(false);
    const toggle = (list: string[], id: string) => list.includes(id) ? list.filter(value => value !== id) : [...list, id];
    async function save(event: FormEvent) {
        event.preventDefault();
        if (requestLock.current) return;
        setError(""); setDateError("");
        if (!title.trim()) { setError("Enter an assessment title to continue."); return; }
        if (startDate && endDate && new Date(endDate) <= new Date(startDate)) { setDateError("Choose an end date after the start date."); endRef.current?.focus(); return; }
        requestLock.current = true;
        setSaving(true);
        const payload = { title: title.trim(), description: description.trim(), status, assignedTo, dimensions: selectedDimensions,
            startDate: startDate ? new Date(startDate).toISOString() : null, endDate: endDate ? new Date(endDate).toISOString() : null };
        try {
            if (session) await api.put(`/sessions/company/${session._id}`, payload);
            else await api.post("/sessions/company", payload);
            onSaved();
        } catch (cause) { setError(requestError(cause, "Couldn't save the assessment. Your entries are still here; try again.")); }
        finally { requestLock.current = false; setSaving(false); }
    }
    return <Modal open title={session ? "Edit assessment" : "Create assessment"} description="Set the scope, choose your team, and decide when to collect responses." icon={<ClipboardList />} onClose={onClose} closeDisabled={saving} dismissOnBackdrop={false}>
        <form className={styles.form} onSubmit={save} aria-busy={saving}>
            <fieldset className={styles.formFieldset} disabled={saving}>
                <TextField label="Assessment title" hint="Use a name your team will recognize." placeholder="e.g. Annual process maturity review" required value={title} onChange={event => setTitle(event.target.value)} />
                <TextAreaField label="Description (optional)" hint="Explain the purpose and scope of this assessment." value={description} onChange={event => setDescription(event.target.value)} />
                <SelectField label="Status" hint="Active assessments accept responses. Scheduled assessments are visible to members but must be activated manually." value={status} onChange={event => setStatus(event.target.value as SessionStatus)}>{sessionStatuses.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</SelectField>
                <div className={styles.formGrid}><TextField type="datetime-local" label="Start date (optional)" hint="Uses your local time zone." value={startDate} onChange={event => setStartDate(event.target.value)} /><TextField ref={endRef} type="datetime-local" label="End date (optional)" hint="Leave empty if there is no deadline." error={dateError} value={endDate} onChange={event => { setEndDate(event.target.value); setDateError(""); }} /></div>
                {members.loading ? <LoadingState inline>Loading team members.</LoadingState> : members.error ? <ResourceError message="Couldn't load team members." retry={members.refresh} /> : <ChoiceGroup label={`Assign team members (${assignedTo.length} selected)`} hint="Choose the people who will contribute to this assessment.">
                    {members.data?.members.length ? members.data.members.map(member => <CheckboxChoice key={member._id} label={`${member.name}${member.isActive ? "" : " (inactive)"}`} checked={assignedTo.includes(member._id)} onChange={() => setAssignedTo(toggle(assignedTo, member._id))} />) : <p className={styles.caption}>No team members yet. <Link className={styles.textLink} href="/dashboard/members">Manage your team</Link> or save a draft first.</p>}
                </ChoiceGroup>}
                {dimensions.loading ? <LoadingState inline>Loading dimensions.</LoadingState> : dimensions.error ? <ResourceError message="Couldn't load dimensions." retry={dimensions.refresh} /> : <ChoiceGroup label="Assessment dimensions" hint={selectedDimensions.length ? `${selectedDimensions.length} dimensions selected.` : "All dimensions are included when none are selected."}>
                    {dimensions.data?.dimensions.map(dimension => <CheckboxChoice key={dimension._id} label={dimension.name} checked={selectedDimensions.includes(dimension._id)} onChange={() => setSelectedDimensions(toggle(selectedDimensions, dimension._id))} />)}
                    {!dimensions.data?.dimensions.length && <p className={styles.caption}>No dimensions configured. Contact your administrator to set up the framework.</p>}
                </ChoiceGroup>}
            </fieldset>
            {error && <Alert variant="error">{error}</Alert>}
            <div className={styles.formActions}><Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button><Button type="submit" loading={saving} disabled={members.loading || dimensions.loading || members.error || dimensions.error}>{session ? "Save changes" : "Create assessment"}</Button></div>
        </form>
    </Modal>;
}
