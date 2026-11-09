import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useId, type ReactNode } from "react";
import styles from "@/app/landing.module.css";
import { BrandLink, ButtonLink } from "@/components/ui";
import { cn } from "@/lib/utils";
import Logo from "@/components/Logo";
import brand from "@/components/ui/ui.module.css";

export function AssessmentCTA() {
    const titleId = useId();

    return (
        <div className={styles.shell}>
            <section className={styles.closing} aria-labelledby={titleId}>
                <div>
                    <p className={styles.eyebrow}>Start with your organization</p>
                    <h2 id={titleId}>Your next chapter<br />starts with clarity.</h2>
                </div>
                <div className={styles.closingAction}>
                    <ButtonLink href="/auth/register" variant="inverse" size="large">
                        Start an assessment <ArrowUpRight aria-hidden="true" />
                    </ButtonLink>
                    <p>Create your account to get started.</p>
                </div>
            </section>
        </div>
    );
}

export function Footer({ containerClassName = styles.container }: { containerClassName?: string }) {
    return (
        <footer className={styles.footer}>
            <div className={cn(containerClassName, styles.footerInner)}>
                <div className={styles.footerDetails}>
                    <div className={styles.footerIdentity}>
                        <Logo className={brand.brandMarkXL} />
                        <p>© {new Date().getFullYear()} Karta Inc.</p>
                    </div>
                    <nav className={styles.footerLinks} aria-label="Footer navigation">
                        <div>
                            <h3>Platform</h3>
                            <Link href="/#platform">Overview</Link>
                            <Link href="/#how-it-works">How it works</Link>
                        </div>
                        <div>
                            <h3>Resources</h3>
                            <Link href="/hp3m">HP3M framework</Link>
                            <Link href="/docs">Documentation</Link>
                            <Link href="/api-docs">API reference</Link>
                        </div>
                    </nav>
                </div>
                <div className={styles.footerWordmark} aria-hidden="true">Karta</div>
            </div>
        </footer>
    );
}

export function PublicPageLayout({ children }: { children: ReactNode }) {
    return (
        <div className={styles.publicPage}>
            <div className={styles.publicContent}>
                {children}
                <AssessmentCTA />
            </div>
            <Footer />
        </div>
    );
}
