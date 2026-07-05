"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
    ArrowLeft, Loader2, AlertCircle, Users, CheckCircle2,
    AlertTriangle, ChevronDown, Layers, BarChart3, Gavel,
    Info, Send, Clock, Table2, MessageSquare
} from "lucide-react";
import {
    RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell,
} from "recharts";
import api from "@/lib/api";
import {
    AssessmentSession, Dimension, SubDimension, AssessmentResponse,
    ResponseItem, Adjustment
} from "@/types";
import MonitoringTable, { monRowKey } from "@/components/MonitoringTable";
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

interface SubResult {
    subId: string;
    subName: string;
    dimId: string;
    levels: { _id: string; name: string; criteria: { _id: string; name: string }[] }[];
    evaluatorAnswers: { userId: string; userName: string; levelIndex: number; criteriaId?: string; criteriaName?: string }[];
    /** vote count per levelIndex */
    voteCounts: Record<number, number>;
    /** true when one level has strictly more votes than all others */
    hasMajority: boolean;
    /** true when two or more levels share the top vote count → needs adjustment */
    isTied: boolean;
    /** levelIndex that has the most votes (only meaningful when hasMajority=true) */
    majorityLevelIndex: number | null;
    adjustment?: Adjustment;
}

export default function SessionResultsPage() {
    const params = useParams();
    const sessionId = params?.id as string;
    const searchParams = useSearchParams();

    const [session, setSession] = useState<AssessmentSession | null>(null);
    const [dimensions, setDimensions] = useState<Dimension[]>([]);
    const [responses, setResponses] = useState<AssessmentResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [expandedDim, setExpandedDim] = useState<string | null>(null);
    const [adjusting, setAdjusting] = useState<string | null>(null);
    const [adjustLevel, setAdjustLevel] = useState<number>(0);
    const [saving, setSaving] = useState(false);
    const [view, setView] = useState<"detail" | "table">("table");
    const [selectedDimIdx, setSelectedDimIdx] = useState(0);
    // Deep-link: ?tab=monitoring opens monitoring tab directly
    const [activeTab, setActiveTab] = useState<"results" | "monitoring">(
        searchParams?.get("tab") === "monitoring" ? "monitoring" : "results"
    );

    const fetchResults = async () => {
        try {
            const res = await api.get(`/sessions/company/${sessionId}/results`);
            setSession(res.data.session);
            setDimensions(res.data.dimensions ?? []);
            setResponses(res.data.responses ?? []);
        } catch {
            setError("Session not found or access denied.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { if (sessionId) fetchResults(); }, [sessionId]);

    // Build results per subdimension — majority-vote logic
    const subResults = useMemo(() => {
        const results: SubResult[] = [];
        for (const dim of dimensions) {
            for (const sub of dim.subdimensions ?? []) {
                // criteria lookup: criteriaId → { name, levelIndex }
                const criteriaMap: Record<string, { name: string; levelIndex: number }> = {};
                (sub.levels ?? []).forEach((lvl, lIdx) => {
                    (lvl.criteria ?? []).forEach(c => {
                        criteriaMap[c._id] = { name: c.name, levelIndex: lIdx };
                    });
                });

                const evaluatorAnswers: SubResult["evaluatorAnswers"] = [];
                for (const resp of responses) {
                    const item = resp.responses.find(r => r.subdimension === sub._id);
                    if (item) {
                        const cId = item.selectedCriteria;
                        evaluatorAnswers.push({
                            userId:       resp.user._id,
                            userName:     resp.user.name,
                            levelIndex:   item.selectedLevelIndex,
                            criteriaId:   cId,
                            criteriaName: cId ? criteriaMap[cId]?.name : undefined,
                        });
                    }
                }

                // Count votes per levelIndex
                const voteCounts: Record<number, number> = {};
                for (const ea of evaluatorAnswers) {
                    voteCounts[ea.levelIndex] = (voteCounts[ea.levelIndex] ?? 0) + 1;
                }

                // Find the max vote count
                const maxVotes = evaluatorAnswers.length > 0
                    ? Math.max(...Object.values(voteCounts))
                    : 0;

                // Which levels share the max?
                const topLevels = Object.entries(voteCounts)
                    .filter(([, cnt]) => cnt === maxVotes)
                    .map(([idx]) => Number(idx));

                // hasMajority = exactly one level has the highest vote count
                const hasMajority = evaluatorAnswers.length > 0 && topLevels.length === 1;
                // isTied = two or more levels are tied at the top → needs adjustment
                const isTied = evaluatorAnswers.length > 0 && topLevels.length > 1;
                const majorityLevelIndex = hasMajority ? topLevels[0] : null;

                const adjustment = session?.adjustments?.find(
                    a => a.subdimension === sub._id && a.dimension === dim._id
                );

                results.push({
                    subId: sub._id,
                    subName: sub.name,
                    dimId: dim._id,
                    levels: (sub.levels ?? []).map(l => ({
                        _id:      l._id,
                        name:     l.name,
                        criteria: (l.criteria ?? []).map(c => ({ _id: c._id, name: c.name })),
                    })),
                    evaluatorAnswers,
                    voteCounts,
                    hasMajority,
                    isTied,
                    majorityLevelIndex,
                    adjustment,
                });
            }
        }
        return results;
    }, [dimensions, responses, session]);

    const totalSubs = subResults.length;
    const majorityCount  = subResults.filter(s => s.hasMajority).length;
    const tiedCount      = subResults.filter(s => s.isTied && !s.adjustment).length;
    const adjustedCount  = subResults.filter(s => s.adjustment).length;
    const noResponseCount = subResults.filter(s => s.evaluatorAnswers.length === 0).length;

    const handleAdjust = async (subId: string, dimId: string) => {
        setSaving(true);
        try {
            await api.post(`/sessions/company/${sessionId}/adjust`, {
                dimension: dimId,
                subdimension: subId,
                finalLevelIndex: adjustLevel,
            });
            toast.success("Adjustment saved");
            setAdjusting(null);
            await fetchResults();
        } catch {
            toast.error("Failed to save adjustment");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="page-container flex items-center justify-center py-32">
                <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
            </div>
        );
    }
    if (error || !session) {
        return (
            <div className="page-container">
                <div className="card py-24 flex flex-col items-center gap-4">
                    <div className="empty-icon-wrap"><AlertCircle className="w-8 h-8 text-red-400/40" /></div>
                    <p className="text-sm t-muted text-center">{error || "Session not found."}</p>
                    <Link href="/dashboard/manage-sessions" className="btn-secondary text-sm">
                        <ArrowLeft className="w-4 h-4" /> Back
                    </Link>
                </div>
            </div>
        );
    }

    const submittedCount = responses.length;
    const totalMembers = session.assignedTo?.length ?? 0;

    return (
        <div className="page-container max-w-5xl">
            {/* Back */}
            <Link href="/dashboard/manage-sessions"
                className="inline-flex items-center gap-2 text-sm t-secondary hover:t-primary transition-colors mb-6"
                style={{ color: "var(--text-secondary)" }}>
                <ArrowLeft className="w-4 h-4" /> Back to Sessions
            </Link>

            {/* Header */}
            <div className="card overflow-hidden mb-6">
                <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
                <div className="px-6 py-5">
                    <h1 className="text-2xl font-bold t-primary mb-1">{session.title}</h1>
                    {session.description && <p className="text-sm t-secondary mb-4">{session.description}</p>}
                    <div className="flex flex-wrap gap-4 text-xs t-muted">
                        <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {submittedCount}/{totalMembers} submitted</span>
                        <span className="flex items-center gap-1.5"><BarChart3 className="w-3.5 h-3.5" /> {totalSubs} sub-dimensions</span>
                    </div>
                </div>
            </div>

            {/* Stats strip — only on results tab */}
            {activeTab === "results" && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {[
                    { label: "Total",    value: totalSubs,    color: "t-primary" },
                    { label: "Majority", value: majorityCount, color: "text-green-400" },
                    { label: "Tied",     value: tiedCount,     color: "text-amber-400" },
                    { label: "Adjusted", value: adjustedCount, color: "text-purple-400" },
                ].map(s => (
                    <div key={s.label} className="card px-4 py-3 text-center">
                        <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                        <p className="text-xs t-muted">{s.label}</p>
                    </div>
                ))}
            </div>
            )}

            {/* ─── Tab Bar ──────────────────────────────────────────── */}
            <div className="flex gap-1 mb-6 p-1 rounded-xl" style={{ backgroundColor: "var(--bg-3)", width: "fit-content" }}>
                {(["results", "monitoring"] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className="px-4 py-2 rounded-lg text-xs font-bold transition-all capitalize"
                        style={activeTab === tab
                            ? { backgroundColor: "var(--bg)", color: "var(--text-primary)", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }
                            : { color: "var(--text-muted)" }
                        }
                    >
                        {tab === "results" ? "Assessment Results" : "Monitoring"}
                    </button>
                ))}
            </div>

            {/* ─── Monitoring Tab (read-only) ──────────────────────── */}
            {activeTab === "monitoring" && (() => {
                const apGroups = session.actionPlanGroups ?? [];
                const monRowMap: Record<string, { subdimension?: string; timeline: number[]; pic: string; checker: string; achievementStatus: "" | "Not Started" | "Ongoing" | "Completed" | "Delayed"; notes: string }> = {};
                for (const row of session.monitoringRows ?? []) {
                    const k = monRowKey(row.actionPlanGroupId ?? "", row.actionPlanItemIdx);
                    monRowMap[k] = {
                        subdimension: row.subdimension ?? "",
                        timeline: row.timeline ?? [],
                        pic: row.pic ?? "",
                        checker: row.checker ?? "",
                        achievementStatus: (row.achievementStatus ?? "") as "" | "Not Started" | "Ongoing" | "Completed" | "Delayed",
                        notes: row.notes ?? "",
                    };
                }
                const subAnalysis: Record<string, { el: string }> = {};
                for (const s of session.subdimensionAnalysis ?? []) {
                    subAnalysis[s.subdimension] = { el: s.expectedLevel != null ? String(s.expectedLevel) : "" };
                }
                const finalResults: Record<string, number | null> = {};
                for (const sub of subResults) {
                    const fi = sub.adjustment ? sub.adjustment.finalLevelIndex : sub.hasMajority ? sub.majorityLevelIndex : null;
                    finalResults[sub.subId] = fi !== null ? fi + 1 : null;
                }
                return (
                    <MonitoringTable
                        apGroups={apGroups}
                        subResults={subResults}
                        dimensions={dimensions}
                        monData={monRowMap}
                        subAnalysis={subAnalysis}
                        finalResults={finalResults}
                    />
                );
            })()}

            {/* ─── FINAL RESULT MEASUREMENT ──────────────────────────── */}
            {activeTab === "results" && subResults.length > 0 && (() => {

                // Radar data: one point per subdimension
                const radarData = subResults.map(sub => {
                    const finalLevelIdx = sub.adjustment
                        ? sub.adjustment.finalLevelIndex
                        : sub.hasMajority ? sub.majorityLevelIndex : null;
                    return {
                        subject: sub.subName,
                        value: finalLevelIdx !== null ? finalLevelIdx + 1 : 0,
                        fullMark: 5,
                    };
                });

                // Bar data: average final result per dimension
                const barData = dimensions.map((dim, dIdx) => {
                    const dimSubs = subResults.filter(s => s.dimId === dim._id);
                    const values = dimSubs.map(sub => {
                        const idx = sub.adjustment
                            ? sub.adjustment.finalLevelIndex
                            : sub.hasMajority ? sub.majorityLevelIndex : null;
                        return idx !== null ? idx + 1 : 0;
                    }).filter(v => v > 0);
                    const avg = values.length > 0
                        ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10
                        : 0;
                    return { name: dIdx + 1, dimName: dim.name, avg };
                });

                const BAR_COLORS = ["#a78bfa","#60a5fa","#34d399","#fbbf24","#f472b6","#2dd4bf"];

                return (
                    <div className="mb-8">
                        <h2 className="text-base font-bold t-primary mb-4 text-center">Final Result Measurement</h2>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            {/* Radar chart */}
                            <div className="lg:col-span-2 card p-5">
                                <p className="text-xs font-semibold t-secondary text-center mb-3">
                                    Maturity Model Measurement — All Sub-Dimensions
                                </p>
                                <ResponsiveContainer width="100%" height={360}>
                                    <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                                        <PolarGrid stroke="var(--border-2)" />
                                        <PolarAngleAxis
                                            dataKey="subject"
                                            tick={{ fill: "var(--text-muted)", fontSize: 10, fontFamily: "var(--font-manrope)" }}
                                        />
                                        <PolarRadiusAxis
                                            angle={90}
                                            domain={[0, 5]}
                                            tickCount={6}
                                            tick={{ fill: "var(--text-muted)", fontSize: 9 }}
                                        />
                                        <Radar
                                            name="Final Result"
                                            dataKey="value"
                                            stroke="#a78bfa"
                                            fill="#a78bfa"
                                            fillOpacity={0.18}
                                            strokeWidth={2}
                                        />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Bar chart — single dimension, dropdown selector */}
                            <div className="card p-4 flex flex-col gap-3">
                                {/* Dropdown */}
                                <select
                                    value={selectedDimIdx}
                                    onChange={e => setSelectedDimIdx(Number(e.target.value))}
                                    className="w-full px-3 py-2 rounded-lg text-xs font-semibold focus:outline-none transition-all"
                                    style={{
                                        backgroundColor: "var(--bg-4)",
                                        border: "1px solid var(--border-2)",
                                        color: "var(--text-primary)",
                                    }}
                                >
                                    {dimensions.map((dim, i) => (
                                        <option key={dim._id} value={i}>{dim.name}</option>
                                    ))}
                                </select>

                                {/* Chart for selected dimension */}
                                {(() => {
                                    const dim = dimensions[selectedDimIdx];
                                    if (!dim) return null;
                                    const dimSubs = subResults.filter(s => s.dimId === dim._id);
                                    const dimBarData = dimSubs.map(sub => {
                                        const idx = sub.adjustment
                                            ? sub.adjustment.finalLevelIndex
                                            : sub.hasMajority ? sub.majorityLevelIndex : null;
                                        return {
                                            name: sub.subName.length > 14 ? sub.subName.slice(0, 14) + "…" : sub.subName,
                                            fullName: sub.subName,
                                            value: idx !== null ? idx + 1 : 0,
                                        };
                                    });
                                    const color = BAR_COLORS[selectedDimIdx % BAR_COLORS.length];
                                    return (
                                        <>
                                            <p className="text-[11px] font-bold t-secondary text-center leading-tight">
                                                {dim.name} — Dimension Result
                                            </p>
                                            <ResponsiveContainer width="100%" height={260}>
                                                <BarChart data={dimBarData} margin={{ top: 4, right: 8, left: -16, bottom: 40 }}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                                    <XAxis
                                                        dataKey="name"
                                                        tick={{ fill: "var(--text-muted)", fontSize: 9 }}
                                                        angle={-35}
                                                        textAnchor="end"
                                                        interval={0}
                                                    />
                                                    <YAxis domain={[0, 5]} tickCount={6} tick={{ fill: "var(--text-muted)", fontSize: 9 }} />
                                                    <Tooltip
                                                        formatter={(val, _, props) => [val, props.payload?.fullName ?? ""]}
                                                        contentStyle={{ backgroundColor: "var(--bg-2)", border: "1px solid var(--border-2)", borderRadius: 8, fontSize: 11 }}
                                                        itemStyle={{ color }}
                                                        cursor={{ fill: "rgba(255,255,255,0.04)" }}
                                                    />
                                                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                                        {dimBarData.map((_, i) => (
                                                            <Cell key={i} fill={color} fillOpacity={0.85} />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                );
            })()}


            {/* ─── View toggle + Table/Detail — only on results tab ── */}
            {activeTab === "results" && (
            <div>

            <div className="flex items-center gap-2 mb-5">
                <button onClick={() => setView("table")} className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${view === "table" ? "border-purple-500/40 bg-purple-500/10 text-purple-400" : "border-[var(--border)] t-secondary hover:bg-[var(--bg-3)]"}`}>
                    <Table2 className="w-4 h-4" /> Results Table
                </button>
                <button onClick={() => setView("detail")} className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${view === "detail" ? "border-blue-500/40 bg-blue-500/10 text-blue-400" : "border-[var(--border)] t-secondary hover:bg-[var(--bg-3)]"}`}>
                    <BarChart3 className="w-4 h-4" /> Detail View
                </button>
            </div>

            {view === "table" && (
                <div className="card overflow-x-auto">
                    <table className="w-full text-sm border-collapse" style={{ minWidth: "1200px" }}>
                        <thead>
                            <tr style={{ backgroundColor: "var(--bg-3)", borderBottom: "2px solid var(--border-2)" }}>
                                <th className="px-4 py-3 text-left text-xs font-bold t-secondary uppercase tracking-wider w-32">Dimension</th>
                                <th className="px-4 py-3 text-left text-xs font-bold t-secondary uppercase tracking-wider w-36">Sub-Dimension</th>
                                <th className="px-4 py-3 text-left text-xs font-bold t-secondary uppercase tracking-wider">Assessment Note</th>
                                <th className="px-4 py-3 text-center text-xs font-bold t-secondary uppercase tracking-wider w-24">Final Result</th>
                                <th className="px-4 py-3 text-left text-xs font-bold t-secondary uppercase tracking-wider" style={{ minWidth: "180px" }}>Strength / Weakness</th>
                                <th className="px-4 py-3 text-left text-xs font-bold t-secondary uppercase tracking-wider" style={{ minWidth: "180px" }}>Opportunity Analysis</th>
                                <th className="px-4 py-3 text-center text-xs font-bold t-secondary uppercase tracking-wider w-28">Expected Level</th>
                                <th className="px-4 py-3 text-left text-xs font-bold t-secondary uppercase tracking-wider" style={{ minWidth: "200px" }}>Action Plan</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dimensions.map((dim, dIdx) => {
                                const dimSubs = subResults.filter(s => s.dimId === dim._id);
                                const colorClass = DIM_COLORS[dIdx % DIM_COLORS.length];
                                return dimSubs.map((sub, sIdx) => {
                                    const finalLevelIdx = sub.adjustment ? sub.adjustment.finalLevelIndex : sub.hasMajority ? sub.majorityLevelIndex : null;
                                    const finalBobot = finalLevelIdx !== null ? finalLevelIdx + 1 : null;
                                    const notes = responses.flatMap(resp => { const item = resp.responses.find(r => r.subdimension === sub.subId); return item?.note ? [{ note: item.note }] : []; });
                                    return (
                                        <tr key={sub.subId} style={{ borderBottom: "1px solid var(--border)", backgroundColor: sIdx % 2 === 0 ? "var(--bg)" : "var(--bg-2)" }}>
                                            {sIdx === 0 && (
                                                <td rowSpan={dimSubs.length} className="px-4 py-3 align-middle font-semibold text-sm" style={{ borderRight: "1px solid var(--border-2)", backgroundColor: "var(--bg-3)", verticalAlign: "middle" }}>
                                                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${colorClass}`}>{dim.name}</div>
                                                </td>
                                            )}
                                            <td className="px-4 py-3 align-top" style={{ borderRight: "1px solid var(--border)" }}><p className="text-sm font-medium t-primary leading-snug">{sub.subName}</p></td>
                                            <td className="px-4 py-3 align-top" style={{ borderRight: "1px solid var(--border)" }}>
                                                {notes.length > 0 ? <ul className="space-y-2">{notes.map(({ note }, i) => <li key={i} className="flex items-start gap-2"><span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 bg-purple-400" /><p className="text-xs t-secondary leading-relaxed">{note}</p></li>)}</ul> : <span className="text-xs t-muted italic">No notes</span>}
                                            </td>
                                            <td className="px-4 py-3 text-center align-middle" style={{ borderRight: "1px solid var(--border)" }}>
                                                {finalBobot !== null ? (
                                                    <div className="flex flex-col items-center gap-1">
                                                        <span className={`text-2xl font-black ${finalBobot >= 4 ? "text-green-400" : finalBobot === 3 ? "text-blue-400" : finalBobot === 2 ? "text-amber-400" : "text-red-400"}`}>{finalBobot}</span>
                                                        {sub.adjustment && <span className="text-[9px] font-semibold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded-full">Adjusted</span>}
                                                        {sub.isTied && !sub.adjustment && <span className="text-[9px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full">Tied</span>}
                                                    </div>
                                                ) : <span className="text-xs t-muted">—</span>}
                                            </td>
                                            {sIdx === 0 && (() => {
                                                const items = session.dimensionAnalysis?.find(d => d.dimension === dim._id)?.strengthWeaknessItems ?? [];
                                                return <td rowSpan={dimSubs.length} className="px-3 py-3 align-top" style={{ borderRight: "1px solid var(--border)", verticalAlign: "top" }}>{items.length > 0 ? <ul className="space-y-2">{items.map((item, i) => <li key={i} className="flex items-start gap-1.5"><span className="mt-1.5 w-1 h-1 rounded-full shrink-0 bg-green-400" /><p className="text-xs t-secondary leading-snug">{item}</p></li>)}</ul> : <span className="text-xs t-muted italic">—</span>}</td>;
                                            })()}
                                            {sIdx === 0 && (() => {
                                                const items = session.dimensionAnalysis?.find(d => d.dimension === dim._id)?.opportunityAnalysisItems ?? [];
                                                return <td rowSpan={dimSubs.length} className="px-3 py-3 align-top" style={{ borderRight: "1px solid var(--border)", verticalAlign: "top" }}>{items.length > 0 ? <ul className="space-y-2">{items.map((item, i) => <li key={i} className="flex items-start gap-1.5"><span className="mt-1.5 w-1 h-1 rounded-full shrink-0 bg-blue-400" /><p className="text-xs t-secondary leading-snug">{item}</p></li>)}</ul> : <span className="text-xs t-muted italic">—</span>}</td>;
                                            })()}
                                            {(() => {
                                                const el = session.subdimensionAnalysis?.find(s => s.subdimension === sub.subId)?.expectedLevel ?? null;
                                                return <td className="px-3 py-3 text-center align-middle" style={{ borderRight: "1px solid var(--border)" }}>{el !== null ? <span className={`text-2xl font-black ${el >= 4 ? "text-green-400" : el === 3 ? "text-blue-400" : el === 2 ? "text-amber-400" : "text-red-400"}`}>{el}</span> : <span className="text-xs t-muted">—</span>}</td>;
                                            })()}
                                            {(() => {
                                                const apGroups = session.actionPlanGroups ?? [];
                                                const grp = apGroups.find(g => g.subdimensions.includes(sub.subId));
                                                if (!grp) return <td className="px-3 py-2 text-center align-middle"><span className="text-xs t-muted italic">—</span></td>;
                                                const grpSubs = subResults.filter(s => grp.subdimensions.includes(s.subId));
                                                if (grpSubs[0]?.subId !== sub.subId) return null;
                                                return (
                                                    <td rowSpan={grpSubs.length} className="px-3 py-3 align-top" style={{ borderLeft: "1px solid var(--border-2)", verticalAlign: "top", backgroundColor: "var(--bg-3)" }}>
                                                        {grp.label && <p className="text-[10px] font-bold text-orange-400 mb-2">{grp.label}</p>}
                                                        {(grp.items ?? []).filter(i => i.trim()).length > 0
                                                            ? <ol className="space-y-1.5 list-none">{(grp.items ?? []).filter(i => i.trim()).map((item, iIdx) => <li key={iIdx} className="flex items-start gap-1.5"><span className="shrink-0 text-[10px] font-black text-orange-400 mt-0.5 w-4">{iIdx + 1}.</span><p className="text-xs t-secondary leading-snug">{item}</p></li>)}</ol>
                                                            : <span className="text-xs t-muted italic">—</span>}
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
            )}

            {view === "detail" && (
            <div className="space-y-3">
                {dimensions.map((dim, dIdx) => {
                    const isExpanded = expandedDim === dim._id;
                    const dimSubs = subResults.filter(s => s.dimId === dim._id);
                    const colorClass = DIM_COLORS[dIdx % DIM_COLORS.length];
                    return (
                        <div key={dim._id} className="card overflow-hidden">
                            <button onClick={() => setExpandedDim(isExpanded ? null : dim._id)} className="w-full px-5 py-4 flex items-center gap-4 text-left transition-colors" style={{ backgroundColor: isExpanded ? "var(--bg-3)" : undefined }}>
                                <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 text-xs font-bold ${colorClass}`}>{dIdx + 1}</div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold t-primary">{dim.name}</p>
                                    <p className="text-xs t-muted mt-0.5">{dimSubs.filter(s => s.hasMajority).length} majority · {dimSubs.filter(s => s.isTied).length} tied · {dimSubs.length} total</p>
                                </div>
                                <ChevronDown className={`w-4 h-4 t-muted transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                            </button>
                            {isExpanded && (
                                <div className="divide-y" style={{ borderTop: "1px solid var(--border-2)" }}>
                                    {dimSubs.map(sub => {
                                        const hasResponses = sub.evaluatorAnswers.length > 0;
                                        const finalLevelIdx = sub.adjustment ? sub.adjustment.finalLevelIndex : sub.hasMajority ? sub.majorityLevelIndex : null;
                                        const finalLevelName = finalLevelIdx !== null && sub.levels[finalLevelIdx] ? sub.levels[finalLevelIdx].name : null;
                                        const finalBobot = finalLevelIdx !== null ? finalLevelIdx + 1 : null;
                                        const isAdjusting = adjusting === sub.subId;
                                        return (
                                            <div key={sub.subId} className="px-5 py-4">
                                                <div className="flex items-start justify-between gap-3 mb-3">
                                                    <p className="text-sm font-semibold t-primary">{sub.subName}</p>
                                                    {!hasResponses ? <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-gray-500/10 border border-gray-500/20 text-gray-400"><Clock className="w-3 h-3" /> No responses</span>
                                                    : sub.adjustment ? <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-purple-500/10 border border-purple-500/20 text-purple-400"><Gavel className="w-3 h-3" /> Adjusted</span>
                                                    : sub.hasMajority ? <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-500/10 border border-green-500/20 text-green-400"><CheckCircle2 className="w-3 h-3" /> Majority</span>
                                                    : <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-amber-500/10 border border-amber-500/20 text-amber-400"><AlertTriangle className="w-3 h-3" /> Tied</span>}
                                                </div>
                                                {hasResponses && (
                                                    <div className="space-y-1.5 mb-3">
                                                        {sub.evaluatorAnswers.map(ea => {
                                                            const isMaj = sub.hasMajority && ea.levelIndex === sub.majorityLevelIndex;
                                                            return (
                                                                <div key={ea.userId} className="flex items-start gap-3 text-xs py-1.5 px-3 rounded-lg" style={{ backgroundColor: "var(--bg-3)" }}>
                                                                    <span className="t-secondary w-24 truncate shrink-0 pt-0.5">{ea.userName}</span>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className={`font-semibold leading-snug ${isMaj ? "text-green-400" : sub.isTied ? "text-amber-400" : "text-green-400"}`}>{ea.criteriaName ?? sub.levels[ea.levelIndex]?.name ?? `Level ${ea.levelIndex + 1}`}</p>
                                                                        <p className="t-muted text-[10px] mt-0.5">{sub.levels[ea.levelIndex]?.name ?? ""}</p>
                                                                    </div>
                                                                    <span className={`text-[10px] font-bold shrink-0 px-1.5 py-0.5 rounded-md mt-0.5 ${isMaj ? "bg-green-500/15 text-green-400" : "bg-amber-500/10 text-amber-400"}`}>{sub.voteCounts[ea.levelIndex] ?? 1}×</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                                {finalLevelIdx !== null && finalLevelName && (
                                                    <div className="flex items-start gap-2 text-xs px-3 py-2.5 rounded-md bg-green-500/5 border border-green-500/15">
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0 mt-0.5" />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="t-primary font-semibold leading-snug">{finalLevelName}</p>
                                                            <p className="t-muted text-[10px] mt-0.5">Bobot: <span className="font-bold text-green-400">{finalBobot}</span>
                                                                {sub.hasMajority && sub.majorityLevelIndex !== null && <span className="ml-2">· {sub.voteCounts[sub.majorityLevelIndex]}/{sub.evaluatorAnswers.length} evaluators</span>}
                                                                {sub.adjustment?.adjustedBy && <span className="ml-2">· Adjusted by {sub.adjustment.adjustedBy.name}</span>}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                                {sub.isTied && hasResponses && !isAdjusting && (
                                                    <button onClick={() => { setAdjusting(sub.subId); setAdjustLevel(sub.adjustment?.finalLevelIndex ?? 0); }} className="mt-3 btn-secondary text-xs">
                                                        <Gavel className="w-3.5 h-3.5" /> {sub.adjustment ? "Re-adjust" : "Adjust Level"}
                                                    </button>
                                                )}
                                                {isAdjusting && (
                                                    <div className="mt-3 p-4 rounded-lg border" style={{ borderColor: "var(--border-2)", backgroundColor: "var(--bg-3)" }}>
                                                        <p className="text-xs font-semibold t-primary mb-2">Select final maturity level:</p>
                                                        <div className="space-y-1.5 mb-3">
                                                            {sub.levels.map((lvl, lIdx) => (
                                                                <button key={lvl._id} onClick={() => setAdjustLevel(lIdx)} className={`w-full text-left px-3 py-2.5 rounded-md border text-xs transition-all ${adjustLevel === lIdx ? "border-purple-500/50 bg-purple-500/10 text-purple-400 font-semibold" : "border-[var(--border)] t-secondary hover:bg-[var(--bg-4)]"}`}>
                                                                    <p className="font-semibold">Level {lIdx + 1}: {lvl.name}</p>
                                                                    {lvl.criteria.length > 0 && <ul className="mt-1 space-y-0.5 pl-2">{lvl.criteria.map(c => <li key={c._id} className="t-muted text-[10px] leading-snug list-disc list-inside">{c.name}</li>)}</ul>}
                                                                </button>
                                                            ))}
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button onClick={() => setAdjusting(null)} className="btn-secondary text-xs flex-1">Cancel</button>
                                                            <button onClick={() => handleAdjust(sub.subId, sub.dimId)} disabled={saving} className="btn-primary text-xs flex-1">
                                                                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} Confirm
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            )}

            </div>
            )} {/* end results tab */}

        </div>
    );
}
