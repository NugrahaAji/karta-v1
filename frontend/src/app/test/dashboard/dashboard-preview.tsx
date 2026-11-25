"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
    ArrowDownWideNarrow, ArrowUpRight, CalendarDays, ChartNoAxesCombined,
    Check, ChevronDown, ChevronLeft, ChevronRight, CircleCheck, CircleDashed,
    ClipboardCheck, Clock3, FileText, Flag, FlaskConical, Folder, Home, LayoutGrid,
    List, Menu, MessageSquare, PanelLeftClose, PanelLeftOpen, Paperclip, Plus,
    SlidersHorizontal, Target, Users,
} from "lucide-react";
import { BrandLink, Button, IconButton, Modal, NavigationButton, NavigationLink, SearchField, SelectField, TextField } from "@/components/ui";
import { ThemeToggle } from "@/components/ThemeToggle";
import { formatDate, initialTasks, projects, selectTasks, statuses, summarizeTasks, team, type PreviewTask, type Priority, type TaskStatus } from "./preview-data";
import styles from "./preview.module.css";

type View = "board" | "list" | "calendar";
const statusIcons = { backlog: Target, progress: Clock3, review: CircleDashed, done: CircleCheck };
const viewOptions = [{ id: "calendar", label: "Calendar", icon: CalendarDays }, { id: "board", label: "Board", icon: LayoutGrid }, { id: "list", label: "List", icon: List }] as const;
const emptyDraft = { title: "", priority: "Medium" as Priority, status: "backlog" as TaskStatus, due: "2026-11-20" };

function Avatars({ people }: { people: string[] }) {
    return <span className={styles.avatars}>{people.map(initials => <span key={initials} className={styles.avatar} role="img" aria-label={team.find(person => person.initials === initials)?.name ?? initials} title={team.find(person => person.initials === initials)?.name}>{initials}</span>)}</span>;
}

function PriorityLabel({ priority }: { priority: Priority }) {
    return <span className={styles.priority} data-priority={priority}><Flag aria-hidden="true" />{priority}</span>;
}

function TaskCard({ task, onOpen }: { task: PreviewTask; onOpen: () => void }) {
    return <article className={styles.taskCard}>
        <PriorityLabel priority={task.priority} />
        <h3><button type="button" onClick={onOpen}>{task.title}</button></h3>
        <div className={styles.taskMeta}>
            <span><CalendarDays aria-hidden="true" /><time dateTime={task.due}>{formatDate(task.due)}</time></span>
            <span><Paperclip aria-hidden="true" />{task.files} {task.files === 1 ? "file" : "files"}</span>
        </div>
        <ul className={styles.tags} aria-label="Task categories">{task.tags.map(tag => <li key={tag}>{tag}</li>)}</ul>
        <footer className={styles.taskFooter}><Avatars people={task.assignees} /><span className={styles.comments}><MessageSquare aria-hidden="true" /><span className={styles.srOnly}>Comments: </span>{task.comments}</span></footer>
    </article>;
}

export default function DashboardPreview() {
    const [tasks, setTasks] = useState(initialTasks);
    const [projectItems, setProjectItems] = useState(projects);
    const [projectId, setProjectId] = useState(projects[0].id);
    const [view, setView] = useState<View>("board");
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [workspaceOpen, setWorkspaceOpen] = useState(true);
    const [query, setQuery] = useState("");
    const [highOnly, setHighOnly] = useState(false);
    const [mineOnly, setMineOnly] = useState(false);
    const [sort, setSort] = useState<"due" | "priority">("due");
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [adding, setAdding] = useState(false);
    const [draft, setDraft] = useState(emptyDraft);
    const [draftError, setDraftError] = useState("");
    const [info, setInfo] = useState<"team" | "report" | null>(null);
    const [addingProject, setAddingProject] = useState(false);
    const [projectName, setProjectName] = useState("");
    const [projectError, setProjectError] = useState("");
    const [calendarMonth, setCalendarMonth] = useState(new Date(Date.UTC(2026, 10, 1)));

    const project = projectItems.find(item => item.id === projectId)!;
    const projectTasks = tasks.filter(task => task.project === projectId);
    const visibleTasks = selectTasks(tasks, projectId, query, highOnly, mineOnly, sort);
    const summary = summarizeTasks(projectTasks);
    const selectedTask = tasks.find(task => task.id === selectedId);
    const activeCount = projectTasks.filter(task => task.status === "progress").length;
    const reviewCount = projectTasks.filter(task => task.status === "review").length;
    const monthLabel = new Intl.DateTimeFormat("en", { month: "long", year: "numeric", timeZone: "UTC" }).format(calendarMonth);
    const year = calendarMonth.getUTCFullYear();
    const month = calendarMonth.getUTCMonth();
    const monthDays = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const calendarCells = Array.from({ length: Math.ceil((calendarMonth.getUTCDay() + monthDays) / 7) * 7 }, (_, index) => index - calendarMonth.getUTCDay() + 1);

    function chooseProject(id: string) {
        setProjectId(id); setQuery(""); setHighOnly(false); setMineOnly(false); setView("board"); setMobileOpen(false);
    }
    function updateTask(id: string, patch: Partial<PreviewTask>) {
        setTasks(current => current.map(task => task.id === id ? { ...task, ...patch } : task));
    }
    function openCreate(status: TaskStatus = "backlog", due = "2026-11-20") {
        setDraft({ ...emptyDraft, status, due }); setDraftError(""); setAdding(true);
    }
    function createTask(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!draft.title.trim()) { setDraftError("Enter a task title."); return; }
        setTasks(current => [...current, { ...draft, title: draft.title.trim(), id: crypto.randomUUID(), project: projectId, tags: ["Assessment"], assignees: ["AM"], files: 0, comments: 0 }]);
        setAdding(false); setQuery(""); setHighOnly(false);
    }
    function createProject(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!projectName.trim()) { setProjectError("Enter a project name."); return; }
        const id = crypto.randomUUID();
        setProjectItems(current => [...current, { id, title: projectName.trim(), description: "A new assessment workspace. Add a task to start planning." }]);
        chooseProject(id); setAddingProject(false); setProjectName("");
    }
    function navigate(action: () => void) { action(); setMobileOpen(false); }

    function sidebar(compact = false) {
        return <div className={styles.sidebarContent}>
            <div className={styles.sidebarBrand}>
                <BrandLink compact={compact} />
                <span className={styles.desktopCollapse}><IconButton aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} onClick={() => setCollapsed(value => !value)}>{collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}</IconButton></span>
            </div>
            <nav className={styles.sidebarNavigation} aria-label="Preview workspace navigation">
                {!compact && <p className={styles.sectionLabel}>Main</p>}
                <NavigationButton compact={compact} leadingIcon={<Home />} selected={!mineOnly && view !== "calendar"} onClick={() => navigate(() => { setMineOnly(false); setView("board"); })}>Overview</NavigationButton>
                <NavigationButton compact={compact} leadingIcon={<ClipboardCheck />} selected={mineOnly} onClick={() => navigate(() => { setMineOnly(value => !value); setView("board"); })} aria-pressed={mineOnly}>My actions</NavigationButton>
                <NavigationButton compact={compact} leadingIcon={<CalendarDays />} selected={view === "calendar"} onClick={() => navigate(() => setView("calendar"))}>Calendar</NavigationButton>
                <NavigationButton compact={compact} leadingIcon={<Users />} onClick={() => navigate(() => setInfo("team"))}>Team</NavigationButton>
                <NavigationLink compact={compact} leadingIcon={<FileText />} href="/docs">Documentation</NavigationLink>
                <NavigationButton compact={compact} leadingIcon={<ChartNoAxesCombined />} onClick={() => navigate(() => setInfo("report"))}>Reports</NavigationButton>
            </nav>
            <div className={styles.workspaceNavigation}>
                {!compact && <p className={styles.sectionLabel}>Workspace</p>}
                <NavigationButton compact={compact} leadingIcon={<span className={styles.workspaceMark}><LayoutGrid /></span>} onClick={() => navigate(() => chooseProject("onboarding"))}>Customer experience</NavigationButton>
                <NavigationButton compact={compact} leadingIcon={<span className={styles.workspaceMark}><Users /></span>} trailingIcon={workspaceOpen ? <ChevronDown /> : <ChevronRight />} aria-expanded={!compact && workspaceOpen} onClick={() => { if (compact) { setCollapsed(false); setWorkspaceOpen(true); } else setWorkspaceOpen(value => !value); }}>Product & technology</NavigationButton>
                {!compact && workspaceOpen && <div className={styles.projectTree}>
                    {projectItems.map(item => <NavigationButton key={item.id} leadingIcon={<Folder />} selected={projectId === item.id} onClick={() => chooseProject(item.id)}>{item.title}</NavigationButton>)}
                    <NavigationButton leadingIcon={<Plus />} onClick={() => navigate(() => { setProjectError(""); setAddingProject(true); })}>Add project</NavigationButton>
                </div>}
            </div>
            <div className={styles.sidebarBottom}>
                {!compact && <p className={styles.sectionLabel}>Support</p>}
                <NavigationLink compact={compact} leadingIcon={<ArrowUpRight />} href="/docs/getting-started">Assessment guide</NavigationLink>
                <div className={styles.profile}><span className={styles.avatar} aria-hidden="true">AM</span>{!compact && <div><strong>Alya Mahendra</strong><span>Preview workspace</span></div>}</div>
            </div>
        </div>;
    }

    return <div className={styles.stage} data-lenis-prevent>
        <div className={styles.previewBar}><span><FlaskConical aria-hidden="true" />Temporary preview <span className={styles.previewNote}>· Sample data resets on refresh</span></span><Link href="/">Back to Karta <ArrowUpRight aria-hidden="true" /></Link></div>
        <div className={styles.workspace} data-collapsed={collapsed}>
            <aside className={styles.sidebar} aria-label="Workspace sidebar">{sidebar(collapsed)}</aside>
            <div className={styles.main}>
                <header className={styles.topbar}>
                    <span className={styles.mobileMenuButton}><IconButton aria-label="Open workspace navigation" onClick={() => setMobileOpen(true)}><Menu /></IconButton></span>
                    <nav className={styles.breadcrumbs} aria-label="Breadcrumb"><span>Workspace</span><ChevronRight aria-hidden="true" /><span>Product & technology</span></nav>
                    <div className={styles.topbarActions}><span className={styles.sampleLabel}>Sample workspace</span><ThemeToggle /></div>
                </header>
                <main id="preview-content" className={styles.content}>
                    <div className={styles.pageHeading}><div><h1>{project.title}</h1><p>{project.description}</p></div><Button leadingIcon={<Plus aria-hidden="true" />} onClick={() => openCreate()}>New task</Button></div>
                    <section className={styles.summaryGrid} aria-label="Project summary">
                        <article className={styles.summaryCard}>
                            <h2><Folder aria-hidden="true" />Assessment momentum</h2>
                            <p className={styles.metric}><strong>{summary.progress}%</strong><span>completed</span></p>
                            <div className={styles.progressBars} role="progressbar" aria-label="Assessment task completion" aria-valuenow={summary.progress} aria-valuemin={0} aria-valuemax={100}>{Array.from({ length: 32 }, (_, i) => <span key={i} data-filled={i < Math.round(summary.progress * 32 / 100)} />)}</div>
                            <p>{summary.completed} of {summary.total} tasks finished</p>
                            <footer>{summary.total - summary.completed} actions left to complete this assessment.</footer>
                        </article>
                        <article className={styles.summaryCard}>
                            <h2><Clock3 aria-hidden="true" />Work in motion</h2><p className={styles.metric}><strong>{activeCount + reviewCount}</strong><span>active actions</span></p>
                            <dl className={styles.miniStats}><div><dt>In progress</dt><dd>{activeCount}</dd></div><div><dt>Ready for review</dt><dd>{reviewCount}</dd></div></dl>
                            <footer>Review evidence and agree on the next step.</footer>
                        </article>
                        <article className={styles.summaryCard}>
                            <h2><Users aria-hidden="true" />Assessment team</h2><p className={styles.metric}><strong>{team.length}</strong><span>collaborators</span></p>
                            <div className={styles.teamSummary}><Avatars people={team.map(person => person.initials)} /><button type="button" className={styles.textAction} onClick={() => setInfo("team")}>View team <ArrowUpRight aria-hidden="true" /></button></div>
                            <footer>Different perspectives. One shared assessment.</footer>
                        </article>
                    </section>
                    <section className={styles.workArea} aria-labelledby="task-view-heading">
                        <h2 id="task-view-heading" className={styles.srOnly}>Assessment tasks</h2>
                        <div className={styles.toolbar}>
                            <div className={styles.viewControls} role="group" aria-label="Task view">{viewOptions.map(({ id, label, icon: Icon }) => <Button key={id} variant={view === id ? "primary" : "secondary"} aria-pressed={view === id} leadingIcon={<Icon aria-hidden="true" />} onClick={() => setView(id)}>{label}</Button>)}</div>
                            <div className={styles.filterControls}>
                                <div className={styles.search}><SearchField label="Search tasks" hint="Search task titles and categories." hideLabel hideHint placeholder="Search tasks" value={query} onChange={event => setQuery(event.target.value)} onClear={() => setQuery("")} /></div>
                                <IconButton aria-label={highOnly ? "Show all priorities" : "Show high priority only"} title={highOnly ? "Show all priorities" : "Show high priority only"} aria-pressed={highOnly} onClick={() => setHighOnly(value => !value)}><SlidersHorizontal /></IconButton>
                                <IconButton aria-label={sort === "due" ? "Sort by priority" : "Sort by due date"} title={sort === "due" ? "Sort by priority" : "Sort by due date"} onClick={() => setSort(value => value === "due" ? "priority" : "due")}><ArrowDownWideNarrow /></IconButton>
                            </div>
                        </div>
                        <div className={styles.filterSummary} aria-live="polite"><span>{visibleTasks.length} of {summary.total} tasks{mineOnly && " · Assigned to me"}{highOnly && " · High priority"} · Sorted by {sort === "due" ? "due date" : "priority"}</span>{(query || mineOnly || highOnly) && <button type="button" className={styles.textAction} onClick={() => { setQuery(""); setMineOnly(false); setHighOnly(false); }}>Clear filters</button>}</div>
                        {view === "board" && <div className={styles.board}>
                            {statuses.map(({ id, label }) => {
                                const Icon = statusIcons[id];
                                const columnTasks = visibleTasks.filter(task => task.status === id);
                                return <section className={styles.column} key={id} aria-labelledby={`column-${id}`}>
                                    <header className={styles.columnHeading}><h2 id={`column-${id}`}><Icon aria-hidden="true" />{label}<span>{columnTasks.length}</span></h2><IconButton aria-label={`Add task to ${label.toLowerCase()}`} onClick={() => openCreate(id)}><Plus /></IconButton></header>
                                    <div className={styles.taskStack}>{columnTasks.map(task => <TaskCard key={task.id} task={task} onOpen={() => setSelectedId(task.id)} />)}{columnTasks.length === 0 && <p className={styles.emptyColumn}>No tasks here{query || highOnly || mineOnly ? " match your filters." : " yet."}</p>}</div>
                                </section>;
                            })}
                        </div>}
                        {view === "list" && <div className={styles.listWrap}><table className={styles.taskTable}><caption className={styles.srOnly}>Tasks for {project.title}</caption><thead><tr><th>Task</th><th>Status</th><th>Priority</th><th>Due date</th><th>Assignees</th></tr></thead><tbody>{visibleTasks.map(task => <tr key={task.id}><td><button type="button" className={styles.textAction} onClick={() => setSelectedId(task.id)}>{task.title}</button></td><td>{statuses.find(status => status.id === task.status)?.label}</td><td><PriorityLabel priority={task.priority} /></td><td><time dateTime={task.due}>{formatDate(task.due)}</time></td><td><Avatars people={task.assignees} /></td></tr>)}{visibleTasks.length === 0 && <tr><td colSpan={5}>No tasks match your filters.</td></tr>}</tbody></table></div>}
                        {view === "calendar" && <div className={styles.calendar}>
                            <header className={styles.calendarHeading}><h3>{monthLabel}</h3><div><IconButton aria-label="Previous month" onClick={() => setCalendarMonth(new Date(Date.UTC(year, month - 1, 1)))}><ChevronLeft /></IconButton><IconButton aria-label="Next month" onClick={() => setCalendarMonth(new Date(Date.UTC(year, month + 1, 1)))}><ChevronRight /></IconButton></div></header>
                            <div className={styles.calendarScroll}><div className={styles.calendarGrid}>{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => <span className={styles.weekday} key={day}>{day}</span>)}{calendarCells.map((day, index) => {
                                const valid = day > 0 && day <= monthDays;
                                const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                                return <div className={styles.calendarDay} key={index} data-outside={!valid}>{valid && <><button type="button" className={styles.dayNumber} aria-label={`Add task on ${formatDate(date)}, ${year}`} onClick={() => openCreate("backlog", date)}>{day}</button>{visibleTasks.filter(task => task.due === date).map(task => <button key={task.id} type="button" className={styles.calendarTask} onClick={() => setSelectedId(task.id)}>{task.title}</button>)}</>}</div>;
                            })}</div></div>
                        </div>}
                    </section>
                </main>
            </div>
        </div>

        <Modal open={mobileOpen} onClose={() => setMobileOpen(false)} title="Workspace navigation" description="Explore the temporary dashboard preview.">{sidebar()}</Modal>
        <Modal open={adding} onClose={() => setAdding(false)} title="New assessment task" description="This task stays in the preview and resets on refresh." icon={<Plus />}>
            <form className={styles.form} onSubmit={createTask}>
                <TextField label="Task title" hint="Describe one action the team can complete." value={draft.title} onChange={event => { setDraft(current => ({ ...current, title: event.target.value })); setDraftError(""); }} error={draftError || undefined} required maxLength={140} />
                <div className={styles.formRow}><SelectField label="Status" hint="Choose a board column." value={draft.status} onChange={event => setDraft(current => ({ ...current, status: event.target.value as TaskStatus }))}>{statuses.map(status => <option key={status.id} value={status.id}>{status.label}</option>)}</SelectField><SelectField label="Priority" hint="Set the task’s importance." value={draft.priority} onChange={event => setDraft(current => ({ ...current, priority: event.target.value as Priority }))}>{["High", "Medium", "Low"].map(priority => <option key={priority}>{priority}</option>)}</SelectField></div>
                <TextField label="Due date" type="date" hint="The task will appear on this date in the calendar." value={draft.due} onChange={event => setDraft(current => ({ ...current, due: event.target.value }))} required />
                <div className={styles.formActions}><Button variant="secondary" onClick={() => setAdding(false)}>Cancel</Button><Button type="submit" leadingIcon={<Plus />}>Add task</Button></div>
            </form>
        </Modal>
        <Modal open={Boolean(selectedTask)} onClose={() => setSelectedId(null)} title={selectedTask?.title ?? "Task details"} description="Update the sample task. Changes apply only to this preview." icon={<ClipboardCheck />}>
            {selectedTask && <div className={styles.form}>
                <div className={styles.detailMeta}><Avatars people={selectedTask.assignees} /><span>Due {formatDate(selectedTask.due)}</span></div>
                <SelectField label="Status" hint="Move this task to another board column." value={selectedTask.status} onChange={event => updateTask(selectedTask.id, { status: event.target.value as TaskStatus })}>{statuses.map(status => <option key={status.id} value={status.id}>{status.label}</option>)}</SelectField>
                <SelectField label="Priority" hint="Changes are reflected in filters and sorting." value={selectedTask.priority} onChange={event => updateTask(selectedTask.id, { priority: event.target.value as Priority })}>{["High", "Medium", "Low"].map(priority => <option key={priority}>{priority}</option>)}</SelectField>
                <p className={styles.supportingCopy}>Attachments and comment counts are illustrative metadata. This preview does not contain uploaded files or conversations.</p>
                <div className={styles.formActions}><Button variant="secondary" onClick={() => setSelectedId(null)}>Close</Button><Button disabled={selectedTask.status === "done"} leadingIcon={<Check />} onClick={() => { updateTask(selectedTask.id, { status: "done" }); setSelectedId(null); }}>Mark complete</Button></div>
            </div>}
        </Modal>
        <Modal open={info !== null} onClose={() => setInfo(null)} title={info === "team" ? "Assessment team" : "Assessment summary"} description={info === "team" ? "Sample collaborators for this layout preview." : `Task progress for ${project.title}.`} icon={info === "team" ? <Users /> : <ChartNoAxesCombined />}>
            {info === "team" ? <ul className={styles.teamList}>{team.map(person => <li key={person.initials}><Avatars people={[person.initials]} /><div><strong>{person.name}</strong><span>{person.role}</span></div></li>)}</ul> : <div className={styles.form}><p className={styles.reportMetric}>{summary.progress}% complete</p><dl className={styles.reportList}>{statuses.map(status => <div key={status.id}><dt>{status.label}</dt><dd>{projectTasks.filter(task => task.status === status.id).length}</dd></div>)}</dl><Button onClick={() => { setInfo(null); setView("list"); }}>View task list</Button></div>}
        </Modal>
        <Modal open={addingProject} onClose={() => setAddingProject(false)} title="New preview project" description="Create an empty project to test the layout. It resets on refresh." icon={<Folder />}>
            <form className={styles.form} onSubmit={createProject}><TextField label="Project name" hint="Use a short, recognizable name." value={projectName} onChange={event => { setProjectName(event.target.value); setProjectError(""); }} error={projectError || undefined} maxLength={80} required /><div className={styles.formActions}><Button variant="secondary" onClick={() => setAddingProject(false)}>Cancel</Button><Button type="submit">Create project</Button></div></form>
        </Modal>
    </div>;
}
