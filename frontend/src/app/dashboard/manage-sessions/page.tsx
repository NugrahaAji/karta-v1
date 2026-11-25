"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, ClipboardList, Clock3, Info, Plus, RefreshCw, CalendarClock } from "lucide-react";
import toast from "react-hot-toast";
import { Button, IconButton, LoadingState } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { ASSESSMENTS_CHANGED_EVENT, useWorkspaceAssessments } from "@/hooks/useWorkspaceAssessments";
import { AssessmentCollection } from "@/components/workspace/AssessmentCollection";
import { AssessmentEditor } from "@/components/workspace/AssessmentEditor";
import { ConfirmAction, Metric, sessionStatuses, WorkspacePage } from "@/components/workspace/WorkspaceUI";
import styles from "@/components/workspace/company-workspace.module.css";
import { requestError, type AssessmentFilter } from "@/lib/workspace";
import api from "@/lib/api";
import type { AssessmentSession } from "@/types";

export default function ManageSessionsPage() {
    return <Suspense fallback={<LoadingState>Loading assessments.</LoadingState>}><ManageSessionsContent /></Suspense>;
}

function ManageSessionsContent() {
    const { user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const assessments = useWorkspaceAssessments("/sessions/company", user?._id ?? "", "/dashboard/manage-sessions");
    const [editor, setEditor] = useState<AssessmentSession | "create" | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<AssessmentSession | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState("");
    const rawStatus = searchParams.get("status");
    const initialFilter: AssessmentFilter = sessionStatuses.some(item => item.value === rawStatus) ? rawStatus as AssessmentFilter : "all";
    useEffect(() => {
        if (searchParams.get("create") === "true") {
            setEditor("create");
            router.replace("/dashboard/manage-sessions", { scroll: false });
        } else if (searchParams.get("edit") && !assessments.loading && !assessments.error) {
            const target = assessments.sessions.find(session => session._id === searchParams.get("edit"));
            if (target) setEditor(target);
            else toast.error("This assessment is no longer available.");
            router.replace("/dashboard/manage-sessions", { scroll: false });
        }
    }, [searchParams, router, assessments.loading, assessments.error, assessments.sessions]);
    const changed = () => window.dispatchEvent(new Event(ASSESSMENTS_CHANGED_EVENT));
    async function remove() {
        if (!deleteTarget || deleting) return;
        setDeleting(true); setDeleteError("");
        try { await api.delete(`/sessions/company/${deleteTarget._id}`); setDeleteTarget(null); changed(); toast.success("Assessment deleted"); }
        catch (cause) { setDeleteError(requestError(cause, "Couldn't delete this assessment. Try again.")); }
        finally { setDeleting(false); }
    }
    const count = (status?: string) => assessments.loading || assessments.error ? "—" : assessments.sessions.filter(session => !status || session.status === status).length;
    return <WorkspacePage title="Assessments" description="Plan assessments, collect team responses, and follow through on results." actions={<><IconButton aria-label="Refresh assessments" title="Refresh assessments" onClick={assessments.refresh} disabled={assessments.loading}><RefreshCw aria-hidden="true" /></IconButton><Button onClick={() => setEditor("create")} leadingIcon={<Plus aria-hidden="true" />}>Create assessment</Button></>}>
        <section className={styles.metrics} aria-label="Assessment summary"><Metric label="All assessments" value={count()} detail="Across your workspace" icon={<ClipboardList />} /><Metric label="Active" value={count("active")} detail="Accepting responses" icon={<Clock3 />} /><Metric label="Scheduled" value={count("scheduled")} detail="Ready for activation" icon={<CalendarClock />} /><Metric label="Completed" value={count("completed")} detail="Available for review" icon={<CheckCircle2 />} /></section>
        <div className={styles.notice}><Info aria-hidden="true" /><p>Set an assessment to <strong>Active</strong> when your team is ready to respond. Scheduled assessments stay read-only until you activate them.</p></div>
        <AssessmentCollection key={initialFilter} {...assessments} retry={assessments.refresh} initialFilter={initialFilter} onEdit={setEditor} onDelete={session => { setDeleteError(""); setDeleteTarget(session); }} />
        {editor && <AssessmentEditor key={editor === "create" ? "create" : editor._id} session={editor === "create" ? undefined : editor} onClose={() => setEditor(null)} onSaved={() => { toast.success(editor === "create" ? "Assessment created" : "Assessment updated"); setEditor(null); changed(); }} />}
        {deleteTarget && <ConfirmAction title={`Delete “${deleteTarget.title}”?`} description="This permanently deletes the assessment and all submitted responses. This action cannot be undone." label="Delete assessment" pending={deleting} error={deleteError} onClose={() => setDeleteTarget(null)} onConfirm={remove} />}
    </WorkspacePage>;
}
