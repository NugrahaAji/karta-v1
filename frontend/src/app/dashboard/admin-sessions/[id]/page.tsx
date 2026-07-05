"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
    ArrowLeft, Loader2, AlertCircle, Users,
    Building2, Save, Plus, Trash2, Settings2, Activity,
    ClipboardList, BarChart2, X, ChevronRight, ListChecks,
} from "lucide-react";
import {
    RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell,
} from "recharts";
import api from "@/lib/api";
import {
    AssessmentSession, Dimension, AssessmentResponse,
    DimensionAnalysis, SubdimensionAnalysis, Adjustment,
    ActionPlanGroup, MonitoringColumn, MonitoringCell, MonitoringRow,
} from "@/types";
import MonitoringTable, { monRowKey, buildMonRows } from "@/components/MonitoringTable";
import Link from "next/link";
import toast from "react-hot-toast";

const DIM_COLORS = [
    "border-purple-500/30 text-purple-400 bg-purple-500/10",
    "border-blue-500/30 text-blue-400 bg-blue-500/10",
    "border-green-500/30 text-green-400 bg-green-500/10",
    "border-amber-500/30 text-amber-400 bg-amber-500/10",
    "border-pink-500/30 text-pink-400 bg-pink-500/10",
    "border-teal-500/30 text-teal-400 bg-teal-500/10",
];
const BAR_COLORS = ["#a78bfa", "#60a5fa", "#34d399", "#fbbf24", "#f472b6", "#2dd4bf"];

interface SubResult {
    subId: string;
    subName: string;
    dimId: string;
    levels: { _id: string; name: string; criteria: { _id: string; name: string }[] }[];
    evaluatorAnswers: { userId: string; userName: string; levelIndex: number; criteriaName?: string }[];
    voteCounts: Record<number, number>;
    hasMajority: boolean;
    isTied: boolean;
    majorityLevelIndex: number | null;
    adjustment?: Adjustment;
}

/* ─── Dynamic list input component ─────────────────────────────────────────── */
function DynamicList({
    items,
    onChange,
    placeholder,
    accentColor = "bg-purple-400",
    rows = 2,
}: {
    items: string[];
    onChange: (items: string[]) => void;
    placeholder?: string;
    accentColor?: string;
    rows?: number;
}) {
    const addItem = () => onChange([...items, ""]);
    const removeItem = (i: number) => onChange(items.filter((_, idx) => idx !== i));
    const updateItem = (i: number, val: string) =>
        onChange(items.map((item, idx) => (idx === i ? val : item)));

    return (
        <div className="space-y-2">
            {items.map((item, i) => (
                <div key={i} className="flex items-start gap-1.5">
                    <span className={`mt-2.5 w-1.5 h-1.5 rounded-full shrink-0 ${accentColor}`} />
                    <textarea
                        rows={rows}
                        value={item}
                        onChange={e => updateItem(i, e.target.value)}
                        placeholder={placeholder ?? "Add item..."}
                        className="flex-1 px-2.5 py-2 rounded-lg text-xs resize-none focus:outline-none transition-all"
                        style={{
                            backgroundColor: "var(--bg-4)",
                            border: "1px solid var(--border-2)",
                            color: "var(--text-primary)",
                        }}
                    />
                    <button
                        onClick={() => removeItem(i)}
                        className="mt-1.5 p-1 rounded-md hover:bg-red-500/10 text-red-400/60 hover:text-red-400 transition-colors shrink-0"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            ))}
            <button
                onClick={addItem}
                className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-md transition-all"
                style={{ color: "var(--accent-from)", backgroundColor: "rgba(139,92,246,0.08)" }}
            >
                <Plus className="w-3 h-3" /> Add item
            </button>
        </div>
    );
}

// State shapes
type DimState = { sw: string[]; oa: string[] };
type SubState = { el: string };
type TabKey = "analysis" | "monitoring";

/* ─── Action Plan Drawer ───────────────────────────────────────────────── */
function ActionPlanDrawer({
    open, grpIdx, apGroups, subResults, dimensions, onClose, onChange, onDelete,
}: {
    open: boolean;
    grpIdx: number | null;
    apGroups: ActionPlanGroup[];
    subResults: { subId: string; subName: string; dimId: string }[];
    dimensions: { _id: string; name: string }[];
    onClose: () => void;
    onChange: (idx: number, grp: ActionPlanGroup) => void;
    onDelete: (idx: number) => void;
}) {
    if (!open || grpIdx === null) return null;
    const grp = apGroups[grpIdx];
    if (!grp) return null;

    const update = (patch: Partial<ActionPlanGroup>) => onChange(grpIdx, { ...grp, ...patch });

    const toggleSub = (subId: string, checked: boolean) => {
        const inOther = apGroups.some((g, i) => i !== grpIdx && (g.subdimensions ?? []).includes(subId));
        if (inOther && checked) return;
        const next = checked
            ? [...(grp.subdimensions ?? []), subId]
            : (grp.subdimensions ?? []).filter(s => s !== subId);
        update({ subdimensions: next });
    };

    // Group subs by dimension for display
    const dimGroups = dimensions.map(dim => ({
        dim,
        subs: subResults.filter(s => s.dimId === dim._id),
    })).filter(dg => dg.subs.length > 0);

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />
            {/* Drawer */}
            <div
                className="fixed top-0 right-0 h-full z-50 flex flex-col shadow-2xl"
                style={{
                    width: "min(480px, 100vw)",
                    backgroundColor: "var(--bg-2)",
                    borderLeft: "1px solid var(--border-2)",
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border-2)" }}>
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(251,146,60,0.12)" }}>
                            <ListChecks className="w-4 h-4 text-orange-400" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold t-primary">Action Plan</h3>
                            <p className="text-[10px] t-muted">{(grp.subdimensions ?? []).length} sub-dimension(s) assigned</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--bg-4)] t-muted hover:t-primary transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Scrollable body */}
                <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">

                    {/* Action Steps */}
                    <div>
                        <p className="text-xs font-bold t-secondary mb-3 flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded-full bg-orange-400 text-white text-[9px] flex items-center justify-center font-black">1</span>
                            Action Steps
                        </p>
                        <div className="space-y-2">
                            {(grp.items.length > 0 ? grp.items : [""]).map((item, i) => (
                                <div key={i} className="flex items-start gap-2">
                                    <span className="shrink-0 mt-2.5 text-[10px] font-black text-orange-400 w-5 text-right">{i + 1}.</span>
                                    <textarea
                                        rows={2}
                                        value={item}
                                        onChange={e => {
                                            const next = [...(grp.items.length > 0 ? grp.items : [""])];
                                            next[i] = e.target.value;
                                            update({ items: next });
                                        }}
                                        placeholder={`Step ${i + 1}...`}
                                        className="flex-1 px-3 py-2 rounded-lg text-xs resize-none focus:outline-none transition-all"
                                        style={{
                                            backgroundColor: "var(--bg-4)",
                                            border: "1px solid var(--border-2)",
                                            color: "var(--text-primary)",
                                        }}
                                    />
                                    <button
                                        onClick={() => update({ items: (grp.items.length > 0 ? grp.items : [""]).filter((_, idx) => idx !== i) })}
                                        className="mt-1.5 p-1 rounded-md hover:bg-red-500/10 text-red-400/40 hover:text-red-400 transition-colors shrink-0"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={() => update({ items: [...(grp.items.length > 0 ? grp.items : [""]), ""] })}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all mt-1"
                                style={{ color: "rgb(251,146,60)", backgroundColor: "rgba(251,146,60,0.08)" }}
                            >
                                <Plus className="w-3.5 h-3.5" /> Add Step
                            </button>
                        </div>
                    </div>

                    {/* Sub-dimension assignment */}
                    <div>
                        <p className="text-xs font-bold t-secondary mb-3 flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded-full bg-orange-400 text-white text-[9px] flex items-center justify-center font-black">2</span>
                            Applies to Sub-Dimensions
                            <span className="ml-auto text-[10px] font-normal t-muted">Select which subs share this plan → merge cells</span>
                        </p>
                        <div className="space-y-3">
                            {dimGroups.map(({ dim, subs }) => (
                                <div key={dim._id} className="rounded-xl p-3" style={{ backgroundColor: "var(--bg-3)", border: "1px solid var(--border)" }}>
                                    <p className="text-[10px] font-bold t-muted uppercase tracking-wider mb-2">{dim.name}</p>
                                    <div className="space-y-1.5">
                                        {subs.map(sub => {
                                            const checked = (grp.subdimensions ?? []).includes(sub.subId);
                                            const inOther = apGroups.some((g, i) => i !== grpIdx && (g.subdimensions ?? []).includes(sub.subId));
                                            return (
                                                <label
                                                    key={sub.subId}
                                                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-all ${
                                                        checked
                                                            ? "bg-orange-400/10 border border-orange-400/30"
                                                            : inOther
                                                            ? "opacity-40 cursor-not-allowed"
                                                            : "hover:bg-[var(--bg-4)] border border-transparent"
                                                    }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        disabled={inOther && !checked}
                                                        onChange={e => toggleSub(sub.subId, e.target.checked)}
                                                        className="accent-orange-500 w-3.5 h-3.5"
                                                    />
                                                    <span className={`text-xs font-medium ${
                                                        checked ? "text-orange-300" : "t-secondary"
                                                    }`}>{sub.subName}</span>
                                                    {inOther && !checked && (
                                                        <span className="ml-auto text-[9px] text-amber-400 font-semibold">Used</span>
                                                    )}
                                                    {checked && (
                                                        <span className="ml-auto text-[9px] text-orange-400 font-semibold">✓ Assigned</span>
                                                    )}
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-4 flex items-center justify-between" style={{ borderTop: "1px solid var(--border-2)" }}>
                    <button
                        onClick={() => { onDelete(grpIdx); onClose(); }}
                        className="inline-flex items-center gap-1.5 text-xs text-red-400/60 hover:text-red-400 transition-colors"
                    >
                        <Trash2 className="w-3.5 h-3.5" /> Remove group
                    </button>
                    <button onClick={onClose} className="btn-primary text-xs gap-1.5">
                        <Save className="w-3.5 h-3.5" /> Done
                    </button>
                </div>
            </div>
        </>
    );
}

export default function AdminSessionDetailPage() {
    const params = useParams();
    const sessionId = params?.id as string;
    const searchParams = useSearchParams();

    // Deep-link support: ?tab=monitoring opens monitoring tab directly
    const initialTab = searchParams?.get("tab") === "monitoring" ? "monitoring" : "analysis";
    const [activeTab, setActiveTab] = useState<TabKey>(initialTab as TabKey);
    const [session, setSession] = useState<AssessmentSession | null>(null);
    const [dimensions, setDimensions] = useState<Dimension[]>([]);
    const [responses, setResponses] = useState<AssessmentResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    const [savingAP, setSavingAP] = useState(false);
    const [apDrawerOpen, setApDrawerOpen] = useState(false);
    const [apDrawerGrpIdx, setApDrawerGrpIdx] = useState<number | null>(null);
    const [selectedDimIdx, setSelectedDimIdx] = useState(0);

    // dimId → { sw: string[]; oa: string[] }
    const [dimAnalysis, setDimAnalysis] = useState<Record<string, DimState>>({});
    // Action plan groups
    const [apGroups, setApGroups] = useState<ActionPlanGroup[]>([]);
    // subId → { el: string }
    const [subAnalysis, setSubAnalysis] = useState<Record<string, SubState>>({});

    // Monitoring state (legacy columns)
    const [monColumns, setMonColumns] = useState<MonitoringColumn[]>([]);
    const [monData, setMonData] = useState<Record<string, string | number | boolean>>({});
    const [savingMon, setSavingMon] = useState(false);
    const [showColEditor, setShowColEditor] = useState(false);
    const [editColumns, setEditColumns] = useState<{ label: string; type: string; _id?: string }[]>([]);

    // New action-plan-based monitoring rows
    type MonRowData = Omit<MonitoringRow, "_id" | "actionPlanGroupId" | "actionPlanItemIdx">;
    const [monRowData, setMonRowData] = useState<Record<string, MonRowData>>({});
    const [savingMonRows, setSavingMonRows] = useState(false);

    const fetchData = async () => {
        try {
            const res = await api.get(`/sessions/admin/${sessionId}/results`);
            const sess = res.data.session as AssessmentSession;
            setSession(sess);
            setDimensions(res.data.dimensions ?? []);
            setResponses(res.data.responses ?? []);

            // Restore dimension-level analysis
            const da: Record<string, DimState> = {};
            for (const entry of sess.dimensionAnalysis ?? []) {
                da[entry.dimension] = {
                    sw: entry.strengthWeaknessItems ?? [],
                    oa: entry.opportunityAnalysisItems ?? [],
                };
            }
            setDimAnalysis(da);

            // Restore action plan groups
            setApGroups(
                (sess.actionPlanGroups ?? []).map(g => ({
                    _id: g._id,
                    label: g.label ?? "",
                    items: g.items ?? [],
                    subdimensions: g.subdimensions ?? [],
                    order: g.order ?? 0,
                }))
            );

            // Restore subdimension-level analysis (only expectedLevel)
            const sa: Record<string, SubState> = {};
            for (const entry of sess.subdimensionAnalysis ?? []) {
                sa[entry.subdimension] = {
                    el: entry.expectedLevel != null ? String(entry.expectedLevel) : "",
                };
            }
            setSubAnalysis(sa);

            // Restore monitoring
            setMonColumns(sess.monitoringColumns ?? []);
            const md: Record<string, string | number | boolean> = {};
            for (const cell of sess.monitoringData ?? []) {
                md[`${cell.subdimension}__${cell.columnId}`] = cell.value;
            }
            setMonData(md);

            // Restore new monitoring rows
            const mrd: Record<string, MonRowData> = {};
            for (const row of sess.monitoringRows ?? []) {
                const grpId = row.actionPlanGroupId ?? "";
                const k = monRowKey(grpId, row.actionPlanItemIdx);
                mrd[k] = {
                    subdimension: row.subdimension ?? "",
                    timeline: row.timeline ?? [],
                    pic: row.pic ?? "",
                    checker: row.checker ?? "",
                    achievementStatus: (row.achievementStatus ?? "") as MonRowData["achievementStatus"],
                    notes: row.notes ?? "",
                };
            }
            setMonRowData(mrd);
        } catch {
            setError("Session not found or access denied.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { if (sessionId) fetchData(); }, [sessionId]);

    const subResults = useMemo((): SubResult[] => {
        const results: SubResult[] = [];
        for (const dim of dimensions) {
            for (const sub of dim.subdimensions ?? []) {
                const criteriaMap: Record<string, { name: string }> = {};
                (sub.levels ?? []).forEach(lvl =>
                    (lvl.criteria ?? []).forEach(c => { criteriaMap[c._id] = { name: c.name }; })
                );
                const evaluatorAnswers: SubResult["evaluatorAnswers"] = [];
                for (const resp of responses) {
                    const item = resp.responses.find(r => r.subdimension === sub._id);
                    if (item) {
                        evaluatorAnswers.push({
                            userId: resp.user._id, userName: resp.user.name,
                            levelIndex: item.selectedLevelIndex,
                            criteriaName: item.selectedCriteria ? criteriaMap[item.selectedCriteria]?.name : undefined,
                        });
                    }
                }
                const voteCounts: Record<number, number> = {};
                for (const ea of evaluatorAnswers) voteCounts[ea.levelIndex] = (voteCounts[ea.levelIndex] ?? 0) + 1;
                const maxVotes = evaluatorAnswers.length > 0 ? Math.max(...Object.values(voteCounts)) : 0;
                const topLevels = Object.entries(voteCounts).filter(([, c]) => c === maxVotes).map(([i]) => Number(i));
                const hasMajority = evaluatorAnswers.length > 0 && topLevels.length === 1;
                const isTied = evaluatorAnswers.length > 0 && topLevels.length > 1;
                const majorityLevelIndex = hasMajority ? topLevels[0] : null;
                const adjustment = session?.adjustments?.find(a => a.subdimension === sub._id && a.dimension === dim._id);
                results.push({
                    subId: sub._id, subName: sub.name, dimId: dim._id,
                    levels: (sub.levels ?? []).map(l => ({ _id: l._id, name: l.name, criteria: (l.criteria ?? []).map(c => ({ _id: c._id, name: c.name })) })),
                    evaluatorAnswers, voteCounts, hasMajority, isTied, majorityLevelIndex, adjustment,
                });
            }
        }
        return results;
    }, [dimensions, responses, session]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const dimensionAnalysis: DimensionAnalysis[] = dimensions.map(dim => ({
                dimension: dim._id,
                strengthWeaknessItems:    (dimAnalysis[dim._id]?.sw ?? []).filter(s => s.trim()),
                opportunityAnalysisItems: (dimAnalysis[dim._id]?.oa ?? []).filter(s => s.trim()),
            }));
            const subdimensionAnalysis: SubdimensionAnalysis[] = subResults.map(sub => ({
                dimension:    sub.dimId,
                subdimension: sub.subId,
                opportunityAnalysisItems: [],
                expectedLevel: subAnalysis[sub.subId]?.el !== ""
                    ? Number(subAnalysis[sub.subId]?.el) : null,
            }));
            await api.patch(`/sessions/admin/${sessionId}/analysis`, { dimensionAnalysis, subdimensionAnalysis });
            toast.success("Analysis saved");
        } catch {
            toast.error("Failed to save analysis");
        } finally {
            setSaving(false);
        }
    };

    const handleSaveActionPlans = async () => {
        setSavingAP(true);
        try {
            const payload = apGroups.map((g, i) => ({
                _id: g._id,
                label: g.label,
                items: g.items.filter(s => s.trim()),
                subdimensions: g.subdimensions,
                order: i,
            }));
            await api.patch(`/sessions/admin/${sessionId}/action-plan-groups`, { actionPlanGroups: payload });
            toast.success("Action plans saved");
        } catch {
            toast.error("Failed to save action plans");
        } finally {
            setSavingAP(false);
        }
    };

    const updateDim = (dimId: string, field: keyof DimState, items: string[]) =>
        setDimAnalysis(prev => ({ ...prev, [dimId]: { ...prev[dimId] ?? { sw: [], oa: [] }, [field]: items } }));

    const handleSaveMonitoring = async () => {
        setSavingMonRows(true);
        try {
            // Build array from monRowData — derive grpId + itemIdx from key
            const rows = buildMonRows(apGroups, subResults, dimensions);
            const payload = rows.map(r => {
                const grpId = r.grp._id ?? String(r.grpIdx);
                const key = monRowKey(grpId, r.itemIdx);
                const d = monRowData[key] ?? { subdimension: "", timeline: [], pic: "", checker: "", achievementStatus: "" as const, notes: "" };
                return {
                    actionPlanGroupId: r.grp._id ?? null,
                    actionPlanItemIdx: r.itemIdx,
                    subdimension:      r.subs[0]?.subId ?? null,
                    timeline:          d.timeline,
                    pic:               d.pic,
                    checker:           d.checker,
                    achievementStatus: d.achievementStatus,
                    notes:             d.notes,
                };
            });
            await api.patch(`/sessions/admin/${sessionId}/monitoring-rows`, { monitoringRows: payload });
            toast.success("Monitoring saved");
        } catch {
            toast.error("Failed to save monitoring");
        } finally {
            setSavingMonRows(false);
        }
    };

    // ─── Monitoring handlers ──────────────────────────────────────────────────
    const handleSaveColumns = async () => {
        setSavingMon(true);
        try {
            const res = await api.patch(`/sessions/admin/${sessionId}/monitoring-columns`, { columns: editColumns });
            setMonColumns(res.data.monitoringColumns ?? []);
            setShowColEditor(false);
            toast.success("Monitoring columns saved");
        } catch { toast.error("Failed to save columns"); }
        finally { setSavingMon(false); }
    };

    const handleSaveMonData = async () => {
        setSavingMon(true);
        try {
            const data: MonitoringCell[] = [];
            for (const sub of subResults) {
                for (const col of monColumns) {
                    const key = `${sub.subId}__${col._id}`;
                    data.push({ dimension: sub.dimId, subdimension: sub.subId, columnId: col._id, value: monData[key] ?? "" });
                }
            }
            await api.patch(`/sessions/admin/${sessionId}/monitoring-data`, { data });
            toast.success("Monitoring data saved");
        } catch { toast.error("Failed to save monitoring data"); }
        finally { setSavingMon(false); }
    };

    if (loading) return (
        <div className="page-container flex items-center justify-center py-32">
            <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
        </div>
    );
    if (error || !session) return (
        <div className="page-container">
            <div className="card py-24 flex flex-col items-center gap-4">
                <AlertCircle className="w-8 h-8 text-red-400/40" />
                <p className="text-sm t-muted">{error}</p>
                <Link href="/dashboard/admin-sessions" className="btn-secondary text-sm">
                    <ArrowLeft className="w-4 h-4" /> Back
                </Link>
            </div>
        </div>
    );

    const radarData = subResults.map(sub => {
        const idx = sub.adjustment ? sub.adjustment.finalLevelIndex : sub.hasMajority ? sub.majorityLevelIndex : null;
        return { subject: sub.subName, value: idx !== null ? idx + 1 : 0, fullMark: 5 };
    });

    return (
        <div className="page-container max-w-7xl">
            {/* Back */}
            <Link href="/dashboard/admin-sessions"
                className="inline-flex items-center gap-2 text-sm t-secondary hover:t-primary transition-colors mb-6"
                style={{ color: "var(--text-secondary)" }}>
                <ArrowLeft className="w-4 h-4" /> Back to Assessments
            </Link>

            {/* Header */}
            <div className="card overflow-hidden mb-6">
                <div className="h-1.5 w-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400" />
                <div className="px-6 py-5">
                    <h1 className="text-2xl font-bold t-primary mb-1">{session.title}</h1>
                    {session.description && <p className="text-sm t-secondary mb-3">{session.description}</p>}
                    <div className="flex flex-wrap gap-4 text-xs t-muted">
                        <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" />{session.company?.name}</span>
                        <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{responses.length}/{session.assignedTo?.length ?? 0} submitted</span>
                    </div>
                </div>
            </div>

            {/* ─── Tab Bar ─────────────────────────────────────────────── */}
            <div className="flex gap-1 mb-6 p-1 rounded-xl" style={{ backgroundColor: "var(--bg-3)", width: "fit-content" }}>
                {(["analysis", "monitoring"] as TabKey[]).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className="px-4 py-2 rounded-lg text-xs font-bold transition-all"
                        style={activeTab === tab
                            ? { backgroundColor: "var(--bg)", color: "var(--text-primary)", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }
                            : { color: "var(--text-muted)" }
                        }
                    >
                        {tab === "analysis" ? "Assessment" : "Monitoring"}
                    </button>
                ))}
            </div>

            {/* ─── Monitoring Tab ──────────────────────────────────────── */}
            {activeTab === "monitoring" && (
                <MonitoringTable
                    apGroups={apGroups}
                    subResults={subResults}
                    dimensions={dimensions}
                    monData={monRowData}
                    onChangeRow={(key, data) => setMonRowData(prev => ({ ...prev, [key]: data }))}
                    subAnalysis={subAnalysis}
                    finalResults={Object.fromEntries(subResults.map(s => {
                        const fi = s.adjustment ? s.adjustment.finalLevelIndex : s.hasMajority ? s.majorityLevelIndex : null;
                        return [s.subId, fi !== null ? fi + 1 : null];
                    }))}
                    saving={savingMonRows}
                    onSave={handleSaveMonitoring}
                />
            )}

            {/* ─── Assessment Tab ──────────────────────────────────────── */}
            {activeTab === "analysis" && <>

            {/* Charts */}
            {radarData.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                    <div className="lg:col-span-2 card p-5">
                        <p className="text-xs font-semibold t-secondary text-center mb-3">Maturity Model Measurement — All Sub-Dimensions</p>
                        <ResponsiveContainer width="100%" height={300}>
                            <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                                <PolarGrid stroke="var(--border-2)" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: "var(--text-muted)", fontSize: 10 }} />
                                <PolarRadiusAxis angle={90} domain={[0, 5]} tickCount={6} tick={{ fill: "var(--text-muted)", fontSize: 9 }} />
                                <Radar name="Final Result" dataKey="value" stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.18} strokeWidth={2} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="card p-4 flex flex-col gap-3">
                        <select value={selectedDimIdx} onChange={e => setSelectedDimIdx(Number(e.target.value))}
                            className="w-full px-3 py-2 rounded-lg text-xs font-semibold focus:outline-none"
                            style={{ backgroundColor: "var(--bg-4)", border: "1px solid var(--border-2)", color: "var(--text-primary)" }}>
                            {dimensions.map((d, i) => <option key={d._id} value={i}>{d.name}</option>)}
                        </select>
                        {(() => {
                            const dim = dimensions[selectedDimIdx];
                            if (!dim) return null;
                            const dimSubs = subResults.filter(s => s.dimId === dim._id);
                            const barData = dimSubs.map(sub => {
                                const idx = sub.adjustment ? sub.adjustment.finalLevelIndex : sub.hasMajority ? sub.majorityLevelIndex : null;
                                return { name: sub.subName.slice(0, 14) + (sub.subName.length > 14 ? "…" : ""), value: idx !== null ? idx + 1 : 0 };
                            });
                            const color = BAR_COLORS[selectedDimIdx % BAR_COLORS.length];
                            return (
                                <>
                                    <p className="text-[11px] font-bold t-secondary text-center">{dim.name} — Result</p>
                                    <ResponsiveContainer width="100%" height={220}>
                                        <BarChart data={barData} margin={{ top: 4, right: 8, left: -16, bottom: 40 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                            <XAxis dataKey="name" tick={{ fill: "var(--text-muted)", fontSize: 9 }} angle={-35} textAnchor="end" interval={0} />
                                            <YAxis domain={[0, 5]} tickCount={6} tick={{ fill: "var(--text-muted)", fontSize: 9 }} />
                                            <Tooltip contentStyle={{ backgroundColor: "var(--bg-2)", border: "1px solid var(--border-2)", borderRadius: 8, fontSize: 11 }} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                                {barData.map((_, i) => <Cell key={i} fill={color} fillOpacity={0.85} />)}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </>
                            );
                        })()}
                    </div>
                </div>
            )}

            {/* Header + unified save */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold t-secondary uppercase tracking-wider">Assessment Results & Analysis</h2>
                <button
                    onClick={async () => { await handleSave(); await handleSaveActionPlans(); }}
                    disabled={saving || savingAP}
                    className="btn-primary text-sm gap-2"
                >
                    {(saving || savingAP) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save All
                </button>
            </div>

            {/* Results Table */}
            <div className="card overflow-x-auto">
                <table className="w-full text-sm border-collapse" style={{ minWidth: "1380px" }}>
                    <thead>
                        <tr style={{ backgroundColor: "var(--bg-3)", borderBottom: "2px solid var(--border-2)" }}>
                            <th className="px-3 py-3 text-left text-xs font-bold t-secondary uppercase tracking-wider w-28">Dimension</th>
                            <th className="px-3 py-3 text-left text-xs font-bold t-secondary uppercase tracking-wider w-32">Sub-Dimension</th>
                            <th className="px-3 py-3 text-left text-xs font-bold t-secondary uppercase tracking-wider w-36">Assessment Note</th>
                            <th className="px-3 py-3 text-center text-xs font-bold t-secondary uppercase tracking-wider w-20">Final</th>
                            <th className="px-3 py-3 text-left text-xs font-bold t-secondary uppercase tracking-wider" style={{ minWidth: "220px" }}>Strength / Weakness</th>
                            <th className="px-3 py-3 text-left text-xs font-bold t-secondary uppercase tracking-wider" style={{ minWidth: "220px" }}>Opportunity Analysis</th>
                            <th className="px-3 py-3 text-center text-xs font-bold t-secondary uppercase tracking-wider w-24">Expected</th>
                            <th className="px-3 py-3 text-left text-xs font-bold t-secondary uppercase tracking-wider" style={{ minWidth: "200px" }}>Action Plan</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dimensions.map((dim, dIdx) => {
                            const dimSubs = subResults.filter(s => s.dimId === dim._id);
                            const colorClass = DIM_COLORS[dIdx % DIM_COLORS.length];
                            const dimState = dimAnalysis[dim._id] ?? { sw: [], oa: [] };

                            return dimSubs.map((sub, sIdx) => {
                                const finalIdx = sub.adjustment ? sub.adjustment.finalLevelIndex
                                    : sub.hasMajority ? sub.majorityLevelIndex : null;
                                const finalBobot = finalIdx !== null ? finalIdx + 1 : null;
                                const notes = responses.flatMap(resp => {
                                    const item = resp.responses.find(r => r.subdimension === sub.subId);
                                    return item?.note ? [item.note] : [];
                                });
                                const elVal = subAnalysis[sub.subId]?.el ?? "";

                                return (
                                    <tr key={sub.subId} style={{
                                        borderBottom: "1px solid var(--border)",
                                        backgroundColor: sIdx % 2 === 0 ? "var(--bg)" : "var(--bg-2)",
                                    }}>
                                        {/* Dimension — rowspan */}
                                        {sIdx === 0 && (
                                            <td rowSpan={dimSubs.length} className="px-3 py-3 align-middle"
                                                style={{ borderRight: "1px solid var(--border-2)", backgroundColor: "var(--bg-3)", verticalAlign: "middle" }}>
                                                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border ${colorClass}`}>
                                                    {dim.name}
                                                </div>
                                            </td>
                                        )}

                                        {/* Sub-Dimension */}
                                        <td className="px-3 py-3 align-top text-xs font-medium t-primary" style={{ borderRight: "1px solid var(--border)" }}>
                                            {sub.subName}
                                        </td>

                                        {/* Assessment Note */}
                                        <td className="px-3 py-3 align-top" style={{ borderRight: "1px solid var(--border)" }}>
                                            {notes.length > 0 ? (
                                                <ul className="space-y-1">
                                                    {notes.map((note, i) => (
                                                        <li key={i} className="flex items-start gap-1.5">
                                                            <span className="mt-1.5 w-1 h-1 rounded-full shrink-0 bg-purple-400" />
                                                            <p className="text-[11px] t-secondary leading-snug">{note}</p>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : <span className="text-[11px] t-muted italic">—</span>}
                                        </td>

                                        {/* Final Result */}
                                        <td className="px-3 py-3 text-center align-middle" style={{ borderRight: "1px solid var(--border)" }}>
                                            {finalBobot !== null ? (
                                                <span className={`text-xl font-black ${finalBobot >= 4 ? "text-green-400" : finalBobot === 3 ? "text-blue-400" : finalBobot === 2 ? "text-amber-400" : "text-red-400"}`}>
                                                    {finalBobot}
                                                </span>
                                            ) : <span className="text-xs t-muted">—</span>}
                                        </td>

                                        {/* Strength / Weakness — rowspan, dynamic list, per dimension */}
                                        {sIdx === 0 && (
                                            <td rowSpan={dimSubs.length} className="px-3 py-3 align-top"
                                                style={{ borderRight: "1px solid var(--border)", verticalAlign: "top" }}>
                                                <DynamicList
                                                    items={dimState.sw.length > 0 ? dimState.sw : [""]}
                                                    onChange={items => updateDim(dim._id, "sw", items)}
                                                    placeholder="Describe strength or weakness..."
                                                    accentColor="bg-green-400"
                                                    rows={3}
                                                />
                                            </td>
                                        )}

                                        {/* Opportunity Analysis — rowspan, dynamic list, per dimension */}
                                        {sIdx === 0 && (
                                            <td rowSpan={dimSubs.length} className="px-3 py-3 align-top"
                                                style={{ borderRight: "1px solid var(--border)", verticalAlign: "top" }}>
                                                <DynamicList
                                                    items={dimState.oa.length > 0 ? dimState.oa : [""]}
                                                    onChange={items => updateDim(dim._id, "oa", items)}
                                                    placeholder="Opportunity analysis..."
                                                    accentColor="bg-blue-400"
                                                    rows={3}
                                                />
                                            </td>
                                        )}

                                        {/* Expected Level — per subdimension */}
                                        <td className="px-3 py-3 text-center align-middle" style={{ borderRight: "1px solid var(--border)" }}>
                                            <select
                                                value={elVal}
                                                onChange={e => setSubAnalysis(prev => ({
                                                    ...prev,
                                                    [sub.subId]: { el: e.target.value },
                                                }))}
                                                className="w-16 text-center px-1 py-1.5 rounded-lg text-sm font-bold focus:outline-none transition-all"
                                                style={{ backgroundColor: "var(--bg-4)", border: "1px solid var(--border-2)", color: "var(--text-primary)" }}
                                            >
                                                <option value="">—</option>
                                                {[1, 2, 3, 4, 5].map(n => (
                                                    <option key={n} value={n}>{n}</option>
                                                ))}
                                            </select>
                                        </td>

                                        {/* Action Plan — compact card + open drawer */}
                                        {(() => {
                                            const grpIdx = apGroups.findIndex(g => (g.subdimensions ?? []).includes(sub.subId));
                                            const grp = grpIdx >= 0 ? apGroups[grpIdx] : null;

                                            if (!grp) {
                                                // No group — show "Add" button
                                                return (
                                                    <td className="px-3 py-3 align-middle" style={{ borderLeft: "1px solid var(--border)" }}>
                                                        <button
                                                            onClick={() => {
                                                                const newIdx = apGroups.length;
                                                                setApGroups(prev => [
                                                                    ...prev,
                                                                    { label: "", items: [""], subdimensions: [sub.subId], order: prev.length },
                                                                ]);
                                                                setApDrawerGrpIdx(newIdx);
                                                                setApDrawerOpen(true);
                                                            }}
                                                            className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-all border border-dashed hover:border-orange-400/40 hover:text-orange-400 group"
                                                            style={{ color: "var(--text-muted)", borderColor: "var(--border-2)" }}
                                                        >
                                                            <Plus className="w-3 h-3 group-hover:text-orange-400" />
                                                            Add Action Plan
                                                        </button>
                                                    </td>
                                                );
                                            }

                                            // Sub is in a group — only render on first sub (for rowspan)
                                            const grpSubsInOrder = subResults.filter(s => (grp.subdimensions ?? []).includes(s.subId));
                                            if (grpSubsInOrder[0]?.subId !== sub.subId) return null;

                                            const stepCount = (grp.items ?? []).filter(i => i.trim()).length;
                                            return (
                                                <td
                                                    rowSpan={grpSubsInOrder.length}
                                                    className="px-3 py-3 align-top"
                                                    style={{ borderLeft: "1px solid var(--border-2)", verticalAlign: "top" }}
                                                >
                                                    {/* Preview card */}
                                                    <div
                                                        className="rounded-xl p-3 cursor-pointer hover:border-orange-400/40 transition-all group"
                                                        style={{ backgroundColor: "rgba(251,146,60,0.06)", border: "1px solid rgba(251,146,60,0.2)" }}
                                                        onClick={() => { setApDrawerGrpIdx(grpIdx); setApDrawerOpen(true); }}
                                                    >
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">Action Plan</span>
                                                            <ChevronRight className="w-3 h-3 text-orange-400/60 group-hover:text-orange-400 transition-colors" />
                                                        </div>
                                                        <div className="flex flex-wrap gap-1.5 mb-2">
                                                            <span className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold" style={{ backgroundColor: "rgba(251,146,60,0.15)", color: "rgb(251,146,60)" }}>
                                                                {stepCount} step{stepCount !== 1 ? "s" : ""}
                                                            </span>
                                                            <span className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold" style={{ backgroundColor: "rgba(251,146,60,0.1)", color: "rgb(251,146,60)" }}>
                                                                {grpSubsInOrder.length} sub{grpSubsInOrder.length !== 1 ? "s" : ""} merged
                                                            </span>
                                                        </div>
                                                        {stepCount > 0 && (
                                                            <p className="text-[10px] t-muted leading-snug line-clamp-2">
                                                                {(grp.items ?? []).filter(i => i.trim())[0]}
                                                                {stepCount > 1 ? ` +${stepCount - 1} more...` : ""}
                                                            </p>
                                                        )}
                                                        <p className="text-[10px] text-orange-400/70 mt-2 font-medium">Click to edit →</p>
                                                    </div>
                                                </td>
                                            );
                                        })()}
                                    </tr>
                                );
                            });
                        })}
                    </tbody>
                </table>
            </div>

            {/* Action Plan Drawer */}
            <ActionPlanDrawer
                open={apDrawerOpen}
                grpIdx={apDrawerGrpIdx}
                apGroups={apGroups}
                subResults={subResults}
                dimensions={dimensions}
                onClose={() => setApDrawerOpen(false)}
                onChange={(idx, grp) => setApGroups(prev => prev.map((g, i) => i === idx ? grp : g))}
                onDelete={idx => setApGroups(prev => prev.filter((_, i) => i !== idx))}
            />

            </> /* end assessment tab */}

        </div>
    );
}
