import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, ChartNoAxesCombined } from "lucide-react";
import { BrandLink } from "@/components/ui/BrandLink";
import { ThemeToggle } from "@/components/ThemeToggle";
import styles from "./auth.module.css";

const dimensions = [
    { name: "Technology", level: 3 },
    { name: "Pipeline", level: 2 },
    { name: "Data", level: 4 },
    { name: "People", level: 3 },
    { name: "Culture", level: 2 },
    { name: "Governance", level: 3 },
    { name: "Strategic alignment", level: 2 },
];

/** A static example of Karta's seven-dimension HP3M assessment, not account data. */
function AssessmentPreview() {
    return (
        <figure className={styles.preview} aria-label="Example maturity assessment with seven dimensions scored out of five">
            <figcaption className={styles.previewHeader}>
                <span className={styles.previewIcon}><ChartNoAxesCombined aria-hidden="true" /></span>
                <div><strong>Maturity overview</strong><span>Example assessment</span></div>
                <span className={styles.previewScale}>Level / 5</span>
            </figcaption>
            <div className={styles.dimensionList}>
                {dimensions.map(({ name, level }) => (
                    <div className={styles.dimension} key={name}>
                        <span>{name}</span>
                        <span className={styles.levelTrack} aria-hidden="true">
                            {[1, 2, 3, 4, 5].map(value => <i key={value} data-filled={value <= level} />)}
                        </span>
                        <span className={styles.levelValue}>{level}<span className={styles.srOnly}> out of 5</span></span>
                    </div>
                ))}
            </div>
            <div className={styles.previewFooter}><span>7 dimensions</span><span>One shared perspective</span></div>
        </figure>
    );
}

export function AuthShell({ children, registration = false }: { children: ReactNode; registration?: boolean }) {
    return (
        <div className={styles.shell}>
            <header className={styles.header}>
                <BrandLink />
                <div className={styles.headerActions}>
                    <Link href="/docs" className={styles.helpLink}>Help & docs <ArrowUpRight aria-hidden="true" /></Link>
                    <ThemeToggle />
                </div>
            </header>
            <main className={styles.main} id="auth-content">
                <aside className={styles.story} aria-labelledby="auth-story-title">
                    <div className={styles.storyIntro}>
                        <p className={styles.eyebrow}>Process mining maturity</p>
                        <h2 id="auth-story-title">Understand where you stand. Decide what comes next.</h2>
                        <p>Bring your assessments, insights, and next steps together in one workspace.</p>
                    </div>
                    <AssessmentPreview />
                    <Link href="/hp3m" className={styles.storyLink}>Explore the HP3M framework <ArrowUpRight aria-hidden="true" /></Link>
                </aside>
                <section className={styles.formPanel} aria-label={registration ? "Create your Karta account" : "Access your Karta account"}>
                    {children}
                </section>
            </main>
            <footer className={styles.footer}>
                <Link href="/" className={styles.backLink}><ArrowLeft aria-hidden="true" /> Back to Karta</Link>
                <span>© {new Date().getFullYear()} Karta</span>
            </footer>
        </div>
    );
}
