"use client";

import { useState, useEffect, useCallback } from "react";
import {
    CalendarClock, Plus, Pencil, Trash2, X, Check,
    AlertTriangle, Loader2, Users, Calendar, ChevronDown,
    CheckCircle2, XCircle, Clock, RefreshCw, Info, BarChart3, Activity
} from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { AssessmentSession, SessionStatus, CompanyMember, Dimension } from "@/types";
import toast from "react-hot-toast";

// ─── Status config ────────────────────────────────────────────────────────────
const STATUSES: { value: SessionStatus; label: string; color: string }[] = [
    { value: "draft",     label: "Draft",     color: "t-muted" },
    { value: "scheduled", label: "Scheduled", color: "text-blue-400" },
    { value: "active",    label: "Active",    color: "text-green-400" },
    { value: "completed", label: "Completed", color: "text-purple-400" },
    { value: "cancelled", label: "Cancelled", color: "text-red-400" },
];

function StatusBadge({ status }: { status: SessionStatus }) {
    const cfg = STATUSES.find(s => s.value === status);
    const icons: Record<SessionStatus, React.ElementType> = {
        draft: Clock, scheduled: CalendarClock, active: CheckCircle2,
        completed: CheckCircle2, cancelled: XCircle,
    };
    const Icon = icons[status] ?? Clock;
    const colors: Record<SessionStatus, string> = {
        draft:     "bg-gray-500/10 border-gray-500/20 text-gray-400",
        scheduled: "bg-blue-500/10 border-blue-500/30 text-blue-400",
        active:    "bg-green-500/10 border-green-500/30 text-green-400",
        completed: "bg-purple-500/10 border-purple-500/30 text-purple-400",
        cancelled: "bg-red-500/10 border-red-500/20 text-red-400",
    };
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${colors[status]}`}>
            <Icon className="w-3 h-3" /> {cfg?.label}
        </span>
    );
}

function formatDate(d?: string) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-6 py-4 sticky top-0 z-10"
                    style={{ borderBottom: "1px solid var(--border)", backgroundColor: "var(--bg-2)" }}>
                    <h3 className="font-semibold t-primary">{title}</h3>
                    <button onClick={onClose} className="btn-secondary !px-2 !py-1.5"><X className="w-4 h-4" /></button>
                </div>
                <div className="px-6 py-5">{children}</div>
            </div>
        </div>
    );
}

function ConfirmDelete({ title, onConfirm, onCancel, loading }: {
    title: string; onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="card w-full max-w-sm p-6 space-y-4">
                <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-red-500/10 border border-red-500/20 shrink-0">
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold t-primary mb-1">Delete "{title}"?</p>
                        <p className="text-xs t-secondary">This action cannot be undone.</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
                    <button onClick={onConfirm} disabled={loading}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition-all disabled:opacity-50">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Delete
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Session form (outside ManageSessionsPage to avoid remount bug) ─────────
interface SessionFormProps {
    isEdit: boolean;
    title: string; setTitle: (v: string) => void;
    description: string; setDescription: (v: string) => void;
    status: SessionStatus; setStatus: (v: SessionStatus) => void;
    startDate: string; setStartDate: (v: string) => void;
    endDate: string; setEndDate: (v: string) => void;
    selectedMembers: string[]; setSelectedMembers: (v: string[]) => void;
    selectedDimensions: string[]; setSelectedDimensions: (v: string[]) => void;
    members: CompanyMember[];
    dimensions: Dimension[];
    error: string;
    saving: boolean;
    onSubmit: () => void;
    onCancel: () => void;
}

function SessionForm({
    isEdit, title, setTitle, description, setDescription, status, setStatus,
    startDate, setStartDate, endDate, setEndDate,
    selectedMembers, setSelectedMembers, selectedDimensions, setSelectedDimensions,
    members, dimensions, error, saving, onSubmit, onCancel,
}: SessionFormProps) {
    const toggleMember = (id: string) =>
        setSelectedMembers(selectedMembers.includes(id)
            ? selectedMembers.filter(m => m !== id)
            : [...selectedMembers, id]);

    const toggleDimension = (id: string) =>
        setSelectedDimensions(selectedDimensions.includes(id)
            ? selectedDimensions.filter(d => d !== id)
            : [...selectedDimensions, id]);

    return (
        <div className="space-y-4">
            {/* Title */}
            <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest t-muted">Session Title</label>
                <input value={title} onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Q2 2025 HP3M Assessment" className="input w-full" />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest t-muted">Description (optional)</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)}
                    placeholder="Brief description of this assessment session..."
                    rows={2} className="input w-full resize-none" />
            </div>

            {/* Status */}
            <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest t-muted">Status</label>
                <div className="flex gap-2 flex-wrap">
                    {STATUSES.map(s => (
                        <button key={s.value} type="button" onClick={() => setStatus(s.value)}
                            className={`flex-1 min-w-[80px] py-2 rounded-md border text-xs font-semibold transition-all ${status === s.value
                                ? "bg-blue-500/20 border-blue-500/50 text-blue-400"
                                : "border-[var(--border)] t-secondary hover:border-[var(--border-3)]"}`}>
                            {s.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Date range */}
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-widest t-muted flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Start Date
                    </label>
                    <input type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)}
                        className="input w-full text-sm" />
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-widest t-muted flex items-center gap-1">
                        <Clock className="w-3 h-3" /> End Date
                    </label>
                    <input type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)}
                        className="input w-full text-sm" />
                </div>
            </div>

            {/* Assign members */}
            <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest t-muted flex items-center gap-1.5">
                    <Users className="w-3 h-3" /> Assign Members
                    <span className="t-muted font-normal normal-case">({selectedMembers.length} selected)</span>
                </label>
                {members.length === 0 ? (
                    <p className="text-xs t-muted italic p-3 border rounded-md" style={{ borderColor: "var(--border)" }}>
                        No members in your team yet. Add members first.
                    </p>
                ) : (
                    <div className="border rounded-md overflow-hidden divide-y" style={{ borderColor: "var(--border)", maxHeight: "160px", overflowY: "auto" }}>
                        {members.map(m => (
                            <label key={m._id} className="flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors"
                                style={{ borderColor: "var(--border-2)" }}
                                onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--bg-3)")}
                                onMouseLeave={e => (e.currentTarget.style.backgroundColor = "")}>
                                <input type="checkbox" checked={selectedMembers.includes(m._id)}
                                    onChange={() => toggleMember(m._id)}
                                    className="accent-blue-500 w-3.5 h-3.5 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium t-primary truncate">{m.name}</p>
                                    <p className="text-xs t-muted truncate">{m.email}</p>
                                </div>
                                <span className="text-xs t-muted capitalize shrink-0">{m.role}</span>
                            </label>
                        ))}
                    </div>
                )}
            </div>

            {/* Select dimensions */}
            <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest t-muted flex items-center gap-1.5">
                    Dimensions
                    <span className="t-muted font-normal normal-case">
                        ({selectedDimensions.length === 0 ? "all" : `${selectedDimensions.length} selected`})
                    </span>
                </label>
                <p className="text-xs t-muted -mt-0.5">Leave all unchecked to include all dimensions.</p>
                <div className="border rounded-md overflow-hidden divide-y" style={{ borderColor: "var(--border)", maxHeight: "130px", overflowY: "auto" }}>
                    {dimensions.map(d => (
                        <label key={d._id} className="flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors"
                            style={{ borderColor: "var(--border-2)" }}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--bg-3)")}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = "")}>
                            <input type="checkbox" checked={selectedDimensions.includes(d._id)}
                                onChange={() => toggleDimension(d._id)}
                                className="accent-blue-500 w-3.5 h-3.5 shrink-0" />
                            <p className="text-sm font-medium t-primary truncate">{d.name}</p>
                        </label>
                    ))}
                </div>
            </div>

            {error && <p className="text-xs text-red-400 bg-red-500/5 border border-red-500/20 rounded px-3 py-2">{error}</p>}

            <div className="flex gap-2 pt-1">
                <button onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
                <button onClick={onSubmit} disabled={saving} className="btn-primary flex-1">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    {isEdit ? "Save Changes" : "Create Session"}
                </button>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ManageSessionsPage() {
    const [sessions, setSessions] = useState<AssessmentSession[]>([]);
    const [members, setMembers] = useState<CompanyMember[]>([]);
    const [dimensions, setDimensions] = useState<Dimension[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [editTarget, setEditTarget] = useState<AssessmentSession | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<AssessmentSession | null>(null);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Form state
    const [fTitle, setFTitle] = useState("");
    const [fDesc, setFDesc] = useState("");
    const [fStatus, setFStatus] = useState<SessionStatus>("draft");
    const [fStart, setFStart] = useState("");
    const [fEnd, setFEnd] = useState("");
    const [fMembers, setFMembers] = useState<string[]>([]);
    const [fDimensions, setFDimensions] = useState<string[]>([]);
    const [fError, setFError] = useState("");

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [sessRes, memRes, dimRes] = await Promise.all([
                api.get("/sessions/company"),
                api.get("/company/members"),
                api.get("/dimensions"),
            ]);
            setSessions(sessRes.data.sessions ?? []);
            setMembers(memRes.data.members ?? []);
            setDimensions(dimRes.data.dimensions ?? []);
        } catch { toast.error("Failed to load data"); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const resetForm = () => {
        setFTitle(""); setFDesc(""); setFStatus("draft");
        setFStart(""); setFEnd(""); setFMembers([]); setFDimensions([]); setFError("");
    };

    const openCreate = () => { resetForm(); setShowCreate(true); };
    const openEdit = (s: AssessmentSession) => {
        setFTitle(s.title); setFDesc(s.description); setFStatus(s.status);
        setFStart(s.startDate ? new Date(s.startDate).toISOString().slice(0, 16) : "");
        setFEnd(s.endDate ? new Date(s.endDate).toISOString().slice(0, 16) : "");
        setFMembers(s.assignedTo.map(m => m._id));
        setFDimensions(s.dimensions ?? []); setFError("");
        setEditTarget(s);
    };

    const payload = () => ({
        title: fTitle.trim(),
        description: fDesc.trim(),
        status: fStatus,
        startDate: fStart || undefined,
        endDate: fEnd || undefined,
        assignedTo: fMembers,
        dimensions: fDimensions,
    });

    const handleCreate = async () => {
        if (!fTitle.trim()) { setFError("Title is required"); return; }
        try {
            setSaving(true);
            await api.post("/sessions/company", payload());
            toast.success("Session created!");
            setShowCreate(false);
            fetchAll();
        } catch (e: unknown) {
            setFError((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Failed to create");
        } finally { setSaving(false); }
    };

    const handleUpdate = async () => {
        if (!editTarget || !fTitle.trim()) { setFError("Title is required"); return; }
        try {
            setSaving(true);
            await api.put(`/sessions/company/${editTarget._id}`, payload());
            toast.success("Session updated!");
            setEditTarget(null);
            fetchAll();
        } catch (e: unknown) {
            setFError((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Failed to update");
        } finally { setSaving(false); }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            setDeleting(true);
            await api.delete(`/sessions/company/${deleteTarget._id}`);
            toast.success("Session deleted");
            setDeleteTarget(null);
            fetchAll();
        } finally { setDeleting(false); }
    };

    const formProps: Omit<SessionFormProps, "isEdit" | "onSubmit" | "onCancel"> = {
        title: fTitle, setTitle: setFTitle,
        description: fDesc, setDescription: setFDesc,
        status: fStatus, setStatus: setFStatus,
        startDate: fStart, setStartDate: setFStart,
        endDate: fEnd, setEndDate: setFEnd,
        selectedMembers: fMembers, setSelectedMembers: setFMembers,
        selectedDimensions: fDimensions, setSelectedDimensions: setFDimensions,
        members, dimensions, error: fError, saving,
    };

    const statusCount = (s: SessionStatus) => sessions.filter(x => x.status === s).length;

    return (
        <div className="page-container">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
                        <CalendarClock className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold t-primary">Assessment Sessions</h1>
                        <p className="text-sm t-secondary mt-0.5">Create and manage assessment sessions for your team</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchAll} className="btn-secondary !px-2.5 !py-2" title="Refresh">
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    <button onClick={openCreate} className="btn-primary">
                        <Plus className="w-4 h-4" /> New Session
                    </button>
                </div>
            </div>

            {/* Stats strip */}
            {!loading && sessions.length > 0 && (
                <div className="flex items-center gap-6 mb-6 p-4 card">
                    {(["active", "scheduled", "completed", "draft"] as SessionStatus[]).map(s => (
                        <div key={s} className="text-center">
                            <p className={`text-2xl font-bold ${STATUSES.find(x => x.value === s)?.color}`}>{statusCount(s)}</p>
                            <p className="text-xs t-muted capitalize">{s}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Info banner */}
            <div className="info-banner info-banner-amber mb-6">
                <Info className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                <p className="text-xs t-secondary leading-relaxed">
                    Set status to <strong>Active</strong> so assigned members can see and start the session. <strong>Scheduled</strong> sessions are visible but not yet actionable.
                </p>
            </div>

            {/* Loading */}
            {loading && (
                <div className="card flex items-center justify-center py-24">
                    <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                </div>
            )}

            {/* Empty */}
            {!loading && sessions.length === 0 && (
                <div className="card py-24 flex flex-col items-center gap-4">
                    <div className="empty-icon-wrap"><CalendarClock className="w-8 h-8 text-blue-400/40" /></div>
                    <p className="text-sm t-muted text-center">No sessions yet.<br />Create your first assessment session to get started.</p>
                    <button onClick={openCreate} className="btn-primary">
                        <Plus className="w-4 h-4" /> Create First Session
                    </button>
                </div>
            )}

            {/* Sessions table */}
            {!loading && sessions.length > 0 && (
                <div className="card overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="table-header-row text-left">
                                <th className="table-header-cell">Session</th>
                                <th className="table-header-cell">Status</th>
                                <th className="table-header-cell">Members</th>
                                <th className="table-header-cell">Start</th>
                                <th className="table-header-cell">End</th>
                                <th className="table-header-cell text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sessions.map(s => (
                                <tr key={s._id} className="table-row-hover transition-colors" style={{ borderTop: "1px solid var(--border-2)" }}>
                                    <td className="px-5 py-4">
                                        <p className="font-semibold t-primary">{s.title}</p>
                                        {s.description && <p className="text-xs t-muted truncate max-w-xs">{s.description}</p>}
                                    </td>
                                    <td className="px-5 py-4"><StatusBadge status={s.status} /></td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-1.5 text-xs t-secondary">
                                            <Users className="w-3.5 h-3.5" />
                                            {s.assignedTo.length} member{s.assignedTo.length !== 1 ? "s" : ""}
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-xs t-muted">{formatDate(s.startDate)}</td>
                                    <td className="px-5 py-4 text-xs t-muted">{formatDate(s.endDate)}</td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center justify-end gap-1.5">
                                            <Link href={`/dashboard/manage-sessions/${s._id}?tab=monitoring`}
                                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold border transition-all"
                                                style={{ backgroundColor: "rgba(251,146,60,0.08)", borderColor: "rgba(251,146,60,0.25)", color: "rgb(251,146,60)" }}
                                            >
                                                <Activity className="w-3.5 h-3.5" /> Monitoring
                                            </Link>
                                            <Link href={`/dashboard/manage-sessions/${s._id}`}
                                                className="btn-secondary !px-2.5 !py-1.5 !text-xs gap-1.5">
                                                <BarChart3 className="w-3.5 h-3.5" /> Results
                                            </Link>
                                            <button onClick={() => openEdit(s)} className="btn-secondary !px-2.5 !py-1.5 !text-xs gap-1.5">
                                                <Pencil className="w-3.5 h-3.5" /> Edit
                                            </button>
                                            <button onClick={() => setDeleteTarget(s)}
                                                className="inline-flex items-center px-2.5 py-1.5 rounded-md border border-red-500/20 bg-red-500/5 text-red-400 text-xs hover:bg-red-500/15 transition-all">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create Modal */}
            {showCreate && (
                <Modal title="New Assessment Session" onClose={() => setShowCreate(false)}>
                    <SessionForm isEdit={false} {...formProps} onSubmit={handleCreate} onCancel={() => setShowCreate(false)} />
                </Modal>
            )}

            {/* Edit Modal */}
            {editTarget && (
                <Modal title="Edit Session" onClose={() => setEditTarget(null)}>
                    <SessionForm isEdit={true} {...formProps} onSubmit={handleUpdate} onCancel={() => setEditTarget(null)} />
                </Modal>
            )}

            {/* Confirm Delete */}
            {deleteTarget && (
                <ConfirmDelete title={deleteTarget.title} onConfirm={handleDelete}
                    onCancel={() => setDeleteTarget(null)} loading={deleting} />
            )}
        </div>
    );
}
