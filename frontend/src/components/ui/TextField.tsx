"use client";

import { useId, useState, type InputHTMLAttributes, type ReactNode, type Ref } from "react";
import { Eye, EyeOff } from "lucide-react";
import { IconButton } from "./Button";
import styles from "./ui.module.css";

export type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
    label: string;
    hint: string;
    error?: string;
    action?: ReactNode;
    leadingIcon?: ReactNode;
    trailingAdornment?: ReactNode;
    hideLabel?: boolean;
    hideHint?: boolean;
    ref?: Ref<HTMLInputElement>;
};

export function TextField({ id, label, hint, error, action, leadingIcon, trailingAdornment, hideLabel = false, hideHint = false, type, className, "aria-describedby": describedBy, "aria-invalid": invalid, ...props }: TextFieldProps) {
    const generatedId = useId();
    const inputId = id || generatedId;
    const [visible, setVisible] = useState(false);
    const password = type === "password";
    const description = [describedBy, `${inputId}-hint`, error && `${inputId}-error`].filter(Boolean).join(" ");

    return <div className={styles.field}>
        <div className={hideLabel ? styles.srOnly : styles.labelRow}><label className={styles.label} htmlFor={inputId}>{label}</label>{action}</div>
        <div className={styles.inputWrap}>
            {leadingIcon && <span className={styles.inputLeading} aria-hidden="true">{leadingIcon}</span>}
            <input {...props} id={inputId} type={password && visible ? "text" : type} className={[styles.input, leadingIcon && styles.inputWithLeading, (password || trailingAdornment) && styles.passwordInput, className].filter(Boolean).join(" ")} aria-describedby={description} aria-invalid={error ? true : invalid} />
            {!password && trailingAdornment && <span className={styles.inputTrailing}>{trailingAdornment}</span>}
            {password && <IconButton className={styles.passwordToggle} aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`} aria-controls={inputId} aria-pressed={visible} onClick={() => setVisible(value => !value)} disabled={props.disabled}>
                {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
            </IconButton>}
        </div>
        <p id={`${inputId}-hint`} className={hideHint ? styles.srOnly : styles.hint}>{hint}</p>
        {error && <p id={`${inputId}-error`} className={`${styles.hint} ${styles.fieldError}`}>{error}</p>}
    </div>;
}
