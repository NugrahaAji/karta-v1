import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from "react";
import styles from "./ui.module.css";

type NavigationAppearance = {
    leadingIcon: ReactNode;
    trailingIcon?: ReactNode;
    selected?: boolean;
    compact?: boolean;
    children: ReactNode;
    className?: string;
};

function navigationClassName({ selected, compact, className }: Pick<NavigationAppearance, "selected" | "compact" | "className">) {
    return [styles.navigationItem, selected && styles.navigationSelected, compact && styles.navigationCompact, className].filter(Boolean).join(" ");
}

function NavigationContent({ leadingIcon, trailingIcon, compact, children }: NavigationAppearance) {
    return <>
        <span className={styles.navigationLeading} aria-hidden="true">{leadingIcon}</span>
        <span className={compact ? styles.srOnly : styles.navigationLabel}>{children}</span>
        {!compact && trailingIcon && <span className={styles.navigationTrailing} aria-hidden="true">{trailingIcon}</span>}
    </>;
}

export function NavigationLink({ leadingIcon, trailingIcon, selected, compact, children, className, ...props }: Omit<ComponentProps<typeof Link>, "children"> & NavigationAppearance) {
    return <Link {...props} className={navigationClassName({ selected, compact, className })}>
        <NavigationContent leadingIcon={leadingIcon} trailingIcon={trailingIcon} compact={compact}>{children}</NavigationContent>
    </Link>;
}

export function NavigationButton({ leadingIcon, trailingIcon, selected, compact, children, className, type = "button", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & NavigationAppearance) {
    return <button {...props} type={type} className={navigationClassName({ selected, compact, className })}>
        <NavigationContent leadingIcon={leadingIcon} trailingIcon={trailingIcon} compact={compact}>{children}</NavigationContent>
    </button>;
}
