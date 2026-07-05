"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ChevronsUpDown } from "lucide-react";

export function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const pathname = usePathname();
    const isLandingPage = pathname === "/";

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll, { passive: true });
        handleScroll();
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Hidden on dashboard (dashboard has its own sidebar)
    if (pathname?.startsWith("/dashboard")) {
        return null;
    }

    return (
        <div
            className="fixed top-0 left-0 right-0 z-50 flex justify-center transition-all duration-500 ease-out"
            style={{ padding: scrolled ? "12px 24px 0" : "0" }}
        >
            <div
                className="w-full transition-all duration-500 ease-out"
                style={{
                    maxWidth: scrolled ? "1280px" : "100%",
                    borderRadius: scrolled ? "14px" : "0",
                    background: scrolled
                        ? "color-mix(in srgb, var(--bg-2) 85%, transparent)"
                        : "transparent",
                    borderTop:    scrolled ? "1px solid var(--border)" : "1px solid transparent",
                    borderLeft:   scrolled ? "1px solid var(--border)" : "1px solid transparent",
                    borderRight:  scrolled ? "1px solid var(--border)" : "1px solid transparent",
                    borderBottom: scrolled
                        ? "1px solid var(--border)"
                        : isLandingPage
                            ? "1px solid transparent"
                            : "1px solid var(--border)",
                    backdropFilter: scrolled ? "blur(16px)" : "blur(0px)",
                    WebkitBackdropFilter: scrolled ? "blur(16px)" : "blur(0px)",
                }}
            >
                <nav className="max-w-7xl mx-auto px-5 sm:px-6">
                    <div
                        className="flex justify-between items-center transition-all duration-500 ease-out"
                        style={{ height: scrolled ? "52px" : "64px" }}
                    >
                        {/* Left: Logo + Links */}
                        <div className="flex items-center gap-10">
                            <Link href="/" className="flex items-center gap-2">
                                <Logo className="w-4 h-4" style={{ color: "var(--text-primary)" }} />
                                <span
                                    className="text-xl font-bold tracking-tight"
                                    style={{ color: "var(--text-primary)" }}
                                >
                                    Karta
                                </span>
                            </Link>

                            <div className="hidden md:flex items-center space-x-8">
                                <button
                                    className="flex items-center gap-1.5 text-sm font-semibold px-2 py-1.5 rounded-md transition-all"
                                    style={{ color: "var(--text-primary)" }}
                                >
                                    Products <ChevronsUpDown className="w-3.5 h-3.5" style={{ color: "var(--text-secondary)" }} />
                                </button>
                                <Link
                                    href="/docs"
                                    className="text-sm font-semibold px-2 py-1.5 transition-all rounded-md"
                                    style={{ color: "var(--text-primary)" }}
                                >
                                    Docs
                                </Link>
                                <Link
                                    href="/pricing"
                                    className="text-sm font-semibold px-2 py-1.5 transition-all rounded-md"
                                    style={{ color: "var(--text-primary)" }}
                                >
                                    Pricing
                                </Link>
                            </div>
                        </div>

                        {/* Right: Theme toggle + Auth */}
                        <div className="flex items-center gap-3">
                            {/* Theme toggle icon button */}
                            <ThemeToggle variant="icon" />

                            <Link
                                href="/auth/login"
                                className="text-sm font-semibold px-3 py-1.5 rounded-md transition-all"
                                style={{
                                    color: "var(--text-primary)",
                                    border: "1px solid transparent",
                                }}
                            >
                                Sign In
                            </Link>
                            <Link
                                href="/auth/register"
                                className="text-sm font-bold px-4 py-1.5 rounded-md text-white hover:opacity-90 transition-all"
                                style={{ background: "var(--accent-gradient)" }}
                            >
                                Start your project
                            </Link>
                        </div>
                    </div>
                </nav>
            </div>
        </div>
    );
}
