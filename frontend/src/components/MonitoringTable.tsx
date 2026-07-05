"use client";
import { Loader2, Save } from "lucide-react";
import { MonitoringRow, ActionPlanGroup } from "@/types";

const MONTHS = 6;
const STATUS_OPTIONS = ["", "Not Started", "Ongoing", "Completed", "Delayed"] as const;
const STATUS_COLORS: Record<string, string> = {
  Completed: "text-green-400 bg-green-400/10 border-green-400/30",
  Ongoing: "text-blue-400 bg-blue-400/10 border-blue-400/30",
  Delayed: "text-red-400 bg-red-400/10 border-red-400/30",
  "Not Started": "text-amber-400 bg-amber-400/10 border-amber-400/30",
  "": "t-muted",
};

type MonRowData = Omit<MonitoringRow, "_id" | "actionPlanGroupId" | "actionPlanItemIdx">;

export function monRowKey(grpId: string, itemIdx: number) {
  return `${grpId}_${itemIdx}`;
}

interface FlatRow {
  key: string;
  grp: ActionPlanGroup;
  grpIdx: number;
  sub: { subId: string; subName: string } | null;
  item: string;
  itemIdx: number;
  /** render AP+monitoring cells, with this rowspan */
  renderAp: boolean;
  apSpan: number;
  dim: { _id: string; name: string } | undefined;
  isFirstDimRow: boolean;
  dimSpan: number;
}

export function buildMonRows(
  apGroups: ActionPlanGroup[],
  subResults: { subId: string; subName: string; dimId: string }[],
  dimensions: { _id: string; name: string }[],
): FlatRow[] {
  const subToGroup = new Map<string, { grp: ActionPlanGroup; grpIdx: number }>();
  apGroups.forEach((grp, gi) =>
    (grp.subdimensions ?? []).forEach(sid => subToGroup.set(sid, { grp, grpIdx: gi }))
  );

  const emitted = new Set<string>();
  const byDim: Record<string, FlatRow[]> = {};
  dimensions.forEach(d => { byDim[d._id] = []; });

  dimensions.forEach(dim => {
    const dimSubs = subResults.filter(s => s.dimId === dim._id);
    dimSubs.forEach(sub => {
      const entry = subToGroup.get(sub.subId);
      if (entry) {
        const { grp, grpIdx } = entry;
        const gid = grp._id ?? String(grpIdx);
        if (emitted.has(gid)) return;
        emitted.add(gid);

        const grpSubs = subResults.filter(s => (grp.subdimensions ?? []).includes(s.subId));
        const N = grpSubs.length;
        const items = (grp.items ?? []).filter(i => i.trim());
        const M = items.length;
        const total = Math.max(N, M || 1);

        for (let i = 0; i < total; i++) {
          const rowSub = i < N ? grpSubs[i] : null;
          let renderAp = true, apSpan = 1, itemIdx = i, item = "";

          if (M === 0) {
            // no items → placeholder per sub
            renderAp = true; apSpan = 1; itemIdx = 0; item = "";
          } else if (M <= N) {
            if (i < M - 1) {
              renderAp = true; apSpan = 1; itemIdx = i; item = items[i];
            } else if (i === M - 1) {
              renderAp = true; apSpan = N - M + 1; itemIdx = i; item = items[i];
            } else {
              // covered by rowspan of row M-1
              renderAp = false; apSpan = 0; itemIdx = M - 1; item = "";
            }
          } else {
            // M > N
            renderAp = true; apSpan = 1; itemIdx = i; item = i < M ? items[i] : "";
          }

          byDim[dim._id].push({
            key: monRowKey(gid, itemIdx),
            grp, grpIdx, sub: rowSub, item, itemIdx,
            renderAp, apSpan, dim,
            isFirstDimRow: false, dimSpan: 0,
          });
        }
      } else {
        const ph: ActionPlanGroup = { _id: `__no_ap_${sub.subId}`, subdimensions: [sub.subId], items: [], label: "" };
        byDim[dim._id].push({
          key: monRowKey(ph._id!, 0),
          grp: ph, grpIdx: -1, sub, item: "", itemIdx: 0,
          renderAp: true, apSpan: 1, dim,
          isFirstDimRow: false, dimSpan: 0,
        });
      }
    });
  });

  const all: FlatRow[] = [];
  dimensions.forEach(dim => {
    const rows = byDim[dim._id] ?? [];
    rows.forEach((r, i) => { r.isFirstDimRow = i === 0; r.dimSpan = rows.length; });
    all.push(...rows);
  });
  return all;
}

interface Props {
  apGroups: ActionPlanGroup[];
  subResults: { subId: string; subName: string; dimId: string }[];
  dimensions: { _id: string; name: string }[];
  monData: Record<string, MonRowData>;
  onChangeRow?: (key: string, patch: Partial<MonRowData>) => void;
  subAnalysis: Record<string, { el: string }>;
  finalResults: Record<string, number | null>;
  saving?: boolean;
  onSave?: () => void;
}

export default function MonitoringTable({ apGroups, subResults, dimensions, monData, onChangeRow, subAnalysis, finalResults, saving, onSave }: Props) {
  const rows = buildMonRows(apGroups, subResults, dimensions);
  const ro = !onChangeRow;

  if (rows.length === 0) return (
    <div className="card p-10 text-center">
      <p className="text-sm t-muted italic">No sub-dimensions found.</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {onSave && (
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold t-secondary uppercase tracking-wider">Monitoring</h2>
          <button onClick={onSave} disabled={saving} className="btn-primary text-sm gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
          </button>
        </div>
      )}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm border-collapse" style={{ minWidth: "1200px" }}>
          <thead>
            <tr style={{ backgroundColor: "var(--bg-3)", borderBottom: "1px solid var(--border-2)" }}>
              <th rowSpan={2} className="px-3 py-3 text-center text-xs font-bold t-secondary uppercase w-24" style={{ borderRight: "1px solid var(--border-2)", verticalAlign: "middle" }}>Dimension</th>
              <th rowSpan={2} className="px-3 py-3 text-center text-xs font-bold t-secondary uppercase w-28" style={{ borderRight: "1px solid var(--border-2)", verticalAlign: "middle" }}>Sub-Dim</th>
              <th rowSpan={2} className="px-3 py-3 text-center text-xs font-bold t-secondary uppercase w-14" style={{ borderRight: "1px solid var(--border-2)", verticalAlign: "middle" }}>Final</th>
              <th rowSpan={2} className="px-3 py-3 text-center text-xs font-bold t-secondary uppercase w-16" style={{ borderRight: "1px solid var(--border-2)", verticalAlign: "middle" }}>Target</th>
              <th rowSpan={2} className="px-3 py-3 text-center text-xs font-bold t-secondary uppercase" style={{ minWidth: 200, borderRight: "1px solid var(--border-2)", verticalAlign: "middle" }}>Action Plan Step</th>
              <th colSpan={MONTHS} className="px-3 py-2 text-center text-xs font-bold t-secondary uppercase" style={{ borderRight: "1px solid var(--border-2)", borderBottom: "1px solid var(--border-2)" }}>Timeline (Month)</th>
              <th rowSpan={2} className="px-3 py-3 text-center text-xs font-bold t-secondary uppercase w-28" style={{ borderRight: "1px solid var(--border-2)", verticalAlign: "middle" }}>PIC</th>
              <th rowSpan={2} className="px-3 py-3 text-center text-xs font-bold t-secondary uppercase w-24" style={{ borderRight: "1px solid var(--border-2)", verticalAlign: "middle" }}>Checker</th>
              <th rowSpan={2} className="px-3 py-3 text-center text-xs font-bold t-secondary uppercase w-28" style={{ borderRight: "1px solid var(--border-2)", verticalAlign: "middle" }}>Status</th>
              <th rowSpan={2} className="px-3 py-3 text-center text-xs font-bold t-secondary uppercase w-32" style={{ verticalAlign: "middle" }}>Notes</th>
            </tr>
            <tr style={{ backgroundColor: "var(--bg-3)", borderBottom: "2px solid var(--border-2)" }}>
              {Array.from({ length: MONTHS }, (_, i) => (
                <th key={i} className="px-1 py-1.5 text-center text-xs font-bold t-secondary w-10"
                  style={{ borderRight: i < MONTHS - 1 ? "1px solid var(--border)" : "1px solid var(--border-2)" }}>
                  {i + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => {
              const data: MonRowData = monData[r.key] ?? { subdimension: r.sub?.subId ?? "", timeline: [], pic: "", checker: "", achievementStatus: "", notes: "" };
              const upd = (patch: Partial<MonRowData>) => onChangeRow?.(r.key, { ...data, ...patch });
              const sid = r.sub?.subId;
              const finalBobot = sid ? (finalResults[sid] ?? null) : null;
              const el = sid ? (subAnalysis[sid]?.el ?? "") : "";

              return (
                <tr key={`${r.key}_${idx}`} style={{ borderBottom: "1px solid var(--border)", backgroundColor: idx % 2 === 0 ? "var(--bg)" : "var(--bg-2)" }}>
                  {/* Dimension */}
                  {r.isFirstDimRow && (
                    <td rowSpan={r.dimSpan} className="px-3 py-3 text-center align-middle"
                      style={{ borderRight: "1px solid var(--border-2)", backgroundColor: "var(--bg-3)", verticalAlign: "middle" }}>
                      <span className="text-xs font-bold t-secondary">{r.dim?.name ?? "—"}</span>
                    </td>
                  )}

                  {/* Sub-Dimension */}
                  <td className="px-3 py-2 text-center align-middle" style={{ borderRight: "1px solid var(--border-2)", verticalAlign: "middle" }}>
                    {r.sub ? <span className="text-xs t-secondary font-medium leading-snug">{r.sub.subName}</span> : <span className="text-xs t-muted">—</span>}
                  </td>

                  {/* Final Result */}
                  <td className="px-2 py-2 text-center align-middle" style={{ borderRight: "1px solid var(--border-2)", verticalAlign: "middle" }}>
                    {finalBobot !== null
                      ? <span className={`text-lg font-black ${finalBobot >= 4 ? "text-green-400" : finalBobot === 3 ? "text-blue-400" : finalBobot === 2 ? "text-amber-400" : "text-red-400"}`}>{finalBobot}</span>
                      : <span className="t-muted text-xs">—</span>}
                  </td>

                  {/* Expected Level */}
                  <td className="px-2 py-2 text-center align-middle" style={{ borderRight: "1px solid var(--border-2)", verticalAlign: "middle" }}>
                    {el ? <span className="text-lg font-black text-purple-400">{el}</span> : <span className="t-muted text-xs">—</span>}
                  </td>

                  {/* Action Plan — rowspanned when items < subs */}
                  {r.renderAp && (
                    <td rowSpan={r.apSpan} className="px-3 py-2 align-middle" style={{ borderRight: "1px solid var(--border-2)", verticalAlign: "middle" }}>
                      <p className="text-xs t-secondary leading-snug">{r.item || <em className="t-muted">—</em>}</p>
                    </td>
                  )}

                  {/* Timeline */}
                  {r.renderAp && Array.from({ length: MONTHS }, (_, i) => {
                    const m = i + 1, active = data.timeline.includes(m);
                    return (
                      <td key={i} rowSpan={r.apSpan} className="px-1 py-2 text-center align-middle"
                        style={{ borderRight: i < MONTHS - 1 ? "1px solid var(--border)" : "1px solid var(--border-2)" }}>
                        {ro
                          ? <div className="mx-auto w-6 h-6 rounded" style={{ backgroundColor: active ? "rgba(251,146,60,0.6)" : "var(--bg-4)" }} />
                          : <button onClick={() => { const has = data.timeline.includes(m); upd({ timeline: has ? data.timeline.filter(x => x !== m) : [...data.timeline, m] }); }}
                              className="mx-auto w-6 h-6 rounded transition-all" title={`Month ${m}`}
                              style={{ backgroundColor: active ? "rgba(251,146,60,0.7)" : "var(--bg-4)", border: active ? "1px solid rgba(251,146,60,0.5)" : "1px solid var(--border)" }} />
                        }
                      </td>
                    );
                  })}

                  {/* PIC */}
                  {r.renderAp && (
                    <td rowSpan={r.apSpan} className="px-2 py-2 align-middle" style={{ borderRight: "1px solid var(--border)" }}>
                      {ro ? <span className="text-xs t-secondary">{data.pic || "—"}</span>
                        : <input type="text" value={data.pic} onChange={e => upd({ pic: e.target.value })} placeholder="PIC..."
                            className="w-full px-2 py-1 rounded-lg text-xs focus:outline-none"
                            style={{ backgroundColor: "var(--bg-4)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />}
                    </td>
                  )}

                  {/* Checker */}
                  {r.renderAp && (
                    <td rowSpan={r.apSpan} className="px-2 py-2 align-middle" style={{ borderRight: "1px solid var(--border)" }}>
                      {ro ? <span className="text-xs t-secondary">{data.checker || "—"}</span>
                        : <input type="text" value={data.checker} onChange={e => upd({ checker: e.target.value })} placeholder="Checker..."
                            className="w-full px-2 py-1 rounded-lg text-xs focus:outline-none"
                            style={{ backgroundColor: "var(--bg-4)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />}
                    </td>
                  )}

                  {/* Status */}
                  {r.renderAp && (
                    <td rowSpan={r.apSpan} className="px-2 py-2 text-center align-middle" style={{ borderRight: "1px solid var(--border)" }}>
                      {ro
                        ? data.achievementStatus
                          ? <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_COLORS[data.achievementStatus]}`}>{data.achievementStatus}</span>
                          : <span className="text-xs t-muted">—</span>
                        : <select value={data.achievementStatus}
                            onChange={e => upd({ achievementStatus: e.target.value as MonRowData["achievementStatus"] })}
                            className="w-full px-1 py-1 rounded-lg text-[11px] font-medium focus:outline-none"
                            style={{ backgroundColor: "var(--bg-4)", border: "1px solid var(--border)", color: "var(--text-primary)" }}>
                            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s || "—"}</option>)}
                          </select>}
                    </td>
                  )}

                  {/* Notes */}
                  {r.renderAp && (
                    <td rowSpan={r.apSpan} className="px-2 py-2 align-middle">
                      {ro ? <span className="text-xs t-secondary">{data.notes || "—"}</span>
                        : <input type="text" value={data.notes} onChange={e => upd({ notes: e.target.value })} placeholder="Notes..."
                            className="w-full px-2 py-1 rounded-lg text-xs focus:outline-none"
                            style={{ backgroundColor: "var(--bg-4)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
