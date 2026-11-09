import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from "react";
import styles from "./ui.module.css";

type ButtonAppearance = {
    variant?: "primary" | "secondary" | "inverse";
    size?: "default" | "large";
    fullWidth?: boolean;
    className?: string;
};

function buttonClassName({ variant = "primary", size = "default", fullWidth, className }: ButtonAppearance) {
    return [styles.button, styles[variant], size === "large" && styles.large, fullWidth && styles.fullWidth, className].filter(Boolean).join(" ");
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & ButtonAppearance & {
    loading?: boolean;
    leadingIcon?: ReactNode;
    trailingIcon?: ReactNode;
};

export function Button({ children, variant, size, fullWidth, className, loading = false, leadingIcon, trailingIcon, disabled, type = "button", ...props }: ButtonProps) {
    return <button {...props} type={type} disabled={disabled || loading} aria-busy={loading || undefined} className={buttonClassName({ variant, size, fullWidth, className })}>
        {leadingIcon}{children}{loading ? <LoaderCircle className={styles.spinner} aria-hidden="true" /> : trailingIcon}
    </button>;
}

export function ButtonLink({ variant, size, fullWidth, className, ...props }: ComponentProps<typeof Link> & ButtonAppearance) {
    return <Link {...props} className={buttonClassName({ variant, size, fullWidth, className })} />;
}

export function IconButton({ className, type = "button", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { "aria-label": string }) {
    return <button {...props} type={type} className={[styles.iconButton, className].filter(Boolean).join(" ")} />;
}

export function IconLink({ className, ...props }: ComponentProps<typeof Link> & { "aria-label": string }) {
    return <Link {...props} className={[styles.iconButton, className].filter(Boolean).join(" ")} />;
}
