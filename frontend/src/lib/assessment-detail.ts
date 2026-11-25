import type { AssessmentResponse, AssessmentSession, ActionPlanGroup, Dimension, FinalScore } from "@/types";

export interface AssessmentResult {
    subId: string;
    subName: string;
    dimId: string;
    dimensionName: string;
    levels: Dimension["subdimensions"][number]["levels"];
    evaluatorAnswers: { userId: string; userName: string; levelIndex: number; criteriaName?: string; note?: string }[];
    voteCounts: Record<number, number>;
    hasMajority: boolean;
    isTied: boolean;
    majorityLevelIndex: number | null;
    finalScore?: FinalScore;
    finalLevelIndex: number | null;
    expectedLevel: number;
}

export interface SavedAnalysis {
    dimension_id?: string; dimension_name?: string; dimension?: string;
    sub_dimension_id?: string; sub_dimension_name?: string; sub_dimension?: string;
    strength_weakness?: string; opportunity_analysis?: string[]; action_plan?: string[];
}

/** The existing scoring rule uses a unique highest vote count, not a >50% threshold. */
export function buildAssessmentResults(dimensions: Dimension[], responses: AssessmentResponse[], session: AssessmentSession): AssessmentResult[] {
    return dimensions.flatMap(dimension => (dimension.subdimensions ?? []).map(sub => {
        const answers = responses.flatMap(response => {
            const item = response.responses.find(answer => answer.subdimension === sub._id);
            if (!item || !Number.isInteger(item.selectedLevelIndex) || !sub.levels[item.selectedLevelIndex]) return [];
            return [{ userId: response.user._id, userName: response.user.name, levelIndex: item.selectedLevelIndex,
                criteriaName: sub.levels.flatMap(level => level.criteria ?? []).find(criterion => criterion._id === item.selectedCriteria)?.name,
                note: item.note }];
        });
        const voteCounts: Record<number, number> = {};
        answers.forEach(answer => { voteCounts[answer.levelIndex] = (voteCounts[answer.levelIndex] ?? 0) + 1; });
        const max = Math.max(0, ...Object.values(voteCounts));
        const top = Object.keys(voteCounts).map(Number).filter(level => voteCounts[level] === max);
        const majorityLevelIndex = top.length === 1 ? top[0] : null;
        const finalScore = session.finalScores?.find(score => score.dimension === dimension._id && score.subdimension === sub._id);
        const savedIndex = finalScore?.finalLevelIndex;
        const finalLevelIndex = savedIndex !== undefined && sub.levels[savedIndex] ? savedIndex : majorityLevelIndex;
        const target = session.subdimensionAnalysis?.find(item => item.subdimension === sub._id)?.expectedLevel ?? 3;
        return { subId: sub._id, subName: sub.name, dimId: dimension._id, dimensionName: dimension.name,
            levels: sub.levels ?? [], evaluatorAnswers: answers, voteCounts, hasMajority: top.length === 1,
            isTied: top.length > 1, majorityLevelIndex, finalScore, finalLevelIndex,
            expectedLevel: Math.max(1, Math.min(sub.levels.length || 1, target)) };
    }));
}

export function resultStatus(result: AssessmentResult) {
    if (result.finalScore?.source === "adjusted") return "Adjusted";
    if (result.finalScore?.source === "majority" || result.hasMajority) return "Majority";
    return result.isTied ? "Needs review" : "Awaiting responses";
}

export function getSavedAnalysis(session: AssessmentSession, result: AssessmentResult, all: AssessmentResult[]): SavedAnalysis | undefined {
    const saved: SavedAnalysis[] = Array.isArray(session.aiAnalysis) ? session.aiAnalysis : [];
    const match = saved.find(item => item.sub_dimension_id === result.subId ||
        ((item.sub_dimension_name === result.subName || item.sub_dimension === result.subName) &&
        (!item.dimension_id || item.dimension_id === result.dimId) &&
        (!item.dimension_name || item.dimension_name === result.dimensionName) &&
        (!item.dimension || item.dimension === result.dimensionName)));
    if (match) return match;
    const index = all.filter(item => item.evaluatorAnswers.length > 0 || item.finalScore).findIndex(item => item.subId === result.subId);
    const legacy = saved[index];
    return legacy && !legacy.sub_dimension_id && !legacy.sub_dimension_name && !legacy.sub_dimension ? legacy : undefined;
}

/** Display and persistence must use the same manual + saved-analysis action list. */
export function assessmentActionGroups(session: AssessmentSession, results: AssessmentResult[]): ActionPlanGroup[] {
    const manual = session.actionPlanGroups ?? [];
    const covered = new Set(manual.flatMap(group => group.subdimensions));
    return [...manual, ...results.flatMap((result, index) => {
        if (covered.has(result.subId)) return [];
        const items = getSavedAnalysis(session, result, results)?.action_plan?.filter(item => item.trim()) ?? [];
        return items.length ? [{ _id: `__no_ap_${result.subId}`, label: "Saved analysis action plan", items,
            subdimensions: [result.subId], order: manual.length + index }] : [];
    })];
}

export function selectResults(results: AssessmentResult[], query: string, dimension: string, status: string) {
    const search = query.trim().toLocaleLowerCase();
    return results.filter(result => (dimension === "all" || result.dimId === dimension) &&
        (status === "all" || resultStatus(result) === status) &&
        (!search || `${result.subName} ${result.dimensionName}`.toLocaleLowerCase().includes(search)));
}
