"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { isAxiosError } from "axios";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthDivider, AuthField, AuthLoading, FormError, FormHeading, GoogleButton, PrimaryButton, authError } from "@/components/auth/AuthControls";
import styles from "@/components/auth/auth.module.css";

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login } = useAuth();
    const [form, setForm] = useState({ email: "", password: "" });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(searchParams.get("error") ? "Google sign-in could not be completed. Try again or sign in with your email." : "");

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();
        if (loading) return;
        setError("");
        setLoading(true);
        try {
            await login(form.email.trim(), form.password);
            toast.success("Welcome back!");
            router.push("/dashboard");
        } catch (err: unknown) {
            if (isAxiosError(err) && err.response?.data?.requiresVerification) {
                toast.error("Verify your email to finish signing in.");
                router.push(`/auth/register?verify=true&email=${encodeURIComponent(err.response.data.email || form.email.trim())}`);
            } else {
                setError(authError(err, "We could not sign you in. Check your email and password, then try again."));
            }
        } finally {
            setLoading(false);
        }
    }

    return <>
        <FormHeading title="Welcome back" eyebrow="Your Karta workspace">Sign in to continue your assessments.</FormHeading>
        <form className={styles.form} onSubmit={handleSubmit} aria-busy={loading}>
            <FormError message={error} />
            <fieldset className={styles.fields} disabled={loading}>
                <AuthField id="login-email" name="email" label="Email address" type="email" autoComplete="email" placeholder="you@company.com" hint="Use the email associated with your account." value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} required />
                <AuthField id="login-password" name="password" label="Password" type="password" autoComplete="current-password" placeholder="Enter your password" hint="Your password is case-sensitive." action={<Link href="/auth/forgot-password" className={styles.textLink}>Forgot password?</Link>} value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} required />
                <PrimaryButton type="submit" loading={loading}>{loading ? "Signing in…" : "Sign in"}</PrimaryButton>
            </fieldset>
        </form>
        <AuthDivider />
        <GoogleButton disabled={loading} />
        <p className={styles.switchAuth}>New to Karta? <Link href="/auth/register" className={styles.textLink}>Create an account</Link></p>
    </>;
}

export default function LoginPage() {
    return <AuthShell><Suspense fallback={<AuthLoading />}><LoginForm /></Suspense></AuthShell>;
}
