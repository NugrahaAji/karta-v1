"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dialog } from "@base-ui/react/dialog";
import {
    BarChart3, CalendarClock, CheckSquare, ChevronRight, CircleCheck,
    ClipboardList, Clock3, FolderOpen, Layers, Layers2, LayoutDashboard,
    ListOrdered, LogOut, Menu, Moon, PanelLeftClose, PanelLeftOpen,
    Plus, Search, Settings, Sun, Upload, Users, X, CircleDashed, CircleX,
} from "lucide-react";
import { clsx } from "clsx";
import Logo from "@/components/Logo";
import { useTheme } from "@/hooks/useTheme";
import { useWorkspaceAssessments } from "@/hooks/useWorkspaceAssessments";
import type { SessionStatus, User } from "@/types";
import styles from "./workspace.module.css";

const overview = { href: "/dashboard", label: "Overview", icon: LayoutDashboard };
const settings = { href: "/dashboard/settings", label: "Settings", icon: Settings };
const navigation = {
    admin: [overview,
        { href: "/dashboard/dimensions", label: "Dimensions", icon: Layers },
        { href: "/dashboard/subdimensions", label: "Sub-dimensions", icon: Layers2 },
        { href: "/dashboard/levels", label: "Levels", icon: ListOrdered },
        { href: "/dashboard/criteria", label: "Criteria", icon: CheckSquare },
        { href: "/dashboard/admin-sessions", label: "Assessments", icon: ClipboardList }, settings],
    company: [overview,
        { href: "/dashboard/assessment", label: "Assessment criteria", icon: CheckSquare },
        { href: "/dashboard/members", label: "Team members", icon: Users },
        { href: "/dashboard/manage-sessions", label: "Sessions", icon: CalendarClock }, settings],
    member: [overview,
        { href: "/dashboard/sessions", label: "My sessions", icon: ClipboardList }, settings],
    personal: [overview,
        { href: "/dashboard/projects", label: "Projects", icon: FolderOpen },
        { href: "/dashboard/upload", label: "Upload log", icon: Upload },
        { href: "/dashboard/results", label: "Results", icon: BarChart3 }, settings],
};

const statusIcons: Record<SessionStatus, typeof Clock3> = {
    draft: CircleDashed, scheduled: CalendarClock, active: Clock3,
    completed: CircleCheck, cancelled: CircleX,
};

function workspaceRole(user: User): "admin" | "company" | "member" | "personal" {
    if (user.accountRole === "superAdmin" || user.role === "superAdmin") return "admin";
    if (user.accountRole === "Company") return user.createdBy ? "member" : "company";
    return "personal";
}

type SidebarProps = { user: User; logout: () => void };

export function WorkspaceSidebar({ user, logout }: SidebarProps) {
    const pathname = usePathname();
    const role = workspaceRole(user);
    const endpoint = role === "admin" ? "/sessions/admin" : role === "company" ? "/sessions/company" : role === "member" ? "/sessions/my" : null;
    const assessments = useWorkspaceAssessments(endpoint, user._id, pathname);
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        try { setCollapsed(localStorage.getItem("karta-sidebar-collapsed") === "true"); } catch { /* Storage is optional. */ }
    }, []);

    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    useEffect(() => {
        const media = window.matchMedia("(max-width: 767px)");
        const closeOnDesktop = () => { if (!media.matches) setMobileOpen(false); };
        const openSearch = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k" && media.matches) {
                event.preventDefault();
                setMobileOpen(true);
            }
        };
        media.addEventListener("change", closeOnDesktop);
        window.addEventListener("keydown", openSearch);
        return () => {
            media.removeEventListener("change", closeOnDesktop);
            window.removeEventListener("keydown", openSearch);
        };
    }, []);

    const toggleCollapsed = () => setCollapsed(value => {
        try { localStorage.setItem("karta-sidebar-collapsed", String(!value)); } catch { /* Storage is optional. */ }
        return !value;
    });
    const shared = { user, logout, role, pathname, assessments };

    return <>
        <aside className={clsx(styles.sidebar, collapsed && styles.collapsed)} aria-label="Workspace sidebar">
            <SidebarContent {...shared} collapsed={collapsed} onToggle={toggleCollapsed} />
        </aside>
        <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
            <header className={styles.mobileToolbar}>
                <Link href="/dashboard" className={styles.mobileBrand}><Logo /> <span>Karta</span></Link>
                <Dialog.Trigger className={styles.iconButton} aria-label="Open workspace navigation"><Menu aria-hidden="true" /></Dialog.Trigger>
            </header>
            <Dialog.Portal>
                <Dialog.Backdrop className={styles.backdrop} />
                <Dialog.Popup className={styles.drawer}>
                    <Dialog.Title className={styles.srOnly}>Workspace navigation</Dialog.Title>
                    <SidebarContent {...shared} mobile onToggle={() => setMobileOpen(false)} onNavigate={() => setMobileOpen(false)} />
                </Dialog.Popup>
            </Dialog.Portal>
        </Dialog.Root>
    </>;
}

function SidebarContent({ user, logout, role, pathname, assessments, collapsed = false, mobile = false, onToggle, onNavigate }: SidebarProps & {
    role: ReturnType<typeof workspaceRole>;
    pathname: string;
    assessments: ReturnType<typeof useWorkspaceAssessments>;
    collapsed?: boolean;
    mobile?: boolean;
    onToggle: () => void;
    onNavigate?: () => void;
}) {
    const { theme, toggleTheme } = useTheme();
    const [query, setQuery] = useState("");
    const [focusSearch, setFocusSearch] = useState(false);
    const searchRef = useRef<HTMLInputElement>(null);
    const menuId = useId();
    const assessmentId = useId();
    const { sessions, loading, error, refresh } = assessments;
    const search = query.trim().toLowerCase();
    const items = navigation[role].filter(item => item.label.toLowerCase().includes(search));
    const filteredSessions = sessions.filter(session =>
        `${session.title} ${session.company?.name ?? ""}`.toLowerCase().includes(search));
    const detailPath = role === "admin" ? "/dashboard/admin-sessions" : role === "company" ? "/dashboard/manage-sessions" : "/dashboard/sessions";
    const subtitle = role === "admin" ? "Admin workspace" : role === "member" ? "Assessor workspace" : role === "company" ? "Company workspace" : "Personal workspace";

    const revealSearch = () => {
        if (collapsed) onToggle();
        setFocusSearch(true);
    };

    useEffect(() => {
        if (focusSearch && !collapsed) {
            searchRef.current?.focus();
            setFocusSearch(false);
        }
    }, [focusSearch, collapsed]);

    useEffect(() => {
        if (mobile) return;
        const handleShortcut = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k" && !window.matchMedia("(max-width: 767px)").matches) {
                event.preventDefault();
                revealSearch();
            }
        };
        window.addEventListener("keydown", handleShortcut);
        return () => window.removeEventListener("keydown", handleShortcut);
    });

    const active = (href: string) => pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));

    return <>
        <div className={styles.brandRow}>
            <Link href="/dashboard" className={styles.brand} onClick={onNavigate} aria-label="Karta workspace" title={collapsed ? "Karta workspace" : undefined}>
                <Logo className={styles.brandMark} />
                {!collapsed && <span className={styles.brandCopy}><strong>Karta</strong><span>{subtitle}</span></span>}
            </Link>
            {!collapsed && <button type="button" className={styles.iconButton} onClick={onToggle} aria-label={mobile ? "Close navigation" : "Collapse sidebar"} title={mobile ? "Close navigation" : "Collapse sidebar"}>
                {mobile ? <X aria-hidden="true" /> : <PanelLeftClose aria-hidden="true" />}
            </button>}
        </div>

        <div className={styles.scrollArea} data-lenis-prevent>
            <div className={styles.searchArea}>
                {collapsed ? <button type="button" className={styles.iconButton} onClick={revealSearch} aria-label="Search workspace" title="Search workspace (Ctrl/⌘ K)"><Search aria-hidden="true" /></button> :
                    <div className={styles.searchBox}>
                        <Search aria-hidden="true" />
                        <input ref={searchRef} value={query} onChange={event => setQuery(event.target.value)} onKeyDown={event => { if (event.key === "Escape" && query) { event.stopPropagation(); setQuery(""); } }} type="search" aria-label="Search navigation and assessments" placeholder="Search" />
                        {query ? <button type="button" className={styles.clearSearch} onClick={() => { setQuery(""); searchRef.current?.focus(); }} aria-label="Clear search"><X aria-hidden="true" /></button> : <kbd aria-hidden="true">{typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘" : "Ctrl"} K</kbd>}
                    </div>}
            </div>

            <nav aria-labelledby={menuId} className={styles.navSection}>
                <h2 id={menuId} className={collapsed ? styles.srOnly : styles.sectionLabel}>Main menu</h2>
                <ul className={styles.list}>
                    {items.map(({ href, label, icon: Icon }) => <li key={href}>
                        <Link href={href} className={clsx(styles.navLink, active(href) && styles.active)} aria-current={active(href) ? "page" : undefined} aria-label={collapsed ? label : undefined} title={collapsed ? label : undefined} onClick={onNavigate}>
                            <Icon className={styles.navIcon} aria-hidden="true" />
                            {!collapsed && <><span className={styles.linkLabel}>{label}</span>{["Sessions", "My sessions", "Assessments", "Projects"].includes(label) && <ChevronRight className={styles.chevron} aria-hidden="true" />}</>}
                        </Link>
                    </li>)}
                </ul>
                {search && items.length === 0 && !collapsed && <p className={styles.helpText}>No matching pages.</p>}
            </nav>

            {role !== "personal" && <nav aria-labelledby={assessmentId} className={styles.assessmentSection}>
                <div className={styles.sectionHeading}>
                    <h2 id={assessmentId} className={collapsed ? styles.srOnly : styles.sectionLabel}>{role === "member" ? "My assessments" : "Assessments"}{!loading && !error && <span className={styles.count}>{sessions.length}</span>}</h2>
                    {role === "company" && <Link href="/dashboard/manage-sessions?create=true" className={styles.iconButton} aria-label="Create assessment" title="Create assessment" onClick={onNavigate}><Plus aria-hidden="true" /></Link>}
                </div>
                {loading && sessions.length === 0 && <div role="status" className={styles.loading}><span className={styles.srOnly}>Loading assessments</span>{[0, 1, 2].map(n => <span key={n} className={styles.skeleton} />)}</div>}
                {error && <div className={styles.helpText} role="status">{!collapsed && <p>Couldn’t load assessments.</p>}<button type="button" className={styles.retry} onClick={refresh} title="Retry loading assessments">Retry</button></div>}
                <ul className={styles.list}>
                    {filteredSessions.map(session => {
                        const href = `${detailPath}/${session._id}`;
                        const StatusIcon = statusIcons[session.status] ?? CircleDashed;
                        return <li key={session._id}>
                            <Link href={href} className={clsx(styles.navLink, styles.assessmentLink, active(href) && styles.active)} aria-current={active(href) ? "page" : undefined} aria-label={collapsed ? `${session.title} — ${session.status}` : undefined} title={`${session.title} — ${session.status}`} onClick={onNavigate}>
                                <span className={styles.assessmentInitial} data-status={session.status} aria-hidden="true">{session.title.trim().charAt(0).toUpperCase() || "A"}</span>
                                {!collapsed && <><span className={styles.linkLabel}>{session.title}</span><StatusIcon className={styles.statusIcon} aria-label={session.status} /></>}
                            </Link>
                        </li>;
                    })}
                </ul>
                {!loading && !error && filteredSessions.length === 0 && !collapsed && <p className={styles.helpText} role="status">{search ? "No matching assessments." : role === "member" ? "Your assigned assessments will appear here." : "No assessments yet."}</p>}
            </nav>}
        </div>

        <footer className={styles.footer}>
            {collapsed && <button type="button" className={styles.iconButton} onClick={onToggle} aria-label="Expand sidebar" title="Expand sidebar"><PanelLeftOpen aria-hidden="true" /></button>}
            <button type="button" className={styles.navLink} onClick={toggleTheme} aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"} title={collapsed ? "Change appearance" : undefined}>
                {theme === "dark" ? <Moon className={styles.navIcon} aria-hidden="true" /> : <Sun className={styles.navIcon} aria-hidden="true" />}
                {!collapsed && <><span className={styles.linkLabel}>Appearance</span><span className={styles.themeName}>{theme === "dark" ? "Dark" : "Light"}</span></>}
            </button>
            <div className={styles.accountRow}>
                <Link href="/dashboard/settings" className={styles.account} onClick={onNavigate} title={collapsed ? user.name : "Account settings"} aria-label={collapsed ? "Account settings" : undefined}>
                    <span className={styles.avatar} aria-hidden="true">{user.name?.charAt(0).toUpperCase() || "U"}</span>
                    {!collapsed && <span className={styles.accountCopy}><strong>{user.name}</strong><span>{user.email}</span></span>}
                </Link>
                <button type="button" className={styles.iconButton} onClick={logout} aria-label="Sign out" title="Sign out"><LogOut aria-hidden="true" /></button>
            </div>
        </footer>
    </>;
}
