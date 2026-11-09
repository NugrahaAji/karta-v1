"use client";

import { useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { isAxiosError } from "axios";
import { ArrowRight } from "lucide-react";
import { Alert, Button, Divider, LoadingState, TextField } from "@/components/ui";
import styles from "./auth.module.css";

export function authError(error: unknown, fallback: string) {
    if (isAxiosError(error)) {
        const data = error.response?.data;
        return data?.errors?.[0]?.msg || data?.error || fallback;
    }
    return fallback;
}

export function FormHeading({ title, children, eyebrow }: { title: string; children: ReactNode; eyebrow?: string }) {
    return <div className={styles.formHeading}>{eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}<h1 tabIndex={-1}>{title}</h1><div className={styles.description}>{children}</div></div>;
}

// Compatibility names keep auth pages focused on their flow, not field styling.
export { TextField as AuthField } from "@/components/ui/TextField";

export function PrimaryButton({ children, loading = false, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
    return <Button {...props} fullWidth loading={loading} trailingIcon={<ArrowRight aria-hidden="true" />}>{children}</Button>;
}

export function FormError({ message }: { message: string }) {
    return message ? <Alert variant="error">{message}</Alert> : null;
}

export function GoogleButton({ disabled }: { disabled?: boolean }) {
    const [redirecting, setRedirecting] = useState(false);
    return <Button variant="secondary" fullWidth disabled={disabled} loading={redirecting} onClick={() => {
        setRedirecting(true);
        window.location.href = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/auth/google`;
    }}>
        {!redirecting && <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.36ZM12 22c2.7 0 4.96-.9 6.62-2.41l-3.24-2.51c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.58-4.12H3.07v2.59A10 10 0 0 0 12 22ZM6.42 13.92a6 6 0 0 1 0-3.84V7.49H3.07a10 10 0 0 0 0 9.02l3.35-2.59ZM12 5.96c1.47 0 2.79.51 3.83 1.51l2.87-2.87A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.93 5.49l3.35 2.59C7.2 7.72 9.4 5.96 12 5.96Z" /></svg>}
        {redirecting ? "Connecting to Google…" : "Continue with Google"}
    </Button>;
}

export function AuthDivider() { return <Divider>or</Divider>; }

export function CodeInput({ value, onChange, disabled, invalid = false }: { value: string; onChange: (value: string) => void; disabled?: boolean; invalid?: boolean }) {
    return <TextField label="Verification code" hint="Enter the 6-digit code from your email." id="verification-code" name="code" className={styles.codeInput} type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={value} disabled={disabled} aria-invalid={invalid || undefined} placeholder="000000" onChange={event => onChange(event.target.value.replace(/\D/g, "").slice(0, 6))} onPaste={event => {
            event.preventDefault();
            onChange(event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6));
        }} />;
}

export function AuthLoading({ message = "Loading your account…" }: { message?: string }) {
    return <LoadingState>{message}</LoadingState>;
}
