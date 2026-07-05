"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Users, Plus, Pencil, Trash2, X, Check,
    AlertTriangle, Loader2, Shield, ShieldOff,
    User, Mail, Lock, Eye, EyeOff, UserCheck, UserX,
    RefreshCw, Layers, ChevronDown, ChevronUp
} from "lucide-react";
import api from "@/lib/api";
import { CompanyMember, Dimension } from "@/types";
import toast from "react-hot-toast";

// ─── Modal wrapper ────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="card w-full max-w-lg max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
                    <h3 className="font-semibold t-primary">{title}</h3>
                    <button onClick={onClose} className="btn-secondary !px-2 !py-1.5"><X className="w-4 h-4" /></button>
                </div>
                <div className="px-6 py-5 overflow-y-auto">{children}</div>
            </div>
        </div>
    );
}

// ─── Confirm Delete ───────────────────────────────────────────────────────────
function ConfirmDelete({ name, onConfirm, onCancel, loading }: {
    name: string; onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="card w-full max-w-sm p-6 space-y-4">
                <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-red-500/10 border border-red-500/20 shrink-0">
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold t-primary mb-1">Remove "{name}"?</p>
                        <p className="text-xs t-secondary">This will permanently delete their account.</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
                    <button onClick={onConfirm} disabled={loading} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition-all disabled:opacity-50">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Remove
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Password input ───────────────────────────────────────────────────────────
function PasswordInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
    const [show, setShow] = useState(false);
    return (
        <div className="relative">
            <input
                type={show ? "text" : "password"}
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                className="input w-full pr-10"
            />
            <button type="button" onClick={() => setShow(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 t-muted hover:t-secondary transition-colors">
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
        </div>
    );
}

// ─── Dimension Picker ─────────────────────────────────────────────────────────
function DimensionPicker({
    allDimensions,
    selected,
    onChange,
}: {
    allDimensions: Dimension[];
    selected: string[];
    onChange: (ids: string[]) => void;
}) {
    const [open, setOpen] = useState(false);

    const toggle = (id: string) => {
        if (selected.includes(id)) {
            onChange(selected.filter(d => d !== id));
        } else {
            onChange([...selected, id]);
        }
    };

    const selectedDims = allDimensions.filter(d => selected.includes(d._id));

    return (
        <div className="space-y-2">
            {/* Summary chips */}
            {selectedDims.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {selectedDims.map(d => (
                        <span
                            key={d._id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
                        >
                            {d.name}
                            <button
                                type="button"
                                onClick={() => toggle(d._id)}
                                className="hover:text-indigo-200 transition-colors"
                            >
                                <X className="w-2.5 h-2.5" />
                            </button>
                        </span>
                    ))}
                </div>
            )}

            {/* Toggle dropdown */}
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-md border text-sm t-secondary transition-all hover:border-[var(--border-3)]"
                style={{ borderColor: "var(--border)" }}
            >
                <span className="flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5" />
                    {selected.length === 0
                        ? "Select dimensions to assign…"
                        : `${selected.length} dimension${selected.length > 1 ? "s" : ""} selected`}
                </span>
                {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {open && (
                <div className="rounded-lg border overflow-hidden" style={{ borderColor: "var(--border)" }}>
                    {allDimensions.length === 0 ? (
                        <p className="text-xs t-muted px-3 py-3 text-center">No dimensions available</p>
                    ) : (
                        allDimensions.map(d => {
                            const checked = selected.includes(d._id);
                            return (
                                <button
                                    key={d._id}
                                    type="button"
                                    onClick={() => toggle(d._id)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors border-b last:border-b-0 ${checked
                                        ? "bg-indigo-500/10"
                                        : "hover:bg-[var(--bg-2)]"
                                        }`}
                                    style={{ borderColor: "var(--border-2)" }}
                                >
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${checked
                                        ? "bg-indigo-500 border-indigo-500"
                                        : "border-[var(--border-3)]"
                                        }`}>
                                        {checked && <Check className="w-2.5 h-2.5 text-white" />}
                                    </div>
                                    <div className="min-w-0">
                                        <p className={`font-medium leading-tight truncate ${checked ? "text-indigo-400" : "t-primary"}`}>{d.name}</p>
                                        {d.detail && <p className="text-xs t-muted truncate">{d.detail}</p>}
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}

// ─── MemberForm ───────────────────────────────────────────────────────────────
interface MemberFormProps {
    isEdit: boolean;
    allDimensions: Dimension[];
    formName: string; setFormName: (v: string) => void;
    formEmail: string; setFormEmail: (v: string) => void;
    formPassword: string; setFormPassword: (v: string) => void;
    formDimensions: string[]; setFormDimensions: (v: string[]) => void;
    formError: string;
    saving: boolean;
    onSubmit: () => void;
    onCancel: () => void;
}

function MemberForm({
    isEdit, allDimensions, formName, setFormName, formEmail, setFormEmail,
    formPassword, setFormPassword, formDimensions, setFormDimensions,
    formError, saving, onSubmit, onCancel,
}: MemberFormProps) {
    return (
        <div className="space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest t-muted flex items-center gap-1.5">
                    <User className="w-3 h-3" /> Full Name
                </label>
                <input
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="input w-full"
                />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest t-muted flex items-center gap-1.5">
                    <Mail className="w-3 h-3" /> Email Address
                </label>
                <input
                    type="email"
                    value={formEmail}
                    onChange={e => setFormEmail(e.target.value)}
                    placeholder="e.g. john@company.com"
                    className="input w-full"
                    disabled={isEdit}
                />
                {isEdit && <p className="text-xs t-muted">Email cannot be changed</p>}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest t-muted flex items-center gap-1.5">
                    <Lock className="w-3 h-3" /> {isEdit ? "New Password (optional)" : "Password"}
                </label>
                <PasswordInput
                    value={formPassword}
                    onChange={setFormPassword}
                    placeholder={isEdit ? "Leave blank to keep current" : "At least 6 characters"}
                />
            </div>

            {/* Role badge — always member */}
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-md border text-sm" style={{ borderColor: "var(--border)", background: "var(--bg-2)" }}>
                <Shield className="w-3.5 h-3.5 t-muted" />
                <span className="t-secondary text-xs">Role:</span>
                <span className="px-2 py-0.5 rounded text-xs font-semibold border bg-gray-500/10 border-gray-500/30 t-secondary">member</span>
                <span className="text-xs t-muted ml-auto">Fixed — company accounts are always members</span>
            </div>

            {/* Dimensions picker */}
            <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest t-muted flex items-center gap-1.5">
                    <Layers className="w-3 h-3" /> Accessible Dimensions
                </label>
                <p className="text-xs t-muted">This member will only receive assessments from the selected dimensions.</p>
                <DimensionPicker
                    allDimensions={allDimensions}
                    selected={formDimensions}
                    onChange={setFormDimensions}
                />
                {formDimensions.length === 0 && (
                    <p className="text-xs text-amber-400/80 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        No dimensions assigned — member won't receive any assessments.
                    </p>
                )}
            </div>

            {formError && (
                <p className="text-xs text-red-400 bg-red-500/5 border border-red-500/20 rounded px-3 py-2">
                    {formError}
                </p>
            )}
            <div className="flex gap-2 pt-1">
                <button onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
                <button onClick={onSubmit} disabled={saving} className="btn-primary flex-1">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    {isEdit ? "Save Changes" : "Create Account"}
                </button>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MembersPage() {
    const [members, setMembers] = useState<CompanyMember[]>([]);
    const [allDimensions, setAllDimensions] = useState<Dimension[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [editTarget, setEditTarget] = useState<CompanyMember | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<CompanyMember | null>(null);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Form state
    const [formName, setFormName] = useState("");
    const [formEmail, setFormEmail] = useState("");
    const [formPassword, setFormPassword] = useState("");
    const [formDimensions, setFormDimensions] = useState<string[]>([]);
    const [formError, setFormError] = useState("");

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [membersRes, dimsRes] = await Promise.all([
                api.get("/company/members"),
                api.get("/dimensions"),
            ]);
            setMembers(membersRes.data.members ?? []);
            setAllDimensions(dimsRes.data.dimensions ?? []);
        } catch {
            toast.error("Failed to load data");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const resetForm = () => {
        setFormName(""); setFormEmail(""); setFormPassword("");
        setFormDimensions([]); setFormError("");
    };

    const openCreate = () => { resetForm(); setShowCreate(true); };
    const openEdit = (m: CompanyMember) => {
        setFormName(m.name); setFormEmail(m.email);
        setFormPassword("");
        setFormDimensions(m.allowedDimensions?.map(d => d._id) ?? []);
        setFormError("");
        setEditTarget(m);
    };

    const handleCreate = async () => {
        if (!formName.trim()) { setFormError("Name is required"); return; }
        if (!formEmail.trim()) { setFormError("Email is required"); return; }
        if (formPassword.length < 6) { setFormError("Password must be at least 6 characters"); return; }
        try {
            setSaving(true);
            await api.post("/company/members", {
                name: formName.trim(),
                email: formEmail.trim(),
                password: formPassword,
                allowedDimensions: formDimensions,
            });
            toast.success("Member account created!");
            setShowCreate(false);
            await fetchData();
        } catch (e: unknown) {
            setFormError((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Failed to create member");
        } finally { setSaving(false); }
    };

    const handleUpdate = async () => {
        if (!editTarget || !formName.trim()) { setFormError("Name is required"); return; }
        try {
            setSaving(true);
            const payload: Record<string, unknown> = {
                name: formName.trim(),
                allowedDimensions: formDimensions,
            };
            if (formPassword) payload.password = formPassword;
            await api.put(`/company/members/${editTarget._id}`, payload);
            toast.success("Member updated!");
            setEditTarget(null);
            await fetchData();
        } catch (e: unknown) {
            setFormError((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Failed to update member");
        } finally { setSaving(false); }
    };

    const handleToggleActive = async (m: CompanyMember) => {
        try {
            await api.put(`/company/members/${m._id}`, { isActive: !m.isActive });
            toast.success(m.isActive ? "Member deactivated" : "Member reactivated");
            await fetchData();
        } catch { toast.error("Failed to update status"); }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            setDeleting(true);
            await api.delete(`/company/members/${deleteTarget._id}`);
            toast.success("Member removed");
            setDeleteTarget(null);
            await fetchData();
        } finally { setDeleting(false); }
    };

    return (
        <div className="page-container">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
                            <Users className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold t-primary">Team Members</h1>
                            <p className="text-sm t-secondary mt-0.5">
                                Manage assessor accounts and their dimension access
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={fetchData} className="btn-secondary !px-2.5 !py-2" title="Refresh">
                            <RefreshCw className="w-4 h-4" />
                        </button>
                        <button onClick={openCreate} className="btn-primary">
                            <Plus className="w-4 h-4" /> Add Member
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats strip */}
            {!loading && members.length > 0 && (
                <div className="flex items-center gap-6 mb-6 p-4 rounded-xl card">
                    <div className="text-center">
                        <p className="text-2xl font-bold t-primary">{members.length}</p>
                        <p className="text-xs t-muted">Total</p>
                    </div>
                    <div className="w-px h-8" style={{ backgroundColor: "var(--border)" }} />
                    <div className="text-center">
                        <p className="text-2xl font-bold text-green-400">{members.filter(m => m.isActive).length}</p>
                        <p className="text-xs t-muted">Active</p>
                    </div>
                    <div className="w-px h-8" style={{ backgroundColor: "var(--border)" }} />
                    <div className="text-center">
                        <p className="text-2xl font-bold t-secondary">{members.filter(m => !m.isActive).length}</p>
                        <p className="text-xs t-muted">Inactive</p>
                    </div>
                    <div className="w-px h-8" style={{ backgroundColor: "var(--border)" }} />
                    <div className="text-center">
                        <p className="text-2xl font-bold text-indigo-400">
                            {members.filter(m => m.allowedDimensions?.length > 0).length}
                        </p>
                        <p className="text-xs t-muted">With Dimensions</p>
                    </div>
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div className="card flex items-center justify-center py-24">
                    <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                </div>
            )}

            {/* Empty */}
            {!loading && members.length === 0 && (
                <div className="card py-24 flex flex-col items-center gap-4">
                    <div className="empty-icon-wrap"><Users className="w-8 h-8 text-blue-400/40" /></div>
                    <p className="text-sm t-muted text-center">No team members yet.<br />Add your first assessor account to get started.</p>
                    <button onClick={openCreate} className="btn-primary text-sm">
                        <Plus className="w-4 h-4" /> Add First Member
                    </button>
                </div>
            )}

            {/* Members Table */}
            {!loading && members.length > 0 && (
                <div className="card overflow-x-auto">
                    <table className="w-full text-sm min-w-[700px]">
                        <thead>
                            <tr className="table-header-row text-left">
                                <th className="table-header-cell">Member</th>
                                <th className="table-header-cell">Assigned Dimensions</th>
                                <th className="table-header-cell">Status</th>
                                <th className="table-header-cell">Added</th>
                                <th className="table-header-cell text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {members.map(m => (
                                <tr key={m._id} className="table-row-hover transition-colors" style={{ borderTop: "1px solid var(--border-2)" }}>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 via-cyan-500 to-teal-500 text-white flex items-center justify-center text-xs font-bold uppercase shrink-0">
                                                {m.name?.[0] ?? "?"}
                                            </div>
                                            <div>
                                                <p className="font-semibold t-primary leading-tight">{m.name}</p>
                                                <p className="text-xs t-muted">{m.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        {m.allowedDimensions?.length > 0 ? (
                                            <div className="flex flex-wrap gap-1">
                                                {m.allowedDimensions.map(d => (
                                                    <span
                                                        key={d._id}
                                                        className="px-2 py-0.5 rounded-full text-xs font-semibold border bg-indigo-500/10 border-indigo-500/25 text-indigo-400"
                                                    >
                                                        {d.name}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="flex items-center gap-1 text-xs text-amber-400/70">
                                                <AlertTriangle className="w-3 h-3" /> None assigned
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-semibold border ${m.isActive
                                            ? "bg-green-500/10 border-green-500/30 text-green-400"
                                            : "bg-gray-500/10 border-gray-500/20 t-muted"}`}>
                                            {m.isActive
                                                ? <><UserCheck className="w-3 h-3" />Active</>
                                                : <><UserX className="w-3 h-3" />Inactive</>}
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-xs t-muted">
                                        {new Date(m.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center justify-end gap-1.5">
                                            <button onClick={() => openEdit(m)} className="btn-secondary !px-2.5 !py-1.5 !text-xs gap-1.5">
                                                <Pencil className="w-3.5 h-3.5" /> Edit
                                            </button>
                                            <button onClick={() => handleToggleActive(m)}
                                                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-medium transition-all ${m.isActive
                                                    ? "border-amber-500/20 bg-amber-500/5 text-amber-400 hover:bg-amber-500/15"
                                                    : "border-green-500/20 bg-green-500/5 text-green-400 hover:bg-green-500/15"}`}
                                                title={m.isActive ? "Deactivate" : "Reactivate"}>
                                                {m.isActive ? <ShieldOff className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                                            </button>
                                            <button onClick={() => setDeleteTarget(m)}
                                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-red-500/20 bg-red-500/5 text-red-400 text-xs font-medium hover:bg-red-500/15 hover:border-red-500/40 transition-all">
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
                <Modal title="Add Team Member" onClose={() => setShowCreate(false)}>
                    <MemberForm
                        isEdit={false}
                        allDimensions={allDimensions}
                        formName={formName} setFormName={setFormName}
                        formEmail={formEmail} setFormEmail={setFormEmail}
                        formPassword={formPassword} setFormPassword={setFormPassword}
                        formDimensions={formDimensions} setFormDimensions={setFormDimensions}
                        formError={formError}
                        saving={saving}
                        onSubmit={handleCreate}
                        onCancel={() => setShowCreate(false)}
                    />
                </Modal>
            )}

            {/* Edit Modal */}
            {editTarget && (
                <Modal title="Edit Member" onClose={() => setEditTarget(null)}>
                    <MemberForm
                        isEdit={true}
                        allDimensions={allDimensions}
                        formName={formName} setFormName={setFormName}
                        formEmail={formEmail} setFormEmail={setFormEmail}
                        formPassword={formPassword} setFormPassword={setFormPassword}
                        formDimensions={formDimensions} setFormDimensions={setFormDimensions}
                        formError={formError}
                        saving={saving}
                        onSubmit={handleUpdate}
                        onCancel={() => setEditTarget(null)}
                    />
                </Modal>
            )}

            {/* Confirm Delete */}
            {deleteTarget && (
                <ConfirmDelete
                    name={deleteTarget.name}
                    onConfirm={handleDelete}
                    onCancel={() => setDeleteTarget(null)}
                    loading={deleting}
                />
            )}
        </div>
    );
}
