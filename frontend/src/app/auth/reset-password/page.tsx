"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AuthShell } from "@/components/auth/AuthShell";
import { Alert, ButtonLink } from "@/components/ui";
import { AuthField, AuthLoading, CodeInput, FormError, FormHeading, PrimaryButton, authError } from "@/components/auth/AuthControls";
import styles from "@/components/auth/auth.module.css";

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const { resetPassword, forgotPassword } = useAuth();
    const [email, setEmail] = useState(searchParams.get("email") || "");
    const [code, setCode] = useState("");
    const [password, setPassword] = useState("");
    const [confirmation, setConfirmation] = useState("");
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [success, setSuccess] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [passwordMismatch, setPasswordMismatch] = useState(false);

    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setTimeout(() => setCooldown(value => value - 1), 1000);
        return () => clearTimeout(timer);
    }, [cooldown]);

    async function resendCode() {
        if (cooldown > 0 || resending || loading) return;
        const emailInput = document.getElementById("reset-email") as HTMLInputElement | null;
        if (emailInput && !emailInput.reportValidity()) return;
        if (!email.trim()) return;
        setResending(true);
        setError("");
        setNotice("");
        try {
            await forgotPassword(email.trim());
            setCode("");
            setCooldown(60);
            setNotice("If this email is registered, a new reset code is on its way. Check your inbox and spam folder.");
        } catch (err: unknown) {
            setError(authError(err, "We could not resend the code. Try again in a moment."));
        } finally { setResending(false); }
    }

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();
        if (loading || resending) return;
        setError("");
        setNotice("");
        if (password !== confirmation) {
            setPasswordMismatch(true);
            setError("Your passwords don’t match. Enter the same password in both fields.");
            document.getElementById("confirm-password")?.focus();
            return;
        }
        setPasswordMismatch(false);
        setLoading(true);
        try {
            await resetPassword(email.trim(), code, password);
            setPassword("");
            setConfirmation("");
            setSuccess(true);
        } catch (err: unknown) {
            setError(authError(err, "We could not reset your password. Check your code or request a new one."));
        } finally { setLoading(false); }
    }

    if (success) return <div role="status">
        <div className={styles.statusIcon}><Check aria-hidden="true" /></div>
        <FormHeading title="Password updated">Your new password is ready. Sign in to return to your Karta workspace.</FormHeading>
        <ButtonLink href="/auth/login" fullWidth>Sign in <ArrowRight aria-hidden="true" /></ButtonLink>
    </div>;

    return <>
        <FormHeading title="Set a new password" eyebrow="Account recovery">Enter your email verification code and choose a new password.</FormHeading>
        <form className={styles.form} onSubmit={handleSubmit} aria-busy={loading}>
            <FormError message={error} />
            {notice && <Alert>{notice}</Alert>}
            <fieldset className={styles.fields} disabled={loading || resending}>
                <AuthField id="reset-email" name="email" label="Email address" type="email" autoComplete="email" placeholder="you@company.com" hint="The email address that received your reset code." value={email} onChange={event => { setEmail(event.target.value); setCode(""); }} required />
                <CodeInput value={code} onChange={setCode} />
                <AuthField id="new-password" name="new-password" label="New password" type="password" autoComplete="new-password" placeholder="Create a new password" hint="Use at least 6 characters." minLength={6} value={password} onChange={event => { setPassword(event.target.value); setPasswordMismatch(false); }} required />
                <AuthField id="confirm-password" name="confirm-password" label="Confirm password" type="password" autoComplete="new-password" placeholder="Repeat your new password" hint={passwordMismatch ? "Enter the same password as the field above." : "Re-enter your new password to confirm it."} aria-invalid={passwordMismatch || undefined} minLength={6} value={confirmation} onChange={event => { setConfirmation(event.target.value); setPasswordMismatch(false); }} required />
                <PrimaryButton type="submit" loading={loading}>{loading ? "Updating password…" : "Update password"}</PrimaryButton>
            </fieldset>
        </form>
        <p className={styles.resend}>Need another code? <button type="button" className={styles.textLink} onClick={resendCode} disabled={cooldown > 0 || resending || loading || !email.trim()}>{resending ? "Sending code…" : cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}</button></p>
        <p className={styles.switchAuth}><Link href="/auth/login" className={styles.textLink}>Back to sign in</Link></p>
    </>;
}

export default function ResetPasswordPage() {
    return <AuthShell><Suspense fallback={<AuthLoading />}><ResetPasswordForm /></Suspense></AuthShell>;
}
