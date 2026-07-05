"use client";

import { useState, useEffect } from "react";
import {
    ClipboardList, Calendar, Clock, CheckCircle2,
    AlertCircle, XCircle, Loader2, ChevronRight,
    Building2, Users, CalendarClock, Info
} from "lucide-react";
import api from "@/lib/api";
import { AssessmentSession, SessionStatus } from "@/types";
import Link from "next/link";

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<SessionStatus, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
    draft:     { label: "Draft",      color: "text-gray-400",   bg: "bg-gray-500/10",   border: "border-gray-500/20",   icon: ClipboardList },
    scheduled: { label: "Scheduled",  color: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-blue-500/30",   icon: CalendarClock },
    active:    { label: "Active",     color: "text-green-400",  bg: "bg-green-500/10",  border: "border-green-500/30",  icon: CheckCircle2 },
    completed: { label: "Completed",  color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/30", icon: CheckCircle2 },
    cancelled: { label: "Cancelled",  color: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/20",    icon: XCircle },
};

function StatusBadge({ status }: { status: SessionStatus }) {
    const { label, color, bg, border, icon: Icon } = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${bg} ${border} ${color}`}>
            <Icon className="w-3 h-3" /> {label}
        </span>
    );
}

function formatDate(d?: string) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatTime(d?: string) {
    if (!d) return "";
    return new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function SessionCard({ session }: { session: AssessmentSession }) {
    const cfg = STATUS_CONFIG[session.status] ?? STATUS_CONFIG.draft;
    const isActive = session.status === "active";
    const isScheduled = session.status === "scheduled";

    return (
        <div className={`card overflow-hidden transition-all duration-200 ${isActive ? "ring-1 ring-green-500/30" : ""}`}>
            {/* Top accent bar */}
            <div className={`h-1 w-full ${isActive ? "bg-gradient-to-r from-green-500 to-teal-400" : isScheduled ? "bg-gradient-to-r from-blue-500 to-cyan-400" : "bg-gradient-to-r from-gray-600 to-gray-500"}`} />

            <div className="px-5 py-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold t-primary text-base truncate">{session.title}</h3>
                        {session.description && (
                            <p className="text-xs t-secondary mt-0.5 line-clamp-2">{session.description}</p>
                        )}
                    </div>
                    <StatusBadge status={session.status} />
                </div>

                {/* Meta info */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mb-4">
                    <div className="flex items-center gap-1.5 text-xs t-muted">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>{session.company?.name ?? "—"}</span>
                    </div>
                    {session.startDate && (
                        <div className="flex items-center gap-1.5 text-xs t-muted">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{formatDate(session.startDate)}</span>
                            {formatTime(session.startDate) && (
                                <span className="t-muted">{formatTime(session.startDate)}</span>
                            )}
                        </div>
                    )}
                    {session.endDate && (
                        <div className="flex items-center gap-1.5 text-xs t-muted">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Until {formatDate(session.endDate)}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-1.5 text-xs t-muted">
                        <Users className="w-3.5 h-3.5" />
                        <span>{session.assignedTo?.length ?? 0} assessors</span>
                    </div>
                </div>

                {/* Action */}
                {isActive ? (
                    <Link
                        href={`/dashboard/sessions/${session._id}`}
                        className="btn-primary w-full justify-center text-sm"
                    >
                        Start Assessment <ChevronRight className="w-4 h-4" />
                    </Link>
                ) : isScheduled ? (
                    <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-md border text-xs font-semibold text-blue-400 bg-blue-500/5 border-blue-500/20">
                        <CalendarClock className="w-3.5 h-3.5" />
                        Starts {formatDate(session.startDate)}
                    </div>
                ) : session.status === "completed" ? (
                    <Link
                        href={`/dashboard/sessions/${session._id}`}
                        className="btn-secondary w-full justify-center text-sm"
                    >
                        View Results <ChevronRight className="w-4 h-4" />
                    </Link>
                ) : (
                    <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-md border text-xs font-semibold t-muted border-[var(--border)]">
                        {session.status === "cancelled" ? "Session cancelled" : "Not available"}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MySessionsPage() {
    const [sessions, setSessions] = useState<AssessmentSession[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get("/sessions/my")
            .then(r => setSessions(r.data.sessions ?? []))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const active    = sessions.filter(s => s.status === "active");
    const scheduled = sessions.filter(s => s.status === "scheduled");
    const others    = sessions.filter(s => !["active", "scheduled"].includes(s.status));

    return (
        <div className="page-container">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20">
                        <ClipboardList className="w-5 h-5 text-teal-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold t-primary">My Sessions</h1>
                        <p className="text-sm t-secondary mt-0.5">Assessment sessions assigned to you</p>
                    </div>
                </div>
            </div>

            {/* Loading */}
            {loading && (
                <div className="card flex items-center justify-center py-24">
                    <Loader2 className="w-6 h-6 text-teal-400 animate-spin" />
                </div>
            )}

            {/* Empty */}
            {!loading && sessions.length === 0 && (
                <div className="card py-24 flex flex-col items-center gap-4">
                    <div className="empty-icon-wrap">
                        <ClipboardList className="w-8 h-8 text-teal-400/40" />
                    </div>
                    <p className="text-sm t-muted text-center">
                        No sessions assigned to you yet.<br />
                        Your company admin will assign you to an assessment session.
                    </p>
                </div>
            )}

            {/* Active sessions — shown first & highlighted */}
            {!loading && active.length > 0 && (
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        <h2 className="text-sm font-bold uppercase tracking-widest text-green-400">Active Now</h2>
                        <span className="text-xs t-muted">({active.length})</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {active.map(s => <SessionCard key={s._id} session={s} />)}
                    </div>
                </div>
            )}

            {/* Scheduled */}
            {!loading && scheduled.length > 0 && (
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <CalendarClock className="w-4 h-4 text-blue-400" />
                        <h2 className="text-sm font-bold uppercase tracking-widest text-blue-400">Upcoming</h2>
                        <span className="text-xs t-muted">({scheduled.length})</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {scheduled.map(s => <SessionCard key={s._id} session={s} />)}
                    </div>
                </div>
            )}

            {/* Past / Other */}
            {!loading && others.length > 0 && (
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <AlertCircle className="w-4 h-4 t-muted" />
                        <h2 className="text-sm font-bold uppercase tracking-widest t-muted">Past Sessions</h2>
                        <span className="text-xs t-muted">({others.length})</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {others.map(s => <SessionCard key={s._id} session={s} />)}
                    </div>
                </div>
            )}
        </div>
    );
}
