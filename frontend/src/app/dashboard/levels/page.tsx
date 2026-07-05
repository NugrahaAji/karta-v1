"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ListOrdered, Plus, Pencil, Trash2, ChevronLeft, ChevronRight, X, Check, AlertTriangle, Loader2, Info, ChevronDown } from "lucide-react";
import api from "@/lib/api";
import { Dimension, SubDimension, Level } from "@/types";
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
            {textarea ? <textarea id={id} rows={3} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="input resize-none" />
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
                <span style={{ color: selected ? "var(--text-primary)" : "var(--text-muted)" }}>{selected?.label ?? placeholder}</span>
                <ChevronDown className={`w-4 h-4 transition-transform shrink-0 ${open ? "rotate-180" : ""}`} style={{ color: "var(--text-muted)" }} />
            </button>
            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div className="absolute top-full left-0 right-0 z-50 mt-1.5 card max-h-56 overflow-y-auto" style={{ border: "1px solid var(--border)" }}>
                        <div onClick={() => { onChange(""); setOpen(false); }} className="px-3 py-2.5 text-sm cursor-pointer transition-colors t-muted"
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-3)"}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = ""}>{placeholder}</div>
                        {options.map(o => (
                            <div key={o.value} onClick={() => { onChange(o.value); setOpen(false); }}
                                className={`px-3 py-2.5 text-sm cursor-pointer flex items-center justify-between ${o.value === value ? "bg-accent-muted" : "t-primary"}`}
                                onMouseEnter={e => { if (o.value !== value) (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-3)"; }}
                                onMouseLeave={e => { if (o.value !== value) (e.currentTarget as HTMLElement).style.backgroundColor = ""; }}>
                                {o.label}{o.value === value && <Check className="w-3.5 h-3.5" style={{ color: "var(--accent-from)" }} />}
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

function LevelsContent() {
    const searchParams = useSearchParams();
    const dimIdParam = searchParams.get("dimId") ?? "";
    const subIdParam = searchParams.get("subId") ?? "";
    const dimNameParam = searchParams.get("dimName") ?? "";
    const subNameParam = searchParams.get("subName") ?? "";

    const [dimensions, setDimensions] = useState<Dimension[]>([]);
    const [subdimensions, setSubdimensions] = useState<SubDimension[]>([]);
    const [levels, setLevels] = useState<Level[]>([]);
    const [selectedDimId, setSelectedDimId] = useState(dimIdParam);
    const [selectedSubId, setSelectedSubId] = useState(subIdParam);
    const [loading, setLoading] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [editTarget, setEditTarget] = useState<Level | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Level | null>(null);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [formName, setFormName] = useState("");
    const [formDetail, setFormDetail] = useState("");
    const [formError, setFormError] = useState("");

    useEffect(() => { api.get("/dimensions").then(r => setDimensions(r.data.dimensions)).catch(() => {}); }, []);

    useEffect(() => {
        if (!selectedDimId) { setSubdimensions([]); setLevels([]); return; }
        api.get(`/dimensions/${selectedDimId}`).then(r => setSubdimensions(r.data.dimension.subdimensions ?? [])).catch(() => {});
    }, [selectedDimId]);

    useEffect(() => {
        if (!selectedDimId || !selectedSubId) { setLevels([]); return; }
        setLoading(true);
        api.get(`/dimensions/${selectedDimId}`).then(r => {
            const dim: Dimension = r.data.dimension;
            setLevels(dim.subdimensions.find(s => s._id === selectedSubId)?.levels ?? []);
        }).catch(() => {}).finally(() => setLoading(false));
    }, [selectedDimId, selectedSubId]);

    const refreshLevels = async () => {
        if (!selectedDimId || !selectedSubId) return;
        const r = await api.get(`/dimensions/${selectedDimId}`);
        const dim: Dimension = r.data.dimension;
        setLevels(dim.subdimensions.find(s => s._id === selectedSubId)?.levels ?? []);
    };

    const selectedDim = dimensions.find(d => d._id === selectedDimId);
    const selectedSub = subdimensions.find(s => s._id === selectedSubId);
    const dimLabel = selectedDim?.name ?? dimNameParam;
    const subLabel = selectedSub?.name ?? subNameParam;
    const dimOptions = dimensions.map(d => ({ value: d._id, label: d.name }));
    const subOptions = subdimensions.map(s => ({ value: s._id, label: s.name }));

    const openCreate = () => { setFormName(""); setFormDetail(""); setFormError(""); setShowCreate(true); };
    const openEdit = (l: Level) => { setFormName(l.name); setFormDetail(l.detail); setFormError(""); setEditTarget(l); };

    const handleCreate = async () => {
        if (!selectedDimId || !selectedSubId) { setFormError("Select a dimension and sub-dimension first"); return; }
        if (!formName.trim()) { setFormError("Name is required"); return; }
        try { setSaving(true); await api.post(`/dimensions/${selectedDimId}/subdimensions/${selectedSubId}/levels`, { name: formName.trim(), detail: formDetail.trim() }); setShowCreate(false); await refreshLevels(); }
        catch (e: unknown) { setFormError((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Failed to create"); }
        finally { setSaving(false); }
    };

    const handleUpdate = async () => {
        if (!editTarget || !formName.trim()) { setFormError("Name is required"); return; }
        try { setSaving(true); await api.put(`/dimensions/${selectedDimId}/subdimensions/${selectedSubId}/levels/${editTarget._id}`, { name: formName.trim(), detail: formDetail.trim() }); setEditTarget(null); await refreshLevels(); }
        catch (e: unknown) { setFormError((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Failed to update"); }
        finally { setSaving(false); }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try { setDeleting(true); await api.delete(`/dimensions/${selectedDimId}/subdimensions/${selectedSubId}/levels/${deleteTarget._id}`); setDeleteTarget(null); await refreshLevels(); }
        finally { setDeleting(false); }
    };

    return (
        <div className="page-container">
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-1">
                    <Link href={`/dashboard/subdimensions?dimId=${selectedDimId}&dimName=${encodeURIComponent(dimLabel)}`}
                        className="p-2 rounded-lg border border-transparent transition-all"
                        style={{ color: "var(--text-secondary)" }}
                        onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.backgroundColor = "var(--bg-3)"; el.style.borderColor = "var(--border)"; el.style.color = "var(--text-primary)"; }}
                        onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.backgroundColor = ""; el.style.borderColor = "transparent"; el.style.color = "var(--text-secondary)"; }}>
                        <ChevronLeft className="w-4 h-4" />
                    </Link>
                    <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20"><ListOrdered className="w-5 h-5 text-teal-400" /></div>
                    <div>
                        <h1 className="text-2xl font-bold t-primary">Levels</h1>
                        {(dimLabel || subLabel) && (
                            <p className="text-xs t-muted mt-0.5">
                                {dimLabel && <><span className="t-secondary">{dimLabel}</span><span className="mx-1" style={{ color: "var(--text-faint)" }}>›</span></>}
                                {subLabel && <span className="text-teal-400">{subLabel}</span>}
                            </p>
                        )}
                    </div>
                </div>
                <p className="text-sm t-secondary ml-[4.5rem]">Manage maturity levels within each sub-dimension.</p>
            </div>

            <div className="info-banner info-banner-teal">
                <Info className="w-4 h-4 text-teal-400 mt-0.5 shrink-0" />
                <p className="text-xs t-secondary leading-relaxed">Each Level contains Criteria with assessment weights. Use "Manage" to configure criteria per level.</p>
            </div>

            <div className="flex items-end gap-4 mb-4 flex-wrap">
                <div className="w-52"><SelectField label="Dimension" value={selectedDimId} onChange={v => { setSelectedDimId(v); setSelectedSubId(""); }} options={dimOptions} placeholder="Select dimension…" /></div>
                <div className="w-52"><SelectField label="Sub-Dimension" value={selectedSubId} onChange={setSelectedSubId} options={subOptions} placeholder="Select sub-dim…" disabled={!selectedDimId} /></div>
                <button onClick={openCreate} className="btn-primary shrink-0"><Plus className="w-4 h-4" /> Add Level</button>
            </div>

            {selectedSubId && !loading && <p className="text-xs t-muted mb-3">{levels.length} level{levels.length !== 1 ? "s" : ""}{subLabel && <> in <span className="t-secondary">{subLabel}</span></>}</p>}

            {loading && <div className="card flex items-center justify-center py-20"><Loader2 className="w-6 h-6 accent-spinner animate-spin" /></div>}

            {!loading && !selectedSubId && (
                <div className="card py-20 flex flex-col items-center gap-4">
                    <div className="empty-icon-wrap"><ListOrdered className="w-8 h-8 text-teal-400/40" /></div>
                    <p className="text-sm t-muted">{!selectedDimId ? "Select a dimension and sub-dimension to view levels." : "Select a sub-dimension to view levels."}</p>
                </div>
            )}

            {!loading && selectedSubId && (
                <div className="card">
                    {levels.length === 0 ? (
                        <div className="py-20 flex flex-col items-center gap-4">
                            <div className="empty-icon-wrap"><ListOrdered className="w-8 h-8 text-teal-400/40" /></div>
                            <p className="text-sm t-muted">No levels yet. Add your first one.</p>
                            <button onClick={openCreate} className="btn-primary text-xs"><Plus className="w-3.5 h-3.5" /> Add Level</button>
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="table-header-row text-left">
                                    <th className="table-header-cell">#</th>
                                    <th className="table-header-cell">Name</th>
                                    <th className="table-header-cell">Description</th>
                                    <th className="table-header-cell">Criteria</th>
                                    <th className="table-header-cell">Manage</th>
                                    <th className="table-header-cell text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {levels.map((l, i) => (
                                    <tr key={l._id} className="table-row-hover transition-colors" style={{ borderTop: "1px solid var(--border-2)" }}>
                                        <td className="px-5 py-4 font-mono text-xs t-muted">{i + 1}</td>
                                        <td className="px-5 py-4 font-semibold t-primary">{l.name}</td>
                                        <td className="px-5 py-4 t-secondary max-w-xs truncate">{l.detail || "—"}</td>
                                        <td className="px-5 py-4"><span className="badge-count">{l.criteria?.length ?? 0}</span></td>
                                        <td className="px-5 py-4">
                                            <Link href={`/dashboard/criteria?dimId=${selectedDimId}&subId=${selectedSubId}&levelId=${l._id}&dimName=${encodeURIComponent(dimLabel)}&subName=${encodeURIComponent(subLabel)}&levelName=${encodeURIComponent(l.name)}`}
                                                className="nav-badge-teal">
                                                Criteria <ChevronRight className="w-3 h-3" />
                                            </Link>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button onClick={() => openEdit(l)} className="btn-secondary !px-2.5 !py-1.5 !text-xs gap-1.5"><Pencil className="w-3.5 h-3.5" /> Edit</button>
                                                <button onClick={() => setDeleteTarget(l)} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-red-500/20 bg-red-500/5 text-red-400 text-xs font-medium hover:bg-red-500/15 hover:border-red-500/40 transition-all">
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
                <Modal title="Add Level" onClose={() => setShowCreate(false)}>
                    <div className="space-y-4">
                        <Field label="Name" id="level-name" value={formName} onChange={setFormName} placeholder="e.g. Level 1 – Initial" />
                        <Field label="Description" id="level-detail" value={formDetail} onChange={setFormDetail} placeholder="Brief description…" textarea />
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
                <Modal title="Edit Level" onClose={() => setEditTarget(null)}>
                    <div className="space-y-4">
                        <Field label="Name" id="edit-level-name" value={formName} onChange={setFormName} placeholder="e.g. Level 1 – Initial" />
                        <Field label="Description" id="edit-level-detail" value={formDetail} onChange={setFormDetail} placeholder="Brief description…" textarea />
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
                <ConfirmDelete name={deleteTarget.name} warn="All criteria inside will also be deleted."
                    onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleting} />
            )}
        </div>
    );
}

export default function LevelsPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-screen"><Loader2 className="w-6 h-6 accent-spinner animate-spin" /></div>}>
            <LevelsContent />
        </Suspense>
    );
}
