"use client";

import { useState } from "react";
import {
    Brain, Loader2, AlertCircle, ChevronDown, ChevronRight,
    Sparkles, TrendingUp, AlertTriangle, CheckCircle2, X,
    Zap, Lock, Save
} from "lucide-react";
import api from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface AssessmentPayloadItem {
    dimension: string;
    dimension_id: string;
    sub_dimension: string;
    sub_dimension_id: string;
    final_result: number;
    expected_level: number;
    assessment_note?: string;
}

/** Sesuai schema PDF: flat array per sub-dimensi */
interface AiResultItem {
    sub_dimension_id:   string;
    sub_dimension_name: string;
    dimension_id:       string;
    dimension_name:     string;
    classification:     string;
    strength_weakness:  string;
    opportunity_analysis: string[];
    action_plan:        string[];
    meta: {
        gap:         number;
        priority:    string;
        risk_score:  number;
        is_strength: boolean;
        is_weakness: boolean;
    };
}

interface Props {
    assessments: AssessmentPayloadItem[];
    onClose:     () => void;
    /** MongoDB session ID untuk menyimpan hasil ke DB */
    sessionId:   string;
    /** Jika true → tombol generate disembunyikan (sudah pernah dilakukan) */
    isLocked:    boolean;
    /** Callback setelah hasil berhasil disimpan ke DB */
    onSaved?:    (items: AiResultItem[]) => void;
}

interface DebugStep {
    step:    string;
    status:  "ok" | "error" | "skip";
    detail?: string;
}

// ─── Priority Badge ───────────────────────────────────────────────────────────
function PriorityBadge({ priority }: { priority?: string }) {
    if (!priority) return null;
    const p = priority.toLowerCase();
    const cfg =
        p === "critical"
            ? { cls: "bg-red-500/10 border-red-500/20 text-red-400",    icon: AlertTriangle }
            : p === "high"
            ? { cls: "bg-orange-500/10 border-orange-500/20 text-orange-400", icon: AlertTriangle }
            : p === "medium"
            ? { cls: "bg-amber-500/10 border-amber-500/20 text-amber-400", icon: TrendingUp }
            : { cls: "bg-green-500/10 border-green-500/20 text-green-400", icon: CheckCircle2 };

    const Icon = cfg.icon;
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.cls}`}>
            <Icon className="w-2.5 h-2.5" />
            {priority}
        </span>
    );
}

// ─── Classification Badge ─────────────────────────────────────────────────────
function ClassificationBadge({ cls }: { cls?: string }) {
    if (!cls) return null;
    const c = cls.toLowerCase();
    const color =
        c.includes("critical") ? "text-red-400 bg-red-500/10 border-red-500/20" :
        c.includes("gap")      ? "text-amber-400 bg-amber-500/10 border-amber-500/20" :
        c === "strength"       ? "text-green-400 bg-green-500/10 border-green-500/20" :
                                 "text-blue-400 bg-blue-500/10 border-blue-500/20";
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${color}`}>
            {cls}
        </span>
    );
}

// ─── Single Result Card ───────────────────────────────────────────────────────
function ResultCard({ item, idx }: { item: AiResultItem; idx: number }) {
    const [expanded, setExpanded] = useState(idx === 0);

    return (
        <div className="card overflow-hidden">
            <button
                onClick={() => setExpanded(v => !v)}
                className="w-full px-4 py-3.5 flex items-center gap-3 text-left transition-colors"
                style={{ backgroundColor: expanded ? "var(--bg-3)" : undefined }}
            >
                <div className="w-6 h-6 rounded-md bg-purple-500/15 border border-purple-500/20 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-black text-purple-400">{idx + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold t-primary truncate">
                        {item.sub_dimension_name}
                    </p>
                    <p className="text-xs t-muted truncate">{item.dimension_name}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <ClassificationBadge cls={item.classification} />
                    <PriorityBadge priority={item.meta?.priority} />
                    {expanded
                        ? <ChevronDown className="w-3.5 h-3.5 t-muted" />
                        : <ChevronRight className="w-3.5 h-3.5 t-muted" />
                    }
                </div>
            </button>

            {expanded && (
                <div className="px-4 pb-4 space-y-3" style={{ borderTop: "1px solid var(--border-2)" }}>
                    {/* Meta scores */}
                    <div className="flex items-center gap-4 pt-3">
                        <div className="text-center">
                            <p className="text-lg font-black text-amber-400">{item.meta?.gap ?? "—"}</p>
                            <p className="text-[10px] t-muted">Gap</p>
                        </div>
                        <div className="flex-1 h-px" style={{ backgroundColor: "var(--border-2)" }} />
                        <div className="text-center">
                            <p className="text-lg font-black text-red-400">{item.meta?.risk_score?.toFixed(1) ?? "—"}</p>
                            <p className="text-[10px] t-muted">Risk Score</p>
                        </div>
                    </div>

                    {/* Strength & Weakness */}
                    {item.strength_weakness && (
                        <div className="p-3 rounded-lg" style={{ backgroundColor: "var(--bg-3)", border: "1px solid var(--border-2)" }}>
                            <p className="text-[10px] font-bold uppercase tracking-widest t-muted mb-1.5">Analisis</p>
                            <p className="text-xs t-secondary leading-relaxed">{item.strength_weakness}</p>
                        </div>
                    )}

                    {/* Opportunity Analysis */}
                    {item.opportunity_analysis?.length > 0 && (
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest t-muted mb-2">Peluang Perbaikan</p>
                            <ul className="space-y-1.5">
                                {item.opportunity_analysis.map((opp, i) => (
                                    <li key={i} className="flex items-start gap-2 text-xs t-secondary">
                                        <span className="mt-1.5 w-1 h-1 rounded-full bg-blue-400 shrink-0" />
                                        <span className="leading-relaxed">{opp}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Action Plan */}
                    {item.action_plan?.length > 0 && (
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest t-muted mb-2">Action Plan</p>
                            <ul className="space-y-1.5">
                                {item.action_plan.map((step, i) => (
                                    <li key={i} className="flex items-start gap-2 text-xs t-secondary">
                                        <span className="mt-0.5 text-[10px] font-black text-purple-400 shrink-0">{i + 1}.</span>
                                        <span className="leading-relaxed">{step}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Main Panel Component ─────────────────────────────────────────────────────
export default function AiReasoningPanel({ assessments, onClose, sessionId, isLocked, onSaved }: Props) {
    const [loading,    setLoading]    = useState(false);
    const [saving,     setSaving]     = useState(false);
    const [results,    setResults]    = useState<AiResultItem[] | null>(null);
    const [error,      setError]      = useState("");
    const [saveError,  setSaveError]  = useState("");
    const [saved,      setSaved]      = useState(false);
    const [hasRun,     setHasRun]     = useState(false);
    const [debugSteps, setDebugSteps] = useState<DebugStep[]>([]);
    const [debugRaw,   setDebugRaw]   = useState<string>("");

    // Sudah locked dari DB ATAU baru saja disimpan di sesi ini
    const isFullyLocked = isLocked || saved;

    // ── Generate AI ───────────────────────────────────────────────────────────
    const handleAnalyze = async () => {
        setLoading(true);
        setError("");
        setSaveError("");
        setResults(null);
        setDebugSteps([]);
        setDebugRaw("");

        try {
            const response = await fetch("/api/analyze", {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({ assessments }),
            });

            const data = await response.json();

            if (Array.isArray(data.debug))        setDebugSteps(data.debug);
            if (data.engine_response_body)         setDebugRaw(data.engine_response_body);
            if (data.raw_response)                 setDebugRaw(data.raw_response);

            if (!data.success) {
                setError(data.error ?? "Analisis gagal");
                setHasRun(true);
                return;
            }

            // data.data harus array flat per sub-dimensi
            const items: AiResultItem[] = Array.isArray(data.data) ? data.data : [];
            setResults(items);
            setHasRun(true);

            // Auto-save langsung ke DB
            if (items.length > 0) {
                await handleSave(items);
            }
        } catch (e) {
            setError("Terjadi kesalahan jaringan (fetch ke /api/analyze gagal). Pastikan Next.js server berjalan.");
            setDebugSteps([{ step: "client_fetch", status: "error", detail: String(e) }]);
            console.error("AI Reasoning client error:", e);
        } finally {
            setLoading(false);
        }
    };

    // ── Save ke DB ────────────────────────────────────────────────────────────
    const handleSave = async (items: AiResultItem[]) => {
        setSaving(true);
        setSaveError("");
        try {
            await api.patch(`/sessions/admin/${sessionId}/ai-analysis`, {
                aiAnalysis: items,
            });
            setSaved(true);
            onSaved?.(items);
        } catch (e: unknown) {
            const msg = (e as { response?: { data?: { error?: string } } })
                ?.response?.data?.error ?? "Gagal menyimpan ke database.";
            setSaveError(msg);
            console.error("AI save error:", e);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-end p-4 pointer-events-none">
            <div
                className="pointer-events-auto w-full max-w-xl h-[calc(100vh-2rem)] flex flex-col card shadow-2xl"
                style={{ borderColor: "var(--accent-muted-border)" }}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between px-5 py-4 shrink-0"
                    style={{ borderBottom: "1px solid var(--border)", backgroundColor: "var(--bg-2)" }}
                >
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                            <Brain className="w-4 h-4 text-purple-400" />
                        </div>
                        <div>
                            <h3 className="font-bold t-primary text-sm flex items-center gap-2">
                                AI Reasoning
                                {isFullyLocked && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-500/10 border border-green-500/20 text-green-400">
                                        <Lock className="w-2.5 h-2.5" /> Tersimpan
                                    </span>
                                )}
                            </h3>
                            <p className="text-[10px] t-muted">Analisis gap &amp; rekomendasi tindakan</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="btn-secondary !px-2 !py-1.5">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Info / locked banner */}
                <div className="px-5 py-3 shrink-0" style={{ borderBottom: "1px solid var(--border-2)", backgroundColor: "var(--bg-3)" }}>
                    {isFullyLocked ? (
                        <p className="text-[11px] leading-relaxed flex items-start gap-1.5" style={{ color: "var(--text-secondary)" }}>
                            <Lock className="w-3 h-3 mt-0.5 text-green-400 shrink-0" />
                            Hasil AI telah disimpan secara permanen ke database dan tidak dapat di-generate ulang.
                        </p>
                    ) : (
                        <p className="text-[11px] t-secondary leading-relaxed">
                            Menganalisis <strong className="t-primary">{assessments.length}</strong> sub-dimensi.
                            Hasil akan disimpan permanen ke database — <strong className="text-amber-400">hanya bisa dilakukan satu kali</strong>.
                        </p>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    {/* Initial state */}
                    {!hasRun && !loading && !error && !isFullyLocked && (
                        <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                            <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20">
                                <Sparkles className="w-8 h-8 text-purple-400" />
                            </div>
                            <div>
                                <p className="font-semibold t-primary mb-1">Siap untuk dianalisis</p>
                                <p className="text-xs t-muted leading-relaxed max-w-xs">
                                    Klik tombol di bawah untuk mengirim data ke Reasoning Engine.
                                    Hasilnya akan langsung disimpan permanen ke database.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Locked — no results in this session */}
                    {isLocked && !results && (
                        <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                            <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/20">
                                <Lock className="w-8 h-8 text-green-400" />
                            </div>
                            <div>
                                <p className="font-semibold t-primary mb-1">AI Analysis Sudah Tersimpan</p>
                                <p className="text-xs t-muted leading-relaxed max-w-xs">
                                    Hasil generate AI untuk sesi ini sudah disimpan di database dan tidak dapat diulang.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Loading */}
                    {loading && (
                        <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                            <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 animate-pulse">
                                <Brain className="w-8 h-8 text-purple-400" />
                            </div>
                            <div>
                                <p className="font-semibold t-primary mb-1">AI Sedang Berpikir…</p>
                                <p className="text-xs t-muted leading-relaxed max-w-xs">
                                    Mengirim data ke Reasoning Engine secara bertahap.<br />
                                    Proses ini membutuhkan <strong className="text-amber-400">1–3 menit</strong> — mohon tunggu.
                                </p>
                            </div>
                            <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                        </div>
                    )}

                    {/* Save status banner */}
                    {saving && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 text-xs text-blue-400">
                            <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                            Menyimpan hasil ke database…
                        </div>
                    )}
                    {saved && !saving && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/5 border border-green-500/20 text-xs text-green-400">
                            <Save className="w-3.5 h-3.5 shrink-0" />
                            Hasil berhasil disimpan ke database secara permanen.
                        </div>
                    )}
                    {saveError && (
                        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/5 border border-red-500/20 text-xs text-red-400">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            <span>Gagal menyimpan: {saveError}</span>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="space-y-3">
                            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/20">
                                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-semibold text-red-400 mb-1">Analisis Gagal</p>
                                    <p className="text-xs t-secondary leading-relaxed">{error}</p>
                                </div>
                            </div>

                            {debugSteps.length > 0 && (
                                <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border-2)" }}>
                                    <p className="text-[10px] font-bold uppercase tracking-widest px-3 py-2" style={{ backgroundColor: "var(--bg-3)", color: "var(--text-muted)" }}>
                                        🔍 Debug Trace — {debugSteps.length} step
                                    </p>
                                    <div className="divide-y" style={{ borderColor: "var(--border-2)" }}>
                                        {debugSteps.map((s, i) => (
                                            <div key={i} className="px-3 py-2 flex items-start gap-2">
                                                <span className={`text-[10px] font-black shrink-0 mt-0.5 ${
                                                    s.status === "ok" ? "text-green-400" :
                                                    s.status === "error" ? "text-red-400" : "text-gray-400"
                                                }`}>
                                                    {s.status === "ok" ? "✓" : s.status === "error" ? "✗" : "—"}
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[10px] font-bold t-primary font-mono">{s.step}</p>
                                                    {s.detail && <p className="text-[10px] t-muted leading-relaxed mt-0.5 break-words">{s.detail}</p>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {debugRaw && (
                                <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border-2)" }}>
                                    <p className="text-[10px] font-bold uppercase tracking-widest px-3 py-2" style={{ backgroundColor: "var(--bg-3)", color: "var(--text-muted)" }}>
                                        📄 Raw Engine Response
                                    </p>
                                    <pre className="text-[10px] t-muted p-3 overflow-x-auto whitespace-pre-wrap break-words leading-relaxed">
                                        {debugRaw}
                                    </pre>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Results */}
                    {results && results.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-[10px] font-bold uppercase tracking-widest t-muted">
                                Hasil Analisis ({results.length} sub-dimensi)
                            </p>
                            {results.map((item, i) => (
                                <ResultCard key={i} item={item} idx={i} />
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div
                    className="px-5 py-4 shrink-0 flex gap-2"
                    style={{ borderTop: "1px solid var(--border)", backgroundColor: "var(--bg-2)" }}
                >
                    {/* Tombol generate hanya tampil jika BELUM locked */}
                    {!isFullyLocked && (
                        <button
                            id="btn-generate-ai"
                            onClick={handleAnalyze}
                            disabled={loading || saving || assessments.length === 0}
                            className="btn-primary flex-1 gap-2"
                        >
                            {loading
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : <Zap className="w-4 h-4" />
                            }
                            {loading ? "Menganalisis…" : "Analisis dengan AI"}
                        </button>
                    )}

                    {/* Jika locked, tampilkan info saja */}
                    {isFullyLocked && (
                        <div className="flex-1 flex items-center justify-center gap-2 text-xs t-muted">
                            <Lock className="w-3.5 h-3.5 text-green-400" />
                            Generate AI telah dikunci secara permanen
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
