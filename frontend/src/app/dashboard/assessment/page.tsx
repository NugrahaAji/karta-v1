"use client";

import { useState, useEffect } from "react";
import {
    CheckSquare, Loader2, Info, Building2, Layers,
    ChevronDown, ChevronRight, Download
} from "lucide-react";
import api from "@/lib/api";
import { Dimension } from "@/types";

// ─── Level column header labels (up to 5) ─────────────────────────────────────
const LEVEL_COLORS: string[] = [
    "#fce1b6", // level 1 — warm peach
    "#fbd09e", // level 2 — deeper peach
    "#f8c08e", // level 3 — light amber
    "#f5af7e", // level 4 — amber-orange
    "#f29e6e", // level 5 — deeper orange
];

const LEVEL_TEXT_COLORS: string[] = [
    "#7c4a00",
    "#7c3c00",
    "#7c3200",
    "#6e2a00",
    "#5e2000",
];

// ─── Single dimension table block ─────────────────────────────────────────────
function DimensionTable({ dim, colorIdx }: { dim: Dimension; colorIdx: number }) {
    const [collapsed, setCollapsed] = useState(false);

    // Gather all level names from across sub-dimensions to determine columns
    const levelNamesSet = new Set<string>();
    dim.subdimensions?.forEach(sub => {
        sub.levels?.forEach(l => levelNamesSet.add(l.name));
    });
    // Keep natural order from first subdimension that has levels
    const levelNames: string[] = [];
    dim.subdimensions?.forEach(sub => {
        sub.levels?.forEach(l => {
            if (!levelNames.includes(l.name)) levelNames.push(l.name);
        });
    });

    const hasSubs = dim.subdimensions && dim.subdimensions.length > 0;

    // Pastel backgrounds for dimension header badge
    const DIM_BG_COLORS = [
        { bg: "#ede9fe", text: "#5b21b6", border: "#c4b5fd" }, // purple
        { bg: "#dbeafe", text: "#1e40af", border: "#93c5fd" }, // blue
        { bg: "#d1fae5", text: "#065f46", border: "#6ee7b7" }, // green
        { bg: "#fef9c3", text: "#854d0e", border: "#fde047" }, // yellow
        { bg: "#fce7f3", text: "#9d174d", border: "#f9a8d4" }, // pink
        { bg: "#e0f2fe", text: "#0c4a6e", border: "#7dd3fc" }, // cyan
        { bg: "#ede9fe", text: "#4c1d95", border: "#a78bfa" }, // violet
    ];
    const dimColor = DIM_BG_COLORS[colorIdx % DIM_BG_COLORS.length];

    return (
        <div className="mb-8">
            {/* Dimension heading bar */}
            <button
                onClick={() => setCollapsed(v => !v)}
                className="w-full flex items-center justify-between px-5 py-3 rounded-t-xl font-bold text-sm transition-all"
                style={{
                    backgroundColor: dimColor.bg,
                    color: dimColor.text,
                    border: `1.5px solid ${dimColor.border}`,
                    borderBottom: collapsed ? `1.5px solid ${dimColor.border}` : "none",
                    borderRadius: collapsed ? "0.75rem" : "0.75rem 0.75rem 0 0",
                }}
            >
                <div className="flex items-center gap-2.5">
                    <Layers className="w-4 h-4 shrink-0" />
                    <span className="uppercase tracking-wide">{dim.name}</span>
                    {dim.detail && (
                        <span className="text-xs font-normal opacity-70 ml-1">{dim.detail}</span>
                    )}
                </div>
                <div className="flex items-center gap-3 text-xs font-normal opacity-60">
                    <span>{dim.subdimensions?.length ?? 0} sub-dimensions</span>
                    {collapsed
                        ? <ChevronRight className="w-4 h-4" />
                        : <ChevronDown className="w-4 h-4" />
                    }
                </div>
            </button>

            {/* Table */}
            {!collapsed && (
                <div className="overflow-x-auto rounded-b-xl" style={{ border: `1.5px solid ${dimColor.border}`, borderTop: "none" }}>
                    <table className="w-full text-sm border-collapse">
                        {/* ── Column headers ── */}
                        <thead>
                            <tr>
                                <th
                                    className="px-4 py-3 text-center font-bold text-xs uppercase tracking-wide"
                                    style={{
                                        backgroundColor: "#e5e7eb",
                                        color: "#374151",
                                        border: "1px solid #d1d5db",
                                        minWidth: "120px",
                                    }}
                                >
                                    Sub-Dimension
                                </th>
                                {levelNames.length === 0 && (
                                    <th
                                        className="px-4 py-3 text-center font-bold text-xs uppercase tracking-wide"
                                        style={{ backgroundColor: "#e5e7eb", color: "#374151", border: "1px solid #d1d5db" }}
                                    >
                                        Criteria
                                    </th>
                                )}
                                {levelNames.map((ln, i) => (
                                    <th
                                        key={ln}
                                        className="px-4 py-3 text-center font-bold text-xs"
                                        style={{
                                            backgroundColor: LEVEL_COLORS[i] ?? LEVEL_COLORS[LEVEL_COLORS.length - 1],
                                            color: LEVEL_TEXT_COLORS[i] ?? LEVEL_TEXT_COLORS[LEVEL_TEXT_COLORS.length - 1],
                                            border: "1px solid #d1d5db",
                                            minWidth: "180px",
                                        }}
                                    >
                                        {ln}
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        {/* ── Body ── */}
                        <tbody>
                            {!hasSubs && (
                                <tr>
                                    <td
                                        colSpan={levelNames.length + 1}
                                        className="px-4 py-8 text-center text-sm italic"
                                        style={{ color: "#9ca3af", border: "1px solid #e5e7eb" }}
                                    >
                                        No sub-dimensions configured yet.
                                    </td>
                                </tr>
                            )}

                            {dim.subdimensions?.map((sub, subIdx) => {
                                // Build a lookup: levelName → criteria[]
                                const levelMap: Record<string, { name: string; detail: string; bobot: number }[]> = {};
                                sub.levels?.forEach(l => {
                                    levelMap[l.name] = l.criteria ?? [];
                                });

                                // How many content rows for this sub-dim?
                                // One row per max criteria count across all levels
                                const maxRows = Math.max(
                                    1,
                                    ...levelNames.map(ln => (levelMap[ln]?.length ?? 0))
                                );

                                return Array.from({ length: maxRows }).map((_, rowIdx) => {
                                    const isFirstRow = rowIdx === 0;
                                    const isLastSub = subIdx === (dim.subdimensions?.length ?? 0) - 1;
                                    const isLastRow = rowIdx === maxRows - 1;

                                    return (
                                        <tr
                                            key={`${sub._id}-${rowIdx}`}
                                            style={{ backgroundColor: rowIdx % 2 === 0 ? "var(--bg)" : "var(--bg-2)" }}
                                        >
                                            {/* Sub-dimension cell (rowspan for first row) */}
                                            {isFirstRow && (
                                                <td
                                                    rowSpan={maxRows}
                                                    className="px-4 py-3 font-semibold align-middle text-sm"
                                                    style={{
                                                        border: "1px solid #e5e7eb",
                                                        borderBottom: isLastSub ? "1px solid #e5e7eb" : "2px solid #d1d5db",
                                                        color: "var(--text-primary)",
                                                        backgroundColor: "var(--bg-2)",
                                                        verticalAlign: "middle",
                                                    }}
                                                >
                                                    <div className="font-semibold" style={{ color: "var(--text-primary)" }}>
                                                        {sub.name}
                                                    </div>
                                                    {sub.detail && (
                                                        <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                                                            {sub.detail}
                                                        </div>
                                                    )}
                                                </td>
                                            )}

                                            {/* Level columns */}
                                            {levelNames.map((ln, colIdx) => {
                                                const criteriaList = levelMap[ln] ?? [];
                                                const crit = criteriaList[rowIdx];
                                                return (
                                                    <td
                                                        key={ln}
                                                        className="px-4 py-3 align-top text-sm"
                                                        style={{
                                                            border: "1px solid #e5e7eb",
                                                            borderBottom: isLastRow && isLastSub
                                                                ? "1px solid #e5e7eb"
                                                                : isLastRow
                                                                    ? "2px solid #d1d5db"
                                                                    : "1px solid #e5e7eb",
                                                            backgroundColor: crit
                                                                ? `${LEVEL_COLORS[colIdx] ?? LEVEL_COLORS[LEVEL_COLORS.length - 1]}22`
                                                                : "transparent",
                                                            verticalAlign: "top",
                                                        }}
                                                    >
                                                        {crit ? (
                                                            <div>
                                                                <p style={{ color: "var(--text-primary)" }}>{crit.name}</p>
                                                                {crit.detail && (
                                                                    <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
                                                                        {crit.detail}
                                                                    </p>
                                                                )}
                                                                {crit.bobot > 0 && (
                                                                    <div
                                                                        className="mt-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold"
                                                                        style={{
                                                                            backgroundColor: `${LEVEL_COLORS[colIdx] ?? LEVEL_COLORS[LEVEL_COLORS.length - 1]}55`,
                                                                            color: LEVEL_TEXT_COLORS[colIdx] ?? LEVEL_TEXT_COLORS[LEVEL_TEXT_COLORS.length - 1],
                                                                        }}
                                                                    >
                                                                        w: {crit.bobot.toFixed(4)}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : null}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                });
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AssessmentPage() {
    const [dimensions, setDimensions] = useState<Dimension[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get("/dimensions")
            .then(r => {
                const dims: Dimension[] = r.data.dimensions ?? [];
                return Promise.all(dims.map(d =>
                    api.get(`/dimensions/${d._id}`).then(r2 => r2.data.dimension)
                ));
            })
            .then(full => setDimensions(full))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    const totalCriteria = dimensions.reduce((s, d) =>
        s + (d.subdimensions?.reduce((ss, sub) =>
            ss + sub.levels?.reduce((ls, l) => ls + (l.criteria?.length ?? 0), 0), 0) ?? 0), 0);

    return (
        <div className="page-container">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
                            <CheckSquare className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold t-primary">Assessment Criteria</h1>
                            <p className="text-sm t-secondary mt-0.5">
                                Dimension &amp; Sub-Dimension Criteria — HP3M Maturity Assessment
                            </p>
                        </div>
                    </div>
                    {!loading && dimensions.length > 0 && (
                        <div className="flex items-center gap-3 text-sm t-secondary">
                            <span className="flex items-center gap-1.5">
                                <Layers className="w-4 h-4 text-purple-400" />
                                <strong className="t-primary">{dimensions.length}</strong> Dimensions
                            </span>
                            <span className="flex items-center gap-1.5">
                                <CheckSquare className="w-4 h-4 text-amber-400" />
                                <strong className="t-primary">{totalCriteria}</strong> Criteria
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Info banner */}
            <div className="info-banner info-banner-amber mb-8">
                <Info className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                <p className="text-xs t-secondary leading-relaxed">
                    Each table below represents one <strong>Dimension</strong>. Rows are grouped by <strong>Sub-Dimension</strong>, and columns represent <strong>Maturity Levels</strong>. Each cell contains the assessment criteria for that sub-dimension at the given level.
                </p>
            </div>

            {/* Loading */}
            {loading && (
                <div className="card flex items-center justify-center py-24">
                    <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                </div>
            )}

            {/* Empty */}
            {!loading && dimensions.length === 0 && (
                <div className="card py-24 flex flex-col items-center gap-4">
                    <div className="empty-icon-wrap">
                        <Building2 className="w-8 h-8 text-blue-400/40" />
                    </div>
                    <p className="text-sm t-muted text-center">
                        No assessment dimensions have been configured yet.<br />
                        Please contact your system administrator.
                    </p>
                </div>
            )}

            {/* One table per dimension */}
            {!loading && dimensions.length > 0 && (
                <div>
                    {dimensions.map((dim, i) => (
                        <DimensionTable key={dim._id} dim={dim} colorIdx={i} />
                    ))}
                </div>
            )}
        </div>
    );
}
