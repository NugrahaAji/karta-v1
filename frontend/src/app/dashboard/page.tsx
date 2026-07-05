"use client";

import { useAuth } from "@/hooks/useAuth";
import { useProjects } from "@/hooks/useProjects";
import {
  FolderOpen, Upload, BarChart3, Clock,
  Layers, Layers2, ListOrdered, CheckSquare,
  ShieldCheck, ArrowRight, TrendingUp, Database,
  ChevronRight, AlertCircle, Building2, Users, BarChart2,
  ClipboardList, CalendarClock, CheckCircle2, XCircle
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Dimension, AssessmentSession, SessionStatus } from "@/types";

// ─── SuperAdmin Overview ───────────────────────────────────────────────────────
function SuperAdminOverview({ userName }: { userName: string }) {
  const [dimensions, setDimensions] = useState<Dimension[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/dimensions")
      .then(r => setDimensions(r.data.dimensions ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Compute stats from dimensions
  const totalDims = dimensions.length;
  const totalSubs = dimensions.reduce((s, d) => s + (d.subdimensions?.length ?? 0), 0);
  const totalLevels = dimensions.reduce((s, d) =>
    s + (d.subdimensions?.reduce((ss, sub) => ss + (sub.levels?.length ?? 0), 0) ?? 0), 0);
  const totalCriteria = dimensions.reduce((s, d) =>
    s + (d.subdimensions?.reduce((ss, sub) =>
      ss + (sub.levels?.reduce((ls, lev) => ls + (lev.criteria?.length ?? 0), 0) ?? 0), 0) ?? 0), 0);

  const stats = [
    {
      label: "Dimensions",
      value: totalDims,
      icon: Layers,
      href: "/dashboard/dimensions",
      color: "text-purple-400",
      bg: "bg-purple-500/10 border-purple-500/20",
      desc: "Primary assessment dimensions",
    },
    {
      label: "Sub-Dimensions",
      value: totalSubs,
      icon: Layers2,
      href: "/dashboard/subdimensions",
      color: "text-indigo-400",
      bg: "bg-indigo-500/10 border-indigo-500/20",
      desc: "Total sub-dimensions",
    },
    {
      label: "Levels",
      value: totalLevels,
      icon: ListOrdered,
      href: "/dashboard/levels",
      color: "text-teal-400",
      bg: "bg-teal-500/10 border-teal-500/20",
      desc: "Maturity levels",
    },
    {
      label: "Criteria",
      value: totalCriteria,
      icon: CheckSquare,
      href: "/dashboard/criteria",
      color: "text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/20",
      desc: "Assessment criteria",
    },
  ];

  const quickLinks = [
    {
      href: "/dashboard/dimensions",
      label: "Manage Dimensions",
      desc: "Add, edit, or delete assessment dimensions",
      icon: Layers,
      color: "text-purple-400",
      border: "border-purple-500/15 hover:border-purple-500/40",
      bg: "bg-purple-500/5",
    },
    {
      href: "/dashboard/subdimensions",
      label: "Manage Sub-Dimensions",
      desc: "Configure sub-dimensions within each dimension",
      icon: Layers2,
      color: "text-indigo-400",
      border: "border-indigo-500/15 hover:border-indigo-500/40",
      bg: "bg-indigo-500/5",
    },
    {
      href: "/dashboard/levels",
      label: "Manage Levels",
      desc: "Set up maturity levels per sub-dimension",
      icon: ListOrdered,
      color: "text-teal-400",
      border: "border-teal-500/15 hover:border-teal-500/40",
      bg: "bg-teal-500/5",
    },
    {
      href: "/dashboard/criteria",
      label: "Manage Criteria & Weights",
      desc: "Configure criteria and assessment weights (0–5) per level",
      icon: CheckSquare,
      color: "text-amber-400",
      border: "border-amber-500/15 hover:border-amber-500/40",
      bg: "bg-amber-500/5",
    },
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl border" style={{ background: "var(--accent-muted)", borderColor: "var(--accent-muted-border)" }}>
            <ShieldCheck className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
              Super Admin Panel
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
              Welcome, <span className="font-medium" style={{ color: "var(--text-primary)" }}>{userName}</span>
            </p>
          </div>
        </div>

        {/* Role Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border" style={{ background: "var(--accent-muted)", borderColor: "var(--accent-muted-border)" }}>
          <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
          <span className="text-xs font-semibold text-purple-400">
            Full Access — Manage HP3M Tool Configuration
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map(({ label, value, icon: Icon, href, color, bg, desc }) => (
          <Link
            key={label}
            href={href}
            className={`card p-5 border group transition-all duration-200`}
            style={{ borderColor: "var(--border)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${bg}`}>
                <Icon className={`w-4.5 h-4.5 ${color}`} />
              </div>
              <ChevronRight
                className="w-4 h-4 group-hover:translate-x-0.5 transition-all"
                style={{ color: "var(--text-muted)" }}
              />
            </div>
            <p className="text-2xl font-bold mb-0.5" style={{ color: "var(--text-primary)" }}>
              {loading ? <span style={{ color: "var(--text-faint)" }}>—</span> : value}
            </p>
            <p className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>{label}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{desc}</p>
          </Link>
        ))}
      </div>

      {/* Info card if no data */}
      {!loading && totalDims === 0 && (
        <div className="mb-8 flex items-start gap-3 px-5 py-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
          <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-400 mb-1">No configuration data yet</p>
            <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              The database is empty. Run the seeder or start by adding your first Dimension to begin HP3M configuration.
            </p>
            <Link href="/dashboard/dimensions" className="btn-primary mt-3 text-xs inline-flex">
              <Layers className="w-3.5 h-3.5" /> Add First Dimension
            </Link>
          </div>
        </div>
      )}

      {/* Dimension Breakdown */}
      {!loading && dimensions.length > 0 && (
        <div className="card mb-8">
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-purple-400" />
              <h2 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>Configuration Structure</h2>
            </div>
            <Link href="/dashboard/dimensions" className="text-xs text-accent hover:opacity-80 transition-colors flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y" style={{ borderColor: "var(--border-2)" }}>
            {dimensions.map(d => {
              const subCount = d.subdimensions?.length ?? 0;
              const levelCount = d.subdimensions?.reduce((s, sub) => s + (sub.levels?.length ?? 0), 0) ?? 0;
              const criteriaCount = d.subdimensions?.reduce((s, sub) =>
                s + (sub.levels?.reduce((ls, lev) => ls + (lev.criteria?.length ?? 0), 0) ?? 0), 0) ?? 0;
              const pct = totalCriteria > 0 ? Math.round((criteriaCount / totalCriteria) * 100) : 0;

              return (
                <div
                  key={d._id}
                  className="px-6 py-4 transition-colors group"
                  style={{ borderColor: "var(--border-2)" }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--bg-3)")}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = "")}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2 h-2 rounded-full accent-dot" />
                      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{d.name}</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
                      <span className="flex items-center gap-1">
                        <Layers2 className="w-3 h-3" /> {subCount} sub-dims
                      </span>
                      <span className="flex items-center gap-1">
                        <ListOrdered className="w-3 h-3" /> {levelCount} levels
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckSquare className="w-3 h-3" /> {criteriaCount} criteria
                      </span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ backgroundColor: "var(--bg-4)" }}>
                      <div
                        className="h-full accent-bar transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono w-8 text-right" style={{ color: "var(--text-muted)" }}>{pct}%</span>
                    <Link
                      href={`/dashboard/subdimensions?dimId=${d._id}&dimName=${encodeURIComponent(d.name)}`}
                      className="opacity-0 group-hover:opacity-100 text-xs text-accent hover:opacity-80 flex items-center gap-0.5 transition-all"
                    >
                      Manage <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                  {d.detail && <p className="text-xs mt-1.5 ml-4" style={{ color: "var(--text-muted)" }}>{d.detail}</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Action Cards */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
          <h2 className="text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>Quick Access</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {quickLinks.map(({ href, label, desc, icon: Icon, color, border, bg }) => (
            <Link
              key={href}
              href={href}
              className={`card p-4 border ${border} group transition-all duration-200`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${bg} border ${border.split(" ")[0]} shrink-0`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{label}</p>
                  <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "var(--text-muted)" }}>{desc}</p>
                </div>
                <ArrowRight className={`w-4 h-4 ${color} opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5`} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Regular User Overview ────────────────────────────────────────────────────
function UserOverview({ userName }: { userName: string }) {
  const { projects, loading } = useProjects();

  const stats = [
    {
      label: "Total Projects",
      value: projects.length,
      icon: FolderOpen,
      color: "text-purple-400 bg-purple-500/10 border border-purple-500/20",
    },
    {
      label: "Event Logs",
      value: projects.reduce((acc, p) => acc + (p.eventLogs?.length ?? 0), 0),
      icon: Upload,
      color: "text-pink-400 bg-pink-500/10 border border-pink-500/20",
    },
    {
      label: "Mining Results",
      value: "—",
      icon: BarChart3,
      color: "text-orange-400 bg-orange-500/10 border border-orange-500/20",
    },
    {
      label: "Last Activity",
      value: projects[0]
        ? new Date(projects[0].updatedAt).toLocaleDateString("id-ID")
        : "—",
      icon: Clock,
      color: "t-primary border",
    },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
          Welcome, {userName} 👋
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Here&apos;s a summary of your Karta workspace.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-5 group transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                {label}
              </span>
              <div className={`w-8 h-8 rounded-md flex items-center justify-center ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>
              {loading ? "…" : value}
            </p>
          </div>
        ))}
      </div>

      {/* Recent Projects */}
      <div className="card">
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid var(--border)", backgroundColor: "var(--bg-2)" }}
        >
          <h2 className="font-semibold" style={{ color: "var(--text-primary)" }}>Recent Projects</h2>
          <Link href="/dashboard/projects" className="text-sm font-medium text-accent hover:opacity-80 hover:underline underline-offset-4 transition-all">
            View all
          </Link>
        </div>

        {loading ? (
          <div className="p-6 text-sm" style={{ color: "var(--text-secondary)" }}>Loading…</div>
        ) : projects.length === 0 ? (
          <div className="p-10 text-center">
            <FolderOpen className="w-8 h-8 mx-auto mb-3" style={{ color: "var(--text-faint)" }} />
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>No projects yet.</p>
            <Link href="/dashboard/projects" className="btn-primary mt-4 inline-flex">
              Create Project
            </Link>
          </div>
        ) : (
          <ul>
            {projects.slice(0, 5).map((p) => (
              <li
                key={p._id}
                className="flex items-center justify-between px-6 py-4 transition-colors group"
                style={{ borderBottom: "1px solid var(--border-2)" }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--bg-hover)")}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = "")}
              >
                <div>
                  <p className="text-sm font-medium transition-colors" style={{ color: "var(--text-primary)" }}>{p.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                    {p.eventLogs?.length ?? 0} event log(s) · Updated{" "}
                    {new Date(p.updatedAt).toLocaleDateString("en-US")}
                  </p>
                </div>
                <Link
                  href={`/dashboard/projects/${p._id}`}
                  className="text-xs font-medium text-accent hover:opacity-80 opacity-0 group-hover:opacity-100 transition-all"
                >
                  Open →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ─── Company Overview ─────────────────────────────────────────────────────────
function CompanyOverview({ userName }: { userName: string }) {
  const [dimensions, setDimensions] = useState<Dimension[]>([]);
  const [memberCount, setMemberCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/dimensions"),
      api.get("/company/members"),
    ])
      .then(([dimsRes, membersRes]) => {
        setDimensions(dimsRes.data.dimensions ?? []);
        setMemberCount((membersRes.data.members ?? []).length);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalCriteria = dimensions.reduce((s, d) =>
    s + (d.subdimensions?.reduce((ss, sub) =>
      ss + (sub.levels?.reduce((ls, lev) => ls + (lev.criteria?.length ?? 0), 0) ?? 0), 0) ?? 0), 0);

  const stats = [
    {
      label: "Dimensions",
      value: dimensions.length,
      icon: Layers,
      href: "/dashboard/assessment",
      color: "text-purple-400",
      bg: "bg-purple-500/10 border-purple-500/20",
      desc: "Assessment dimensions",
    },
    {
      label: "Total Criteria",
      value: totalCriteria,
      icon: CheckSquare,
      href: "/dashboard/assessment",
      color: "text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/20",
      desc: "Across all dimensions",
    },
    {
      label: "Team Members",
      value: memberCount,
      icon: Users,
      href: "/dashboard/members",
      color: "text-teal-400",
      bg: "bg-teal-500/10 border-teal-500/20",
      desc: "Assessor accounts",
    },
    {
      label: "Assessments",
      value: "—",
      icon: BarChart2,
      href: "/dashboard/assessment",
      color: "text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/20",
      desc: "Coming soon",
    },
  ];

  const quickLinks = [
    {
      href: "/dashboard/assessment",
      label: "View Assessment Criteria",
      desc: "Explore all HP3M dimensions, levels, and criteria",
      icon: CheckSquare,
      color: "text-blue-400",
      border: "border-blue-500/15 hover:border-blue-500/40",
      bg: "bg-blue-500/5",
    },
    {
      href: "/dashboard/members",
      label: "Manage Team Members",
      desc: "Add and manage assessor accounts for your company",
      icon: Users,
      color: "text-teal-400",
      border: "border-teal-500/15 hover:border-teal-500/40",
      bg: "bg-teal-500/5",
    },
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-600/20 to-cyan-500/10 border border-blue-500/20">
            <Building2 className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
              Company Dashboard
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
              Welcome, <span className="font-medium" style={{ color: "var(--text-primary)" }}>{userName}</span>
            </p>
          </div>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600/10 via-cyan-500/10 to-teal-500/10 border border-blue-500/20">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-xs font-semibold text-blue-400">HP3M Maturity Assessment Platform</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map(({ label, value, icon: Icon, href, color, bg, desc }) => (
          <Link key={label} href={href}
            className="card p-5 border group transition-all duration-200"
            style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${bg}`}>
                <Icon className={`w-4.5 h-4.5 ${color}`} />
              </div>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-all" style={{ color: "var(--text-muted)" }} />
            </div>
            <p className="text-2xl font-bold mb-0.5" style={{ color: "var(--text-primary)" }}>
              {loading ? <span style={{ color: "var(--text-faint)" }}>—</span> : value}
            </p>
            <p className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>{label}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{desc}</p>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
          <h2 className="text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>Quick Access</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {quickLinks.map(({ href, label, desc, icon: Icon, color, border, bg }) => (
            <Link key={href} href={href}
              className={`card p-4 border ${border} group transition-all duration-200`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${bg} border ${border.split(" ")[0]} shrink-0`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{label}</p>
                  <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "var(--text-muted)" }}>{desc}</p>
                </div>
                <ArrowRight className={`w-4 h-4 ${color} opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5`} />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Dimension overview */}
      {!loading && dimensions.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-400" />
              <h2 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>Configured Dimensions</h2>
            </div>
            <Link href="/dashboard/assessment" className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y" style={{ borderColor: "var(--border-2)" }}>
            {dimensions.map(d => (
              <div key={d._id} className="px-6 py-3 flex items-center justify-between group transition-colors"
                style={{ borderColor: "var(--border-2)" }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--bg-3)")}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = "")}>
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-500" />
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{d.name}</p>
                </div>
                <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
                  <span>{d.subdimensions?.length ?? 0} sub-dims</span>
                  <Link href="/dashboard/assessment"
                    className="opacity-0 group-hover:opacity-100 text-xs text-blue-400 hover:text-blue-300 flex items-center gap-0.5 transition-all">
                    View <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Company Member Overview ──────────────────────────────────────────────────
function CompanyMemberOverview({ userName }: { userName: string }) {
  const [sessions, setSessions] = useState<AssessmentSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/sessions/my")
      .then(r => setSessions(r.data.sessions ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const STATUS_COLORS: Record<SessionStatus, string> = {
    draft: "t-muted", scheduled: "text-blue-400",
    active: "text-green-400", completed: "text-purple-400", cancelled: "text-red-400",
  };
  const STATUS_BG: Record<SessionStatus, string> = {
    draft: "bg-gray-500/10 border-gray-500/20",
    scheduled: "bg-blue-500/10 border-blue-500/30",
    active: "bg-green-500/10 border-green-500/30",
    completed: "bg-purple-500/10 border-purple-500/30",
    cancelled: "bg-red-500/10 border-red-500/20",
  };

  const active    = sessions.filter(s => s.status === "active");
  const scheduled = sessions.filter(s => s.status === "scheduled");

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20">
            <ClipboardList className="w-6 h-6 text-teal-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
              Assessor Dashboard
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
              Welcome, <span className="font-medium" style={{ color: "var(--text-primary)" }}>{userName}</span>
            </p>
          </div>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-teal-500/10 border border-teal-500/20">
          <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
          <span className="text-xs font-semibold text-teal-400">HP3M Assessment Participant</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {[
          { label: "Total Sessions", value: sessions.length, color: "text-teal-400", bg: "bg-teal-500/10 border-teal-500/20", icon: ClipboardList },
          { label: "Active Now",     value: active.length,    color: "text-green-400", bg: "bg-green-500/10 border-green-500/20", icon: CheckCircle2 },
          { label: "Upcoming",       value: scheduled.length, color: "text-blue-400",  bg: "bg-blue-500/10 border-blue-500/20",  icon: CalendarClock },
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <Link key={label} href="/dashboard/sessions"
            className="card p-5 border group transition-all duration-200"
            style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${bg}`}>
                <Icon className={`w-4.5 h-4.5 ${color}`} />
              </div>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-all" style={{ color: "var(--text-muted)" }} />
            </div>
            <p className={`text-2xl font-bold mb-0.5 ${color}`}>
              {loading ? <span style={{ color: "var(--text-faint)" }}>—</span> : value}
            </p>
            <p className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>{label}</p>
          </Link>
        ))}
      </div>

      {/* Active sessions highlight */}
      {!loading && active.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-green-400">Active Sessions — Start Now</h2>
          </div>
          <div className="space-y-3">
            {active.map(s => (
              <div key={s._id} className="card p-4 border border-green-500/20 hover:border-green-500/40 transition-all group">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold t-primary truncate">{s.title}</p>
                    {s.description && <p className="text-xs t-secondary mt-0.5 truncate">{s.description}</p>}
                  </div>
                  <Link href={`/dashboard/sessions/${s._id}`}
                    className="btn-primary shrink-0 text-sm">
                    Start <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming sessions */}
      {!loading && scheduled.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <CalendarClock className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-blue-400">Upcoming Sessions</h2>
          </div>
          <div className="card divide-y" style={{ borderColor: "var(--border-2)" }}>
            {scheduled.map(s => (
              <div key={s._id} className="px-5 py-3.5 flex items-center justify-between gap-4"
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--bg-3)")}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = "")}>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold t-primary text-sm truncate">{s.title}</p>
                  {s.startDate && (
                    <p className="text-xs t-muted mt-0.5">
                      Starts {new Date(s.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  )}
                </div>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_BG[s.status]} ${STATUS_COLORS[s.status]}`}>
                  <CalendarClock className="w-3 h-3" /> Scheduled
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && sessions.length === 0 && (
        <div className="card py-16 flex flex-col items-center gap-4">
          <div className="empty-icon-wrap"><ClipboardList className="w-8 h-8 text-teal-400/40" /></div>
          <p className="text-sm t-muted text-center">
            No assessment sessions assigned to you yet.<br />
            Your company admin will assign you to a session.
          </p>
          <Link href="/dashboard/sessions" className="btn-secondary text-sm">
            View All Sessions
          </Link>
        </div>
      )}
    </div>
  );
}

// ─── Root Dashboard Page ──────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user, loading } = useAuth();

  // Wait for auth to resolve before deciding which dashboard to render.
  // Without this guard, the page mounts <UserOverview> (which fires useProjects)
  // then immediately re-mounts the correct role view when `user` arrives —
  // causing double fetches and the visible re-render flicker.
  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-t-[color:var(--accent-from)] animate-spin" style={{ borderColor: "var(--accent-muted-border)", borderTopColor: "var(--accent-from)" }} />
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading dashboard…</p>
        </div>
      </div>
    );
  }

  const isSuperAdmin = user?.accountRole === "superAdmin" || user?.role === "superAdmin";
  const isCompany    = user?.accountRole === "Company" && !user?.createdBy;
  const isMember     = user?.accountRole === "Company" && !!user?.createdBy;
  const firstName    = user?.name?.split(" ")[0] ?? "User";

  if (isSuperAdmin) return <SuperAdminOverview userName={firstName} />;
  if (isCompany)    return <CompanyOverview userName={firstName} />;
  if (isMember)     return <CompanyMemberOverview userName={firstName} />;
  return <UserOverview userName={firstName} />;
}
