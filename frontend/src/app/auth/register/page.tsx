"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { Briefcase, Check, GraduationCap, Mail, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AuthShell } from "@/components/auth/AuthShell";
import { Alert } from "@/components/ui/Feedback";
import { AuthDivider, AuthField, AuthLoading, CodeInput, FormError, FormHeading, GoogleButton, PrimaryButton, authError } from "@/components/auth/AuthControls";
import styles from "@/components/auth/auth.module.css";

type Role = "Company" | "Researcher" | "Consultant";
type Plan = { id: string; title: string; price: string; description: string };
const businessPlans: Plan[] = [
    { id: "free", title: "Free", price: "$0/mo", description: "Explore demo data and basic dashboards." },
    { id: "pro", title: "Pro", price: "$49/mo", description: "Measure process mining maturity and export reports." },
    { id: "enterprise", title: "Enterprise", price: "$199/mo", description: "Maturity results, actionable dashboards, and recommendations." },
];
const academicPlans: Plan[] = [{ id: "researcher_plan", title: "Academic", price: "Free", description: "Process mining maturity measurement for academic use." }];
const roles = [{ id: "Company", icon: Briefcase }, { id: "Researcher", icon: GraduationCap }, { id: "Consultant", icon: User }] as const;

function RegisterForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { register, verifyEmail, resendOtp, user } = useAuth();
    const verifyEmailParam = searchParams.get("verify") === "true" ? searchParams.get("email") : null;
    const [step, setStep] = useState(verifyEmailParam ? 3 : 1);
    const [role, setRole] = useState<Role>("Company");
    const [plan, setPlan] = useState("free");
    const [form, setForm] = useState({ firstName: "", lastName: "", email: verifyEmailParam || "", password: "" });
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [cooldown, setCooldown] = useState(verifyEmailParam ? 5 : 0);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const contentRef = useRef<HTMLDivElement>(null);
    const previousStep = useRef(step);
    const plans = role === "Researcher" ? academicPlans : businessPlans;
    const selectedPlan = plans.find(item => item.id === plan)!;

    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setTimeout(() => setCooldown(value => value - 1), 1000);
        return () => clearTimeout(timer);
    }, [cooldown]);

    useEffect(() => {
        if (previousStep.current !== step) {
            previousStep.current = step;
            contentRef.current?.querySelector("h1")?.focus();
        }
    }, [step]);

    function changeStep(next: number) { setError(""); setNotice(""); setStep(next); }

    async function createAccount(event: React.FormEvent) {
        event.preventDefault();
        if (loading) return;
        if (!form.firstName.trim() || !form.lastName.trim()) {
            setError("Enter your first and last name to create your account.");
            return;
        }
        setError("");
        setLoading(true);
        try {
            await register(`${form.firstName.trim()} ${form.lastName.trim()}`, form.email.trim(), form.password, role, plan);
            setForm(value => ({ ...value, email: value.email.trim(), password: "" }));
            changeStep(3);
            setCooldown(60);
        } catch (err: unknown) {
            setError(authError(err, "We could not create your account. Check your details and try again."));
        } finally { setLoading(false); }
    }

    async function verifyCode(event: React.FormEvent) {
        event.preventDefault();
        if (loading || resending) return;
        setLoading(true);
        setError("");
        setNotice("");
        try {
            await verifyEmail(form.email, code);
            toast.success(user ? "Email verified. Your workspace is ready." : "Email verified. Sign in to continue.");
            router.push(user ? "/dashboard" : "/auth/login");
        } catch (err: unknown) {
            setError(authError(err, "We could not verify this code. Check the 6 digits or request a new code."));
        } finally { setLoading(false); }
    }

    async function resendCode() {
        if (cooldown > 0 || resending || loading) return;
        setResending(true);
        setError("");
        setNotice("");
        try {
            await resendOtp(form.email, "email_verification");
            setCode("");
            setCooldown(60);
            setNotice("A new verification code has been sent. Check your inbox and spam folder.");
        } catch (err: unknown) {
            setError(authError(err, "The code could not be sent. Please try again."));
        } finally { setResending(false); }
    }

    return <div ref={contentRef}>
        <ol className={styles.steps} aria-label="Account setup progress">
            {["Workspace", "Your details", "Verify email"].map((label, index) => <li key={label} className={styles.step} aria-current={step === index + 1 ? "step" : undefined} data-done={step > index + 1}>
                <span className={styles.stepNumber}>{step > index + 1 ? <Check aria-hidden="true" /> : index + 1}</span><span>{label}</span>
            </li>)}
        </ol>
        {step === 1 && <>
            <FormHeading title="Make room for better processes">Choose how you’ll use Karta to get started.</FormHeading>
            <form className={styles.form} onSubmit={event => { event.preventDefault(); changeStep(2); }}>
                <fieldset className={styles.choiceGroup}>
                    <legend>I’m joining as a</legend>
                    <div className={styles.roleOptions}>{roles.map(({ id, icon: Icon }) => <label className={styles.roleChoice} key={id}>
                        <input className={styles.srOnly} type="radio" name="role" value={id} checked={role === id} onChange={() => { setRole(id); setPlan(id === "Researcher" ? "researcher_plan" : "free"); }} />
                        <span><Icon aria-hidden="true" />{id}</span>
                    </label>)}</div>
                </fieldset>
                <fieldset className={styles.choiceGroup}>
                    <legend>Choose your plan</legend>
                    <div className={styles.planOptions}>{plans.map(item => <label className={styles.planChoice} key={item.id}>
                        <input type="radio" name="plan" value={item.id} checked={plan === item.id} onChange={() => setPlan(item.id)} />
                        <span className={styles.planContent}><span className={styles.planTitle}><span>{item.title}</span><span>{item.price}</span></span><span className={styles.planDescription}>{item.description}</span></span>
                    </label>)}</div>
                </fieldset>
                <PrimaryButton type="submit">Continue with {selectedPlan.title}</PrimaryButton>
            </form>
        </>}
        {step === 2 && <>
            <FormHeading title="Create your account">A few details, then you’re ready to get started.</FormHeading>
            <div className={styles.configuration}><span><Briefcase aria-hidden="true" />{role} · {selectedPlan.title}</span><button type="button" className={styles.textLink} onClick={() => changeStep(1)} disabled={loading}>Change</button></div>
            <form className={styles.form} onSubmit={createAccount} aria-busy={loading}>
                <FormError message={error} />
                <fieldset className={styles.fields} disabled={loading}>
                    <div className={styles.nameFields}>
                        <AuthField id="first-name" name="given-name" label="First name" type="text" autoComplete="given-name" placeholder="Alex" hint="Your given name." required value={form.firstName} onChange={event => setForm({ ...form, firstName: event.target.value })} />
                        <AuthField id="last-name" name="family-name" label="Last name" type="text" autoComplete="family-name" placeholder="Morgan" hint="Your family name." required value={form.lastName} onChange={event => setForm({ ...form, lastName: event.target.value })} />
                    </div>
                    <AuthField id="register-email" name="email" label="Email address" type="email" autoComplete="email" placeholder="you@company.com" hint="We’ll send a verification code to this address." required value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} />
                    <AuthField id="register-password" name="password" label="Password" type="password" autoComplete="new-password" placeholder="Create a password" hint="Use at least 6 characters." minLength={6} required value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} />
                    <PrimaryButton type="submit" loading={loading}>{loading ? "Creating account…" : "Create account"}</PrimaryButton>
                </fieldset>
            </form>
            <AuthDivider /><GoogleButton disabled={loading} />
        </>}
        {step === 3 && <>
            <div className={styles.statusIcon}><Mail aria-hidden="true" /></div>
            <FormHeading title="Check your inbox">Enter the verification code sent to <strong>{form.email}</strong> to activate your account.</FormHeading>
            <form className={styles.form} onSubmit={verifyCode} aria-busy={loading}>
                <FormError message={error} />
                {notice && <Alert>{notice}</Alert>}
                <CodeInput value={code} onChange={value => { setCode(value); setError(""); }} disabled={loading || resending} invalid={Boolean(error)} />
                <PrimaryButton type="submit" loading={loading} disabled={resending}>{loading ? "Verifying email…" : "Verify email"}</PrimaryButton>
            </form>
            <p className={styles.resend}>Didn’t receive a code? <button type="button" className={styles.textLink} disabled={cooldown > 0 || resending || loading} onClick={resendCode}>{resending ? "Sending code…" : cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}</button></p>
        </>}
        <p className={styles.switchAuth}>{step === 3 ? "Already verified?" : "Already have an account?"} <Link className={styles.textLink} href="/auth/login">Sign in</Link></p>
    </div>;
}

export default function RegisterPage() {
    return <AuthShell registration><Suspense fallback={<AuthLoading />}><RegisterForm /></Suspense></AuthShell>;
}
