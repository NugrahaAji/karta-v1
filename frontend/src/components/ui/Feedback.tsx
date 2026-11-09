import { AlertCircle, LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";
import styles from "./ui.module.css";

export function Alert({ children, variant = "notice" }: { children: ReactNode; variant?: "error" | "notice" }) {
    return <div className={`${styles.alert} ${styles[variant]}`} role={variant === "error" ? "alert" : "status"}>
        {variant === "error" && <AlertCircle aria-hidden="true" />}<div>{children}</div>
    </div>;
}

export function Divider({ children }: { children?: ReactNode }) {
    return <div className={styles.divider}>{children && <span>{children}</span>}</div>;
}

export function LoadingState({ children = "Loading.", inline = false, iconOnly = false }: { children?: ReactNode; inline?: boolean; iconOnly?: boolean }) {
    return <div className={`${styles.loadingState} ${inline ? styles.loadingInline : ""}`} role="status"><LoaderCircle className={styles.spinner} aria-hidden="true" /><p className={iconOnly ? styles.srOnly : undefined}>{children}</p></div>;
}
