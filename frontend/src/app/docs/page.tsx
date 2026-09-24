"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import {
    Search,
    ChevronRight,
    Building2,
    ClipboardList,
    Users,
    CalendarDays,
    BarChart2,
    SlidersHorizontal,
    BrainCircuit,
    TrendingUp,
    LogIn,
    CheckSquare,
    FileEdit,
    HelpCircle,
    ArrowRight,
    Clock,
    AlertTriangle,
    Info,
    Lightbulb,
    CheckCircle2,
    BookOpen,
    Menu,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Section {
    id: string;
    label: string;
    icon: React.ReactNode;
    role?: "company" | "assessor" | "general";
}

interface NavGroup {
    title: string;
    badge?: string;
    badgeColor?: "blue" | "green";
    sections: Section[];
}

// ─── Navigation structure ─────────────────────────────────────────────────────

const NAV_GROUPS: NavGroup[] = [
    {
        title: "Getting Started",
        sections: [
            { id: "overview", label: "Overview", icon: <BookOpen className="w-3.5 h-3.5" />, role: "general" },
            { id: "user-roles", label: "User Roles", icon: <Users className="w-3.5 h-3.5" />, role: "general" },
        ],
    },
    {
        title: "Company Guide",
        badge: "Company",
        badgeColor: "blue",
        sections: [
            { id: "company-account", label: "1. Create Account", icon: <Building2 className="w-3.5 h-3.5" />, role: "company" },
            { id: "company-onboarding", label: "2. Company Onboarding", icon: <ClipboardList className="w-3.5 h-3.5" />, role: "company" },
            { id: "company-members", label: "3. Add Members", icon: <Users className="w-3.5 h-3.5" />, role: "company" },
            { id: "company-sessions", label: "4. Create Session", icon: <CalendarDays className="w-3.5 h-3.5" />, role: "company" },
            { id: "company-results", label: "5. Monitor Results", icon: <BarChart2 className="w-3.5 h-3.5" />, role: "company" },
            { id: "company-adjust", label: "5b. Adjust Scores", icon: <SlidersHorizontal className="w-3.5 h-3.5" />, role: "company" },
            { id: "company-ai", label: "6. AI Analysis", icon: <BrainCircuit className="w-3.5 h-3.5" />, role: "company" },
            { id: "company-monitoring", label: "7. Action Plan", icon: <TrendingUp className="w-3.5 h-3.5" />, role: "company" },
        ],
    },
    {
        title: "Assessor Guide",
        badge: "Assessor",
        badgeColor: "green",
        sections: [
            { id: "assessor-login", label: "1. Login", icon: <LogIn className="w-3.5 h-3.5" />, role: "assessor" },
            { id: "assessor-check", label: "2. Check Assignment", icon: <CheckSquare className="w-3.5 h-3.5" />, role: "assessor" },
            { id: "assessor-fill", label: "3. Fill Assessment", icon: <FileEdit className="w-3.5 h-3.5" />, role: "assessor" },
        ],
    },
    {
        title: "Reference",
        sections: [
            { id: "timeline", label: "Timeline Diagram", icon: <CalendarDays className="w-3.5 h-3.5" />, role: "general" },
            { id: "faq", label: "FAQ", icon: <HelpCircle className="w-3.5 h-3.5" />, role: "general" },
        ],
    },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function Callout({ type, children }: { type: "tip" | "warning" | "info"; children: React.ReactNode }) {
    const cfg = {
        tip: { bg: "color-mix(in srgb, #22c55e 8%, transparent)", border: "color-mix(in srgb, #22c55e 30%, transparent)", icon: <Lightbulb className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#22c55e" }} />, label: "Tip", lc: "#22c55e" },
        warning: { bg: "color-mix(in srgb, #f59e0b 8%, transparent)", border: "color-mix(in srgb, #f59e0b 30%, transparent)", icon: <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#f59e0b" }} />, label: "Warning", lc: "#f59e0b" },
        info: { bg: "color-mix(in srgb, var(--accent-from) 8%, transparent)", border: "color-mix(in srgb, var(--accent-from) 30%, transparent)", icon: <Info className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "var(--accent-from)" }} />, label: "Note", lc: "var(--accent-from)" },
    }[type];
    return (
        <div className="flex gap-3 rounded-lg px-4 py-3 my-4 text-sm leading-relaxed" style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
            {cfg.icon}
            <div>
                <span className="font-semibold mr-1.5" style={{ color: cfg.lc }}>{cfg.label}:</span>
                <span style={{ color: "var(--text-secondary)" }}>{children}</span>
            </div>
        </div>
    );
}

function StepBadge({ num }: { num: number }) {
    return (
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0 mt-0.5 font-mono" style={{ background: "var(--accent-muted)", border: "1px solid var(--accent-muted-border)", color: "var(--accent-from)" }}>
            {num}
        </span>
    );
}

function StepList({ steps }: { steps: string[] }) {
    return (
        <ol className="space-y-3 my-4">
            {steps.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm" style={{ color: "var(--text-secondary)" }}>
                    <StepBadge num={i + 1} />
                    <span className="pt-0.5" dangerouslySetInnerHTML={{ __html: step }} />
                </li>
            ))}
        </ol>
    );
}

function TimeBadge({ time }: { time: string }) {
    return (
        <span className="inline-flex items-center gap-1.5 text-xs font-mono px-2 py-0.5 rounded-full mb-4" style={{ background: "var(--bg-3)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
            <Clock className="w-3 h-3" /> {time}
        </span>
    );
}

function SectionHeader({ id, title, role }: { id: string; title: string; role?: "company" | "assessor" | "general" }) {
    const badge = role === "company"
        ? { bg: "color-mix(in srgb, var(--accent-from) 12%, transparent)", color: "var(--accent-from)", border: "color-mix(in srgb, var(--accent-from) 30%, transparent)", label: "Company" }
        : role === "assessor"
            ? { bg: "color-mix(in srgb, #22c55e 12%, transparent)", color: "#22c55e", border: "color-mix(in srgb, #22c55e 30%, transparent)", label: "Assessor" }
            : null;
    return (
        <div className="flex items-center gap-3 mb-2">
            <h2 id={id} className="text-xl font-bold scroll-mt-24" style={{ color: "var(--text-primary)" }}>{title}</h2>
            {badge && <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>{badge.label}</span>}
        </div>
    );
}

function Divider() {
    return <hr className="my-10" style={{ borderColor: "var(--border-2)" }} />;
}

function ActionStatus({ color, label }: { color: string; label: string }) {
    return (
        <span className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />{label}
        </span>
    );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({ activeSection, onNavigate, search, onSearch }: {
    activeSection: string;
    onNavigate: (id: string) => void;
    search: string;
    onSearch: (v: string) => void;
}) {
    const filtered = search.trim()
        ? NAV_GROUPS.map(g => ({ ...g, sections: g.sections.filter(s => s.label.toLowerCase().includes(search.toLowerCase())) })).filter(g => g.sections.length > 0)
        : NAV_GROUPS;

    return (
        <div className="p-4 h-full flex flex-col">
            {/* Search */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg mb-5 text-sm" style={{ background: "var(--bg-3)", border: "1px solid var(--border)" }}>
                <Search className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-muted)" }} />
                <input type="text" placeholder="Search docs..." value={search} onChange={e => onSearch(e.target.value)} className="bg-transparent outline-none w-full text-xs" style={{ color: "var(--text-primary)" }} />
            </div>

            {/* Nav groups */}
            <nav className="space-y-5 flex-1 overflow-y-auto">
                {filtered.map(group => (
                    <div key={group.title}>
                        <div className="flex items-center gap-2 mb-1.5">
                            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>{group.title}</p>
                            {group.badge && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={
                                    group.badgeColor === "blue"
                                        ? { background: "var(--accent-muted)", color: "var(--accent-from)" }
                                        : { background: "color-mix(in srgb, #22c55e 15%, transparent)", color: "#22c55e" }
                                }>{group.badge}</span>
                            )}
                        </div>
                        <ul className="space-y-0.5">
                            {group.sections.map(s => {
                                const active = activeSection === s.id;
                                return (
                                    <li key={s.id}>
                                        <button onClick={() => onNavigate(s.id)} className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs text-left transition-all" style={{
                                            color: active ? "var(--accent-from)" : "var(--text-secondary)",
                                            background: active ? "var(--accent-muted)" : "transparent",
                                            fontWeight: active ? 600 : 500,
                                        }}>
                                            <span style={{ color: active ? "var(--accent-from)" : "var(--text-muted)" }}>{s.icon}</span>
                                            {s.label}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </nav>

            {/* CTA */}
            <div className="mt-6 p-3 rounded-lg shrink-0" style={{ background: "var(--accent-muted)", border: "1px solid var(--accent-muted-border)" }}>
                <p className="text-xs font-semibold mb-1" style={{ color: "var(--accent-from)" }}>Ready to start?</p>
                <p className="text-xs mb-3" style={{ color: "var(--text-secondary)" }}>Create your free account and run your first assessment.</p>
                <Link href="/auth/register" className="flex items-center gap-1 text-xs font-bold text-white px-3 py-1.5 rounded-md accent-gradient w-full justify-center">
                    Get Started <ArrowRight className="w-3 h-3" />
                </Link>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DocsPage() {
    const [activeSection, setActiveSection] = useState("overview");
    const [search, setSearch] = useState("");
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const ids = NAV_GROUPS.flatMap(g => g.sections.map(s => s.id));
        const observers = ids.map(id => {
            const el = document.getElementById(id);
            if (!el) return null;
            const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setActiveSection(id); }, { rootMargin: "-20% 0px -70% 0px" });
            obs.observe(el);
            return obs;
        }).filter(Boolean);
        return () => observers.forEach(o => o?.disconnect());
    }, []);

    const scrollTo = (id: string) => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
        setMobileOpen(false);
    };

    return (
        <div className="min-h-screen font-sans" style={{ backgroundColor: "var(--bg)", color: "var(--text-primary)" }}>
            {/* Breadcrumb bar */}
            <div className="fixed top-16 left-0 right-0 z-40 hidden md:flex items-center gap-2 px-6 py-2.5 text-xs font-mono border-b" style={{ background: "color-mix(in srgb, var(--bg) 92%, transparent)", borderColor: "var(--border-2)", backdropFilter: "blur(12px)" }}>
                <Link href="/" className="transition-colors hover:opacity-80" style={{ color: "var(--text-muted)" }}>karta</Link>
                <ChevronRight className="w-3 h-3" style={{ color: "var(--text-faint)" }} />
                <span style={{ color: "var(--text-primary)" }}>docs</span>
                <ChevronRight className="w-3 h-3" style={{ color: "var(--text-faint)" }} />
                <span style={{ color: "var(--accent-from)" }}>user-guide</span>
            </div>

            <div className="flex pt-[6.5rem] md:pt-[6.5rem]">
                {/* Desktop sidebar */}
                <aside className="hidden md:block sticky top-[6.5rem] w-64 shrink-0 h-[calc(100vh-6.5rem)] overflow-y-auto border-r" style={{ background: "var(--sidebar-bg)", borderColor: "var(--border-2)" }}>
                    <Sidebar activeSection={activeSection} onNavigate={scrollTo} search={search} onSearch={setSearch} />
                </aside>

                {/* Mobile sidebar */}
                {mobileOpen && (
                    <>
                        <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => setMobileOpen(false)} />
                        <aside className="fixed top-0 left-0 bottom-0 z-50 w-72 md:hidden border-r overflow-y-auto" style={{ background: "var(--sidebar-bg)", borderColor: "var(--border-2)" }}>
                            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "var(--border-2)" }}>
                                <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Docs Navigation</span>
                                <button onClick={() => setMobileOpen(false)} className="text-xs px-2 py-1 rounded" style={{ background: "var(--bg-3)", color: "var(--text-muted)" }}>✕</button>
                            </div>
                            <Sidebar activeSection={activeSection} onNavigate={scrollTo} search={search} onSearch={setSearch} />
                        </aside>
                    </>
                )}

                {/* Main content */}
                <main className="flex-1 min-w-0 px-6 md:px-12 lg:px-16 py-10 max-w-4xl">
                    {/* Mobile nav toggle */}
                    <button onClick={() => setMobileOpen(true)} className="md:hidden flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-md mb-8" style={{ background: "var(--bg-3)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                        <Menu className="w-3.5 h-3.5" /> Navigation
                    </button>

                    {/* ── Overview ── */}
                    <section id="overview" className="scroll-mt-32 mb-2">
                        <div className="mb-6">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono mb-4" style={{ background: "var(--bg-3)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                                <span className="h-1.5 w-1.5 bg-green-400 rounded-full" />User Guide — v1.0
                            </div>
                            <h1 className="text-4xl font-bold tracking-tight mb-4" style={{ color: "var(--text-primary)" }}>Karta User Guide</h1>
                            <p className="text-lg leading-relaxed max-w-2xl" style={{ color: "var(--text-secondary)" }}>
                                <strong className="font-semibold" style={{ color: "var(--text-primary)" }}>Karta</strong> is an AI-powered assessment management platform that helps organizations manage their evaluation process, analysis, and action plan monitoring in a structured and efficient way.
                            </p>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-3 my-8">
                            {[
                                { label: "Company Guide", desc: "Manage sessions, members, and AI analysis", href: "company-account", color: "var(--accent-from)" },
                                { label: "Assessor Guide", desc: "Login, check assignments, and fill assessments", href: "assessor-login", color: "#22c55e" },
                                { label: "Timeline Overview", desc: "See the complete system workflow at a glance", href: "timeline", color: "#a78bfa" },
                                { label: "FAQ", desc: "Frequently asked questions", href: "faq", color: "#f59e0b" },
                            ].map(card => (
                                <button key={card.label} onClick={() => scrollTo(card.href)} className="text-left p-4 rounded-xl transition-all group hover:brightness-110" style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-sm font-semibold mb-1" style={{ color: card.color }}>{card.label}</p>
                                            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{card.desc}</p>
                                        </div>
                                        <ChevronRight className="w-4 h-4 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: card.color }} />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </section>

                    <Divider />

                    {/* ── User Roles ── */}
                    <section id="user-roles" className="scroll-mt-32">
                        <SectionHeader id="user-roles-h" title="Two User Roles" />
                        <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>Karta has two types of users, each with distinct responsibilities:</p>
                        <div className="grid sm:grid-cols-2 gap-4 my-4">
                            {[
                                { role: "Company", icon: <Building2 className="w-5 h-5" />, color: "var(--accent-from)", desc: "Manages the entire system: members, dimensions, sessions, results, and AI analysis.", items: ["Create & manage member accounts", "Set up assessment sessions", "Monitor results & AI analysis", "Track action plans"] },
                                { role: "Assessor", icon: <ClipboardList className="w-5 h-5" />, color: "#22c55e", desc: "Fills in assessments according to the dimensions and sessions assigned by the Company.", items: ["Log in with credentials from Company", "View assigned dimensions", "Fill assessments honestly", "Submit before the deadline"] },
                            ].map(r => (
                                <div key={r.role} className="p-5 rounded-xl" style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}>
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="p-1.5 rounded-md" style={{ background: `color-mix(in srgb, ${r.color} 15%, transparent)`, color: r.color }}>{r.icon}</div>
                                        <span className="font-bold text-sm" style={{ color: r.color }}>{r.role}</span>
                                    </div>
                                    <p className="text-xs mb-3" style={{ color: "var(--text-secondary)" }}>{r.desc}</p>
                                    <ul className="space-y-1.5">
                                        {r.items.map(item => (
                                            <li key={item} className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                                                <CheckCircle2 className="w-3 h-3 shrink-0" style={{ color: r.color }} />{item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </section>

                    <Divider />

                    {/* Company section banner */}
                    <div className="flex items-center gap-3 mb-8 px-4 py-3 rounded-xl" style={{ background: "var(--accent-muted)", border: "1px solid var(--accent-muted-border)" }}>
                        <Building2 className="w-5 h-5" style={{ color: "var(--accent-from)" }} />
                        <div>
                            <p className="text-sm font-bold" style={{ color: "var(--accent-from)" }}>Company Guide</p>
                            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Complete guide for users with the Company role</p>
                        </div>
                    </div>

                    {/* ── Company Stage 1 ── */}
                    <section id="company-account" className="scroll-mt-32 mb-10">
                        <SectionHeader id="company-account-h" title="Step 1 — Create Account & Sign In" role="company" />
                        <TimeBadge time="Estimated time: 2 minutes" />
                        <StepList steps={[
                            `Open <a href="https://karta.my.id" target="_blank" rel="noopener" style="color:var(--accent-from);text-decoration:underline">karta.my.id</a> in your browser`,
                            `Click the <strong style="color:var(--text-primary)">"Sign Up"</strong> or <strong style="color:var(--text-primary)">"Get Started"</strong> button`,
                            `Choose a registration method:<br/><br/>
                            <span style="color:var(--text-secondary)">• <strong style="color:var(--text-primary)">Google</strong> → Click "Continue with Google", select your Google account — done</span><br/>
                            <span style="color:var(--text-secondary)">• <strong style="color:var(--text-primary)">Email</strong> → Enter your name, email, and password (min. 6 characters), then verify the OTP code sent to your email</span>`,
                            `Once successful, you will be redirected to the <strong style="color:var(--text-primary)">Onboarding</strong> page`,
                        ]} />
                        <Callout type="tip">Use Google Auth for a faster sign-up experience — no email verification required.</Callout>
                    </section>

                    <Divider />

                    {/* ── Company Stage 2 ── */}
                    <section id="company-onboarding" className="scroll-mt-32 mb-10">
                        <SectionHeader id="company-onboarding-h" title="Step 2 — Company Onboarding" role="company" />
                        <TimeBadge time="Estimated time: 5–10 minutes" />
                        <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>Onboarding helps the system understand your organization's context so that AI analysis becomes more relevant and accurate.</p>
                        <StepList steps={[
                            `Fill in your <strong style="color:var(--text-primary)">company profile</strong>: company name, industry / sector, organization size`,
                            `Click <strong style="color:var(--text-primary)">"Finish"</strong> → you will be directed to the main Dashboard`,
                        ]} />
                        <Callout type="warning">Fill in the onboarding form completely and accurately. This data is the foundation for AI analysis. You can update it later from the company profile settings.</Callout>
                    </section>

                    <Divider />

                    {/* ── Company Stage 3 ── */}
                    <section id="company-members" className="scroll-mt-32 mb-10">
                        <SectionHeader id="company-members-h" title="Step 3 — Add Members (Assessors)" role="company" />
                        <TimeBadge time="Estimated time: 5 minutes" />
                        <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>Before an assessment session begins, you need to add team members who will act as <strong style={{ color: "var(--text-primary)" }}>Assessors</strong>.</p>
                        <StepList steps={[
                            `Open the <strong style="color:var(--text-primary)">"Members"</strong> menu in the sidebar`,
                            `Click the <strong style="color:var(--text-primary)">"+ Add Member"</strong> button`,
                            `Enter member details: full name, email address, role — <strong style="color:var(--text-primary)">Assessor</strong>`,
                            `Select one or more <strong style="color:var(--text-primary)">dimensions</strong> to be assigned to this assessor`,
                            `Repeat for each assessor you want to add`,
                        ]} />
                        <Callout type="info">Assessors can only log in after you have created an account for them. They cannot self-register.</Callout>
                    </section>

                    <Divider />

                    {/* ── Company Stage 4 ── */}
                    <section id="company-sessions" className="scroll-mt-32 mb-10">
                        <SectionHeader id="company-sessions-h" title="Step 4 — Create an Assessment Session" role="company" />
                        <TimeBadge time="Estimated time: 5 minutes" />
                        <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>An assessment session is the <em>"container"</em> where assessors fill in their assessments during a defined time period.</p>
                        <StepList steps={[
                            `Open the <strong style="color:var(--text-primary)">"Sessions"</strong> menu in the sidebar`,
                            `Click <strong style="color:var(--text-primary)">"+ Create New Session"</strong>`,
                            `Fill in session details: session name (e.g. <em>"Q3 2026 Assessment"</em>), start date and deadline, select participating assessors`,
                            `Click <strong style="color:var(--text-primary)">"Create Session"</strong> → A notification will be sent to the selected assessors`,
                        ]} />
                        <Callout type="warning">Assessors can only fill in their assessment once: their account is created ✅, dimensions are assigned ✅, and they are added to an active session ✅</Callout>
                    </section>

                    <Divider />

                    {/* ── Company Stage 5 ── */}
                    <section id="company-results" className="scroll-mt-32 mb-10">
                        <SectionHeader id="company-results-h" title="Step 5 — Monitor Assessment Results" role="company" />
                        <TimeBadge time="Anytime after assessors begin filling in" />
                        <StepList steps={[
                            `Open the <strong style="color:var(--text-primary)">"Results"</strong> menu in the sidebar`,
                            `Select the session you want to monitor`,
                            `View the <strong style="color:var(--text-primary)">completion progress</strong> per assessor and per dimension`,
                            `Click a specific dimension to see detailed scores`,
                        ]} />
                    </section>

                    <Divider />

                    {/* ── Company Stage 5b ── */}
                    <section id="company-adjust" className="scroll-mt-32 mb-10">
                        <SectionHeader id="company-adjust-h" title="Step 5b — Adjust Final Score" role="company" />
                        <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>If there is a discrepancy in the final score, the Company can make a manual adjustment with a written justification.</p>
                        <StepList steps={[
                            `Click the <strong style="color:var(--text-primary)">"Detail View"</strong> tab`,
                            `Click the sub-dimension you want to adjust`,
                            `Click <strong style="color:var(--text-primary)">"Adjust Score"</strong>`,
                            `Enter the considered final score`,
                            `Add an <strong style="color:var(--text-primary)">adjustment note</strong> as justification`,
                            `Click <strong style="color:var(--text-primary)">"Save"</strong>`,
                        ]} />
                    </section>

                    <Divider />

                    {/* ── Company Stage 6 ── */}
                    <section id="company-ai" className="scroll-mt-32 mb-10">
                        <SectionHeader id="company-ai-h" title="Step 6 — One-Click AI Analysis" role="company" />
                        <TimeBadge time="Estimated time: 2–10 minutes (depends on number of dimensions)" />
                        <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>Once all assessments are submitted, get an in-depth analysis powered by AI.</p>
                        <StepList steps={[
                            `From the <strong style="color:var(--text-primary)">Results</strong> page, click the <strong style="color:var(--text-primary)">"🤖 Analyze with AI"</strong> button`,
                            `Wait for the analysis to complete`,
                            `The system will display the full analysis results`,
                        ]} />
                        <div className="my-4 grid sm:grid-cols-3 gap-3">
                            {[
                                { title: "Dimension Summary", desc: "Strengths and areas that need improvement", color: "var(--accent-from)" },
                                { title: "Action Plan Recommendations", desc: "Specific and measurable action plans", color: "#22c55e" },
                                { title: "Gap Analysis", desc: "Gap between current state and target maturity level", color: "#a78bfa" },
                            ].map(item => (
                                <div key={item.title} className="p-3 rounded-lg text-xs" style={{ background: `color-mix(in srgb, ${item.color} 8%, var(--bg-2))`, border: `1px solid color-mix(in srgb, ${item.color} 25%, transparent)` }}>
                                    <p className="font-semibold mb-1" style={{ color: item.color }}>{item.title}</p>
                                    <p style={{ color: "var(--text-secondary)" }}>{item.desc}</p>
                                </div>
                            ))}
                        </div>
                        <Callout type="info">The analysis process may take a few minutes as the AI analyzes all data in depth. Do not close the page while the process is running.</Callout>
                    </section>

                    <Divider />

                    {/* ── Company Stage 7 ── */}
                    <section id="company-monitoring" className="scroll-mt-32 mb-10">
                        <SectionHeader id="company-monitoring-h" title="Step 7 — Action Plan Monitoring" role="company" />
                        <TimeBadge time="Ongoing" />
                        <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>Track the implementation progress of AI-recommended action plans.</p>
                        <StepList steps={[
                            `Open the <strong style="color:var(--text-primary)">"Results"</strong> menu → select a session → click the <strong style="color:var(--text-primary)">"Monitoring"</strong> tab`,
                            `View the action plan list per dimension`,
                            `Update the status of each action plan`,
                            `Add progress notes if needed`,
                        ]} />
                        <div className="mt-4 flex flex-wrap gap-2">
                            <ActionStatus color="#a78bfa" label="Target" />
                            <ActionStatus color="#f59e0b" label="Not Started" />
                            <ActionStatus color="#3b82f6" label="On Going" />
                            <ActionStatus color="#22c55e" label="Completed" />
                            <ActionStatus color="#ef4444" label="Delayed" />
                        </div>
                    </section>

                    <Divider />

                    {/* Assessor section banner */}
                    <div className="flex items-center gap-3 mb-8 px-4 py-3 rounded-xl" style={{ background: "color-mix(in srgb, #22c55e 10%, transparent)", border: "1px solid color-mix(in srgb, #22c55e 25%, transparent)" }}>
                        <ClipboardList className="w-5 h-5" style={{ color: "#22c55e" }} />
                        <div>
                            <p className="text-sm font-bold" style={{ color: "#22c55e" }}>Assessor Guide</p>
                            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Complete guide for users with the Assessor role</p>
                        </div>
                    </div>

                    {/* ── Assessor Step 1 ── */}
                    <section id="assessor-login" className="scroll-mt-32 mb-10">
                        <SectionHeader id="assessor-login-h" title="Step 1 — Log In" role="assessor" />
                        <TimeBadge time="Estimated time: 1 minute" />
                        <StepList steps={[
                            `Check your email — the Company has sent you an <strong style="color:var(--text-primary)">email with your login credentials</strong>`,
                            `Open <a href="https://karta.my.id" target="_blank" rel="noopener" style="color:#22c55e;text-decoration:underline">karta.my.id</a>`,
                            `Click <strong style="color:var(--text-primary)">"Login"</strong>`,
                            `Enter the email and password you received`,
                        ]} />
                        <Callout type="warning">You cannot self-register. Your account is created only by the Company that invited you.</Callout>
                    </section>

                    <Divider />

                    {/* ── Assessor Step 2 ── */}
                    <section id="assessor-check" className="scroll-mt-32 mb-10">
                        <SectionHeader id="assessor-check-h" title="Step 2 — Check Your Assignment" role="assessor" />
                        <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>After logging in, review the dimensions and sessions that have been assigned to you.</p>
                        <StepList steps={[
                            `Go to your <strong style="color:var(--text-primary)">Dashboard</strong> → look for the <em>"Active Session"</em> section or open the <em>"My Session"</em> tab`,
                        ]} />
                        <Callout type="info">If no assignment is visible, contact your Company admin.</Callout>
                    </section>

                    <Divider />

                    {/* ── Assessor Step 3 ── */}
                    <section id="assessor-fill" className="scroll-mt-32 mb-10">
                        <SectionHeader id="assessor-fill-h" title="Step 3 — Fill In the Assessment" role="assessor" />
                        <TimeBadge time="Estimated time: 15–45 minutes (depends on number of dimensions)" />
                        <StepList steps={[
                            `Open the <strong style="color:var(--text-primary)">"Assessment"</strong> menu or click directly from the Dashboard`,
                            `Select the available <strong style="color:var(--text-primary)">active session</strong>`,
                            `Choose the <strong style="color:var(--text-primary)">dimension</strong> you are responsible for`,
                            `Answer each question / indicator <strong style="color:var(--text-primary)">honestly and objectively</strong>: select the level that best reflects the current actual condition, and add notes if needed as additional context`,
                            `Once everything is filled in, click <strong style="color:var(--text-primary)">"Submit Assessment"</strong>`,
                        ]} />
                        <Callout type="warning">
                            Base your answers on the <strong>current actual state</strong>, not the ideal state. The submission deadline is set by the Company.
                        </Callout>
                    </section>

                    <Divider />

                    {/* ── Timeline ── */}
                    <section id="timeline" className="scroll-mt-32 mb-10">
                        <SectionHeader id="timeline-h" title="Timeline Summary" />
                        <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>The complete system workflow from both the Company and Assessor perspectives:</p>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="p-5 rounded-xl" style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}>
                                <div className="flex items-center gap-2 mb-4">
                                    <Building2 className="w-4 h-4" style={{ color: "var(--accent-from)" }} />
                                    <span className="text-sm font-bold" style={{ color: "var(--accent-from)" }}>Company</span>
                                </div>
                                <div className="space-y-3">
                                    {["Create Account & Onboarding", "Add Members (Assessors)", "Create Assessment Session", "Monitor Results", "Adjust Score (if needed)", "AI Analysis 🤖", "Action Plan Monitoring 📊"].map((step, i, arr) => (
                                        <div key={i} className="flex items-start gap-3">
                                            <div className="flex flex-col items-center">
                                                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style={{ background: "var(--accent-muted)", border: "1px solid var(--accent-muted-border)", color: "var(--accent-from)" }}>{i + 1}</div>
                                                {i < arr.length - 1 && <div className="w-px h-3 mt-1" style={{ background: "var(--border)" }} />}
                                            </div>
                                            <span className="text-xs pt-0.5" style={{ color: "var(--text-secondary)" }}>{step}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="p-5 rounded-xl" style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}>
                                <div className="flex items-center gap-2 mb-4">
                                    <ClipboardList className="w-4 h-4" style={{ color: "#22c55e" }} />
                                    <span className="text-sm font-bold" style={{ color: "#22c55e" }}>Assessor</span>
                                </div>
                                <div className="space-y-3">
                                    {["Receive login credentials from Company", "Log in to karta.my.id", "Check dimension & session assignment", "Fill in assessment honestly", "Submit before the deadline"].map((step, i, arr) => (
                                        <div key={i} className="flex items-start gap-3">
                                            <div className="flex flex-col items-center">
                                                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style={{ background: "color-mix(in srgb, #22c55e 15%, transparent)", border: "1px solid color-mix(in srgb, #22c55e 30%, transparent)", color: "#22c55e" }}>{i + 1}</div>
                                                {i < arr.length - 1 && <div className="w-px h-3 mt-1" style={{ background: "var(--border)" }} />}
                                            </div>
                                            <span className="text-xs pt-0.5" style={{ color: "var(--text-secondary)" }}>{step}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    <Divider />

                    {/* ── FAQ ── */}
                    <section id="faq" className="scroll-mt-32 mb-16">
                        <SectionHeader id="faq-h" title="FAQ" />
                        <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>Frequently asked questions.</p>
                        <div className="space-y-3">
                            {[
                                { q: "Can an assessor register on their own?", a: "No. Assessor accounts can only be created by the Company." },
                                { q: "Can one assessor fill in more than one dimension?", a: "Yes, as long as the Company assigns more than one dimension to them." },
                                { q: "What happens if an assessor hasn't submitted by the deadline?", a: "The Company can view submission status on the Results page and may extend the session deadline if needed." },
                                { q: "Can assessment results be edited after submission?", a: "Assessors cannot edit their own submissions. However, the Company can perform a manual Adjust Score with a written justification." },
                                { q: "How long does the AI analysis process take?", a: "Usually 2–10 minutes depending on the number of dimensions and assessors involved." },
                                { q: "Can one company run multiple active sessions at once?", a: "Yes. You can create and run multiple sessions in parallel for different time periods or teams." },
                            ].map((item, i) => (
                                <details key={i} className="group rounded-lg overflow-hidden" style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}>
                                    <summary className="flex items-center justify-between px-4 py-3 cursor-pointer text-sm font-semibold list-none gap-2" style={{ color: "var(--text-primary)" }}>
                                        {item.q}
                                        <ChevronRight className="w-4 h-4 shrink-0 transition-transform group-open:rotate-90" style={{ color: "var(--text-muted)" }} />
                                    </summary>
                                    <div className="px-4 pb-4 text-sm" style={{ color: "var(--text-secondary)", borderTop: "1px solid var(--border-2)" }}>
                                        <p className="pt-3">{item.a}</p>
                                    </div>
                                </details>
                            ))}
                        </div>
                    </section>

                    <div className="text-xs font-mono pb-4" style={{ color: "var(--text-faint)" }}>
                        Last updated: September 2026
                    </div>
                </main>
            </div>

            <Footer />
        </div>
    );
}
