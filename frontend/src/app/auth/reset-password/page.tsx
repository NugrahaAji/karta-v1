"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import Logo from "@/components/Logo";

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { resetPassword, forgotPassword } = useAuth();

    const [email, setEmail] = useState(searchParams.get("email") || "");
    const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);

    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setTimeout(() => setResendCooldown((p) => p - 1), 1000);
        return () => clearTimeout(timer);
    }, [resendCooldown]);

    const handleResendCode = async () => {
        if (resendCooldown > 0 || !email) return;
        try {
            await forgotPassword(email);
            toast.success("A new reset code has been sent to your email.");
            setOtpDigits(["", "", "", "", "", ""]);
            otpRefs.current[0]?.focus();
            setResendCooldown(60);
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to resend code.");
        }
    };

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const code = otpDigits.join("");
        if (code.length !== 6) {
            toast.error("Please enter the 6-digit code.");
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match.");
            return;
        }
        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters.");
            return;
        }
        setLoading(true);
        try {
            await resetPassword(email, code, newPassword);
            toast.success("Password reset successfully!");
            setSuccess(true);
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Reset failed.");
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
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <h2 className="text-4xl lg:text-5xl font-extrabold mb-6 leading-tight" style={{ color: "var(--text-primary)" }}>
                                Reset <br /> Password
                            </h2>
                            <p className="max-w-[280px] leading-relaxed text-base" style={{ color: "var(--text-secondary)" }}>
                                Enter the code we sent to your email along with your new password.
                            </p>
                        </div>
                    </div>

                    {/* Right Panel */}
                    <div
                        className="w-full md:w-7/12 lg:w-1/2 p-10 lg:p-20 flex flex-col justify-center"
                        style={{ backgroundColor: "var(--bg-3)" }}
                    >
                        <div className="max-w-md mx-auto w-full">
                            {!success ? (
                                <>
                                    <div className="mb-10 text-center md:text-left">
                                        <h3 className="text-3xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>Enter Reset Code</h3>
                                        <p style={{ color: "var(--text-secondary)" }}>
                                            We sent a 6-digit code to{" "}
                                            <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{email}</span>
                                        </p>
                                    </div>

                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        {!searchParams.get("email") && (
                                            <div>
                                                <label className="block text-sm font-semibold mb-1.5 ml-1" style={{ color: "var(--text-secondary)" }}>Email</label>
                                                <input
                                                    type="email"
                                                    className="input w-full"
                                                    placeholder="Your email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    required
                                                />
                                            </div>
                                        )}

                                        <div>
                                            <label className="block text-sm font-semibold mb-3 ml-1" style={{ color: "var(--text-secondary)" }}>Verification Code</label>
                                            <div className="flex justify-center gap-3" onPaste={handleOtpPaste}>
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
                                                        className="w-14 h-16 text-center text-2xl font-bold font-mono rounded-md ring-accent transition-all"
                                                        style={{
                                                            backgroundColor: "var(--input-bg)",
                                                            border: "1px solid var(--border)",
                                                            color: "var(--text-primary)",
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                            <div className="flex justify-center mt-4">
                                                <div className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                                                    {resendCooldown > 0 ? (
                                                        <span>
                                                            Resend code in{" "}
                                                            <span className="font-mono" style={{ color: "var(--text-primary)" }}>{resendCooldown}s</span>
                                                        </span>
                                                    ) : (
                                                        <>
                                                            Didn&apos;t receive the code?{" "}
                                                            <button
                                                                type="button"
                                                                onClick={handleResendCode}
                                                                className="font-semibold hover:underline transition-all underline-offset-4"
                                                                style={{ color: "var(--text-primary)" }}
                                                            >
                                                                Resend
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold mb-1.5 ml-1" style={{ color: "var(--text-secondary)" }}>New Password</label>
                                            <input
                                                type="password"
                                                className="input w-full"
                                                placeholder="At least 6 characters"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                required
                                                minLength={6}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold mb-1.5 ml-1" style={{ color: "var(--text-secondary)" }}>Confirm Password</label>
                                            <input
                                                type="password"
                                                className="input w-full"
                                                placeholder="Re-enter your password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                required
                                            />
                                        </div>

                                        <div className="pt-4">
                                            <button
                                                type="submit"
                                                disabled={loading}
                                                className="w-full flex justify-center py-2.5 px-4 rounded-md text-sm font-semibold text-white accent-gradient focus:outline-none transition-all disabled:opacity-50"
                                            >
                                                {loading ? "Resetting..." : "Reset Password"}
                                            </button>
                                        </div>
                                    </form>
                                </>
                            ) : (
                                <div className="text-center">
                                    <div className="w-20 h-20 mx-auto mb-8 bg-gradient-to-br from-green-600/20 via-green-500/20 to-green-400/20 rounded-xl flex items-center justify-center border border-green-500/30">
                                        <svg className="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <h3 className="text-3xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>Password Reset!</h3>
                                    <p className="mb-8" style={{ color: "var(--text-secondary)" }}>
                                        Your password has been changed successfully. You can now log in with your new password.
                                    </p>
                                    <Link
                                        href="/auth/login"
                                        className="inline-flex justify-center py-2.5 px-4 rounded-md text-sm font-semibold text-white accent-gradient transition-all"
                                    >
                                        Go to Login
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div className="min-h-screen" style={{ backgroundColor: "var(--bg)" }} />}>
            <ResetPasswordForm />
        </Suspense>
    );
}
