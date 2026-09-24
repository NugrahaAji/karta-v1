"use client";

import { useEffect, useState } from "react";
import { X, FlaskConical, Wrench, Megaphone } from "lucide-react";
import Link from "next/link";

const STORAGE_KEY = "karta_alpha_announcement_seen";

export function AnnouncementModal() {
    const [open, setOpen] = useState(false);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Show once per session (clears when tab/browser is closed)
        const seen = sessionStorage.getItem(STORAGE_KEY);
        if (!seen) {
            setOpen(true);
            // Slight delay so the entrance feels intentional
            const t = setTimeout(() => setVisible(true), 80);
            return () => clearTimeout(t);
        }
    }, []);

    const dismiss = () => {
        setVisible(false);
        setTimeout(() => {
            setOpen(false);
            sessionStorage.setItem(STORAGE_KEY, "1");
        }, 250);
    };

    if (!open) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={dismiss}
                className="fixed inset-0 z-[200] transition-opacity duration-300"
                style={{
                    background: "rgba(0,0,0,0.6)",
                    backdropFilter: "blur(6px)",
                    WebkitBackdropFilter: "blur(6px)",
                    opacity: visible ? 1 : 0,
                }}
                aria-hidden="true"
            />

            {/* Panel */}
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="announcement-title"
                className="fixed z-[210] inset-0 flex items-center justify-center px-4 pointer-events-none"
            >
                <div
                    className="pointer-events-auto w-full max-w-md rounded-2xl p-0 overflow-hidden transition-all duration-300"
                    style={{
                        background: "var(--bg-2)",
                        border: "1px solid var(--border)",
                        boxShadow: "0 32px 80px rgba(0,0,0,0.5)",
                        opacity: visible ? 1 : 0,
                        transform: visible ? "translateY(0) scale(1)" : "translateY(24px) scale(0.97)",
                    }}
                >
                    {/* Accent banner */}
                    <div
                        className="px-6 py-2 flex items-center gap-3 bg-[var(--bg)]"
                    >
                        <div className="p-1.5 bg-white/20 rounded-md">
                            <Megaphone className="w-4 h-4 text-black" />
                        </div>
                        <span className="text-sm font-bold text-black tracking-wide">
                            Platform Announcement
                        </span>
                        <button
                            onClick={dismiss}
                            className="ml-auto p-1 rounded-md transition-colors hover:bg-white/20 text-black/80 hover:text-black"
                            aria-label="Dismiss announcement"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="px-6 py-6">
                        {/* Status chips */}
                        <div className="flex flex-wrap gap-2 mb-5">
                            <span
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                                style={{
                                    background: "rgba(251,191,36,0.12)",
                                    border: "1px solid rgba(251,191,36,0.3)",
                                    color: "#fbbf24",
                                }}
                            >
                                <FlaskConical className="w-3 h-3" />
                                Alpha Testing
                            </span>
                            <span
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                                style={{
                                    background: "rgba(99,102,241,0.1)",
                                    border: "1px solid rgba(99,102,241,0.25)",
                                    color: "#818cf8",
                                }}
                            >
                                <Wrench className="w-3 h-3" />
                                In Development
                            </span>
                        </div>

                        <h2
                            id="announcement-title"
                            className="text-lg font-bold mb-3 leading-snug"
                            style={{ color: "var(--text-primary)" }}
                        >
                            Karta is currently in Alpha
                        </h2>

                        <p
                            className="text-sm leading-relaxed mb-4"
                            style={{ color: "var(--text-secondary)" }}
                        >
                            You&apos;re accessing an{" "}
                            <strong style={{ color: "var(--text-primary)" }}>early alpha build</strong>{" "}
                            of Karta. The platform is still actively being developed — features may
                            change, some areas may be incomplete, and you may encounter bugs.
                        </p>

                        <ul className="space-y-2 mb-6">
                            {[
                                "Some features may be limited or unavailable",
                                "Data may be reset during major updates",
                                "Performance & stability are actively being improved",
                            ].map((item) => (
                                <li
                                    key={item}
                                    className="flex items-start gap-2 text-xs"
                                    style={{ color: "var(--text-muted)" }}
                                >
                                    <span
                                        className="mt-1.5 h-1.5 w-1.5 rounded-full shrink-0"
                                        style={{ background: "var(--accent-from)" }}
                                    />
                                    {item}
                                </li>
                            ))}
                        </ul>

                        <div
                            className="mb-5"
                            style={{ borderTop: "1px solid var(--border-2)" }}
                        />

                        {/* CTA row */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={dismiss}
                                className="flex-1 py-2.5 text-sm font-bold text-white rounded-lg transition-all hover:brightness-110 accent-gradient"
                            >
                                Got it, let me in
                            </button>
                            <Link
                                href="/docs"
                                onClick={dismiss}
                                className="py-2.5 px-4 text-sm font-semibold rounded-lg transition-all"
                                style={{
                                    background: "var(--bg-3)",
                                    border: "1px solid var(--border)",
                                    color: "var(--text-secondary)",
                                }}
                            >
                                Read docs
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
