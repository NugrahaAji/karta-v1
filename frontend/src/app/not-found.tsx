"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatedGridPattern } from "@/components/ui/animated-grid-pattern";
import { Home, ArrowLeft, FileSearch } from "lucide-react";

export default function NotFound() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setVisible(true), 60);
        return () => clearTimeout(t);
    }, []);

    return (
        <div
            className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden font-sans"
            style={{ backgroundColor: "var(--bg)", color: "var(--text-primary)" }}
        >
            {/* Animated grid background */}
            <AnimatedGridPattern
                numSquares={30}
                maxOpacity={0.05}
                duration={4}
                repeatDelay={1.2}
                className="[mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,black_20%,transparent_100%)]"
                style={{ color: "var(--accent-from)" }}
            />

            {/* Radial vignette */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background:
                        "radial-gradient(ellipse 80% 60% at 50% 50%, transparent 40%, var(--bg) 100%)",
                }}
            />

            {/* Content */}
            <div
                className="relative z-10 flex flex-col items-center text-center px-6"
                style={{
                    opacity: visible ? 1 : 0,
                    transform: visible ? "translateY(0)" : "translateY(16px)",
                    transition: "opacity 0.5s ease, transform 0.5s ease",
                }}
            >
                {/* Status chip */}
                <div
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono mb-8"
                    style={{
                        background: "var(--bg-3)",
                        border: "1px solid var(--border)",
                        color: "var(--text-muted)",
                    }}
                >
                    <FileSearch className="w-3 h-3" />
                    HTTP 404 — Page not found
                </div>

                {/* Giant 404 */}
                <div className="relative mb-6 select-none">
                    <span
                        className="text-[10rem] md:text-[14rem] font-black tracking-tighter leading-none text-accent-gradient"
                        aria-hidden="true"
                    >
                        404
                    </span>
                    {/* Subtle glow behind the number */}
                    <div
                        className="absolute inset-0 -z-10 blur-3xl opacity-20"
                        style={{ background: "var(--accent-gradient)" }}
                    />
                </div>

                <h1
                    className="text-2xl md:text-3xl font-bold mb-3 tracking-tight"
                    style={{ color: "var(--text-primary)" }}
                >
                    This page doesn&apos;t exist
                </h1>
                <p
                    className="text-base max-w-sm mb-10 leading-relaxed"
                    style={{ color: "var(--text-secondary)" }}
                >
                    The page you&apos;re looking for may have been moved, deleted, or never
                    existed. Let&apos;s get you back on track.
                </p>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                    <Link
                        href="/"
                        className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-md text-white hover:brightness-110 transition-all accent-gradient"
                    >
                        <Home className="w-4 h-4" />
                        Back to Home
                    </Link>
                    <button
                        onClick={() => window.history.back()}
                        className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-md transition-all"
                        style={{
                            background: "var(--bg-3)",
                            border: "1px solid var(--border)",
                            color: "var(--text-primary)",
                        }}
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Go Back
                    </button>
                </div>

                {/* Divider + helpful links */}
                <div
                    className="mt-12 pt-8 flex items-center gap-6 text-xs"
                    style={{
                        borderTop: "1px solid var(--border-2)",
                        color: "var(--text-faint)",
                    }}
                >
                    {[
                        { label: "Dashboard", href: "/dashboard" },
                        { label: "Docs", href: "/docs" },
                        { label: "Sign In", href: "/auth/login" },
                    ].map((l) => (
                        <Link
                            key={l.href}
                            href={l.href}
                            className="transition-colors hover:text-accent font-medium"
                            style={{ color: "var(--text-muted)" }}
                        >
                            {l.label}
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
