"use client";

import { Dialog } from "@base-ui/react/dialog";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
    ArrowUpRight, BarChart3, CalendarClock, CheckCircle2, CheckSquare,
    ChevronRight, Circle, ClipboardList, Clock, FolderOpen, Layers, Layers2,
    LayoutDashboard, ListOrdered, LogOut, Menu, Moon, PanelLeftClose,
    PanelLeftOpen, Plus, RefreshCw, Search, Settings, Sun, Upload, Users, X, XCircle,
} from "lucide-react";
import { Alert, BrandLink, Button, IconButton, IconLink, LoadingState, NavigationButton, NavigationLink, SearchField } from "@/components/ui";
import ui from "@/components/ui/ui.module.css";
import { useTheme } from "@/hooks/useTheme";
import { useWorkspaceAssessments } from "@/hooks/useWorkspaceAssessments";
import type { SessionStatus, User } from "@/types";
import styles from "./WorkspaceSidebar.module.css";

const overview = { href: "/dashboard", label: "Overview", icon: LayoutDashboard };
const settings = { href: "/dashboard/settings", label: "Settings", icon: Settings };
const userNavItems = [
    overview,
    { href: "/dashboard/projects", label: "Projects", icon: FolderOpen },
    { href: "/dashboard/upload", label: "Upload log", icon: Upload },
    { href: "/dashboard/results", label: "Results", icon: BarChart3 },
    settings,
];
const adminNavItems = [
    overview,
    { href: "/dashboard/dimensions", label: "Dimensions", icon: Layers },
    { href: "/dashboard/subdimensions", label: "Sub-dimensions", icon: Layers2 },
    { href: "/dashboard/levels", label: "Levels", icon: ListOrdered },
    { href: "/dashboard/criteria", label: "Criteria", icon: CheckSquare },
    { href: "/dashboard/admin-sessions", label: "Assessments", icon: ClipboardList },
    settings,
];
const companyNavItems = [
    overview,
    { href: "/dashboard/manage-sessions", label: "Assessments", icon: ClipboardList },
    { href: "/dashboard/members", label: "Team members", icon: Users },
    { href: "/dashboard/assessment", label: "Assessment criteria", icon: CheckSquare },
    settings,
];
const memberNavItems = [
    overview,
    { href: "/dashboard/sessions", label: "My sessions", icon: ClipboardList },
    settings,
];
const statusIcons: Record<SessionStatus, typeof Circle> = {
    draft: Circle, scheduled: CalendarClock, active: Clock,
    completed: CheckCircle2, cancelled: XCircle,
};

export default function WorkspaceSidebar({ user, onLogout }: { user: User; onLogout: () => void }) {
    const pathname = usePathname();
    const { theme, toggleTheme } = useTheme();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [query, setQuery] = useState("");
    const desktopSearch = useRef<HTMLInputElement>(null);
    const mobileSearch = useRef<HTMLInputElement>(null);
    const pendingSearchFocus = useRef(false);
    const isAdmin = user.accountRole === "superAdmin" || user.role === "superAdmin";
    const isCompany = !isAdmin && user.accountRole === "Company" && !user.createdBy;
    const isMember = !isAdmin && user.accountRole === "Company" && !!user.createdBy;
    const navItems = isAdmin ? adminNavItems : isCompany ? companyNavItems : isMember ? memberNavItems : userNavItems;
    const endpoint = isAdmin ? "/sessions/admin" : isCompany ? "/sessions/company" : isMember ? "/sessions/my" : null;
    const sessionBase = isAdmin ? "/dashboard/admin-sessions" : isCompany ? "/dashboard/manage-sessions" : "/dashboard/sessions";
    const workspaceLabel = isAdmin ? "Admin workspace" : isCompany ? "Company workspace" : isMember ? "Assessor workspace" : "Project workspace";
    const { sessions, loading, error, refresh: retry } = useWorkspaceAssessments(endpoint, user._id, pathname);
    const search = query.trim().toLowerCase();
    const filteredNav = navItems.filter(item => item.label.toLowerCase().includes(search));
    const filteredSessions = sessions.filter(session => `${session.title} ${session.company?.name ?? ""}`.toLowerCase().includes(search));
    const showAppearance = "themes & appearance".includes(search);

    function focusSearch() {
        if (window.matchMedia("(max-width: 767px)").matches) {
            setMobileOpen(true);
            mobileSearch.current?.focus();
        } else if (collapsed) {
            pendingSearchFocus.current = true;
            setCollapsed(false);
        } else desktopSearch.current?.focus();
    }

    useEffect(() => {
        if (!collapsed && pendingSearchFocus.current) {
            desktopSearch.current?.focus();
            pendingSearchFocus.current = false;
        }
    }, [collapsed]);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement;
            const typing = target.closest("input, textarea, select, [contenteditable='true'], [role='textbox']");
            const shortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
            if (shortcut || (event.key === "/" && !typing && !event.altKey && !event.ctrlKey && !event.metaKey)) {
                if (document.querySelector('[role="dialog"]') && !mobileOpen) return;
                event.preventDefault();
                focusSearch();
            }
        };
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    });

    useEffect(() => {
        const media = window.matchMedia("(max-width: 767px)");
        const onResize = () => { if (!media.matches) setMobileOpen(false); };
        media.addEventListener("change", onResize);
        return () => media.removeEventListener("change", onResize);
    }, []);

    const onNavigate = () => { setMobileOpen(false); setQuery(""); };

    function sidebarContent(mobile = false) {
        const compact = collapsed && !mobile;
        return <>
            <header className={styles.header}>
                {!compact && <BrandLink href="/dashboard" subtitle={workspaceLabel} className={styles.brand}
                    aria-label="Karta workspace" onNavigate={onNavigate} />}
                <IconButton
                    aria-label={mobile ? "Close navigation" : compact ? "Expand sidebar" : "Collapse sidebar"}
                    title={mobile ? "Close navigation" : compact ? "Expand sidebar" : "Collapse sidebar"}
                    aria-expanded={mobile ? true : !compact}
                    onClick={() => mobile ? setMobileOpen(false) : setCollapsed(value => !value)}>
                    {mobile ? <X aria-hidden="true" /> : compact ? <PanelLeftOpen aria-hidden="true" /> : <PanelLeftClose aria-hidden="true" />}
                </IconButton>
            </header>
            <div className={styles.searchArea}>
                {compact
                    ? <IconButton aria-label="Search workspace" title="Search workspace" onClick={focusSearch}><Search aria-hidden="true" /></IconButton>
                    : <SearchField ref={mobile ? mobileSearch : desktopSearch} value={query}
                        label="Search navigation and assessments" hint="Filter menu items and assessments. Press / or Control+K to search."
                        hideLabel hideHint placeholder="Search" shortcut="/" aria-keyshortcuts="Control+k Meta+k /"
                        onChange={event => setQuery(event.target.value)} onClear={() => setQuery("")}
                        onKeyDown={event => { if (event.key === "Escape" && query) { event.stopPropagation(); setQuery(""); } }} />}
            </div>
            <div className={styles.scrollArea} data-lenis-prevent>
                <nav aria-label="Main menu" className={styles.navigation}>
                    {!compact && <p className={styles.sectionLabel}>Main menu</p>}
                    {filteredNav.map(({ href, label, icon: Icon }) => {
                        const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
                        const hasChildren = ["/dashboard/projects", "/dashboard/manage-sessions", "/dashboard/sessions", "/dashboard/admin-sessions"].includes(href);
                        return <NavigationLink key={href} href={href} onNavigate={onNavigate} title={label}
                            compact={compact} selected={active} leadingIcon={<Icon />} trailingIcon={hasChildren ? <ChevronRight /> : undefined}
                            aria-current={active ? pathname === href ? "page" : "location" : undefined}>{label}</NavigationLink>;
                    })}
                    {showAppearance && <NavigationButton onClick={toggleTheme} compact={compact}
                        leadingIcon={theme === "dark" ? <Moon /> : <Sun />}
                        aria-label={`Themes & appearance: switch to ${theme === "dark" ? "light" : "dark"} mode`}
                        title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>Themes & appearance</NavigationButton>}
                    {!compact && !filteredNav.length && !showAppearance && <p className={styles.empty}>No menu items found.</p>}
                </nav>
                {endpoint && <section className={styles.assessments} aria-label={isMember ? "Assigned assessments" : "Created assessments"}>
                    <div className={styles.sectionHeading}>
                        {!compact && <><h2 className={styles.sectionLabel}>{isMember ? "Assigned assessments" : "Assessments"}</h2>{!loading && !error && <span className={styles.count}>{sessions.length}</span>}</>}
                        {isCompany && <IconLink href="/dashboard/manage-sessions?create=true" className={styles.addAssessment}
                            aria-label="Create assessment" title="Create assessment" onNavigate={onNavigate}><Plus aria-hidden="true" /></IconLink>}
                        {compact && !isCompany && <ClipboardList className={styles.sectionIcon} aria-hidden="true" />}
                    </div>
                    {loading ? <LoadingState inline iconOnly={compact}>Loading assessments.</LoadingState> :
                        error ? compact
                            ? <IconButton aria-label="Retry loading assessments" title="Retry loading assessments" onClick={retry}><RefreshCw aria-hidden="true" /></IconButton>
                            : <Alert variant="error"><p>Couldn't load assessments.</p><Button variant="secondary" onClick={retry}>Retry</Button></Alert> :
                        !filteredSessions.length ? !compact && <p className={styles.empty}>{search ? "No matching assessments." : isMember ? "No assessments assigned yet." : "No assessments created yet."}</p> :
                        <ul className={styles.assessmentList}>
                            {filteredSessions.map(session => {
                                const href = `${sessionBase}/${session._id}`;
                                const active = pathname === href || pathname.startsWith(`${href}/`);
                                const StatusIcon = statusIcons[session.status] ?? Circle;
                                return <li key={session._id}><NavigationLink href={href} onNavigate={onNavigate} prefetch={false}
                                    compact={compact} selected={active} trailingIcon={!compact ? <StatusIcon /> : undefined}
                                    leadingIcon={compact ? <StatusIcon /> : undefined}
                                    title={`${session.title} - ${session.status}`} aria-label={`${session.title}, ${session.status}`} aria-current={active ? "page" : undefined}>
                                    {session.title}
                                </NavigationLink></li>;
                            })}
                        </ul>}
                </section>}
            </div>
            <footer className={styles.footer}>
                {!compact && <Link href="/docs" className={`${ui.textLink} ${styles.helpLink}`} onNavigate={onNavigate}><span>Help & documentation</span><ArrowUpRight aria-hidden="true" /></Link>}
                <div className={styles.account}>
                    <Link href="/dashboard/settings" className={styles.profile} onNavigate={onNavigate} title={`${user.name} - Account settings`} aria-label={`${user.name}, account settings`}>
                        <span className={styles.avatar}>{user.name?.charAt(0).toUpperCase() || "U"}</span>
                        {!compact && <span className={styles.userCopy}><strong>{user.name}</strong><span>{user.email}</span></span>}
                    </Link>
                    <IconButton aria-label="Sign out" title="Sign out" onClick={onLogout}><LogOut aria-hidden="true" /></IconButton>
                </div>
            </footer>
        </>;
    }

    return <>
        <a href="#workspace-content" className={styles.skipLink}>Skip to content</a>
        <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`} aria-label="Workspace navigation">{sidebarContent()}</aside>
        <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
            <div className={styles.mobileBar}>
                <BrandLink href="/dashboard" aria-label="Karta workspace" />
                <Dialog.Trigger render={<IconButton aria-label="Open navigation" />}><Menu aria-hidden="true" /></Dialog.Trigger>
            </div>
            <Dialog.Portal>
                <Dialog.Backdrop className={styles.backdrop} />
                <Dialog.Popup className={`${styles.sidebar} ${styles.drawer}`} initialFocus={mobileSearch}>
                    <Dialog.Title className="sr-only">Workspace navigation</Dialog.Title>
                    <Dialog.Description className="sr-only">Search your workspace, open an assessment, or navigate to a page.</Dialog.Description>
                    {sidebarContent(true)}
                </Dialog.Popup>
            </Dialog.Portal>
        </Dialog.Root>
    </>;
}
