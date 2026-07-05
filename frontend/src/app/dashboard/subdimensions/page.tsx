"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Layers2, Plus, Pencil, Trash2, ChevronLeft, ChevronRight, X, Check, AlertTriangle, Loader2, Info, ChevronDown } from "lucide-react";
import api from "@/lib/api";
import { Dimension, SubDimension } from "@/types";
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

function SelectField({ label, value, onChange, options, placeholder, disabled }: {
    label: string; value: string; onChange: (v: string) => void;
    options: { value: string; label: string }[]; placeholder: string; disabled?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const selected = options.find(o => o.value === value);
    return (
        <div className="space-y-1.5 relative">
            <label className="text-xs font-semibold uppercase tracking-widest t-muted">{label}</label>
            <button type="button" onClick={() => !disabled && setOpen(v => !v)}
                className={`input flex items-center justify-between text-left ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"} ${open ? "border-accent" : ""}`}>
                <span className={selected ? "t-primary" : "t-muted"}>{selected?.label ?? placeholder}</span>
                <ChevronDown className={`w-4 h-4 t-muted transition-transform shrink-0 ${open ? "rotate-180" : ""}`} />
            </button>
            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div className="absolute top-full left-0 right-0 z-50 mt-1.5 card max-h-56 overflow-y-auto" style={{ border: "1px solid var(--border)" }}>
                        <div onClick={() => { onChange(""); setOpen(false); }} className="px-3 py-2.5 text-sm t-muted cursor-pointer transition-colors" style={{ ["--hover-bg" as string]: "var(--bg-3)" }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-3)"}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = ""}>{placeholder}</div>
                        {options.map(o => (
                            <div key={o.value} onClick={() => { onChange(o.value); setOpen(false); }}
                                className={`px-3 py-2.5 text-sm cursor-pointer transition-colors flex items-center justify-between ${o.value === value ? "bg-accent-muted" : "t-primary"}`}
                                onMouseEnter={e => { if (o.value !== value) (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-3)"; }}
                                onMouseLeave={e => { if (o.value !== value) (e.currentTarget as HTMLElement).style.backgroundColor = ""; }}>
                                {o.label}
                                {o.value === value && <Check className="w-3.5 h-3.5" style={{ color: "var(--accent-from)" }} />}
                            </div>
                        ))}
                    </div>
                </>
            )}
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

function SubDimensionsContent() {
    const searchParams = useSearchParams();
    const dimIdParam = searchParams.get("dimId") ?? "";
    const dimNameParam = searchParams.get("dimName") ?? "";

    const [dimensions, setDimensions] = useState<Dimension[]>([]);
    const [selectedDimId, setSelectedDimId] = useState(dimIdParam);
    const [subdimensions, setSubdimensions] = useState<SubDimension[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showCreate, setShowCreate] = useState(false);
    const [editTarget, setEditTarget] = useState<SubDimension | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<SubDimension | null>(null);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [formName, setFormName] = useState("");
    const [formDetail, setFormDetail] = useState("");
    const [formDimId, setFormDimId] = useState(dimIdParam);
    const [formError, setFormError] = useState("");

    useEffect(() => { api.get("/dimensions").then(r => setDimensions(r.data.dimensions)).catch(() => {}); }, []);

    useEffect(() => {
        if (!selectedDimId) { setSubdimensions([]); return; }
        setLoading(true); setError("");
        api.get(`/dimensions/${selectedDimId}`)
            .then(r => setSubdimensions(r.data.dimension.subdimensions ?? []))
            .catch(() => setError("Failed to load sub-dimensions."))
            .finally(() => setLoading(false));
    }, [selectedDimId]);

    const selectedDim = dimensions.find(d => d._id === selectedDimId);
    const dimLabel = selectedDim?.name ?? dimNameParam;
    const dimOptions = dimensions.map(d => ({ value: d._id, label: d.name }));

    const refresh = async () => {
        if (!selectedDimId) return;
        const r = await api.get(`/dimensions/${selectedDimId}`);
        setSubdimensions(r.data.dimension.subdimensions ?? []);
    };

    const openCreate = () => { setFormName(""); setFormDetail(""); setFormDimId(selectedDimId); setFormError(""); setShowCreate(true); };
    const openEdit = (s: SubDimension) => { setFormName(s.name); setFormDetail(s.detail); setFormError(""); setEditTarget(s); };

    const handleCreate = async () => {
        if (!formDimId) { setFormError("Please select a dimension"); return; }
        if (!formName.trim()) { setFormError("Name is required"); return; }
        try { setSaving(true); await api.post(`/dimensions/${formDimId}/subdimensions`, { name: formName.trim(), detail: formDetail.trim() }); setShowCreate(false); if (formDimId === selectedDimId) await refresh(); }
        catch (e: unknown) { setFormError((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Failed to create"); }
        finally { setSaving(false); }
    };

    const handleUpdate = async () => {
        if (!editTarget || !formName.trim()) { setFormError("Name is required"); return; }
        try { setSaving(true); await api.put(`/dimensions/${selectedDimId}/subdimensions/${editTarget._id}`, { name: formName.trim(), detail: formDetail.trim() }); setEditTarget(null); await refresh(); }
        catch (e: unknown) { setFormError((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Failed to update"); }
        finally { setSaving(false); }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try { setDeleting(true); await api.delete(`/dimensions/${selectedDimId}/subdimensions/${deleteTarget._id}`); setDeleteTarget(null); await refresh(); }
        finally { setDeleting(false); }
    };

    return (
        <div className="page-container">
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-1">
                    <Link href="/dashboard/dimensions" className="p-2 rounded-lg t-secondary hover:t-primary border border-transparent hover:border-[var(--border)] transition-all" style={{ backgroundColor: "transparent" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-3)"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = ""; }}>
                        <ChevronLeft className="w-4 h-4" />
                    </Link>
                    <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20"><Layers2 className="w-5 h-5 text-indigo-400" /></div>
                    <div>
                        <h1 className="text-2xl font-bold t-primary">Sub-Dimensions</h1>
                        {dimLabel && <p className="text-xs t-muted mt-0.5">Dimensions <span className="t-secondary">›</span> <span className="text-indigo-400">{dimLabel}</span></p>}
                    </div>
                </div>
                <p className="text-sm t-secondary ml-[4.5rem]">Manage sub-dimensions within each dimension. Select a dimension to view its list.</p>
            </div>

            <div className="info-banner info-banner-indigo">
                <Info className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                <p className="text-xs t-secondary leading-relaxed">Each Sub-Dimension contains Levels → Criteria. Use "Manage" to navigate to the next level.</p>
            </div>

            <div className="flex items-end gap-4 mb-4">
                <div className="w-72"><SelectField label="Filter by Dimension" value={selectedDimId} onChange={setSelectedDimId} options={dimOptions} placeholder="Select dimension…" /></div>
                <button onClick={openCreate} className="btn-primary shrink-0"><Plus className="w-4 h-4" /> Add Sub-Dimension</button>
            </div>

            {selectedDimId && !loading && <p className="text-xs t-muted mb-3">{subdimensions.length} sub-dimension{subdimensions.length !== 1 ? "s" : ""}{dimLabel && <> in <span className="t-secondary">{dimLabel}</span></>}</p>}

            {loading && <div className="card flex items-center justify-center py-20"><Loader2 className="w-6 h-6 accent-spinner animate-spin" /></div>}
            {error && <p className="text-sm text-red-400 text-center py-10">{error}</p>}

            {!loading && !error && !selectedDimId && (
                <div className="card py-20 flex flex-col items-center gap-4">
                    <div className="empty-icon-wrap"><Layers2 className="w-8 h-8 text-indigo-400/40" /></div>
                    <p className="text-sm t-muted">Select a dimension to view its sub-dimensions.</p>
                </div>
            )}

            {!loading && !error && selectedDimId && (
                <div className="card">
                    {subdimensions.length === 0 ? (
                        <div className="py-20 flex flex-col items-center gap-4">
                            <div className="empty-icon-wrap"><Layers2 className="w-8 h-8 text-indigo-400/40" /></div>
                            <p className="text-sm t-muted">No sub-dimensions yet. Add your first one.</p>
                            <button onClick={openCreate} className="btn-primary text-xs"><Plus className="w-3.5 h-3.5" /> Add Sub-Dimension</button>
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="table-header-row text-left">
                                    <th className="table-header-cell">Name</th>
                                    <th className="table-header-cell">Description</th>
                                    <th className="table-header-cell">Levels</th>
                                    <th className="table-header-cell">Manage</th>
                                    <th className="table-header-cell text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {subdimensions.map(s => (
                                    <tr key={s._id} className="table-row-hover transition-colors" style={{ borderTop: "1px solid var(--border-2)" }}>
                                        <td className="px-5 py-4 font-semibold t-primary">{s.name}</td>
                                        <td className="px-5 py-4 t-secondary max-w-xs truncate">{s.detail || "—"}</td>
                                        <td className="px-5 py-4"><span className="badge-count">{s.levels?.length ?? 0}</span></td>
                                        <td className="px-5 py-4">
                                            <Link href={`/dashboard/levels?dimId=${selectedDimId}&subId=${s._id}&dimName=${encodeURIComponent(dimLabel)}&subName=${encodeURIComponent(s.name)}`} className="nav-badge-indigo">
                                                Levels <ChevronRight className="w-3 h-3" />
                                            </Link>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button onClick={() => openEdit(s)} className="btn-secondary !px-2.5 !py-1.5 !text-xs gap-1.5"><Pencil className="w-3.5 h-3.5" /> Edit</button>
                                                <button onClick={() => setDeleteTarget(s)} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-red-500/20 bg-red-500/5 text-red-400 text-xs font-medium hover:bg-red-500/15 hover:border-red-500/40 transition-all">
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
                <Modal title="Add Sub-Dimension" onClose={() => setShowCreate(false)}>
                    <div className="space-y-4">
                        <SelectField label="Dimension" value={formDimId} onChange={setFormDimId} options={dimOptions} placeholder="Select dimension…" />
                        <Field label="Name" id="sub-name" value={formName} onChange={setFormName} placeholder="e.g. Information Capability" />
                        <Field label="Description" id="sub-detail" value={formDetail} onChange={setFormDetail} placeholder="Brief description…" textarea />
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
                <Modal title="Edit Sub-Dimension" onClose={() => setEditTarget(null)}>
                    <div className="space-y-4">
                        <Field label="Name" id="edit-sub-name" value={formName} onChange={setFormName} placeholder="e.g. Information Capability" />
                        <Field label="Description" id="edit-sub-detail" value={formDetail} onChange={setFormDetail} placeholder="Brief description…" textarea />
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
                <ConfirmDelete name={deleteTarget.name} warn="All levels and criteria inside will also be deleted."
                    onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleting} />
            )}
        </div>
    );
}

export default function SubDimensionsPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-screen"><Loader2 className="w-6 h-6 accent-spinner animate-spin" /></div>}>
            <SubDimensionsContent />
        </Suspense>
    );
}
