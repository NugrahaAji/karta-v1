import Link from "next/link";
import type { ComponentProps } from "react";
import Logo from "@/components/Logo";
import styles from "./ui.module.css";

export function BrandLink({ className, href = "/", subtitle, compact = false, "aria-label": label = "Karta home", ...props }: Omit<ComponentProps<typeof Link>, "href" | "children"> & {
    href?: ComponentProps<typeof Link>["href"];
    subtitle?: string;
    compact?: boolean;
}) {
    return <Link {...props} href={href} aria-label={label} className={[styles.brand, className].filter(Boolean).join(" ")}>
        <Logo className={styles.brandMark} />
        <span className={compact ? styles.srOnly : styles.brandText}><span>Karta</span>{subtitle && <span className={styles.brandSubtitle}>{subtitle}</span>}</span>
    </Link>;
}
