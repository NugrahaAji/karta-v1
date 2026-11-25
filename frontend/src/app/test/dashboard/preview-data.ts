export const statuses = [
    { id: "backlog", label: "Backlog" },
    { id: "progress", label: "In progress" },
    { id: "review", label: "In review" },
    { id: "done", label: "Completed" },
] as const;

export type TaskStatus = typeof statuses[number]["id"];
export type Priority = "High" | "Medium" | "Low";
export type PreviewTask = {
    id: string;
    project: string;
    title: string;
    status: TaskStatus;
    priority: Priority;
    due: string;
    tags: string[];
    assignees: string[];
    files: number;
    comments: number;
};

export const projects = [
    { id: "readiness", title: "Process mining readiness", description: "Bring your assessment findings, evidence, and next actions together." },
    { id: "onboarding", title: "Customer onboarding", description: "Review the onboarding process and agree on practical improvements." },
    { id: "operations", title: "Service operations", description: "Connect operational findings with the work needed to improve them." },
];

export const team = [
    { initials: "AM", name: "Alya Mahendra", role: "Assessment lead" },
    { initials: "RP", name: "Raka Pratama", role: "Process analyst" },
    { initials: "NS", name: "Nadia Sari", role: "Data specialist" },
    { initials: "DW", name: "Dimas Wijaya", role: "Process owner" },
];

const templates: Omit<PreviewTask, "id" | "project">[] = [
    { title: "Map the current process journey", status: "backlog", priority: "High", due: "2026-11-20", tags: ["Research", "Process"], assignees: ["AM", "RP"], files: 2, comments: 3 },
    { title: "Define improvement success metrics", status: "backlog", priority: "Medium", due: "2026-11-23", tags: ["Governance"], assignees: ["DW"], files: 1, comments: 2 },
    { title: "Review event log completeness", status: "progress", priority: "High", due: "2026-11-18", tags: ["Data", "Evidence"], assignees: ["NS", "RP"], files: 3, comments: 4 },
    { title: "Document team responsibilities", status: "progress", priority: "Medium", due: "2026-11-21", tags: ["People"], assignees: ["AM"], files: 1, comments: 1 },
    { title: "Validate the assessment evidence", status: "review", priority: "High", due: "2026-11-24", tags: ["Assessment"], assignees: ["NS", "DW"], files: 4, comments: 2 },
    { title: "Agree on improvement priorities", status: "review", priority: "Medium", due: "2026-11-26", tags: ["Strategy"], assignees: ["AM", "DW"], files: 2, comments: 3 },
    { title: "Confirm assessment scope", status: "done", priority: "Low", due: "2026-11-12", tags: ["Planning"], assignees: ["AM"], files: 1, comments: 2 },
    { title: "Invite the assessment team", status: "done", priority: "Low", due: "2026-11-13", tags: ["People"], assignees: ["AM", "RP"], files: 0, comments: 1 },
];

export const initialTasks: PreviewTask[] = projects.flatMap(project => templates.map((task, i) => ({ ...task, id: `${project.id}-${i}`, project: project.id })));

export function selectTasks(tasks: PreviewTask[], project: string, query: string, highOnly: boolean, mineOnly: boolean, sort: "due" | "priority") {
    const priorityRank = { High: 0, Medium: 1, Low: 2 };
    const search = query.trim().toLowerCase();
    return tasks.filter(task => task.project === project
        && (!highOnly || task.priority === "High")
        && (!mineOnly || task.assignees.includes("AM"))
        && `${task.title} ${task.tags.join(" ")}`.toLowerCase().includes(search))
        .sort((a, b) => sort === "due" ? a.due.localeCompare(b.due) : priorityRank[a.priority] - priorityRank[b.priority] || a.due.localeCompare(b.due));
}

export function summarizeTasks(tasks: PreviewTask[]) {
    const completed = tasks.filter(task => task.status === "done").length;
    return { total: tasks.length, completed, progress: tasks.length ? Math.round(completed / tasks.length * 100) : 0 };
}

export function formatDate(date: string) {
    return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`));
}
