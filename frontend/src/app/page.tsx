import Link from "next/link";
import {
    ArrowDown, ArrowRight, ArrowUpRight, ChartNoAxesCombined,
    Check, CircleCheck, ClipboardList, FileText, Layers3, ListChecks, Users,
} from "lucide-react";
import { PublicPageLayout } from "@/components/Footer";
import HeroVisualizer from "@/components/HeroVisualizer";
import { ButtonLink } from "@/components/ui/Button";
import styles from "./landing.module.css";

const sampleScores = [
    { name: "Communication", score: 4 },
    { name: "Quality metric", score: 3 },
    { name: "Documentation system", score: 2 },
    { name: "Ownership", score: 4 },
];

const steps = [
    { title: "Set the context", description: "Create your company profile, invite your team, and open an assessment session.", icon: Users },
    { title: "Measure maturity", description: "Assess your practices against HP3M criteria and review the results together.", icon: ChartNoAxesCombined },
    { title: "Move forward", description: "Use the findings to build an action plan and follow improvements over time.", icon: ListChecks },
];

function ResultsPreview() {
    return (
        <div className={styles.resultCard}>
            <div className={styles.cardHeading}>
                <span className={styles.iconBox}><ChartNoAxesCombined aria-hidden="true" /></span>
                <span>Assessment results<small>Governance</small></span>
            </div>
            <div className={styles.reportHeading}><span>Subdimension</span><span>Score / 5</span></div>
            <dl className={styles.scores}>
                {sampleScores.map(({ name, score }) => (
                    <div key={name} className={styles.scoreRow}>
                        <dt>{name}</dt>
                        <dd>
                            <strong>{score}<span className="sr-only"> out of 5</span></strong>
                            <span className={styles.scoreTrack} aria-hidden="true">
                                {[1, 2, 3, 4, 5].map(level => <span key={level} data-filled={level <= score} />)}
                            </span>
                        </dd>
                    </div>
                ))}
            </dl>
            <p className={styles.sampleLabel}>Illustrative assessment · Sample data</p>
        </div>
    );
}

export default function Home() {
    return (
        <PublicPageLayout>
            <main className={`${styles.page} ${styles.shell}`}>
                <section className={styles.hero} data-hero aria-labelledby="landing-title">
                    <div className={styles.heroMeta}><span>Process mining maturity</span><span>Built around the HP3M framework</span></div>
                    <div className={styles.heroContent}>
                        <div className={styles.intro}>
                            <h1 id="landing-title">Know where<br />you stand.<br />See what’s next.</h1>
                            <p>Understand your process mining maturity. Bring your team together, uncover the gaps, and turn assessment into action.</p>
                            <div className={styles.actions}>
                                <ButtonLink href="/auth/register" variant="inverse" size="large">Start an assessment <ArrowUpRight aria-hidden="true" /></ButtonLink>
                                <Link href="/docs" className={styles.heroLink}>Explore the guide <ArrowRight aria-hidden="true" /></Link>
                            </div>
                        </div>
                        <div className={styles.heroArt}>
                            <HeroVisualizer />
                        </div>
                    </div>
                </section>

                <section id="platform" className={styles.statement} aria-labelledby="statement-title" tabIndex={-1}>
                    <p className={styles.eyebrow}>From understanding to improvement</p>
                    <h2 id="statement-title"><span>Better processes start with a shared understanding.</span> Karta connects your assessment, your team, and your next steps.</h2>
                    <div className={styles.statementNotes}>
                        <div><h3>Know your starting point</h3><p>See how your organization measures up against structured maturity criteria, with a common language for every assessor.</p></div>
                        <div><h3>Give progress a direction</h3><p>Explore gaps in your practices, agree on priorities, and keep improvement work connected to the assessment.</p></div>
                    </div>
                    <Link href="/hp3m" className={styles.platformLink}>Learn about HP3M <ArrowRight aria-hidden="true" /></Link>
                </section>

                <section id="how-it-works" className={styles.workflow} aria-labelledby="workflow-title" tabIndex={-1}>
                    <div className={styles.workflowHeading}><div><p className={styles.eyebrow}>How it works</p><h2 id="workflow-title">A clear path<br />to your next step.</h2></div><p>Build a picture of where you are today.<br />Then decide where to go together.</p></div>
                    <ol className={styles.steps} role="list">
                        {steps.map(({ title, description, icon: Icon }, i) => (
                            <li key={title}><div className={styles.stepTop}><span>0{i + 1}</span><Icon aria-hidden="true" /></div><h3>{title}</h3><p>{description}</p></li>
                        ))}
                    </ol>
                </section>
            </main>
        </PublicPageLayout>
    );
}
