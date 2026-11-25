import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { ButtonLink } from "@/components/ui";
import { NotFoundArtwork } from "@/components/NotFoundArtwork";
import ui from "@/components/ui/ui.module.css";
import styles from "./not-found.module.css";

export default function NotFound() {
    return (
        <main className={styles.page} aria-labelledby="not-found-title">
            <div className={styles.layout}>
                <div className={styles.content}>
                    <p className={styles.eyebrow}>Error 404</p>
                    <h1 id="not-found-title">This page isn&apos;t here.</h1>
                    <p className={styles.description}>
                        The link may be out of date, or the page may have moved.
                        Let&apos;s get you back to familiar ground.
                    </p>
                    <div className={styles.actions}>
                        <ButtonLink href="/"><ArrowLeft aria-hidden="true" />Back to home</ButtonLink>
                        <ButtonLink href="/docs" variant="secondary">Read the guide<ArrowUpRight aria-hidden="true" /></ButtonLink>
                    </div>
                    <p className={styles.workspaceLink}>
                        Returning to an assessment?{" "}
                        <Link href="/dashboard" className={ui.textLink}>Open your workspace</Link>
                    </p>
                </div>
                <NotFoundArtwork />
            </div>
        </main>
    );
}
