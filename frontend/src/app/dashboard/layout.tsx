"use client";

import { useEffect } from "react";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    FolderOpen,
    Upload,
    BarChart3,
    Settings,
    LogOut,
    Layers,
    Layers2,
    ListOrdered,
    CheckSquare,
    ShieldCheck,
    Building2,
    Users,
    ClipboardList,
    CalendarClock,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ThemeToggle";
import { clsx } from "clsx";
import Logo from "@/components/Logo";
import CompanyOnboardingPanel from "@/components/CompanyOnboardingPanel";

const userNavItems = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/projects", label: "Projects", icon: FolderOpen },
    { href: "/dashboard/upload", label: "Upload Log", icon: Upload },
    { href: "/dashboard/results", label: "Results", icon: BarChart3 },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

const superAdminNavItems = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/dimensions", label: "Dimensions", icon: Layers },
    { href: "/dashboard/subdimensions", label: "Sub-Dimensions", icon: Layers2 },
    { href: "/dashboard/levels", label: "Levels", icon: ListOrdered },
    { href: "/dashboard/criteria", label: "Criteria", icon: CheckSquare },
    { href: "/dashboard/admin-sessions", label: "Assessments", icon: ClipboardList },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

const companyNavItems = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/assessment", label: "Assessment", icon: CheckSquare },
    { href: "/dashboard/members", label: "Team Members", icon: Users },
    { href: "/dashboard/manage-sessions", label: "Sessions", icon: CalendarClock },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

const companyMemberNavItems = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/sessions", label: "My Sessions", icon: ClipboardList },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, loading, logout } = useAuth();

    // Auth guard — must be in useEffect, never in render body.
    // Calling router.replace() during render causes React to re-render
    // mid-cycle, which is a violation and leads to extra render passes.
    useEffect(() => {
        if (!loading && !user) {
            router.replace("/auth/login");
        }
    }, [loading, user, router]);

    // While loading, or while redirecting (no user) → show spinner
    if (loading || !user) {
        return (
            <div className="flex h-screen items-center justify-center" style={{ backgroundColor: "var(--bg)" }}>
                <div className="w-6 h-6 rounded-full border-2 animate-spin"
                    style={{ borderColor: "var(--border)", borderTopColor: "var(--accent-from)" }} />
            </div>
        );
    }

    const isSuperAdmin = user.accountRole === "superAdmin" || user.role === "superAdmin";
    const isCompany    = user.accountRole === "Company" && !user.createdBy;
    const isMember     = user.accountRole === "Company" && !!user.createdBy;
    const navItems = isSuperAdmin
        ? superAdminNavItems
        : isCompany
        ? companyNavItems
        : isMember
        ? companyMemberNavItems
        : userNavItems;

    return (
        <div
            className="flex h-screen font-sans"
            style={{ backgroundColor: "var(--bg)", color: "var(--text-primary)" }}
        >
            {/* ─── Sidebar ──────────────────────────────────────────────── */}
            <aside
                className="w-60 flex flex-col shrink-0"
                style={{
                    backgroundColor: "var(--sidebar-bg)",
                    borderRight: "1px solid var(--border)",
                }}
            >
                {/* Logo */}
                <div className="px-5 py-5" style={{ borderBottom: "1px solid var(--border)" }}>
                    <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <Logo className="w-4 h-4" style={{ color: "var(--text-primary)" }} />
                        <span className="font-bold tracking-tight text-lg" style={{ color: "var(--text-primary)" }}>
                            Karta
                        </span>
                    </Link>
                </div>

                {/* SuperAdmin badge */}
                {isSuperAdmin && (
                    <div className="mx-3 mt-3 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center gap-2">
                        <ShieldCheck className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span className="text-xs font-semibold text-purple-400">Super Admin</span>
                    </div>
                )}
                {isCompany && (
                    <div className="mx-3 mt-3 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span className="text-xs font-semibold text-blue-400">Company</span>
                    </div>
                )}
                {isMember && (
                    <div className="mx-3 mt-3 px-3 py-1.5 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                        <span className="text-xs font-semibold text-teal-400">Assessor</span>
                    </div>
                )}

                {/* Nav */}
                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                    {navItems.map(({ href, label, icon: Icon }) => {
                        const isActive = pathname === href;
                        return (
                            <Link
                                key={href}
                                href={href}
                                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                                style={
                                    isActive
                                        ? {
                                            backgroundColor: "var(--bg-4)",
                                            border: "1px solid var(--border)",
                                            color: "#a78bfa",
                                        }
                                        : {
                                            border: "1px solid transparent",
                                            color: "var(--text-secondary)",
                                        }
                                }
                                onMouseEnter={e => {
                                    if (!isActive) {
                                        (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-3)";
                                        (e.currentTarget as HTMLElement).style.borderColor = "var(--border-2)";
                                        (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
                                    }
                                }}
                                onMouseLeave={e => {
                                    if (!isActive) {
                                        (e.currentTarget as HTMLElement).style.backgroundColor = "";
                                        (e.currentTarget as HTMLElement).style.borderColor = "transparent";
                                        (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
                                    }
                                }}
                            >
                                <Icon className="w-4 h-4 shrink-0" />
                                {label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom: Theme + User */}
                <div className="px-3 pb-4 space-y-3" style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
                    {/* Theme Toggle */}
                    <ThemeToggle variant="full" />

                    {/* User Info */}
                    <div className="flex items-center gap-3 px-3 py-2">
                        <div className="accent-avatar w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold uppercase shrink-0">
                            {user?.name?.[0] ?? "U"}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                                {user?.name}
                            </p>
                            <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                                {user?.email}
                            </p>
                        </div>
                    </div>

                    {/* Logout */}
                    <button
                        onClick={logout}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm transition-all hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-400"
                        style={{
                            border: "1px solid var(--border)",
                            color: "var(--text-secondary)",
                        }}
                    >
                        <LogOut className="w-4 h-4" />
                        Sign out
                    </button>
                </div>
            </aside>

            {/* ─── Main ─────────────────────────────────────────────────── */}
            <main
                className="flex-1 overflow-y-auto"
                style={{ backgroundColor: "var(--bg)" }}
            >
                {children}
            </main>

            {isCompany && user.isOnboarding === false && <CompanyOnboardingPanel />}
        </div>
    );
}
