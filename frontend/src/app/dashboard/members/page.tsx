"use client";

import { useState } from "react";
import { CheckCircle2, Layers, Pencil, Plus, RefreshCw, ShieldCheck, ShieldOff, Trash2, Users, UserX } from "lucide-react";
import toast from "react-hot-toast";
import { Button, IconButton, LoadingState, SearchField } from "@/components/ui";
import { useWorkspaceResource } from "@/hooks/useWorkspaceResource";
import { ConfirmAction, EmptyState, FilterTabs, initials, Metric, ResourceError, WorkspacePage } from "@/components/workspace/WorkspaceUI";
import { MemberEditor } from "@/components/workspace/MemberEditor";
import styles from "@/components/workspace/company-workspace.module.css";
import type { CompanyMember } from "@/types";
import api from "@/lib/api";
import { requestError } from "@/lib/workspace";

type MemberFilter = "all" | "active" | "inactive" | "unassigned";
export default function MembersPage() {
    const resource = useWorkspaceResource<{ members: CompanyMember[]; availableRoles: string[] }>("/company/members");
    const members = resource.data?.members ?? [];
    const [query, setQuery] = useState("");
    const [filter, setFilter] = useState<MemberFilter>("all");
    const [editor, setEditor] = useState<CompanyMember | "create" | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<CompanyMember | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState("");
    const [updating, setUpdating] = useState<string[]>([]);
    const active = members.filter(member => member.isActive).length;
    const unassigned = members.filter(member => !member.allowedDimensions?.length).length;
    const search = query.trim().toLowerCase();
    const filtered = members.filter(member => `${member.name} ${member.email} ${member.memberRole ?? ""}`.toLowerCase().includes(search) && (filter === "all" || filter === "active" && member.isActive || filter === "inactive" && !member.isActive || filter === "unassigned" && !member.allowedDimensions?.length));
    const value = (number: number) => resource.loading || resource.error ? "—" : number;
    async function toggleActive(member: CompanyMember) {
        if (updating.includes(member._id)) return;
        setUpdating(values => [...values, member._id]);
        try { await api.put(`/company/members/${member._id}`, { isActive: !member.isActive }); toast.success(member.isActive ? "Member deactivated" : "Member reactivated"); resource.refresh(); }
        catch (cause) { toast.error(requestError(cause, "Couldn't update member access. Try again.")); }
        finally { setUpdating(values => values.filter(value => value !== member._id)); }
    }
    async function remove() {
        if (!deleteTarget || deleting) return;
        setDeleting(true); setDeleteError("");
        try { await api.delete(`/company/members/${deleteTarget._id}`); setDeleteTarget(null); toast.success("Member removed"); resource.refresh(); }
        catch (cause) { setDeleteError(requestError(cause, "Couldn't remove this member. Try again.")); }
        finally { setDeleting(false); }
    }
    return <WorkspacePage title="Team members" description="Bring the right people into each assessment and manage their access." actions={<><IconButton aria-label="Refresh team members" title="Refresh team members" onClick={resource.refresh} disabled={resource.loading}><RefreshCw aria-hidden="true" /></IconButton><Button leadingIcon={<Plus aria-hidden="true" />} onClick={() => setEditor("create")}>Add member</Button></>}>
        <section className={styles.metrics} aria-label="Team summary"><Metric label="Team members" value={value(members.length)} detail="Assessor accounts" icon={<Users />} /><Metric label="Active accounts" value={value(active)} detail="Can access the workspace" icon={<CheckCircle2 />} /><Metric label="Inactive accounts" value={value(members.length - active)} detail="Access is paused" icon={<UserX />} /><Metric label="Need dimensions" value={value(unassigned)} detail="Assign assessment access" icon={<Layers />} /></section>
        <div className={styles.collection}>
            <div className={styles.search}><SearchField label="Search team members" hint="Search by name, email, or department." hideLabel hideHint placeholder="Search name, email, or department…" value={query} onChange={event => setQuery(event.target.value)} onClear={() => setQuery("")} /></div>
            {!resource.loading && !resource.error && <FilterTabs<MemberFilter> label="Filter team members" value={filter} onChange={setFilter} items={[{ value: "all", label: "All members", count: members.length }, { value: "active", label: "Active", count: active }, { value: "inactive", label: "Inactive", count: members.length - active }, { value: "unassigned", label: "Need dimensions", count: unassigned }]} />}
            {resource.loading ? <LoadingState>Loading team members.</LoadingState> : resource.error ? <ResourceError message="Couldn't load team members. Try again to manage access." retry={resource.refresh} /> : !filtered.length ? <EmptyState icon={<Users />} title={members.length ? "No matching team members" : "Build your assessment team"} description={members.length ? "Try another name, email, or department, or clear your filters." : "Add your first team member and choose the dimensions they will assess."} action={members.length ? <Button variant="secondary" onClick={() => { setQuery(""); setFilter("all"); }}>Clear filters</Button> : undefined} /> : <>
                <div className={styles.tableWrap} role="region" aria-label="Team members table" tabIndex={0}><table className={styles.table}><thead><tr><th scope="col">Team member</th><th scope="col">Department</th><th scope="col">Dimension access</th><th scope="col">Account</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead><tbody>{filtered.map(member => <tr key={member._id}>
                    <td><div className={styles.person}><span className={styles.avatar}>{initials(member.name)}</span><div className={styles.personCopy}><strong>{member.name}</strong><span>{member.email}</span></div></div></td>
                    <td>{member.memberRole || <span className={styles.muted}>Not specified</span>}</td>
                    <td><span title={member.allowedDimensions?.map(dimension => dimension.name).join(", ")}>{member.allowedDimensions?.length ? `${member.allowedDimensions.length} dimensions` : "No dimensions assigned"}</span></td>
                    <td><span className={styles.status} data-status={member.isActive ? "active" : "draft"}>{member.isActive ? <CheckCircle2 aria-hidden="true" /> : <UserX aria-hidden="true" />}{member.isActive ? "Active" : "Inactive"}</span></td>
                    <td><div className={styles.tableActions}><IconButton aria-label={`Edit ${member.name}`} title="Edit member" disabled={updating.includes(member._id)} onClick={() => setEditor(member)}><Pencil aria-hidden="true" /></IconButton><IconButton aria-label={`${member.isActive ? "Deactivate" : "Reactivate"} ${member.name}`} title={member.isActive ? "Deactivate account" : "Reactivate account"} disabled={updating.includes(member._id)} onClick={() => toggleActive(member)}>{member.isActive ? <ShieldOff aria-hidden="true" /> : <ShieldCheck aria-hidden="true" />}</IconButton><IconButton aria-label={`Remove ${member.name}`} title="Remove member" disabled={updating.includes(member._id)} onClick={() => { setDeleteError(""); setDeleteTarget(member); }}><Trash2 aria-hidden="true" /></IconButton></div></td>
                </tr>)}</tbody></table></div><p className={styles.resultsCount} role="status">Showing {filtered.length} of {members.length} members</p>
            </>}
        </div>
        {editor && <MemberEditor key={editor === "create" ? "create" : editor._id} member={editor === "create" ? undefined : editor} roles={resource.data?.availableRoles ?? []} onClose={() => setEditor(null)} onSaved={() => { setEditor(null); resource.refresh(); toast.success(editor === "create" ? "Member account created" : "Member updated"); }} />}
        {deleteTarget && <ConfirmAction title={`Remove ${deleteTarget.name}?`} description="This permanently deletes their account. To temporarily pause access, cancel and deactivate the account instead." label="Remove member" pending={deleting} error={deleteError} onClose={() => setDeleteTarget(null)} onConfirm={remove} />}
    </WorkspacePage>;
}
