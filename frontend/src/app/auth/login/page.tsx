"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import Logo from "@/components/Logo";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const { login } = useAuth();
    const [form, setForm] = useState({ email: "", password: "" });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(form.email, form.password);
            toast.success("Welcome back!");
            router.push("/dashboard");
        } catch (err: any) {
            if (err.response?.data?.requiresVerification) {
                toast.error("Please verify your email before logging in.", { duration: 5000 });
                router.push(`/auth/register?verify=true&email=${encodeURIComponent(err.response.data.email)}`);
            } else {
                toast.error(err.response?.data?.error || "Login failed");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleOAuth = (provider: string) => {
        if (provider === "Google") {
            window.location.href = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/auth/google`;
        }
    };

    return (
        <div
            className="min-h-screen font-sans  flex flex-col pt-16"
            style={{ backgroundColor: "var(--bg)", color: "var(--text-primary)" }}
        >
            <div className="flex-grow flex w-full animate-in fade-in" style={{ backgroundColor: "var(--bg)" }}>
                <div className="w-full flex flex-col md:flex-row">

                    {/* Left Panel (Visual) */}
                    <div
                        className="w-full md:w-5/12 lg:w-1/2 relative p-10 lg:p-20 flex flex-col justify-center overflow-hidden"
                        style={{
                            backgroundColor: "var(--bg-2)",
                            borderRight: "1px solid var(--border)",
                        }}
                    >
                        <div className="absolute top-0 left-0 w-full h-full opacity-70" style={{ background: "linear-gradient(to bottom right, color-mix(in srgb, var(--accent-from) 20%, transparent), color-mix(in srgb, var(--accent-via) 10%, transparent), color-mix(in srgb, var(--accent-to) 10%, transparent))" }} />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[100px]" style={{ background: "radial-gradient(circle, color-mix(in srgb, var(--accent-from) 10%, transparent), transparent)" }} />

                        <div className="relative z-10 max-w-md mx-auto w-full">
                            <div
                                className="w-12 h-12 rounded-md flex items-center justify-center mb-8"
                                style={{
                                    backgroundColor: "var(--bg)",
                                    border: "1px solid var(--border)",
                                }}
                            >
                                <Logo className="w-6 h-6 text-accent" />
                            </div>
                            <h2
                                className="text-4xl lg:text-5xl font-extrabold mb-6 leading-tight"
                                style={{ color: "var(--text-primary)" }}
                            >
                                Welcome <br /> Back.
                            </h2>
                            <p className="max-w-[280px] leading-relaxed text-base" style={{ color: "var(--text-secondary)" }}>
                                Log in to your workspace to continue analyzing and optimizing your business processes.
                            </p>
                        </div>
                    </div>

                    {/* Right Panel (Form) */}
                    <div
                        className="w-full md:w-7/12 lg:w-1/2 p-10 lg:p-20 flex flex-col justify-center"
                        style={{ backgroundColor: "var(--bg-3)" }}
                    >
                        <div className="max-w-md mx-auto w-full">
                            <div className="mb-10 text-center md:text-left">
                                <h3
                                    className="text-3xl font-bold mb-3"
                                    style={{ color: "var(--text-primary)" }}
                                >
                                    Login
                                </h3>
                                <p style={{ color: "var(--text-secondary)" }}>
                                    Enter your credentials to access your account.
                                </p>
                            </div>

                            {/* OAuth */}
                            <div className="flex gap-4 mb-8">
                                <button
                                    type="button"
                                    onClick={() => handleOAuth("Google")}
                                    className="w-full flex justify-center items-center gap-3 py-2.5 rounded-md text-sm font-semibold transition-all"
                                    style={{
                                        border: "1px solid var(--border)",
                                        backgroundColor: "var(--bg-2)",
                                        color: "var(--text-primary)",
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--bg-4)")}
                                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = "var(--bg-2)")}
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                    </svg>
                                    Continue with Google
                                </button>
                            </div>

                            {/* Divider */}
                            <div className="relative my-8">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full" style={{ borderTop: "1px solid var(--border)" }} />
                                </div>
                                <div className="relative flex justify-center text-xs">
                                    <span
                                        className="px-2 uppercase tracking-widest font-mono text-[10px]"
                                        style={{ backgroundColor: "var(--bg-3)", color: "var(--text-muted)" }}
                                    >
                                        Or
                                    </span>
                                </div>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label
                                        className="block text-sm font-semibold mb-1.5 ml-1"
                                        style={{ color: "var(--text-secondary)" }}
                                    >
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        className="w-full px-4 py-2.5 rounded-md focus:outline-none ring-accent transition-all text-sm"
                                        style={{
                                            backgroundColor: "var(--input-bg)",
                                            border: "1px solid var(--border)",
                                            color: "var(--text-primary)",
                                        }}
                                        placeholder="e.g. johnfrans@gmail.com"
                                        value={form.email}
                                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                                        required
                                    />
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-1.5 px-1">
                                        <label
                                            className="block text-sm font-semibold"
                                            style={{ color: "var(--text-secondary)" }}
                                        >
                                            Password
                                        </label>
                                        <Link
                                            href="/auth/forgot-password"
                                            className="text-xs font-semibold text-accent hover:opacity-80"
                                        >
                                            Forgot password?
                                        </Link>
                                    </div>

                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            className="w-full px-4 py-2.5 rounded-md focus:outline-none ring-accent transition-all text-sm pr-10"
                                            style={{
                                                backgroundColor: "var(--input-bg)",
                                                border: "1px solid var(--border)",
                                                color: "var(--text-primary)",
                                            }}
                                            placeholder="Enter your password"
                                            value={form.password}
                                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(v => !v)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded transition-colors"
                                            style={{ color: "var(--text-muted)" }}
                                            onMouseEnter={e => (e.currentTarget.style.color = "var(--text-primary)")}
                                            onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}
                                            tabIndex={-1}
                                            aria-label={showPassword ? "Hide password" : "Show password"}
                                        >
                                            {showPassword
                                                ? <EyeOff className="w-4 h-4" />
                                                : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full flex justify-center py-2.5 px-4 rounded-md text-sm font-semibold text-white accent-gradient focus:outline-none transition-all disabled:opacity-50"
                                    >
                                        {loading ? "Signing in..." : "Log In"}
                                    </button>
                                </div>
                            </form>

                            <div className="mt-8 text-center text-sm font-medium">
                                <span style={{ color: "var(--text-secondary)" }}>Don&apos;t have an account? </span>
                                <Link
                                    href="/auth/register"
                                    className="font-semibold hover:underline transition-all underline-offset-4"
                                    style={{ color: "var(--text-primary)" }}
                                >
                                    Sign up
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
