"use client";

import { useId, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import styles from "./ui.module.css";

type FieldContent = { label: string; hint: string; error?: string };

export function SelectField({ id, label, hint, error, children, className, "aria-describedby": describedBy, ...props }: SelectHTMLAttributes<HTMLSelectElement> & FieldContent) {
    const generatedId = useId();
    const fieldId = id || generatedId;
    return <div className={styles.field}>
        <label htmlFor={fieldId} className={styles.label}>{label}</label>
        <div className={styles.inputWrap}>
            <select {...props} id={fieldId} className={[styles.input, styles.select, className].filter(Boolean).join(" ")} aria-invalid={error ? true : props["aria-invalid"]} aria-describedby={[describedBy, `${fieldId}-hint`, error && `${fieldId}-error`].filter(Boolean).join(" ")}>{children}</select>
            <ChevronDown className={styles.selectIcon} aria-hidden="true" />
        </div>
        <p id={`${fieldId}-hint`} className={styles.hint}>{hint}</p>
        {error && <p id={`${fieldId}-error`} className={`${styles.hint} ${styles.fieldError}`}>{error}</p>}
    </div>;
}

export function TextAreaField({ id, label, hint, error, className, rows = 3, "aria-describedby": describedBy, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & FieldContent) {
    const generatedId = useId();
    const fieldId = id || generatedId;
    return <div className={styles.field}>
        <label htmlFor={fieldId} className={styles.label}>{label}</label>
        <textarea {...props} id={fieldId} rows={rows} className={[styles.input, styles.textarea, className].filter(Boolean).join(" ")} aria-invalid={error ? true : props["aria-invalid"]} aria-describedby={[describedBy, `${fieldId}-hint`, error && `${fieldId}-error`].filter(Boolean).join(" ")} />
        <p id={`${fieldId}-hint`} className={styles.hint}>{hint}</p>
        {error && <p id={`${fieldId}-error`} className={`${styles.hint} ${styles.fieldError}`}>{error}</p>}
    </div>;
}

export function ChoiceGroup({ label, hint, error, children, disabled }: FieldContent & { children: ReactNode; disabled?: boolean }) {
    const id = useId();
    return <fieldset className={styles.choiceGroup} disabled={disabled} aria-describedby={`${id}-hint${error ? ` ${id}-error` : ""}`} aria-invalid={Boolean(error) || undefined}>
        <legend className={styles.label}>{label}</legend>
        <p id={`${id}-hint`} className={styles.hint}>{hint}</p>
        <div className={styles.choices}>{children}</div>
        {error && <p id={`${id}-error`} className={`${styles.hint} ${styles.fieldError}`}>{error}</p>}
    </fieldset>;
}

export function CheckboxChoice({ label, ...props }: Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & { label: string }) {
    return <label className={styles.checkboxChoice}><input {...props} type="checkbox" /><span>{label}</span></label>;
}
