"use client";

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";

export default function ForgotPasswordPage() {
    const { forgotPassword } = useAuth();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await forgotPassword(email);
            setSent(true);
            toast.success("If that email is registered, a reset code has been sent.");
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen font-sans  flex flex-col pt-16"
            style={{ backgroundColor: "var(--bg)", color: "var(--text-primary)" }}
        >
            <div className="flex-grow flex w-full" style={{ backgroundColor: "var(--bg)" }}>
                <div className="w-full flex flex-col md:flex-row">
                    {/* Left Panel */}
                    <div
                        className="w-full md:w-5/12 lg:w-1/2 relative p-10 lg:p-20 flex flex-col justify-center overflow-hidden"
                        style={{ backgroundColor: "var(--bg-2)", borderRight: "1px solid var(--border)" }}
                    >
                        <div className="absolute top-0 left-0 w-full h-full opacity-70" style={{ background: "linear-gradient(to bottom right, color-mix(in srgb, var(--accent-from) 20%, transparent), color-mix(in srgb, var(--accent-via) 10%, transparent), color-mix(in srgb, var(--accent-to) 10%, transparent))" }}></div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[100px]" style={{ background: "radial-gradient(circle, color-mix(in srgb, var(--accent-from) 10%, transparent), transparent)" }}></div>
                        <div className="relative z-10 max-w-md mx-auto w-full">
                            <div
                                className="w-12 h-12 rounded-md flex items-center justify-center mb-8"
                                style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)" }}
                            >
                                <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                </svg>
                            </div>
                            <h2 className="text-4xl lg:text-5xl font-extrabold mb-6 leading-tight" style={{ color: "var(--text-primary)" }}>
                                Forgot <br /> Password?
                            </h2>
                            <p className="max-w-[280px] leading-relaxed text-base" style={{ color: "var(--text-secondary)" }}>
                                No worries! Enter your email and we&apos;ll send you a reset code.
                            </p>
                        </div>
                    </div>

                    {/* Right Panel */}
                    <div
                        className="w-full md:w-7/12 lg:w-1/2 p-10 lg:p-20 flex flex-col justify-center"
                        style={{ backgroundColor: "var(--bg-3)" }}
                    >
                        <div className="max-w-md mx-auto w-full">
                            {!sent ? (
                                <>
                                    <div className="mb-10 text-center md:text-left">
                                        <h3 className="text-3xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>Reset Password</h3>
                                        <p style={{ color: "var(--text-secondary)" }}>Enter the email associated with your account.</p>
                                    </div>

                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-semibold mb-1.5 ml-1" style={{ color: "var(--text-secondary)" }}>Email</label>
                                            <input
                                                type="email"
                                                className="input w-full"
                                                placeholder="e.g. johnfrans@gmail.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="pt-4">
                                            <button
                                                type="submit"
                                                disabled={loading}
                                                className="w-full flex justify-center py-2.5 px-4 rounded-md text-sm font-semibold text-white accent-gradient focus:outline-none transition-all disabled:opacity-50"
                                            >
                                                {loading ? "Sending..." : "Send Reset Code"}
                                            </button>
                                        </div>
                                    </form>
                                </>
                            ) : (
                                <div className="text-center">
                                    <div className="w-20 h-20 mx-auto mb-8 bg-gradient-to-br from-green-600/20 via-green-500/20 to-green-400/20 rounded-xl flex items-center justify-center border border-green-500/30">
                                        <svg className="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-3xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>Check Your Email</h3>
                                    <p className="mb-2" style={{ color: "var(--text-secondary)" }}>We sent a password reset code to</p>
                                    <p className="font-semibold mb-8" style={{ color: "var(--text-primary)" }}>{email}</p>
                                    <Link
                                        href={`/auth/reset-password?email=${encodeURIComponent(email)}`}
                                        className="inline-flex justify-center py-2.5 px-4 rounded-md text-sm font-semibold text-white accent-gradient transition-all"
                                    >
                                        Enter Reset Code
                                    </Link>
                                </div>
                            )}

                            <div className="mt-8 text-center text-sm font-medium">
                                <Link
                                    href="/auth/login"
                                    className="transition-colors underline-offset-4 hover:underline"
                                    style={{ color: "var(--text-secondary)" }}
                                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--text-primary)"}
                                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"}
                                >
                                    ← Back to Login
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
