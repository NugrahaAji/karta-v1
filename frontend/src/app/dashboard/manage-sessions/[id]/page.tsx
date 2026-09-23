"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
    ArrowLeft, Loader2, AlertCircle, Users, CheckCircle2,
    AlertTriangle, ChevronDown, Layers, BarChart3, Gavel,
    Info, Send, Clock, Table2, MessageSquare, Brain, X
} from "lucide-react";
import {
    RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell,
} from "recharts";
import api from "@/lib/api";
import {
    AssessmentSession, Dimension, SubDimension, AssessmentResponse,
    ResponseItem, FinalScore, MonitoringRow
} from "@/types";
import MonitoringTable, { monRowKey, buildMonRows } from "@/components/MonitoringTable";
import AiReasoningPanel, { AssessmentPayloadItem } from "@/components/AiReasoningPanel";
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

type MonRowData = Omit<MonitoringRow, "_id" | "actionPlanGroupId" | "actionPlanItemIdx">;

interface SavedAiResult {
    dimension_id?: string;
    dimension_name?: string;
    dimension?: string;
    sub_dimension_id?: string;
    sub_dimension_name?: string;
    sub_dimension?: string;
    strength_weakness?: string;
    opportunity_analysis?: string[];
    action_plan?: string[];
}

interface SubResult {
    subId: string;
    subName: string;
    dimId: string;
    levels: { _id: string; name: string; detail: string; criteria: { _id: string; name: string; detail: string }[] }[];
    evaluatorAnswers: { userId: string; userName: string; levelIndex: number; criteriaId?: string; criteriaName?: string }[];
    /** vote count per levelIndex */
    voteCounts: Record<number, number>;
    /** true when one level has strictly more votes than all others */
    hasMajority: boolean;
    /** true when two or more levels share the top vote count → needs adjustment */
    isTied: boolean;
    /** levelIndex that has the most votes (only meaningful when hasMajority=true) */
    majorityLevelIndex: number | null;
    finalScore?: FinalScore;
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
    const [showAiPanel, setShowAiPanel] = useState(false);
    const [monRowData, setMonRowData] = useState<Record<string, MonRowData>>({});
    const [savingMonitoring, setSavingMonitoring] = useState(false);
    const [savingExpectedSubId, setSavingExpectedSubId] = useState<string | null>(null);
    const [expectedDetailSubId, setExpectedDetailSubId] = useState<string | null>(null);
    // Deep-link: ?tab=monitoring opens monitoring tab directly
    const [activeTab, setActiveTab] = useState<"results" | "monitoring">(
        searchParams?.get("tab") === "monitoring" ? "monitoring" : "results"
    );

    const fetchResults = async () => {
        try {
            const res = await api.get(`/sessions/company/${sessionId}/results`);
            const sess = res.data.session as AssessmentSession;
            setSession(sess);
            setDimensions(res.data.dimensions ?? []);
            setResponses(res.data.responses ?? []);

            const monitoring: Record<string, MonRowData> = {};
            for (const row of sess.monitoringRows ?? []) {
                const groupKey = row.actionPlanGroupId ?? (row.subdimension ? `__no_ap_${row.subdimension}` : "");
                monitoring[monRowKey(groupKey, row.actionPlanItemIdx)] = {
                    subdimension: row.subdimension ?? "",
                    timeline: row.timeline ?? [],
                    timelineStatuses: row.timelineStatuses ?? [],
                    pic: row.pic ?? "",
                    checker: row.checker ?? "",
                    achievementStatus: row.achievementStatus ?? "",
                    notes: row.notes ?? "",
                };
            }
            setMonRowData(monitoring);
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

                const finalScore = session?.finalScores?.find(
                    f => f.subdimension === sub._id && f.dimension === dim._id
                );

                results.push({
                    subId: sub._id,
                    subName: sub.name,
                    dimId: dim._id,
                    levels: (sub.levels ?? []).map(l => ({
                        _id:      l._id,
                        name:     l.name,
                        detail:   l.detail ?? "",
                        criteria: (l.criteria ?? []).map(c => ({ _id: c._id, name: c.name, detail: c.detail ?? "" })),
                    })),
                    evaluatorAnswers,
                    voteCounts,
                    hasMajority,
                    isTied,
                    majorityLevelIndex,
                    finalScore,
                });
            }
        }
        return results;
    }, [dimensions, responses, session]);

    const totalSubs = subResults.length;
    const majorityCount  = subResults.filter(s => s.hasMajority).length;
    const tiedCount      = subResults.filter(s => s.isTied && !s.finalScore).length;
    const adjustedCount  = subResults.filter(s => s.finalScore?.source === "adjusted").length;
    const noResponseCount = subResults.filter(s => s.evaluatorAnswers.length === 0).length;

    const savedAiResults = useMemo<SavedAiResult[]>(
        () => Array.isArray(session?.aiAnalysis) ? session.aiAnalysis as SavedAiResult[] : [],
        [session?.aiAnalysis]
    );

    const getSavedAiResult = (sub: SubResult, dimensionName: string) => {
        const matched = savedAiResults.find(item =>
            item.sub_dimension_id === sub.subId ||
            ((item.sub_dimension_name === sub.subName || item.sub_dimension === sub.subName) &&
             (!item.dimension_id || item.dimension_id === sub.dimId) &&
             (!item.dimension_name || item.dimension_name === dimensionName) &&
             (!item.dimension || item.dimension === dimensionName))
        );
        if (matched) return matched;

        const analyzedSubs = subResults.filter(item =>
            item.evaluatorAnswers.length > 0 || item.finalScore !== undefined
        );
        const legacyResult = savedAiResults[analyzedSubs.findIndex(item => item.subId === sub.subId)];
        const hasIdentity = legacyResult && (
            legacyResult.sub_dimension_id || legacyResult.sub_dimension_name || legacyResult.sub_dimension
        );
        return hasIdentity ? undefined : legacyResult;
    };

    // ─── Build AI Reasoning payload ───────────────────────────────────────────
    const aiAssessments = useMemo<AssessmentPayloadItem[]>(() => {
        return subResults
            .filter(sub => sub.evaluatorAnswers.length > 0 || sub.finalScore !== undefined)
            .map(sub => {
                const dim = dimensions.find(d => d._id === sub.dimId);
                const finalIdx = sub.finalScore !== undefined
                    ? sub.finalScore.finalLevelIndex
                    : sub.hasMajority ? sub.majorityLevelIndex : null;
                const finalResult = finalIdx !== null ? finalIdx + 1 : 0;
                const expectedLevel =
                    session?.subdimensionAnalysis?.find(s => s.subdimension === sub.subId)?.expectedLevel
                    ?? 3;
                const notes = responses
                    .flatMap(resp => {
                        const item = resp.responses.find(r => r.subdimension === sub.subId);
                        return item?.note ? [item.note] : [];
                    })
                    .join(" | ");
                return {
                    dimension:        dim?.name ?? "Unknown",
                    dimension_id:     sub.dimId,
                    sub_dimension:    sub.subName,
                    sub_dimension_id: sub.subId,
                    final_result:     finalResult,
                    expected_level:   expectedLevel,
                    assessment_note:  notes || undefined,
                };
            });
    }, [subResults, dimensions, session, responses]);

    const handleExpectedLevelChange = async (sub: SubResult, expectedLevel: number) => {
        setSavingExpectedSubId(sub.subId);
        try {
            await api.patch(`/sessions/company/${sessionId}/expected-level`, {
                dimension: sub.dimId,
                subdimension: sub.subId,
                expectedLevel,
            });
            setSession(previous => previous ? {
                ...previous,
                subdimensionAnalysis: [
                    ...(previous.subdimensionAnalysis ?? []).filter(item => item.subdimension !== sub.subId),
                    { dimension: sub.dimId, subdimension: sub.subId, expectedLevel },
                ],
            } : previous);
            toast.success("Expected level updated");
        } catch {
            toast.error("Failed to update expected level");
        } finally {
            setSavingExpectedSubId(null);
        }
    };

    const handleSaveMonitoring = async () => {
        setSavingMonitoring(true);
        try {
            const rows = buildMonRows(session?.actionPlanGroups ?? [], subResults, dimensions);
            const monitoringRows = rows.flatMap(row => {
                const groupKey = row.grp._id ?? String(row.grpIdx);
                const data = monRowData[monRowKey(groupKey, row.itemIdx)];
                if (!data) return [];

                const hasData = (data.timelineStatuses?.length ?? 0) > 0 || data.timeline.length > 0 || data.pic.trim() || data.checker.trim() ||
                    data.achievementStatus || data.notes.trim();
                if (!hasData) return [];

                return [{
                    actionPlanGroupId: row.grpIdx >= 0 && !row.grp._id?.startsWith("__") ? row.grp._id ?? null : null,
                    actionPlanItemIdx: row.itemIdx,
                    subdimension: data.subdimension || row.sub?.subId || null,
                    timeline: data.timeline,
                    timelineStatuses: data.timelineStatuses ?? [],
                    pic: data.pic,
                    checker: data.checker,
                    achievementStatus: data.achievementStatus,
                    notes: data.notes,
                }];
            });

            await api.patch(`/sessions/company/${sessionId}/monitoring-rows`, { monitoringRows });
            toast.success("Monitoring saved");
            await fetchResults();
        } catch {
            toast.error("Failed to save monitoring");
        } finally {
            setSavingMonitoring(false);
        }
    };

    const handleDeleteMonitoring = (key: string) => {
        setMonRowData(previous => {
            const next = { ...previous };
            delete next[key];
            return next;
        });
    };

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
        <>
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

            {/* ─── Tab Bar + AI Button ───────────────────────────────── */}
            <div className="flex items-center justify-between gap-3 mb-6">
                <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: "var(--bg-3)", width: "fit-content" }}>
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

                {/* AI Reasoning Button */}
                {activeTab === "results" && aiAssessments.length > 0 && (
                    <button
                        onClick={() => setShowAiPanel(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all border"
                        style={{
                            background: showAiPanel
                                ? "linear-gradient(135deg, rgba(139,92,246,0.25), rgba(168,85,247,0.15))"
                                : "linear-gradient(135deg, rgba(139,92,246,0.12), rgba(168,85,247,0.06))",
                            borderColor: "rgba(139,92,246,0.35)",
                            color: "#c084fc",
                        }}
                    >
                        <Brain className="w-4 h-4" />
                        AI Reasoning
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-black" style={{ backgroundColor: "rgba(139,92,246,0.2)", color: "#a78bfa" }}>
                            {aiAssessments.length}
                        </span>
                    </button>
                )}
            </div>

            {/* ─── Monitoring Tab ─────────────────────────────────── */}
            {activeTab === "monitoring" && (() => {
                const manualGroups = session.actionPlanGroups ?? [];
                const coveredSubdimensions = new Set(manualGroups.flatMap(group => group.subdimensions));
                const aiGroups = subResults.flatMap((sub, index) => {
                    if (coveredSubdimensions.has(sub.subId)) return [];
                    const actionPlan = getSavedAiResult(
                        sub,
                        dimensions.find(dimension => dimension._id === sub.dimId)?.name ?? ""
                    )?.action_plan?.filter(item => item.trim()) ?? [];
                    if (actionPlan.length === 0) return [];
                    return [{
                        _id: `__no_ap_${sub.subId}`,
                        label: "AI Action Plan",
                        items: actionPlan,
                        subdimensions: [sub.subId],
                        order: manualGroups.length + index,
                    }];
                });
                const apGroups = [...manualGroups, ...aiGroups];
                const subAnalysis: Record<string, { el: string }> = {};
                for (const s of session.subdimensionAnalysis ?? []) {
                    subAnalysis[s.subdimension] = { el: s.expectedLevel != null ? String(s.expectedLevel) : "" };
                }
                const finalResults: Record<string, number | null> = {};
                for (const sub of subResults) {
                    const fi = sub.finalScore?.finalLevelIndex ?? (sub.hasMajority ? sub.majorityLevelIndex : null);
                    finalResults[sub.subId] = fi !== null ? fi + 1 : null;
                }
                return (
                    <MonitoringTable
                        apGroups={apGroups}
                        subResults={subResults}
                        dimensions={dimensions}
                        monData={monRowData}
                        onChangeRow={(key, data) => setMonRowData(previous => ({
                            ...previous,
                            [key]: {
                                subdimension: "", timeline: [], timelineStatuses: [], pic: "", checker: "", achievementStatus: "", notes: "",
                                ...previous[key],
                                ...data,
                            },
                        }))}
                        onDeleteRow={handleDeleteMonitoring}
                        subAnalysis={subAnalysis}
                        finalResults={finalResults}
                        saving={savingMonitoring}
                        onSave={handleSaveMonitoring}
                    />
                );
            })()}

            {/* ─── FINAL RESULT MEASUREMENT ──────────────────────────── */}
            {activeTab === "results" && subResults.length > 0 && (() => {

                // Radar data: only subdimensions that have 5 levels
                const radarSubs = subResults.filter(sub => (sub.levels?.length ?? 0) === 5);
                const radarData = radarSubs.map(sub => {
                    const finalLevelIdx = sub.finalScore?.finalLevelIndex ?? (sub.hasMajority ? sub.majorityLevelIndex : null);
                    return {
                        subject: sub.subName,
                        value: finalLevelIdx !== null ? finalLevelIdx + 1 : 0,
                        fullMark: 5,
                    };
                });

                const TECH_COLORS = ["#38bdf8", "#06b6d4", "#2dd4bf", "#60a5fa", "#818cf8"];
                const techSubs = subResults.filter(s => {
                    const dim = dimensions.find(d => d._id === s.dimId);
                    return dim?.name.toLowerCase().includes("tech") || (s.levels?.length ?? 0) === 4;
                });
                const techBarData = techSubs.map(sub => {
                    const idx = sub.finalScore?.finalLevelIndex ?? (sub.hasMajority ? sub.majorityLevelIndex : null);
                    const levelObj = idx !== null && sub.levels?.[idx] ? sub.levels[idx] : null;
                    return {
                        name: sub.subName.length > 16 ? sub.subName.slice(0, 16) + "…" : sub.subName,
                        fullName: sub.subName,
                        value: idx !== null ? idx + 1 : 0,
                        levelName: levelObj?.name ?? "",
                    };
                });

                return (
                    <div className="mb-8">
                        <h2 className="text-base font-bold t-primary mb-4 text-center">Final Result Measurement</h2>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            {/* Radar chart — 5 levels only */}
                            <div className="lg:col-span-2 card p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wider text-purple-400">
                                            Spider Chart — 5-Level Sub-Dimensions ({radarSubs.length})
                                        </p>
                                        <p className="text-[11px] t-muted">
                                            Maturity measurement across all 5-level maturity dimensions
                                        </p>
                                    </div>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/25 text-purple-300">
                                        5-Level Scale
                                    </span>
                                </div>
                                {radarData.length > 0 ? (
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
                                ) : (
                                    <div className="flex h-[360px] items-center justify-center text-xs t-muted">
                                        No 5-level sub-dimensions found
                                    </div>
                                )}
                            </div>

                            {/* Bar chart — Technology Sub-Dimensions (4-Level Scale) */}
                            <div className="card p-5 flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                                            Technology Sub-Dimensions ({techSubs.length})
                                        </p>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-300">
                                            4-Level Scale
                                        </span>
                                    </div>
                                    <p className="text-[11px] t-muted mb-3">
                                        Maturity measurement for Technology dimension (Level 1 - 4)
                                    </p>
                                </div>

                                {techBarData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={290}>
                                        <BarChart data={techBarData} margin={{ top: 10, right: 12, left: -16, bottom: 40 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                            <XAxis
                                                dataKey="name"
                                                tick={{ fill: "var(--text-muted)", fontSize: 9 }}
                                                angle={-25}
                                                textAnchor="end"
                                                interval={0}
                                            />
                                            <YAxis domain={[0, 4]} tickCount={5} tick={{ fill: "var(--text-muted)", fontSize: 9 }} />
                                            <Tooltip
                                                formatter={(val, _, props) => [
                                                    `Level ${val}${props.payload?.levelName ? ` — ${props.payload.levelName}` : ""}`,
                                                    props.payload?.fullName ?? "Technology Sub-Dimension"
                                                ]}
                                                contentStyle={{ backgroundColor: "var(--bg-2)", border: "1px solid var(--border-2)", borderRadius: 8, fontSize: 11 }}
                                                itemStyle={{ color: "#38bdf8" }}
                                                cursor={{ fill: "rgba(255,255,255,0.04)" }}
                                            />
                                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                                {techBarData.map((_, i) => (
                                                    <Cell key={i} fill={TECH_COLORS[i % TECH_COLORS.length]} fillOpacity={0.85} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex h-[290px] items-center justify-center text-xs t-muted text-center p-4">
                                        No Technology sub-dimensions found in this session
                                    </div>
                                )}
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
                                const dimensionAiResults = dimSubs.map(sub => ({
                                    sub,
                                    result: getSavedAiResult(sub, dim.name),
                                }));
                                return dimSubs.map((sub, sIdx) => {
                                    const aiResult = getSavedAiResult(sub, dim.name);
                                    const finalLevelIdx = sub.finalScore?.finalLevelIndex ?? (sub.hasMajority ? sub.majorityLevelIndex : null);
                                    const finalBobot = finalLevelIdx !== null ? finalLevelIdx + 1 : null;
                                    const isAdjusted = sub.finalScore?.source === "adjusted";
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
                                                        {isAdjusted && <span className="text-[9px] font-semibold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded-full">Adjusted</span>}
                                                        {sub.finalScore?.source === "majority" && <span className="text-[9px] font-semibold text-green-400 bg-green-500/10 border border-green-500/20 px-1.5 py-0.5 rounded-full">Majority</span>}
                                                        {sub.isTied && !sub.finalScore && <span className="text-[9px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full">Tied</span>}
                                                    </div>
                                                ) : <span className="text-xs t-muted">—</span>}
                                            </td>
                                            {sIdx === 0 && (() => {
                                                const manualItems = session.dimensionAnalysis?.find(d => d.dimension === dim._id)?.strengthWeaknessItems ?? [];
                                                const aiItems = dimensionAiResults.filter(entry => entry.result?.strength_weakness);
                                                return <td rowSpan={dimSubs.length} className="px-3 py-3 align-top" style={{ borderRight: "1px solid var(--border)", verticalAlign: "top" }}>{aiItems.length > 0 ? <ul className="space-y-3">{aiItems.map(({ sub: aiSub, result }) => <li key={aiSub.subId}><p className="text-[10px] font-bold text-purple-400 mb-1">{aiSub.subName}</p><p className="text-xs t-secondary leading-snug">{result?.strength_weakness}</p></li>)}</ul> : manualItems.length > 0 ? <ul className="space-y-2">{manualItems.map((item, i) => <li key={i} className="flex items-start gap-1.5"><span className="mt-1.5 w-1 h-1 rounded-full shrink-0 bg-green-400" /><p className="text-xs t-secondary leading-snug">{item}</p></li>)}</ul> : <span className="text-xs t-muted italic">—</span>}</td>;
                                            })()}
                                            {sIdx === 0 && (() => {
                                                const manualItems = session.dimensionAnalysis?.find(d => d.dimension === dim._id)?.opportunityAnalysisItems ?? [];
                                                const aiItems = dimensionAiResults.flatMap(({ sub: aiSub, result }) => (result?.opportunity_analysis ?? []).map(item => ({ sub: aiSub, item })));
                                                return <td rowSpan={dimSubs.length} className="px-3 py-3 align-top" style={{ borderRight: "1px solid var(--border)", verticalAlign: "top" }}>{aiItems.length > 0 ? <ul className="space-y-2">{aiItems.map(({ sub: aiSub, item }, i) => <li key={`${aiSub.subId}-${i}`} className="flex items-start gap-1.5"><span className="mt-1.5 w-1 h-1 rounded-full shrink-0 bg-blue-400" /><p className="text-xs t-secondary leading-snug"><span className="font-semibold text-purple-400">{aiSub.subName}: </span>{item}</p></li>)}</ul> : manualItems.length > 0 ? <ul className="space-y-2">{manualItems.map((item, i) => <li key={i} className="flex items-start gap-1.5"><span className="mt-1.5 w-1 h-1 rounded-full shrink-0 bg-blue-400" /><p className="text-xs t-secondary leading-snug">{item}</p></li>)}</ul> : <span className="text-xs t-muted italic">—</span>}</td>;
                                            })()}
                                            {(() => {
                                                const el = session.subdimensionAnalysis?.find(s => s.subdimension === sub.subId)?.expectedLevel ?? 3;
                                                return (
                                                    <td className="px-3 py-3 text-center align-middle" style={{ borderRight: "1px solid var(--border)" }}>
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            <select
                                                                value={el}
                                                                disabled={savingExpectedSubId === sub.subId}
                                                                onChange={event => handleExpectedLevelChange(sub, Number(event.target.value))}
                                                                className={`rounded-lg px-2 py-1 text-sm font-black focus:outline-none ${el >= 4 ? "text-green-400" : el === 3 ? "text-blue-400" : el === 2 ? "text-amber-400" : "text-red-400"}`}
                                                                style={{ backgroundColor: "var(--bg-4)", border: "1px solid var(--border)" }}
                                                            >
                                                                {sub.levels.map((level, levelIndex) => (
                                                                    <option key={level._id} value={levelIndex + 1}>Level {levelIndex + 1}</option>
                                                                ))}
                                                            </select>
                                                            <button
                                                                type="button"
                                                                onClick={() => setExpectedDetailSubId(sub.subId)}
                                                                className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-purple-400 hover:bg-purple-500/10"
                                                                title="View expected level details"
                                                            >
                                                                {savingExpectedSubId === sub.subId ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Info className="h-3.5 w-3.5" />}
                                                            </button>
                                                        </div>
                                                    </td>
                                                );
                                            })()}
                                            {(() => {
                                                const apGroups = session.actionPlanGroups ?? [];
                                                const grp = apGroups.find(g => g.subdimensions.includes(sub.subId));
                                                if (!grp) {
                                                    const aiItems = (aiResult?.action_plan ?? []).filter(item => item.trim());
                                                    return <td className="px-3 py-3 align-top">{aiItems.length > 0 ? <ol className="space-y-1.5 list-none">{aiItems.map((item, i) => <li key={i} className="flex items-start gap-1.5"><span className="shrink-0 text-[10px] font-black text-orange-400 mt-0.5 w-4">{i + 1}.</span><p className="text-xs t-secondary leading-snug">{item}</p></li>)}</ol> : <span className="text-xs t-muted italic">—</span>}</td>;
                                                }
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
                                        const finalLevelIdx = sub.finalScore?.finalLevelIndex ?? (sub.hasMajority ? sub.majorityLevelIndex : null);
                                        const finalLevelName = finalLevelIdx !== null && sub.levels[finalLevelIdx] ? sub.levels[finalLevelIdx].name : null;
                                        const finalBobot = finalLevelIdx !== null ? finalLevelIdx + 1 : null;
                                        const isAdjusting = adjusting === sub.subId;
                                        return (
                                            <div key={sub.subId} className="px-5 py-4">
                                                <div className="flex items-start justify-between gap-3 mb-3">
                                                    <p className="text-sm font-semibold t-primary">{sub.subName}</p>
                                                    {!hasResponses ? <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-gray-500/10 border border-gray-500/20 text-gray-400"><Clock className="w-3 h-3" /> No responses</span>
                                                    : sub.finalScore?.source === "adjusted" ? <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-purple-500/10 border border-purple-500/20 text-purple-400"><Gavel className="w-3 h-3" /> Adjusted</span>
                                                    : sub.finalScore?.source === "majority" ? <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-500/10 border border-green-500/20 text-green-400"><CheckCircle2 className="w-3 h-3" /> Majority</span>
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
                                                                {sub.finalScore?.adjustedBy && <span className="ml-2">· Adjusted by {sub.finalScore.adjustedBy.name}</span>}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                                {sub.isTied && hasResponses && !isAdjusting && (
                                                    <button onClick={() => { setAdjusting(sub.subId); setAdjustLevel(sub.finalScore?.finalLevelIndex ?? 0); }} className="mt-3 btn-secondary text-xs">
                                                        <Gavel className="w-3.5 h-3.5" /> {sub.finalScore?.source === "adjusted" ? "Re-adjust" : "Adjust Level"}
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

        {expectedDetailSubId && (() => {
            const sub = subResults.find(item => item.subId === expectedDetailSubId);
            if (!sub) return null;
            const expectedLevel = session.subdimensionAnalysis?.find(item => item.subdimension === sub.subId)?.expectedLevel ?? 3;
            const level = sub.levels[expectedLevel - 1];
            if (!level) return null;

            return (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setExpectedDetailSubId(null)}>
                    <div className="card w-full max-w-lg p-5 shadow-2xl" onClick={event => event.stopPropagation()}>
                        <div className="mb-4 flex items-start justify-between gap-4">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-purple-400">Expected Level · {sub.subName}</p>
                                <h3 className="mt-1 text-lg font-bold t-primary">Level {expectedLevel}: {level.name}</h3>
                            </div>
                            <button type="button" onClick={() => setExpectedDetailSubId(null)} className="btn-secondary !px-2 !py-1.5">
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <p className="text-sm leading-relaxed t-secondary">{level.detail || "No level description available."}</p>

                        <div className="mt-5">
                            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest t-muted">Criteria</p>
                            {level.criteria.length > 0 ? (
                                <div className="space-y-2">
                                    {level.criteria.map(criterion => (
                                        <div key={criterion._id} className="rounded-lg p-3" style={{ backgroundColor: "var(--bg-3)", border: "1px solid var(--border-2)" }}>
                                            <p className="text-sm font-semibold t-primary">{criterion.name}</p>
                                            {criterion.detail && <p className="mt-1 text-xs leading-relaxed t-muted">{criterion.detail}</p>}
                                        </div>
                                    ))}
                                </div>
                            ) : <p className="text-xs italic t-muted">No criteria available for this level.</p>}
                        </div>
                    </div>
                </div>
            );
        })()}

        {/* ─── AI Reasoning Panel (slide-in from right) ────────────── */}
        {showAiPanel && (
            <AiReasoningPanel
                assessments={aiAssessments}
                sessionId={sessionId}
                isLocked={session.aiAnalysisLocked ?? false}
                onClose={() => setShowAiPanel(false)}
                onSaved={() => fetchResults()}
            />
        )}
        </>
    );
}
