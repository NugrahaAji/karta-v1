"use client";

import { useState, useEffect } from "react";
import { Layers, Plus, Pencil, Trash2, ChevronRight, X, Check, AlertTriangle, Loader2, Info } from "lucide-react";
import api from "@/lib/api";
import { Dimension } from "@/types";
import Link from "next/link";

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="card w-full max-w-md">
                <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
                    <h3 className="font-semibold t-primary">{title}</h3>
                    <button onClick={onClose} className="btn-secondary !px-2 !py-1.5"><X className="w-4 h-4" /></button>
                </div>
                <div className="px-6 py-5">{children}</div>
            </div>
        </div>
    );
}

function Field({ label, id, value, onChange, placeholder, textarea = false }: {
    label: string; id: string; value: string; onChange: (v: string) => void; placeholder?: string; textarea?: boolean;
}) {
    return (
        <div className="space-y-1.5">
            <label htmlFor={id} className="text-xs font-semibold uppercase tracking-widest t-muted">{label}</label>
            {textarea
                ? <textarea id={id} rows={3} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="input resize-none" />
                : <input id={id} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="input" />}
        </div>
    );
}

function ConfirmDelete({ name, onConfirm, onCancel, loading, warn }: {
    name: string; onConfirm: () => void; onCancel: () => void; loading: boolean; warn?: string;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="card w-full max-w-md p-6 space-y-4">
                <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-red-500/10 border border-red-500/20 shrink-0"><AlertTriangle className="w-4 h-4 text-red-400" /></div>
                    <div>
                        <p className="text-sm font-semibold t-primary mb-1">Delete "{name}"?</p>
                        <p className="text-xs t-secondary leading-relaxed">{warn ?? "This action cannot be undone."}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
                    <button onClick={onConfirm} disabled={loading} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition-all disabled:opacity-50">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Delete
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function DimensionsPage() {
    const [dimensions, setDimensions] = useState<Dimension[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showCreate, setShowCreate] = useState(false);
    const [editTarget, setEditTarget] = useState<Dimension | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Dimension | null>(null);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [formName, setFormName] = useState("");
    const [formDetail, setFormDetail] = useState("");
    const [formError, setFormError] = useState("");

    const load = async () => {
        try { setLoading(true); const r = await api.get("/dimensions"); setDimensions(r.data.dimensions); }
        catch { setError("Failed to load dimensions."); } finally { setLoading(false); }
    };
    useEffect(() => { load(); }, []);

    const openCreate = () => { setFormName(""); setFormDetail(""); setFormError(""); setShowCreate(true); };
    const openEdit = (d: Dimension) => { setFormName(d.name); setFormDetail(d.detail); setFormError(""); setEditTarget(d); };

    const handleCreate = async () => {
        if (!formName.trim()) { setFormError("Name is required"); return; }
        try { setSaving(true); await api.post("/dimensions", { name: formName.trim(), detail: formDetail.trim() }); setShowCreate(false); load(); }
        catch (e: unknown) { setFormError((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Failed to create"); }
        finally { setSaving(false); }
    };

    const handleUpdate = async () => {
        if (!editTarget || !formName.trim()) { setFormError("Name is required"); return; }
        try { setSaving(true); await api.put(`/dimensions/${editTarget._id}`, { name: formName.trim(), detail: formDetail.trim() }); setEditTarget(null); load(); }
        catch (e: unknown) { setFormError((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Failed to update"); }
        finally { setSaving(false); }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try { setDeleting(true); await api.delete(`/dimensions/${deleteTarget._id}`); setDeleteTarget(null); load(); }
        finally { setDeleting(false); }
    };

    return (
        <div className="page-container">
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-1">
                    <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20"><Layers className="w-5 h-5 text-purple-400" /></div>
                    <h1 className="text-2xl font-bold t-primary">Dimensions</h1>
                </div>
                <p className="text-sm t-secondary ml-14">Manage the main assessment dimensions for the HP3M process mining maturity tool.</p>
            </div>

            <div className="info-banner info-banner-purple">
                <Info className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
                <p className="text-xs t-secondary leading-relaxed">Each Dimension contains Sub-Dimensions → Levels → Criteria. Use "Manage" to navigate deeper.</p>
            </div>

            <div className="flex items-center justify-between mb-4">
                <p className="text-sm t-muted">{loading ? "Loading…" : `${dimensions.length} dimension${dimensions.length !== 1 ? "s" : ""}`}</p>
                <button onClick={openCreate} className="btn-primary"><Plus className="w-4 h-4" /> Add Dimension</button>
            </div>

            {loading && <div className="card flex items-center justify-center py-20"><Loader2 className="w-6 h-6 accent-spinner animate-spin" /></div>}
            {error && <p className="text-sm text-red-400 text-center py-10">{error}</p>}

            {!loading && !error && (
                <div className="card">
                    {dimensions.length === 0 ? (
                        <div className="py-20 flex flex-col items-center gap-4">
                            <div className="empty-icon-wrap"><Layers className="w-8 h-8 text-purple-400/40" /></div>
                            <p className="text-sm t-muted">No dimensions yet. Add your first one.</p>
                            <button onClick={openCreate} className="btn-primary text-xs"><Plus className="w-3.5 h-3.5" /> Add Dimension</button>
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="table-header-row text-left">
                                    <th className="table-header-cell">Name</th>
                                    <th className="table-header-cell">Description</th>
                                    <th className="table-header-cell">Sub-dims</th>
                                    <th className="table-header-cell">Manage</th>
                                    <th className="table-header-cell text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dimensions.map(d => (
                                    <tr key={d._id} className="table-row-hover transition-colors" style={{ borderTop: "1px solid var(--border-2)" }}>
                                        <td className="px-5 py-4 font-semibold t-primary">{d.name}</td>
                                        <td className="px-5 py-4 t-secondary max-w-xs truncate">{d.detail || "—"}</td>
                                        <td className="px-5 py-4"><span className="badge-count">{d.subdimensions?.length ?? 0}</span></td>
                                        <td className="px-5 py-4">
                                            <Link href={`/dashboard/subdimensions?dimId=${d._id}&dimName=${encodeURIComponent(d.name)}`} className="nav-badge-pink">
                                                Sub-dims <ChevronRight className="w-3 h-3" />
                                            </Link>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button onClick={() => openEdit(d)} className="btn-secondary !px-2.5 !py-1.5 !text-xs gap-1.5"><Pencil className="w-3.5 h-3.5" /> Edit</button>
                                                <button onClick={() => setDeleteTarget(d)} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-red-500/20 bg-red-500/5 text-red-400 text-xs font-medium hover:bg-red-500/15 hover:border-red-500/40 transition-all">
                                                    <Trash2 className="w-3.5 h-3.5" /> Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {showCreate && (
                <Modal title="Add Dimension" onClose={() => setShowCreate(false)}>
                    <div className="space-y-4">
                        <Field label="Name" id="dim-name" value={formName} onChange={setFormName} placeholder="e.g. Technology" />
                        <Field label="Description" id="dim-detail" value={formDetail} onChange={setFormDetail} placeholder="Brief description…" textarea />
                        {formError && <p className="text-xs text-red-400 bg-red-500/5 border border-red-500/20 rounded px-3 py-2">{formError}</p>}
                        <div className="flex gap-2 pt-1">
                            <button onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
                            <button onClick={handleCreate} disabled={saving} className="btn-primary flex-1">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Create
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {editTarget && (
                <Modal title="Edit Dimension" onClose={() => setEditTarget(null)}>
                    <div className="space-y-4">
                        <Field label="Name" id="edit-dim-name" value={formName} onChange={setFormName} placeholder="e.g. Technology" />
                        <Field label="Description" id="edit-dim-detail" value={formDetail} onChange={setFormDetail} placeholder="Brief description…" textarea />
                        {formError && <p className="text-xs text-red-400 bg-red-500/5 border border-red-500/20 rounded px-3 py-2">{formError}</p>}
                        <div className="flex gap-2 pt-1">
                            <button onClick={() => setEditTarget(null)} className="btn-secondary flex-1">Cancel</button>
                            <button onClick={handleUpdate} disabled={saving} className="btn-primary flex-1">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Save
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {deleteTarget && (
                <ConfirmDelete name={deleteTarget.name} warn="All sub-dimensions, levels, and criteria inside will also be deleted."
                    onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleting} />
            )}
        </div>
    );
}
