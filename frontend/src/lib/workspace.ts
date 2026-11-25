import type { AssessmentSession, SessionStatus } from "@/types";

export type AssessmentFilter = "all" | SessionStatus;
export type AssessmentSort = "updated" | "due" | "name";

export function selectAssessments(sessions: AssessmentSession[], query: string, status: AssessmentFilter, sort: AssessmentSort) {
    const search = query.trim().toLocaleLowerCase();
    return sessions.filter(session => (status === "all" || session.status === status) &&
        `${session.title} ${session.description} ${session.assignedTo.map(person => person.name).join(" ")}`.toLocaleLowerCase().includes(search))
        .sort((a, b) => sort === "name" ? a.title.localeCompare(b.title) : sort === "due"
            ? (a.endDate ? new Date(a.endDate).getTime() : Infinity) - (b.endDate ? new Date(b.endDate).getTime() : Infinity)
            : new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
}

export function formatWorkspaceDate(value?: string) {
    if (!value || Number.isNaN(new Date(value).getTime())) return "No date set";
    return new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

/** datetime-local displays local wall time; never slice a UTC ISO value. */
export function toLocalDateTime(value?: string) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const pad = (part: number) => String(part).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function requestError(error: unknown, fallback: string) {
    const data = (error as { response?: { data?: { error?: string; errors?: { msg: string }[] } } })?.response?.data;
    return data?.error || data?.errors?.map(item => item.msg).join(". ") || fallback;
}
