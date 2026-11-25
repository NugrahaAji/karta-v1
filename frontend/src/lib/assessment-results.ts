import type { ActionPlanGroup, AssessmentResponse, AssessmentSession, Dimension, FinalScore, Level } from "@/types";

export interface SubResult {
    subId: string;
    subName: string;
    dimId: string;
    dimName: string;
    levels: Level[];
    evaluatorAnswers: { userId: string; userName: string; levelIndex: number; criteriaName?: string; note?: string }[];
    voteCounts: Record<number, number>;
    hasMajority: boolean;
    isTied: boolean;
    majorityLevelIndex: number | null;
    finalScore?: FinalScore;
}

export interface SavedAiResult {
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

/** Keep the existing unique-mode scoring rule; a tied vote has no inferred score. */
export function buildSubResults(dimensions: Dimension[], responses: AssessmentResponse[], scores: FinalScore[] = []): SubResult[] {
    return dimensions.flatMap(dim => (dim.subdimensions ?? []).map(sub => {
        const levels = sub.levels ?? [];
        const evaluatorAnswers = responses.flatMap(response => {
            const item = response.responses.find(answer => answer.subdimension === sub._id && answer.dimension === dim._id);
            if (!item || !levels[item.selectedLevelIndex]) return [];
            return [{ userId: response.user._id, userName: response.user.name, levelIndex: item.selectedLevelIndex,
                criteriaName: levels.flatMap(level => level.criteria ?? []).find(criterion => criterion._id === item.selectedCriteria)?.name, note: item.note }];
        });
        const voteCounts: Record<number, number> = {};
        evaluatorAnswers.forEach(answer => { voteCounts[answer.levelIndex] = (voteCounts[answer.levelIndex] ?? 0) + 1; });
        const maximum = Math.max(0, ...Object.values(voteCounts));
        const top = Object.keys(voteCounts).map(Number).filter(index => voteCounts[index] === maximum);
        return { subId: sub._id, subName: sub.name, dimId: dim._id, dimName: dim.name, levels, evaluatorAnswers, voteCounts,
            hasMajority: top.length === 1, isTied: top.length > 1, majorityLevelIndex: top.length === 1 ? top[0] : null,
            finalScore: scores.find(score => score.subdimension === sub._id && score.dimension === dim._id) };
    }));
}

export function finalLevel(sub: SubResult): number | null {
    const index = sub.finalScore?.finalLevelIndex ?? sub.majorityLevelIndex;
    return index !== null && sub.levels[index] ? index + 1 : null;
}

export function expectedLevel(session: AssessmentSession, sub: SubResult): number | null {
    if (!sub.levels.length) return null;
    const saved = session.subdimensionAnalysis?.find(item => item.subdimension === sub.subId && item.dimension === sub.dimId)?.expectedLevel;
    return Math.min(sub.levels.length, Math.max(1, saved ?? 3));
}

export function resultState(sub: SubResult) {
    if (sub.finalScore?.source === "adjusted") return "Adjusted";
    if (sub.isTied && !sub.finalScore) return "Needs review";
    if (finalLevel(sub) !== null) return "Majority";
    return "No responses";
}

export function findSavedAnalysis(session: AssessmentSession, sub: SubResult, all: SubResult[]): SavedAiResult | undefined {
    const saved: SavedAiResult[] = Array.isArray(session.aiAnalysis) ? session.aiAnalysis : [];
    const identified = saved.find(item => item.sub_dimension_id
        ? item.sub_dimension_id === sub.subId && (!item.dimension_id || item.dimension_id === sub.dimId)
        : ((item.sub_dimension_name === sub.subName || item.sub_dimension === sub.subName) &&
            (!item.dimension_id || item.dimension_id === sub.dimId) &&
            (!item.dimension_name || item.dimension_name === sub.dimName) &&
            (!item.dimension || item.dimension === sub.dimName)));
    if (identified) return identified;
    const legacy = saved[all.filter(item => item.evaluatorAnswers.length || item.finalScore).findIndex(item => item.subId === sub.subId)];
    return legacy && !(legacy.sub_dimension_id || legacy.sub_dimension_name || legacy.sub_dimension) ? legacy : undefined;
}

/** Display and persistence must use the same manual + generated action plan groups. */
export function assessmentActionGroups(session: AssessmentSession, subs: SubResult[]): ActionPlanGroup[] {
    const manual = session.actionPlanGroups ?? [];
    const covered = new Set(manual.flatMap(group => group.subdimensions));
    return [...manual, ...subs.flatMap((sub, index) => {
        if (covered.has(sub.subId)) return [];
        const items = findSavedAnalysis(session, sub, subs)?.action_plan?.filter(item => item.trim()) ?? [];
        return items.length ? [{ _id: `__no_ap_${sub.subId}`, label: "AI action plan", items, subdimensions: [sub.subId], order: manual.length + index }] : [];
    })];
}

/** Number of consecutive rows to merge; zero marks a cell already covered by a span. */
export function rowSpans(keys: string[]): number[] {
    const spans = keys.map(() => 0);
    for (let start = 0; start < keys.length;) {
        let end = start + 1;
        while (end < keys.length && keys[end] === keys[start]) end++;
        spans[start] = end - start;
        start = end;
    }
    return spans;
}
