"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    ClipboardList, Loader2, AlertCircle, Building2, Users,
    Calendar, CheckCircle2, Clock, CalendarClock, XCircle, ChevronRight,
    BarChart3, Activity,
} from "lucide-react";
import api from "@/lib/api";
import { AssessmentSession, SessionStatus } from "@/types";

const STATUS_COLORS: Record<SessionStatus, string> = {
    draft:     "bg-gray-500/10 border-gray-500/20 text-gray-400",
    scheduled: "bg-blue-500/10 border-blue-500/30 text-blue-400",
    active:    "bg-green-500/10 border-green-500/30 text-green-400",
    completed: "bg-purple-500/10 border-purple-500/30 text-purple-400",
    cancelled: "bg-red-500/10 border-red-500/20 text-red-400",
};
const STATUS_ICONS: Record<SessionStatus, React.ElementType> = {
    draft: Clock, scheduled: CalendarClock,
    active: CheckCircle2, completed: CheckCircle2, cancelled: XCircle,
};
const STATUS_LABELS: Record<SessionStatus, string> = {
    draft: "Draft", scheduled: "Scheduled",
    active: "Active", completed: "Completed", cancelled: "Cancelled",
};

export default function AdminSessionsPage() {
    const [sessions, setSessions] = useState<AssessmentSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");

    useEffect(() => {
        api.get("/sessions/admin")
            .then(res => setSessions(res.data.sessions ?? []))
            .catch(() => setError("Failed to load sessions."))
            .finally(() => setLoading(false));
    }, []);

    const filtered = sessions.filter(s =>
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.company?.name?.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return (
        <div className="page-container flex items-center justify-center py-32">
            <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
        </div>
    );

    return (
        <div className="page-container max-w-5xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold t-primary flex items-center gap-2">
                        <ClipboardList className="w-6 h-6 text-purple-400" /> All Assessments
                    </h1>
                    <p className="text-sm t-secondary mt-1">View and analyze assessment sessions from all companies</p>
                </div>
            </div>

            {/* Search */}
            <div className="mb-5">
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by session title or company..."
                    className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all"
                    style={{
                        backgroundColor: "var(--bg-3)",
                        border: "1px solid var(--border-2)",
                        color: "var(--text-primary)",
                    }}
                />
            </div>

            {error && (
                <div className="card py-16 flex flex-col items-center gap-3">
                    <AlertCircle className="w-8 h-8 text-red-400/40" />
                    <p className="text-sm t-muted">{error}</p>
                </div>
            )}

            {!error && filtered.length === 0 && (
                <div className="card py-16 flex flex-col items-center gap-3">
                    <div className="empty-icon-wrap"><ClipboardList className="w-8 h-8 opacity-20" /></div>
                    <p className="text-sm t-muted">No assessment sessions found.</p>
                </div>
            )}

            <div className="space-y-3">
                {filtered.map(session => {
                    const Icon = STATUS_ICONS[session.status] ?? Clock;
                    const hasAnalysis =
                        (session.dimensionAnalysis?.length ?? 0) > 0 ||
                        (session.subdimensionAnalysis?.length ?? 0) > 0;
                    return (
                        <div
                            key={session._id}
                            className="card px-5 py-4 flex items-center gap-4 hover:ring-1 hover:ring-purple-500/20 transition-all"
                        >
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-purple-500/10 border border-purple-500/20">
                                <ClipboardList className="w-5 h-5 text-purple-400" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <p className="font-semibold t-primary truncate">{session.title}</p>
                                    {hasAnalysis && (
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 shrink-0">
                                            Analyzed
                                        </span>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-3 text-xs t-muted">
                                    <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{session.company?.name ?? "—"}</span>
                                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{session.assignedTo?.length ?? 0} members</span>
                                    {session.startDate && (
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(session.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[session.status]}`}>
                                    <Icon className="w-3.5 h-3.5" />{STATUS_LABELS[session.status]}
                                </span>
                                <Link
                                    href={`/dashboard/admin-sessions/${session._id}?tab=monitoring`}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border"
                                    style={{ backgroundColor: "rgba(251,146,60,0.08)", borderColor: "rgba(251,146,60,0.25)", color: "rgb(251,146,60)" }}
                                    title="Open Monitoring"
                                >
                                    <Activity className="w-3.5 h-3.5" /> Monitoring
                                </Link>
                                <Link
                                    href={`/dashboard/admin-sessions/${session._id}`}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                                    style={{ backgroundColor: "var(--bg-4)", border: "1px solid var(--border-2)", color: "var(--text-primary)" }}
                                >
                                    <BarChart3 className="w-3.5 h-3.5" /> View
                                    <ChevronRight className="w-3 h-3 t-muted" />
                                </Link>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
