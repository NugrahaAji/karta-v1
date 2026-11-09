"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AuthShell } from "@/components/auth/AuthShell";
import { ButtonLink } from "@/components/ui/Button";
import { AuthField, FormError, FormHeading, PrimaryButton, authError } from "@/components/auth/AuthControls";
import styles from "@/components/auth/auth.module.css";

export default function ForgotPasswordPage() {
    const { forgotPassword } = useAuth();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();
        if (loading) return;
        setError("");
        setLoading(true);
        try {
            await forgotPassword(email.trim());
            setEmail(value => value.trim());
            setSent(true);
        } catch (err: unknown) {
            setError(authError(err, "We could not send a reset code. Check your email address and try again."));
        } finally { setLoading(false); }
    }

    return <AuthShell>
        {sent ? <div role="status">
            <div className={styles.statusIcon}><Mail aria-hidden="true" /></div>
            <FormHeading title="Check your inbox">If there’s an account for <strong>{email}</strong>, you’ll receive a password reset code.</FormHeading>
            <div className={styles.successActions}>
                <p className={styles.hint}>Can’t find it? Check your spam folder, or enter a different email address.</p>
                <ButtonLink href={`/auth/reset-password?email=${encodeURIComponent(email)}`} fullWidth>Enter reset code <ArrowRight aria-hidden="true" /></ButtonLink>
                <button type="button" className={styles.textLink} onClick={() => setSent(false)}>Use a different email</button>
            </div>
        </div> : <>
            <FormHeading title="Forgot your password?" eyebrow="Account recovery">Enter your account email and we’ll send you a code to reset your password.</FormHeading>
            <form className={styles.form} onSubmit={handleSubmit} aria-busy={loading}>
                <FormError message={error} />
                <fieldset className={styles.fields} disabled={loading}>
                    <AuthField id="recovery-email" name="email" label="Email address" type="email" autoComplete="email" placeholder="you@company.com" hint="Use the email you registered with Karta." required value={email} onChange={event => setEmail(event.target.value)} />
                    <PrimaryButton type="submit" loading={loading}>{loading ? "Sending reset code…" : "Send reset code"}</PrimaryButton>
                </fieldset>
            </form>
        </>}
        <p className={styles.switchAuth}><Link href="/auth/login" className={styles.textLink}>Back to sign in</Link></p>
    </AuthShell>;
}
