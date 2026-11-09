import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUpRight, Plus } from "lucide-react";
import { PublicPageLayout } from "@/components/Footer";
import landing from "../landing.module.css";
import styles from "./hp3m.module.css";

export const metadata: Metadata = {
    title: "What is HP3M? | Karta",
    description: "Learn what the Holistic Process Mining Maturity Model measures and how Karta uses it to assess capabilities and plan improvements.",
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://karta.my.id"),
    alternates: { canonical: "/hp3m" },
};

const dimensions = [
    {
        name: "Technology",
        focus: "Analysis and insight",
        description: "What can your tools tell you about what happened, why it happened, and what to do next? This dimension looks at the information your process mining tools can provide.",
    },
    {
        name: "Pipeline",
        focus: "Connected systems",
        description: "How well do your tools connect data sources, analysis, and the systems teams use to act on findings? The pipeline connects process mining with the rest of your working environment.",
    },
    {
        name: "Data",
        focus: "Reliable event records",
        description: "Can teams access event data they trust, understand, and handle securely? This dimension examines the data that process mining depends on.",
    },
    {
        name: "People",
        focus: "Skills and responsibilities",
        description: "Do people have the skills and clear responsibilities to run and use process mining? This dimension considers the people doing the analysis and those using its results.",
    },
    {
        name: "Culture",
        focus: "Adoption in daily work",
        description: "Do teams identify useful cases, involve managers, and adapt how they work based on findings? This dimension looks at how process mining becomes part of everyday decisions.",
    },
    {
        name: "Governance",
        focus: "Ownership and oversight",
        description: "Who owns the work, how are results shared, and how are quality and compliance checked? Governance covers communication, quality metrics, documentation, and ownership.",
    },
    {
        name: "Strategic alignment",
        focus: "Business priorities",
        description: "Do budgets and priorities support process mining work that contributes to business goals? This dimension connects the assessment to what your organization wants to achieve.",
    },
];

// These labels match the Governance scale in backend/governance.json.
const governanceLevels = ["Initial", "Repeatable", "Defined", "Managed", "Optimizing"];

const assessmentSteps = [
    { title: "Set the scope", description: "Choose the process or initiative to assess. Create a session and assign dimensions to the people who know the work." },
    { title: "Assess current practices", description: "Compare today’s practices with the criteria for each assigned subdimension. Review the scores together to find gaps and strengths." },
    { title: "Plan the next improvements", description: "Use the findings to agree on priorities, create an action plan, and track the work in your Karta workspace." },
];

const pageSections = [
    { id: "dimensions", label: "The seven dimensions" },
    { id: "maturity-levels", label: "Maturity levels" },
    { id: "assessment", label: "Using HP3M in Karta" },
];

export default function HP3MPage() {
    return (
        <PublicPageLayout>
            <main className={`${landing.shell} ${styles.page}`}>
                <header className={styles.hero}>
                    <p className={styles.eyebrow}>About HP3M</p>
                    <div className={styles.heroHeading}>
                        <h1>Holistic Process Mining Maturity Model</h1>
                        <div className={styles.heroCopy}>
                            <p>Process mining shows how work actually flows. HP3M helps you understand how well your organization uses it.</p>
                            <p>The framework behind Karta brings technology, people, and organizational practices into one assessment, so you can decide where to improve.</p>
                        </div>
                    </div>
                    <nav className={styles.contents} aria-label="On this page">
                        {pageSections.map(({ id, label }, index) => (
                            <a key={id} href={`#${id}`}>
                                <span className={styles.number} aria-hidden="true">0{index + 1}</span>
                                <span>{label}</span>
                                <ArrowDown aria-hidden="true" />
                            </a>
                        ))}
                    </nav>
                </header>

                <section id="dimensions" className={styles.framework} aria-labelledby="dimensions-title" tabIndex={-1}>
                    <div className={styles.frameworkIntro}>
                        <div>
                            <p className={styles.eyebrow}>The assessment framework</p>
                            <h2 id="dimensions-title">What does<br />{" "}HP3M assess?</h2>
                            <p className={styles.frameworkDescription}>Tools are one part of the picture. HP3M also considers the people, decisions, and practices that make process mining useful.</p>
                        </div>
                        <dl className={styles.scope}>
                            <div className={styles.dimensionCount}>
                                <dt>Dimensions</dt>
                                <dd>{dimensions.length.toString().padStart(2, "0")}</dd>
                            </div>
                            <div className={styles.subdimensionCount}>
                                <dt>Subdimensions</dt>
                                <dd>22</dd>
                            </div>
                        </dl>
                    </div>

                    <div className={styles.dimensionIndex}>
                        <p className={styles.indexHint}>Explore each dimension</p>
                        {dimensions.map(({ name, focus, description }, index) => (
                            <details className={styles.dimension} name="hp3m-dimensions" key={name} open={index === 0}>
                                <summary>
                                    <span className={styles.number} aria-hidden="true">0{index + 1}</span>
                                    <span className={styles.dimensionName}>{name}</span>
                                    <span className={styles.dimensionFocus}>{focus}</span>
                                    <Plus className={styles.expandIcon} aria-hidden="true" />
                                </summary>
                                <div className={styles.dimensionDescription}>
                                    <p>{description}</p>
                                </div>
                            </details>
                        ))}
                    </div>
                </section>

                <section id="maturity-levels" className={styles.levels} aria-labelledby="levels-title" tabIndex={-1}>
                    <div className={styles.sectionHeading}>
                        <div>
                            <p className={styles.eyebrow}>Reading the assessment</p>
                            <h2 id="levels-title">Maturity is a progression.</h2>
                        </div>
                        <p>Most subdimensions use five levels, from ad hoc practices to practices that teams manage and improve. Compare results by subdimension to see where to focus next.</p>
                    </div>

                    <figure className={styles.scale}>
                        <figcaption>Example: the five levels used in Governance</figcaption>
                        <ol className={styles.scaleLevels} role="list">
                            {governanceLevels.map((level, index) => (
                                <li key={level}>
                                    <span className={styles.levelNumber}><span className={styles.srOnly}>Level </span>{index + 1}</span>
                                    <span>{level}</span>
                                </li>
                            ))}
                        </ol>
                    </figure>

                    <div className={styles.technologyNote}>
                        <h3>Technology uses four levels.</h3>
                        <p>Information capability has its own scale: getting started with process mining, descriptive and diagnostic analysis, prediction, and recommendations for action.</p>
                    </div>
                </section>

                <section id="assessment" className={styles.assessment} aria-labelledby="assessment-title" tabIndex={-1}>
                    <div className={styles.assessmentIntro}>
                        <p className={styles.eyebrow}>From framework to practice</p>
                        <h2 id="assessment-title">Use HP3M<br />{" "}in Karta.</h2>
                        <p>Bring your team’s knowledge together, understand the results, and turn them into a plan.</p>
                        <Link href="/docs/getting-started" className={styles.textLink}>Read the assessment guide <ArrowRight aria-hidden="true" /></Link>
                    </div>
                    <ol className={styles.steps} role="list">
                        {assessmentSteps.map(({ title, description }, index) => (
                            <li key={title}>
                                <span className={styles.stepNumber} aria-hidden="true">0{index + 1}</span>
                                <div>
                                    <h3>{title}</h3>
                                    <p>{description}</p>
                                </div>
                            </li>
                        ))}
                    </ol>
                </section>

                <aside className={styles.source} aria-labelledby="research-title">
                    <h2 id="research-title">Based on research</h2>
                    <div>
                        <p>Astria Hijriani and Marco Comuzzi introduced and evaluated HP3M in <cite>Enterprise Information Systems</cite> (2025).</p>
                        <a className={styles.textLink} href="https://doi.org/10.1080/17517575.2025.2567696">Read the original paper <ArrowUpRight aria-hidden="true" /></a>
                    </div>
                </aside>
            </main>
        </PublicPageLayout>
    );
}
