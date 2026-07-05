"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import { Check, Briefcase, User, GraduationCap, BarChart2 } from "lucide-react";

export default function RegisterPage() {
    const router = useRouter();
    const { register: registerFn, verifyEmail, resendOtp } = useAuth();

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    const [role, setRole] = useState("Company");
    const [plan, setPlan] = useState("");

    const [form, setForm] = useState({
        firstName: "", lastName: "", email: "", password: ""
    });

    // OTP state
    const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
    const [resendCooldown, setResendCooldown] = useState(0);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get("verify") === "true" && params.get("email")) {
            setStep(3);
            setForm(f => ({ ...f, email: params.get("email")! }));

            // Give 5 seconds initial warning/cooldown, users can attempt immediately if they have the code or wait
            setResendCooldown(5);
            const interval = setInterval(() => {
                setResendCooldown((prev) => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
    }, []);

    const rolesList = [
        { id: "Researcher", icon: <GraduationCap className="w-4 h-4" /> },
        { id: "Company", icon: <Briefcase className="w-4 h-4" /> },
        { id: "Consultant", icon: <User className="w-4 h-4" /> },
    ];

    const plansByRole: Record<string, any[]> = {
        Researcher: [
            {
                id: "researcher_plan",
                title: "Academic",
                price: "Free",
                desc: "Process Mining Maturity Measurement only.",
                features: ["Maturity Measurement", "Academic Use"]
            }
        ],
        Company: [
            {
                id: "free",
                title: "Free",
                price: "$0/mo",
                desc: "Demo with dummy data limit.",
                features: ["Demo Data Only", "Basic Dashboards"]
            },
            {
                id: "pro",
                title: "Pro",
                price: "$49/mo",
                desc: "Process Mining Maturity Measurement.",
                features: ["PM Maturity Measurement", "Export Reports"]
            },
            {
                id: "enterprise",
                title: "Enterprise",
                price: "$199/mo",
                desc: "Maturity, Results & Recommendations.",
                features: ["Actionable Dashboard", "Improvement Recs"]
            }
        ],
        Consultant: [
            {
                id: "free",
                title: "Free",
                price: "$0/mo",
                desc: "Demo with dummy data limit.",
                features: ["Demo Data Only", "Basic Dashboards"]
            },
            {
                id: "pro",
                title: "Pro",
                price: "$49/mo",
                desc: "Process Mining Maturity Measurement.",
                features: ["PM Maturity Measurement", "Export Reports"]
            },
            {
                id: "enterprise",
                title: "Enterprise",
                price: "$199/mo",
                desc: "Maturity, Results & Recommendations.",
                features: ["Actionable Dashboard", "Improvement Recs"]
            }
        ]
    };

    const handlePlanSelect = (selectedPlanId: string) => {
        setPlan(selectedPlanId);
        setStep(2);
    };

    const handleFinalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const fullName = `${form.firstName} ${form.lastName}`.trim();
            await registerFn(fullName, form.email, form.password, role, plan);
            toast.success("Account created! Please verify your email.");
            setStep(3);
            startResendCooldown();
        } catch (err: any) {
            const msg = err.response?.data?.errors?.[0]?.msg || err.response?.data?.error || "Registration failed";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleOAuth = (provider: string) => {
        if (provider === "Google") {
            window.location.href = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/auth/google`;
        }
    };

    // ─── OTP Handlers ─────────────────────────────────────────────────────

    const handleOtpChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;
        const newDigits = [...otpDigits];
        newDigits[index] = value.slice(-1);
        setOtpDigits(newDigits);
        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handleOtpPaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        const newDigits = [...otpDigits];
        for (let i = 0; i < 6; i++) {
            newDigits[i] = pasted[i] || "";
        }
        setOtpDigits(newDigits);
        const focusIdx = Math.min(pasted.length, 5);
        otpRefs.current[focusIdx]?.focus();
    };

    const handleVerifyOtp = async () => {
        const code = otpDigits.join("");
        if (code.length !== 6) {
            toast.error("Please enter the 6-digit code.");
            return;
        }
        setLoading(true);
        try {
            await verifyEmail(form.email, code);
            toast.success("Email verified successfully!");
            router.push("/dashboard");
        } catch (err: any) {
            const msg = err.response?.data?.error || "Verification failed.";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const startResendCooldown = (initialValue: number = 60) => {
        setResendCooldown(initialValue);
        const interval = setInterval(() => {
            setResendCooldown((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleResendOtp = async () => {
        if (resendCooldown > 0) return;
        try {
            await resendOtp(form.email, "email_verification");
            toast.success("New verification code sent!");
            startResendCooldown();
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to resend code.");
        }
    };

    // ─── Step Indicator ────────────────────────────────────────────────────

    const StepIndicator = ({ activeStep }: { activeStep: number }) => (
        <div className="flex gap-4">
            {[
                { num: 1, label: "Setup Plan" },
                { num: 2, label: "Your Details" },
                { num: 3, label: "Verify Email" },
            ].map((s) => {
                const isActive = s.num === activeStep;
                const isDone = s.num < activeStep;
                return (
                    <div
                        key={s.num}
                        className="p-5 rounded-2xl flex-1 flex flex-col gap-3 relative backdrop-blur-md"
                        style={{
                            backgroundColor: isActive
                                ? "var(--bg-2)"
                                : isDone
                                    ? "rgba(34,197,94,0.15)"
                                    : "rgba(255,255,255,0.06)",
                            border: isActive
                                ? "1px solid var(--border)"
                                : isDone
                                    ? "1px solid rgba(34,197,94,0.3)"
                                    : "1px solid rgba(255,255,255,0.08)",

                        }}
                    >
                        <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold font-mono"
                            style={{
                                backgroundColor: isActive
                                    ? "var(--text-primary)"
                                    : isDone
                                        ? "#22c55e"
                                        : "rgba(255,255,255,0.1)",
                                color: isActive
                                    ? "var(--bg)"
                                    : isDone
                                        ? "#fff"
                                        : "rgba(255,255,255,0.5)",
                            }}
                        >
                            {isDone ? "✓" : s.num}
                        </div>
                        <span
                            className="text-sm font-medium"
                            style={{
                                color: isActive
                                    ? "var(--text-primary)"
                                    : isDone
                                        ? "#4ade80"
                                        : "rgba(255,255,255,0.45)",
                                fontWeight: isActive ? 700 : 500,
                            }}
                        >
                            {s.label}
                        </span>
                    </div>
                );
            })}
        </div>
    );

    return (
        <div className="min-h-screen font-sans  flex flex-col pt-16" style={{ backgroundColor: "var(--bg)", color: "var(--text-primary)" }}>

            {/* ─── Step 1: Role & Plan Selection ────────────────────────── */}
            {step === 1 && (
                <div className="flex-grow flex items-center justify-center w-full px-4 sm:px-6 lg:px-8 py-10 animate-in fade-in slide-in-from-bottom-4">
                    <div className="w-full max-w-[1400px]">
                        <div className="mb-10 text-center">
                            <h1 className="text-4xl font-bold mb-3" style={{color:"var(--text-primary)"}}>Tailor your experience</h1>
                            <p className="text-lg" style={{color:"var(--text-secondary)"}}>Select your role and choose the plan that best fits your needs.</p>
                        </div>
                        <div className="rounded-lg overflow-hidden" style={{backgroundColor:"var(--bg-3)",border:"1px solid var(--border)"}}>
                            <div className="flex flex-col lg:flex-row min-h-[500px]">
                                {/* Column 1: Role Selection */}
                                <div className="lg:w-1/4 p-8" style={{backgroundColor:"var(--bg)",borderRight:"1px solid var(--border))"}}>
                                    <h2 className="text-[10px] font-bold uppercase tracking-widest mb-6 font-mono" style={{color:"var(--text-muted)"}}>1. Determine your Role</h2>
                                    <div className="space-y-4">
                                        {rolesList.map((r) => (
                                            <button
                                                key={r.id}
                                                onClick={() => setRole(r.id)}
                                                className={`w-full flex items-center gap-3 p-4 rounded-lg border transition-all text-left group ${role === r.id ? 'accent-selected' : ''}`}
                                                style={role !== r.id ? {border:"1px solid var(--border)",backgroundColor:"var(--bg-3)",color:"var(--text-secondary)"} : {}}
                                            >
                                                <div className={`p-2 rounded-lg ${role === r.id ? 'accent-gradient text-white' : ''}`}
                                                    style={role !== r.id ? {backgroundColor:"var(--bg-4)",color:"var(--text-secondary)"} : {}}>
                                                    {r.icon}
                                                </div>
                                                <span className="font-semibold" style={{color:role===r.id?"var(--text-primary)":"var(--text-secondary)"}}>{r.id}</span>
                                                {role === r.id && <div className="ml-auto w-2 h-2 rounded-full accent-dot" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Columns 2 & 3: Plan Selection */}
                                <div className="lg:w-3/4 p-8 xl:p-12 relative" style={{backgroundColor:"var(--bg-3)"}}>
                                    <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full blur-[100px] pointer-events-none" style={{ background: "radial-gradient(circle, color-mix(in srgb, var(--accent-from) 10%, transparent), transparent)" }}></div>
                                    <h2 className="text-[10px] font-bold uppercase tracking-widest mb-6 relative z-10 font-mono" style={{color:"var(--text-muted)"}}>2. Choose your Plan</h2>
                                    <div className={`grid gap-6 relative z-10 ${plansByRole[role].length === 1 ? 'grid-cols-1 max-w-sm' : 'grid-cols-1 md:grid-cols-3'}`}>
                                        {plansByRole[role].map((p) => (
                                            <div
                                                key={p.id}
                                                className="flex flex-col rounded-lg p-6 lg:p-8 transition-all group relative overflow-hidden"
                                                style={{backgroundColor:"var(--bg)",border:"1px solid var(--border)"}}>
                                                <div className="absolute top-0 right-0 p-24 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ background: `radial-gradient(circle, color-mix(in srgb, var(--accent-from) 5%, transparent), transparent)` }}></div>
                                                <div className="mb-6 relative z-10">
                                                    <h3 className="text-2xl font-bold" style={{color:"var(--text-primary)"}}>{p.title}</h3>
                                                    <div className="text-3xl font-extrabold text-accent-gradient mt-2">{p.price}</div>
                                                    <p className="text-sm mt-3 h-10" style={{color:"var(--text-secondary)"}}>{p.desc}</p>
                                                </div>
                                                <div className="w-full h-px mb-6 relative z-10" style={{backgroundColor:"var(--border)"}}></div>
                                                <ul className="space-y-4 mb-8 flex-grow relative z-10">
                                                    {p.features.map((feat: string, idx: number) => (
                                                        <li key={idx} className="flex items-start gap-3 text-sm leading-snug" style={{color:"var(--text-primary)"}}>
                                                            <Check className="w-5 h-5 accent-spinner shrink-0" />
                                                            <span>{feat}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                                <button
                                                    onClick={() => handlePlanSelect(p.id)}
                                                    className="mt-auto w-full py-2.5 text-sm font-semibold rounded-md group-hover:accent-gradient group-hover:border-transparent group-hover:text-white transition-all z-10"
                                                    style={{backgroundColor:"var(--bg-4)",border:"1px solid var(--border)",color:"var(--text-primary)"}}>
                                                    Select {p.title}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Step 2: Registration Form ────────────────────────────── */}
            {step === 2 && (
                <div className="flex-grow flex w-full animate-in fade-in slide-in-from-right-8" style={{backgroundColor:"var(--bg)"}}>
                    <div className="w-full flex flex-col md:flex-row">
                        {/* Left Panel */}
                        <div className="w-full md:w-5/12 lg:w-1/2 relative p-10 lg:p-20 flex flex-col justify-center overflow-hidden" style={{backgroundColor:"var(--bg-2)",borderRight:"1px solid var(--border)"}}>
                            <div className="absolute top-0 left-0 w-full h-full opacity-70" style={{ background: "linear-gradient(to bottom right, color-mix(in srgb, var(--accent-from) 20%, transparent), color-mix(in srgb, var(--accent-via) 10%, transparent), color-mix(in srgb, var(--accent-to) 10%, transparent))" }}></div>
                            <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full blur-[80px]" style={{ background: "color-mix(in srgb, var(--accent-from) 20%, transparent)" }}></div>
                            <div className="relative z-10 max-w-md mx-auto w-full">
                                <h2 className="text-4xl lg:text-5xl font-extrabold mb-6 leading-tight" style={{color:"var(--text-primary)"}}>Get Started <br /> with Us</h2>
                                <div className="text-sm mb-16" style={{color:"var(--text-secondary)"}}>
                                    <p className="max-w-[240px] leading-relaxed text-base">Complete these easy steps to register your account.</p>
                                </div>
                                <StepIndicator activeStep={2} />
                                <div className="mt-16 p-6 rounded-lg backdrop-blur-md" style={{border:"1px solid var(--border)",backgroundColor:"var(--bg-3)"}}>
                                    <p className="text-[10px] font-bold uppercase tracking-widest mb-2 font-mono" style={{color:"var(--text-muted)"}}>Selected Configuration:</p>
                                    <strong className="block text-xl text-accent-gradient font-bold tracking-wide">
                                        {role} • {plan.toUpperCase()}
                                    </strong>
                                    <button onClick={() => setStep(1)} className="block mt-4 text-sm underline underline-offset-4 font-medium transition-colors" style={{color:"var(--text-primary)"}}>
                                        Change Role or Plan
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Right Panel (Form) */}
                        <div className="w-full md:w-7/12 lg:w-1/2 p-10 lg:p-20 flex flex-col justify-center" style={{backgroundColor:"var(--bg-3)"}}>
                            <div className="max-w-md mx-auto w-full">
                                <div className="mb-10 text-center md:text-left">
                                    <h3 className="text-3xl font-bold mb-3" style={{color:"var(--text-primary)"}}>Sign Up Account</h3>
                                    <p style={{color:"var(--text-secondary)"}}>Enter your personal data to create your account.</p>
                                </div>

                                <div className="flex gap-4 mb-8">
                                    <button type="button" onClick={() => handleOAuth("Google")} className="w-full flex justify-center items-center gap-3 py-2.5 rounded-md text-sm font-semibold transition-all" style={{border:"1px solid var(--border)",backgroundColor:"var(--bg-2)",color:"var(--text-primary)"}}>
                                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                        </svg>
                                        Continue with Google
                                    </button>
                                </div>

                                <div className="relative my-8">
                                    <div className="absolute inset-0 flex items-center"><div className="w-full" style={{borderTop:"1px solid var(--border)"}} /></div>
                                    <div className="relative flex justify-center text-xs"><span className="px-2 uppercase tracking-widest font-mono text-[10px]" style={{backgroundColor:"var(--bg-3)",color:"var(--text-muted)"}}>Or</span></div>
                                </div>

                                <form onSubmit={handleFinalSubmit} className="space-y-6">
                                    <div className="flex gap-4">
                                        <div className="flex-1">
                                            <label className="block text-sm font-semibold mb-1.5 ml-1" style={{color:"var(--text-secondary)"}}>First Name</label>
                                            <input type="text" className="w-full px-4 py-2.5 rounded-md ring-accent transition-all text-sm" style={{backgroundColor:"var(--input-bg)",border:"1px solid var(--border)",color:"var(--text-primary)"}} placeholder="e.g. John" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-sm font-semibold mb-1.5 ml-1" style={{color:"var(--text-secondary)"}}>Last Name</label>
                                            <input type="text" className="w-full px-4 py-2.5 rounded-md ring-accent transition-all text-sm" style={{backgroundColor:"var(--input-bg)",border:"1px solid var(--border)",color:"var(--text-primary)"}} placeholder="e.g. Francisco" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-1.5 ml-1" style={{color:"var(--text-secondary)"}}>Email</label>
                                        <input type="email" className="w-full px-4 py-2.5 rounded-md ring-accent transition-all text-sm" style={{backgroundColor:"var(--input-bg)",border:"1px solid var(--border)",color:"var(--text-primary)"}} placeholder="e.g. johnfrans@gmail.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-1.5 ml-1" style={{color:"var(--text-secondary)"}}>Password</label>
                                        <div className="relative">
                                            <input type="password" className="w-full px-4 py-2.5 rounded-md ring-accent transition-all text-sm pr-10" style={{backgroundColor:"var(--input-bg)",border:"1px solid var(--border)",color:"var(--text-primary)"}} placeholder="Enter your password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center" style={{color:"var(--text-muted)"}}>
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            </div>
                                        </div>
                                        <p className="text-xs mt-2 ml-1" style={{color:"var(--text-muted)"}}>Must be at least 6 characters.</p>
                                    </div>
                                    <div className="pt-4">
                                        <button type="submit" disabled={loading} className="w-full flex justify-center py-2.5 px-4 rounded-md text-sm font-semibold text-white accent-gradient focus:outline-none transition-all disabled:opacity-50">
                                            {loading ? "Creating account..." : "Sign Up"}
                                        </button>
                                    </div>
                                </form>

                                <div className="mt-8 text-center text-sm font-medium">
                                    <span style={{color:"var(--text-secondary)"}}>Already have an account? </span>
                                    <Link href="/auth/login" className="font-semibold hover:underline transition-all underline-offset-4" style={{color:"var(--text-primary)"}}>Log in</Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Step 3: OTP Email Verification ───────────────────────── */}
            {step === 3 && (
                <div className="flex-grow flex w-full animate-in fade-in slide-in-from-right-8" style={{backgroundColor:"var(--bg)"}}>
                    <div className="w-full flex flex-col md:flex-row">
                        {/* Left Panel */}
                        <div className="w-full md:w-5/12 lg:w-1/2 relative p-10 lg:p-20 flex flex-col justify-center overflow-hidden" style={{backgroundColor:"var(--bg-2)",borderRight:"1px solid var(--border)"}}>
                            <div className="absolute top-0 left-0 w-full h-full opacity-70" style={{ background: "linear-gradient(to bottom right, color-mix(in srgb, var(--accent-from) 20%, transparent), color-mix(in srgb, var(--accent-via) 10%, transparent), color-mix(in srgb, var(--accent-to) 10%, transparent))" }}></div>
                            <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full blur-[80px]" style={{ background: "color-mix(in srgb, var(--accent-from) 20%, transparent)" }}></div>
                            <div className="relative z-10 max-w-md mx-auto w-full">
                                <h2 className="text-4xl lg:text-5xl font-extrabold mb-6 leading-tight" style={{color:"var(--text-primary)"}}>Almost <br /> There!</h2>
                                <div className="text-sm mb-16" style={{color:"var(--text-secondary)"}}>
                                    <p className="max-w-[260px] leading-relaxed text-base">We sent a 6-digit verification code to your email. Enter it to activate your account.</p>
                                </div>
                                <StepIndicator activeStep={3} />
                            </div>
                        </div>

                        {/* Right Panel (OTP Input) */}
                        <div className="w-full md:w-7/12 lg:w-1/2 p-10 lg:p-20 flex flex-col justify-center" style={{backgroundColor:"var(--bg-3)"}}>
                            <div className="max-w-md mx-auto w-full text-center">
                                <div className="w-20 h-20 mx-auto mb-8 rounded-xl flex items-center justify-center" style={{border:"1px solid var(--border)", background: "var(--accent-muted)"}}>
                                    <svg className="w-10 h-10 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>

                                <h3 className="text-3xl font-bold mb-3" style={{color:"var(--text-primary)"}}>Verify Your Email</h3>
                                <p className="mb-2" style={{color:"var(--text-secondary)"}}>We sent a code to</p>
                                <p className="font-semibold mb-10" style={{color:"var(--text-primary)"}}>{form.email}</p>

                                <div className="flex justify-center gap-3 mb-10" onPaste={handleOtpPaste}>
                                    {otpDigits.map((digit, i) => (
                                        <input
                                            key={i}
                                            ref={(el) => { otpRefs.current[i] = el; }}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleOtpChange(i, e.target.value)}
                                            onKeyDown={(e) => handleOtpKeyDown(i, e)}
                                            className="w-14 h-16 text-center text-2xl font-bold font-mono rounded-md ring-accent transition-all" style={{backgroundColor:"var(--input-bg)",border:"1px solid var(--border)",color:"var(--text-primary)"}}
                                        />
                                    ))}
                                </div>

                                <button
                                    onClick={handleVerifyOtp}
                                    disabled={loading}
                                    className="w-full flex justify-center py-2.5 px-4 rounded-md text-sm font-semibold accent-gradient focus:outline-none transition-all disabled:opacity-50 mb-6"
                                >
                                    {loading ? "Verifying..." : "Verify Email"}
                                </button>

                                <p className="text-sm" style={{color:"var(--text-secondary)"}}>
                                    Didn&apos;t receive the code?{" "}
                                    <button
                                        onClick={handleResendOtp}
                                        disabled={resendCooldown > 0}
                                        className={`font-semibold transition-colors ${resendCooldown > 0
                                            ? "cursor-not-allowed"
                                            : "text-accent hover:opacity-80"
                                            }`}
                                    >
                                        {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
                                    </button>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
