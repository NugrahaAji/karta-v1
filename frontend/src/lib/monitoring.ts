import type { ActionPlanGroup, MonitoringRow, MonitoringStatus } from "@/types";

export type MonRowData = Omit<MonitoringRow, "_id" | "actionPlanGroupId" | "actionPlanItemIdx">;
export const MONITORING_STATUSES: MonitoringStatus[] = ["Targeted", "Not Started", "Ongoing", "Completed", "Delayed"];
export const MONITORING_MONTHS = [1, 2, 3, 4, 5, 6];
export const STATUS_SHORT: Record<MonitoringStatus, string> = { Targeted: "T", "Not Started": "NS", Ongoing: "O", Completed: "C", Delayed: "D" };
export function monRowKey(groupId: string, itemIndex: number) { return `${groupId}_${itemIndex}`; }
export function emptyMonitoring(subdimension = ""): MonRowData {
    return { subdimension, timeline: [], timelineStatuses: [], pic: "", checker: "", achievementStatus: "", notes: "" };
}
export function monthStatuses(data: MonRowData) {
    return data.timelineStatuses?.length ? data.timelineStatuses : data.timeline.map(month => ({ month, status: data.achievementStatus || "Targeted" as MonitoringStatus }));
}
export function hasMonitoringData(data?: MonRowData) {
    return Boolean(data && (data.timelineStatuses?.length || data.timeline.length || data.pic.trim() || data.checker.trim() || data.achievementStatus || data.notes.trim()));
}
export interface MonitoringDisplayRow {
    key: string;
    grp: ActionPlanGroup;
    grpIdx: number;
    sub: { subId: string; subName: string } | null;
    item: string;
    itemIdx: number;
    renderAp: boolean;
    apSpan: number;
    dim: { _id: string; name: string } | undefined;
    isFirstDimRow: boolean;
    dimSpan: number;
    subSpan: number;
}

export function mergeMonitoringRows(rows: MonitoringDisplayRow[]) {
    const result = rows.map(row => ({ ...row, renderAp: false, apSpan: 0, isFirstDimRow: false, dimSpan: 0, subSpan: 0 }));
    const merge = (key: (row: MonitoringDisplayRow) => string, apply: (row: MonitoringDisplayRow, span: number) => void) => {
        for (let start = 0; start < result.length;) {
            let end = start + 1;
            while (end < result.length && key(result[start]) === key(result[end])) end++;
            apply(result[start], end - start);
            start = end;
        }
    };
    merge(row => row.dim?._id ?? "", (row, span) => { row.isFirstDimRow = true; row.dimSpan = span; });
    merge(row => row.sub?.subId ?? row.key, (row, span) => { row.subSpan = span; });
    merge(row => row.key, (row, span) => { row.renderAp = true; row.apSpan = span; });
    return result;
}

/** Preserve item keys and dimension order, including plans shared across dimensions. */
export function buildMonRows(groups: ActionPlanGroup[], subs: { subId: string; subName: string; dimId: string }[], dimensions: { _id: string; name: string }[]): MonitoringDisplayRow[] {
    const ordered = dimensions.flatMap(dim => subs.filter(sub => sub.dimId === dim._id));
    const rows: MonitoringDisplayRow[] = [];
    for (const sub of ordered) {
        const groupIndex = groups.findLastIndex(group => group.subdimensions.includes(sub.subId));
        const group = groups[groupIndex] ?? { _id: `__no_ap_${sub.subId}`, label: "", items: [], subdimensions: [sub.subId], order: 0 };
        const groupSubs = ordered.filter(item => group.subdimensions.includes(item.subId) && (groupIndex < 0 || groups.findLastIndex(candidate => candidate.subdimensions.includes(item.subId)) === groupIndex));
        const position = groupSubs.findIndex(item => item.subId === sub.subId);
        // Existing records use indices of non-empty action steps.
        const items = group.items.filter(item => item.trim());
        const itemIndex = Math.max(0, Math.min(position, items.length - 1));
        const indices = [itemIndex];
        if (position === groupSubs.length - 1) for (let index = groupSubs.length; index < items.length; index++) indices.push(index);
        for (const index of indices) rows.push({ key: monRowKey(group._id ?? String(groupIndex), index), grp: group, grpIdx: groupIndex, sub,
            item: items[index] ?? "", itemIdx: index, dim: dimensions.find(dim => dim._id === sub.dimId), renderAp: true, apSpan: 1, isFirstDimRow: false, dimSpan: 1, subSpan: 1 });
    }
    return mergeMonitoringRows(rows);
}

export function readMonitoringRows(rows: MonitoringRow[] = []): Record<string, MonRowData> {
    return Object.fromEntries(rows.map(row => [monRowKey(row.actionPlanGroupId || `__no_ap_${row.subdimension}`, row.actionPlanItemIdx), {
        ...emptyMonitoring(row.subdimension), timeline: row.timeline ?? [], timelineStatuses: row.timelineStatuses ?? [],
        pic: row.pic ?? "", checker: row.checker ?? "", achievementStatus: row.achievementStatus ?? "", notes: row.notes ?? "",
    }]));
}

export function serializeMonitoringRows(rows: MonitoringDisplayRow[], data: Record<string, MonRowData>) {
    const seen = new Set<string>();
    return rows.flatMap(row => {
        if (seen.has(row.key)) return [];
        seen.add(row.key);
        const value = data[row.key];
        if (!hasMonitoringData(value)) return [];
        const normalized = monthStatuses(value);
        return [{ ...value, actionPlanGroupId: row.grpIdx >= 0 && !row.grp._id?.startsWith("__") ? row.grp._id ?? null : null,
            actionPlanItemIdx: row.itemIdx, subdimension: value.subdimension || row.sub?.subId || null,
            timeline: normalized.map(item => item.month), timelineStatuses: normalized }];
    });
}

// Compatibility with the administrator page's existing save integration.
export function monitoringEntries(...args: Parameters<typeof buildMonRows>) {
    const seen = new Set<string>();
    return buildMonRows(...args).filter(row => {
        if (seen.has(row.key)) return false;
        seen.add(row.key);
        return true;
    });
}
export const monitoringPayload = serializeMonitoringRows;
export const monitoringStatuses = MONITORING_STATUSES;
export const monthlyStatuses = monthStatuses;
export type FlatRow = MonitoringDisplayRow;
