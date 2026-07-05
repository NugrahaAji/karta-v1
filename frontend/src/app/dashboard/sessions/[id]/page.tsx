"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import {
    ClipboardList, Calendar, Clock, CheckCircle2, XCircle,
    CalendarClock, Loader2, ArrowLeft, Building2, Users,
    Info, AlertCircle, ChevronRight, ChevronLeft, Send,
    CheckCheck, Layers, Lock,
} from "lucide-react";
import api from "@/lib/api";
import { AssessmentSession, SessionStatus, Dimension, ResponseItem } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import toast from "react-hot-toast";

/* ─── Status helpers ──────────────────────────────────────────────────────── */
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

function StatusBadge({ status }: { status: SessionStatus }) {
    const Icon = STATUS_ICONS[status] ?? Clock;
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border ${STATUS_COLORS[status]}`}>
            <Icon className="w-4 h-4" /> {STATUS_LABELS[status]}
        </span>
    );
}

const DIM_ACCENT = [
    { ring: "ring-purple-500/40", dot: "bg-purple-400", text: "text-purple-400", badge: "bg-purple-500/10 border-purple-500/30 text-purple-400" },
    { ring: "ring-blue-500/40",   dot: "bg-blue-400",   text: "text-blue-400",   badge: "bg-blue-500/10 border-blue-500/30 text-blue-400" },
    { ring: "ring-teal-500/40",   dot: "bg-teal-400",   text: "text-teal-400",   badge: "bg-teal-500/10 border-teal-500/30 text-teal-400" },
    { ring: "ring-amber-500/40",  dot: "bg-amber-400",  text: "text-amber-400",  badge: "bg-amber-500/10 border-amber-500/30 text-amber-400" },
    { ring: "ring-pink-500/40",   dot: "bg-pink-400",   text: "text-pink-400",   badge: "bg-pink-500/10 border-pink-500/30 text-pink-400" },
    { ring: "ring-green-500/40",  dot: "bg-green-400",  text: "text-green-400",  badge: "bg-green-500/10 border-green-500/30 text-green-400" },
];

/* ─── Stepper indicator ───────────────────────────────────────────────────── */
function StepperBar({
    dimensions, currentStep, completedDims, selections,
}: {
    dimensions: Dimension[];
    currentStep: number;
    completedDims: Set<string>;
    selections: Record<string, { levelId: string; levelIndex: number }>;
}) {
    return (
        <div className="w-full overflow-x-auto pb-2 mb-6">
            <div className="flex items-center min-w-max gap-0">
                {dimensions.map((dim, i) => {
                    const accent = DIM_ACCENT[i % DIM_ACCENT.length];
                    const isDone = completedDims.has(dim._id);
                    const isActive = i === currentStep;
                    const isPast = i < currentStep;

                    return (
                        <div key={dim._id} className="flex items-center">
                            {/* Step node */}
                            <div className="flex flex-col items-center gap-1.5">
                                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-xs transition-all
                                    ${isActive
                                        ? `ring-2 ring-offset-2 ring-offset-[var(--bg-2)] ${accent.ring} border-transparent bg-[var(--bg-4)] ${accent.text}`
                                        : isDone
                                        ? "border-transparent bg-green-500 text-white"
                                        : isPast
                                        ? "border-transparent bg-green-500 text-white"
                                        : "border-[var(--border)] t-muted"
                                    }`}
                                >
                                    {isDone || isPast ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                                </div>
                                <p className={`text-[10px] font-semibold whitespace-nowrap max-w-[72px] text-center truncate transition-all
                                    ${isActive ? accent.text : isDone || isPast ? "text-green-400" : "t-muted"}`}>
                                    {dim.name}
                                </p>
                            </div>
                            {/* Connector */}
                            {i < dimensions.length - 1 && (
                                <div className={`h-0.5 w-12 mx-1 mb-5 rounded-full transition-all
                                    ${isPast || isDone ? "bg-green-400" : "bg-[var(--border)]"}`} />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/* ─── Criteria card (each criteria = one selectable option) ──────────────── */
function CriteriaCard({
    criteriaName, isSelected, onSelect, disabled,
}: {
    criteriaName: string;
    isSelected: boolean;
    onSelect: () => void;
    disabled: boolean;
}) {
    return (
        <button
            onClick={onSelect}
            disabled={disabled}
            className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all duration-150
                ${isSelected
                    ? "border-teal-500/60"
                    : "border-[var(--border)] hover:border-[var(--border-3)] hover:bg-[var(--bg-3)]"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
            style={isSelected ? { backgroundColor: "rgba(20,184,166,0.07)" } : undefined}
        >
            <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all
                    ${isSelected ? "border-teal-400 bg-teal-400" : "border-[var(--border-3)]"}`}>
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <span className={`text-sm leading-snug ${
                    isSelected ? "font-semibold text-teal-300" : "t-primary"
                }`}>
                    {criteriaName}
                </span>
            </div>
        </button>
    );
}

/* ─── Main page ───────────────────────────────────────────────────────────── */
export default function SessionDetailPage() {
    const params = useParams();
    const { user } = useAuth();
    const sessionId = params?.id as string;

    const [session, setSession] = useState<AssessmentSession | null>(null);
    const [dimensions, setDimensions] = useState<Dimension[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // currentStep = index into `dimensions` array
    const [currentStep, setCurrentStep] = useState(0);

    // selections[subId] = { levelId, levelIndex, criteriaId }
    // criteriaId is used only for visual highlight; backend only receives levelId+levelIndex
    const [selections, setSelections] = useState<Record<string, { levelId: string; levelIndex: number; criteriaId: string }>>({});
    const [notes, setNotes] = useState<Record<string, string>>({}); // subId → note text
    const [alreadySubmitted, setAlreadySubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!sessionId) return;
        Promise.all([
            api.get(`/sessions/${sessionId}`),
            api.get("/dimensions"),
            api.get(`/sessions/${sessionId}/my-response`),
        ])
            .then(([sessRes, dimRes, respRes]) => {
                const sess = sessRes.data.session as AssessmentSession;
                setSession(sess);

                const allDims: Dimension[] = dimRes.data.dimensions ?? [];

                // Step 1: filter by session's dimension list (empty = all)
                let filtered = sess.dimensions?.length
                    ? allDims.filter(d => sess.dimensions.includes(d._id))
                    : allDims;

                // Step 2: further filter by the logged-in member's allowedDimensions
                // (empty allowedDimensions = no restriction for this member)
                const memberAllowed = user?.allowedDimensions ?? [];
                if (memberAllowed.length > 0) {
                    const allowedIds = new Set(memberAllowed.map(d => d._id));
                    filtered = filtered.filter(d => allowedIds.has(d._id));
                }

                setDimensions(filtered);

                // Restore previous response — including which criteria card was selected
                const prev = respRes.data.response;
                if (prev?.responses?.length) {
                    setAlreadySubmitted(true);
                    const restored: typeof selections = {};
                    const restoredNotes: Record<string, string> = {};
                    for (const r of prev.responses) {
                        restored[r.subdimension] = {
                            levelId:    r.selectedLevel,
                            levelIndex: r.selectedLevelIndex,
                            // Use stored criteriaId for exact card highlight on restore
                            criteriaId: r.selectedCriteria ?? "",
                        };
                        if (r.note) restoredNotes[r.subdimension] = r.note;
                    }
                    setSelections(restored);
                    setNotes(restoredNotes);
                }
            })
            .catch(() => setError("Session not found or you don't have access."))
            .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId, user]);

    /* ─── Derived state ───────────────────────────────────────────────────── */
    const currentDim = dimensions[currentStep] ?? null;
    const isLastStep = currentStep === dimensions.length - 1;
    const isFirstStep = currentStep === 0;

    // Which subdimensions in the CURRENT dimension are answered?
    const currentSubIds = useMemo(() =>
        (currentDim?.subdimensions ?? []).map(s => s._id), [currentDim]);
    const currentAnswered = currentSubIds.filter(id => selections[id]).length;
    const currentComplete = currentAnswered === currentSubIds.length && currentSubIds.length > 0;

    // Which dimensions are fully completed?
    const completedDims = useMemo(() => {
        const s = new Set<string>();
        for (const dim of dimensions) {
            const subs = dim.subdimensions ?? [];
            if (subs.length > 0 && subs.every(sub => selections[sub._id])) {
                s.add(dim._id);
            }
        }
        return s;
    }, [dimensions, selections]);

    // Overall progress
    const totalSubs = dimensions.reduce((n, d) => n + (d.subdimensions?.length ?? 0), 0);
    const answeredSubs = Object.keys(selections).length;
    const overallProgress = totalSubs > 0 ? Math.round((answeredSubs / totalSubs) * 100) : 0;

    /* ─── Actions ─────────────────────────────────────────────────────────── */
    const selectLevel = (subId: string, levelId: string, levelIndex: number, criteriaId: string) =>
        setSelections(prev => ({ ...prev, [subId]: { levelId, levelIndex, criteriaId } }));

    const handleSubmit = async () => {
        if (answeredSubs < totalSubs) {
            toast.error(`Please answer all sub-dimensions (${answeredSubs}/${totalSubs})`);
            return;
        }
        setSubmitting(true);
        try {
            const responses: ResponseItem[] = [];
            for (const dim of dimensions) {
                for (const sub of dim.subdimensions ?? []) {
                    const sel = selections[sub._id];
                    if (sel) responses.push({
                        dimension:          dim._id,
                        subdimension:       sub._id,
                        selectedLevel:      sel.levelId,
                        selectedLevelIndex: sel.levelIndex,
                        selectedCriteria:   sel.criteriaId || undefined,
                        note:               notes[sub._id]?.trim() || undefined,
                    });
                }
            }
            await api.post(`/sessions/${sessionId}/respond`, { responses });
            toast.success("Assessment submitted!");
            setAlreadySubmitted(true);
        } catch (e: unknown) {
            toast.error((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Submission failed");
        } finally {
            setSubmitting(false);
        }
    };

    /* ─── Loading / error ─────────────────────────────────────────────────── */
    if (loading) return (
        <div className="page-container flex items-center justify-center py-32">
            <Loader2 className="w-6 h-6 text-teal-400 animate-spin" />
        </div>
    );
    if (error || !session) return (
        <div className="page-container">
            <div className="card py-24 flex flex-col items-center gap-4">
                <div className="empty-icon-wrap"><AlertCircle className="w-8 h-8 text-red-400/40" /></div>
                <p className="text-sm t-muted text-center">{error || "Session not found."}</p>
                <Link href="/dashboard/sessions" className="btn-secondary text-sm">
                    <ArrowLeft className="w-4 h-4" /> Back to Sessions
                </Link>
            </div>
        </div>
    );

    const isActive = session.status === "active";
    const isCompleted = session.status === "completed";
    const canAssess = isActive || (isCompleted && alreadySubmitted);

    /* ─── Render ──────────────────────────────────────────────────────────── */
    return (
        <div className="page-container max-w-4xl">
            {/* Back */}
            <Link href="/dashboard/sessions"
                className="inline-flex items-center gap-2 text-sm t-secondary hover:t-primary transition-colors mb-6"
                style={{ color: "var(--text-secondary)" }}>
                <ArrowLeft className="w-4 h-4" /> Back to My Sessions
            </Link>

            {/* Session header card */}
            <div className={`card overflow-hidden mb-6 ${isActive ? "ring-1 ring-green-500/25" : ""}`}>
                <div className={`h-1.5 w-full ${
                    isActive ? "bg-gradient-to-r from-green-500 to-teal-400"
                    : session.status === "scheduled" ? "bg-gradient-to-r from-blue-500 to-cyan-400"
                    : session.status === "completed" ? "bg-gradient-to-r from-purple-500 to-pink-400"
                    : "bg-gradient-to-r from-gray-600 to-gray-500"}`} />
                <div className="px-6 py-5">
                    <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex-1 min-w-0">
                            <h1 className="text-xl font-bold t-primary">{session.title}</h1>
                            {session.description && <p className="text-sm t-secondary mt-1">{session.description}</p>}
                        </div>
                        <StatusBadge status={session.status} />
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs t-muted" style={{ borderTop: "1px solid var(--border-2)", paddingTop: "12px" }}>
                        <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" />{session.company?.name}</span>
                        <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{session.assignedTo?.length ?? 0} assessors</span>
                        <span className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5" />{dimensions.length} dimensions assigned to you</span>
                        {session.startDate && <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{new Date(session.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>}
                    </div>
                </div>
            </div>

            {/* Not-active banner */}
            {!isActive && !isCompleted && (
                <div className={`info-banner mb-6 ${session.status === "scheduled" ? "info-banner-accent" : "info-banner-amber"}`}>
                    <Info className="w-4 h-4 mt-0.5 shrink-0 text-amber-400" />
                    <p className="text-xs t-secondary leading-relaxed">
                        {session.status === "scheduled"
                            ? "This session is scheduled. You'll be able to start once it becomes active."
                            : session.status === "cancelled"
                            ? "This session has been cancelled."
                            : "This session is in draft state."}
                    </p>
                </div>
            )}

            {/* No dimensions assigned to you */}
            {canAssess && dimensions.length === 0 && (
                <div className="card py-16 flex flex-col items-center gap-4">
                    <div className="empty-icon-wrap"><Lock className="w-7 h-7 text-amber-400/40" /></div>
                    <p className="text-sm t-muted text-center">
                        No dimensions are assigned to your account for this session.<br />
                        Contact your company admin.
                    </p>
                </div>
            )}

            {/* ─── STEPPER ASSESSMENT ──────────────────────────────────── */}
            {canAssess && dimensions.length > 0 && (
                <>
                    {/* Overall progress bar */}
                    <div className="card px-5 py-4 mb-5">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <ClipboardList className="w-4 h-4 text-teal-400" />
                                <span className="text-sm font-semibold t-primary">Overall Progress</span>
                                {alreadySubmitted && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-500/10 border border-green-500/20 text-green-400">
                                        <CheckCheck className="w-3 h-3" /> Submitted
                                    </span>
                                )}
                            </div>
                            <span className="text-xs font-mono t-muted">{answeredSubs}/{totalSubs} · {overallProgress}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--bg-4)" }}>
                            <div className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-teal-500 to-green-400"
                                style={{ width: `${overallProgress}%` }} />
                        </div>
                    </div>

                    {/* Stepper bar */}
                    <StepperBar
                        dimensions={dimensions}
                        currentStep={currentStep}
                        completedDims={completedDims}
                        selections={selections}
                    />

                    {/* Current dimension card */}
                    {currentDim && (() => {
                        const accent = DIM_ACCENT[currentStep % DIM_ACCENT.length];
                        return (
                            <div className={`card overflow-hidden mb-4 ring-1 ${accent.ring}`}>
                                {/* Dimension header */}
                                <div className="px-6 py-4 flex items-center gap-3" style={{ borderBottom: "1px solid var(--border-2)", backgroundColor: "var(--bg-3)" }}>
                                    <div className={`w-9 h-9 rounded-xl border flex items-center justify-center font-bold text-sm ${accent.badge}`}>
                                        {currentStep + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h2 className="font-bold t-primary">{currentDim.name}</h2>
                                        {currentDim.detail && <p className="text-xs t-secondary mt-0.5">{currentDim.detail}</p>}
                                    </div>
                                    <span className="text-xs t-muted">
                                        {currentAnswered}/{currentSubIds.length} answered
                                    </span>
                                </div>

                                {/* Sub-dimensions */}
                                <div className="px-6 py-5 space-y-8">
                                    {(currentDim.subdimensions ?? []).map((sub, sIdx) => {
                                        const selected = selections[sub._id];
                                        return (
                                            <div key={sub._id}>
                                                {/* Sub-dimension label */}
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className={`w-5 h-5 rounded-md text-[10px] font-bold flex items-center justify-center shrink-0 border ${accent.badge}`}>
                                                        {sIdx + 1}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold t-primary">{sub.name}</p>
                                                        {sub.detail && <p className="text-xs t-muted">{sub.detail}</p>}
                                                    </div>
                                                </div>

                                                {/* Options: flat list of criteria cards */}
                                                <div className="grid gap-2">
                                                    {(sub.levels ?? []).flatMap((lvl, lIdx) => {
                                                        const hasCriteria = lvl.criteria?.length > 0;
                                                        if (hasCriteria) {
                                                            return lvl.criteria.map(c => (
                                                                <CriteriaCard
                                                                    key={c._id}
                                                                    criteriaName={c.name}
                                                                    isSelected={selected?.criteriaId === c._id}
                                                                    onSelect={() => isActive
                                                                        ? selectLevel(sub._id, lvl._id, lIdx, c._id)
                                                                        : undefined
                                                                    }
                                                                    disabled={!isActive}
                                                                />
                                                            ));
                                                        }
                                                        return [(
                                                            <CriteriaCard
                                                                key={lvl._id}
                                                                criteriaName={lvl.detail || lvl.name}
                                                                isSelected={selected?.levelId === lvl._id}
                                                                onSelect={() => isActive
                                                                    ? selectLevel(sub._id, lvl._id, lIdx, lvl._id)
                                                                    : undefined
                                                                }
                                                                disabled={!isActive}
                                                            />
                                                        )];
                                                    })}
                                                </div>

                                                {/* Note input — optional, below options */}
                                                <div className="mt-3">
                                                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-muted)" }}>
                                                        Note <span className="font-normal opacity-60">(optional)</span>
                                                    </label>
                                                    <textarea
                                                        rows={3}
                                                        disabled={!isActive}
                                                        value={notes[sub._id] ?? ""}
                                                        onChange={e => setNotes(prev => ({ ...prev, [sub._id]: e.target.value }))}
                                                        placeholder="Add a note for this sub-dimension..."
                                                        className="w-full px-3 py-2 rounded-lg text-sm resize-none focus:outline-none transition-all"
                                                        style={{
                                                            backgroundColor: "var(--bg-4)",
                                                            border: "1px solid var(--border-2)",
                                                            color: "var(--text-primary)",
                                                            opacity: isActive ? 1 : 0.6,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })()}

                    {/* Navigation */}
                    <div className="flex items-center gap-3">
                        {/* Previous */}
                        <button
                            onClick={() => setCurrentStep(s => s - 1)}
                            disabled={isFirstStep}
                            className="btn-secondary gap-2 disabled:opacity-40"
                        >
                            <ChevronLeft className="w-4 h-4" /> Previous
                        </button>

                        {/* Dimension completion hint */}
                        <div className="flex-1 text-center">
                            {!currentComplete && isActive && (
                                <p className="text-xs t-muted">
                                    Answer all {currentSubIds.length} sub-dimensions to continue
                                </p>
                            )}
                        </div>

                        {/* Next or Submit */}
                        {!isLastStep ? (
                            <button
                                onClick={() => setCurrentStep(s => s + 1)}
                                disabled={!currentComplete && isActive}
                                className="btn-primary gap-2 disabled:opacity-40"
                            >
                                Next <ChevronRight className="w-4 h-4" />
                            </button>
                        ) : (
                            isActive && (
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting || answeredSubs < totalSubs}
                                    className="btn-primary gap-2 disabled:opacity-40"
                                >
                                    {submitting
                                        ? <Loader2 className="w-4 h-4 animate-spin" />
                                        : <Send className="w-4 h-4" />}
                                    {alreadySubmitted ? "Update" : "Submit"}
                                </button>
                            )
                        )}
                    </div>
                </>
            )}

            {/* Completed session (read-only) */}
            {isCompleted && !alreadySubmitted && (
                <div className="card p-6 border border-purple-500/20 bg-purple-500/5">
                    <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-purple-400 shrink-0" />
                        <div>
                            <h3 className="font-bold text-purple-400 mb-0.5">Assessment Completed</h3>
                            <p className="text-xs t-secondary">This session has been completed. Results are being reviewed.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
