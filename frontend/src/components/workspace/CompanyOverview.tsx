"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight, BookOpen, CheckCircle2, ClipboardList, Clock3, Layers, Plus, Users } from "lucide-react";
import { ButtonLink, LoadingState } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspaceAssessments } from "@/hooks/useWorkspaceAssessments";
import { useWorkspaceResource } from "@/hooks/useWorkspaceResource";
import type { CompanyMember, Dimension } from "@/types";
import { formatWorkspaceDate } from "@/lib/workspace";
import { AssessmentCollection } from "./AssessmentCollection";
import { AvatarGroup, initials, Metric, ResourceError, SectionHeading, StatusBadge, WorkspacePage } from "./WorkspaceUI";
import styles from "./company-workspace.module.css";

export default function CompanyOverview({ userName }: { userName: string }) {
    const { user } = useAuth();
    const assessments = useWorkspaceAssessments("/sessions/company", user?._id ?? "", "/dashboard");
    const members = useWorkspaceResource<{ members: CompanyMember[] }>("/company/members");
    const dimensions = useWorkspaceResource<{ dimensions: Dimension[] }>("/dimensions");
    const team = members.data?.members ?? [];
    const sessions = assessments.sessions;
    const active = sessions.filter(session => session.status === "active");
    const completed = sessions.filter(session => session.status === "completed").length;
    const focus = [...active].sort((a, b) => (a.endDate ? Date.parse(a.endDate) : Infinity) - (b.endDate ? Date.parse(b.endDate) : Infinity))[0]
        ?? sessions.find(session => session.status === "draft") ?? sessions.find(session => session.status === "scheduled");
    const value = (count: number) => assessments.loading || assessments.error ? "—" : count;
    return <WorkspacePage title="Company overview" eyebrow="Overview" description={`Welcome back, ${userName}. Keep your assessments and team moving forward.`}
        actions={<ButtonLink href="/dashboard/manage-sessions?create=true"><Plus aria-hidden="true" />Create assessment</ButtonLink>}>
        <section className={styles.metrics} aria-label="Workspace summary">
            <Metric label="Total assessments" value={value(sessions.length)} detail="Across your workspace" icon={<ClipboardList />} href="/dashboard/manage-sessions" />
            <Metric label="Active now" value={value(active.length)} detail="Open for team responses" icon={<Clock3 />} href="/dashboard/manage-sessions?status=active" />
            <Metric label="Completed" value={value(completed)} detail="Ready to review" icon={<CheckCircle2 />} href="/dashboard/manage-sessions?status=completed" />
            <Metric label="Team members" value={members.loading || members.error ? "—" : team.length} detail="Your assessment team" icon={<Users />} href="/dashboard/members" />
        </section>
        <div className={styles.overviewGrid}>
            <div className={styles.primaryColumn}>
                {!assessments.error && !assessments.loading && <section className={styles.focusPanel} aria-label="Next step">
                    <span className={styles.focusLabel}><Clock3 aria-hidden="true" />{focus ? "Pick up where you left off" : "Build a clearer picture of your maturity"}</span>
                    <h2>{focus?.title ?? "Start with your first assessment"}</h2>
                    <p>{focus ? focus.status === "draft" ? "Your draft is ready to shape. Confirm the team and dimensions before opening it for responses." : focus.status === "scheduled" ? "Review the assignment and schedule before opening this assessment for responses." : "Review team responses, compare maturity levels, and plan the next steps." : "Choose the dimensions that matter, assign your team, and turn their responses into a shared action plan."}</p>
                    <div className={styles.focusFooter}>
                        {focus ? <><div className={styles.actions}><StatusBadge status={focus.status} /><span className={styles.caption}>{focus.endDate ? `Due ${formatWorkspaceDate(focus.endDate)}` : "No due date set"}</span></div><Link className={styles.textLink} href={focus.status === "draft" ? `/dashboard/manage-sessions?edit=${focus._id}` : `/dashboard/manage-sessions/${focus._id}`}>{focus.status === "draft" ? "Continue draft" : "Open assessment"}<ArrowRight aria-hidden="true" /></Link></> : <Link className={styles.textLink} href="/dashboard/assessment">Explore the assessment criteria<ArrowRight aria-hidden="true" /></Link>}
                    </div>
                </section>}
                <section><SectionHeading title="Your assessments" description="A shared view of work in progress." action={<Link className={styles.textLink} href="/dashboard/manage-sessions">View all<ArrowUpRight aria-hidden="true" /></Link>} /><AssessmentCollection {...assessments} retry={assessments.refresh} compact /></section>
            </div>
            <aside className={styles.sideColumn} aria-label="Team and assessment guidance">
                <section className={styles.panel}><SectionHeading title="Your team" action={<Users size={24} aria-hidden="true" />} />
                    {members.loading ? <LoadingState inline>Loading team.</LoadingState> : members.error ? <ResourceError message="Couldn't load the team." retry={members.refresh} /> : team.length ? <>
                        <AvatarGroup people={team} /><ul className={styles.teamList}>{team.slice(0, 3).map(member => <li key={member._id} className={styles.person}><span className={styles.avatar}>{initials(member.name)}</span><div className={styles.personCopy}><strong>{member.name}</strong><span>{member.memberRole || "Assessor"}</span></div></li>)}</ul>
                    </> : <p>Add team members and give each person access to the dimensions they assess.</p>}
                    <div className={styles.panelFooter}><Link className={styles.textLink} href="/dashboard/members">Manage team<ArrowRight aria-hidden="true" /></Link></div>
                </section>
                <section className={styles.panel}><SectionHeading title="From assessment to action" action={<BookOpen size={24} aria-hidden="true" />} /><ol className={styles.guideSteps}>
                    <li><div><strong>Set the scope</strong><p>Choose dimensions and assign the right people.</p></div></li><li><div><strong>Collect perspectives</strong><p>Activate the assessment to receive team responses.</p></div></li><li><div><strong>Plan the next step</strong><p>Review the results and track your action plan.</p></div></li>
                </ol><div className={styles.panelFooter}><Link href="/docs" className={styles.textLink}>Read the guide<ArrowUpRight aria-hidden="true" /></Link></div></section>
                <section className={styles.panel}><SectionHeading title="Assessment framework" action={<Layers size={24} aria-hidden="true" />} />
                    {dimensions.loading ? <LoadingState inline>Loading framework.</LoadingState> : dimensions.error ? <ResourceError message="Couldn't load the framework." retry={dimensions.refresh} /> : <p>{dimensions.data?.dimensions.length ?? 0} dimensions available to guide your maturity assessment.</p>}
                    <div className={styles.panelFooter}><Link href="/dashboard/assessment" className={styles.textLink}>Browse criteria<ArrowRight aria-hidden="true" /></Link></div>
                </section>
            </aside>
        </div>
    </WorkspacePage>;
}
