"use client";

import Link from "next/link";
import { BarChart2, Shield, Terminal } from "lucide-react";
import { Footer } from "@/components/Footer";
import { AnimatedGridPattern } from "@/components/ui/animated-grid-pattern";

export default function Home() {
    return (
        <div
            className="min-h-screen font-sans"
            style={{ backgroundColor: "var(--bg)", color: "var(--text-primary)" }}
        >
            <main>
                {/* Hero Section */}
                <section
                    className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden flex flex-col items-center min-h-[90vh] justify-center"
                    style={{ borderBottom: "1px solid var(--border)" }}
                >
                    {/* Animated grid pattern background */}
                    <AnimatedGridPattern
                        numSquares={35}
                        maxOpacity={0.06}
                        duration={3}
                        repeatDelay={1}
                        className="[mask-image:radial-gradient(ellipse_80%_70%_at_50%_50%,black_30%,transparent_100%)]"
                        style={{ color: "var(--accent-from)" }}
                    />
                    {/* Bottom fade so grid dissolves into next section */}
                    <div
                        className="absolute inset-x-0 bottom-0 h-48 z-[1] pointer-events-none"
                        style={{
                            background: "linear-gradient(to bottom, transparent, var(--bg))",
                        }}
                    />

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                        {/* Badge */}
                        <div
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono mb-8 backdrop-blur-md"
                            style={{
                                backgroundColor: "var(--bg-3)",
                                border: "1px solid var(--border)",
                                color: "var(--text-primary)",
                            }}
                        >
                            <span className="h-1.5 w-1.5 bg-yellow-400 rounded-full" />
                            <span className="font-bold">Karta</span> is now on development
                        </div>

                        <h1
                            className="text-5xl lg:text-7xl font-bold tracking-tighter mb-6 leading-tight"
                            style={{ color: "var(--text-primary)" }}
                        >
                            Analyze Process Mining. <br />
                            <span className="text-accent-gradient font-mono tracking-tighter">
                                Scale to millions.
                            </span>
                        </h1>

                        <p
                            className="text-xl mb-10 max-w-2xl mx-auto leading-snug font-sans"
                            style={{ color: "var(--text-secondary)" }}
                        >
                            process mining maturity measurement platform, explain your organization, measure maturity and drive continuous improvement seamlessly
                        </p>

                        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                            <Link
                                href="/auth/register"
                                className="flex items-center px-6 py-3 text-sm font-semibold rounded-md text-white hover:brightness-110 transition-all accent-gradient"
                            >
                                Start your project
                            </Link>
                            <Link
                                href="/docs"
                                className="flex items-center px-6 py-3 text-sm font-semibold rounded-md backdrop-blur-sm transition-all"
                                style={{
                                    backgroundColor: "var(--bg-3)",
                                    color: "var(--text-primary)",
                                    border: "1px solid var(--border)",
                                }}
                            >
                                Documentation
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section
                    id="features"
                    className="py-24 relative"
                    style={{ backgroundColor: "var(--bg)" }}
                >
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                        <div className="mb-16">
                            <h2
                                className="text-3xl font-bold mb-4"
                                style={{ color: "var(--text-primary)" }}
                            >
                                Enterprise-grade capabilities out of the box
                            </h2>
                            <p
                                className="max-w-2xl text-lg"
                                style={{ color: "var(--text-secondary)" }}
                            >
                                We&apos;ve built all the core process analysis blocks you need so you can focus on making process improvements.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6">
                            {[
                                {
                                    icon: <BarChart2 className="w-5 h-5 text-purple-400" />,
                                    title: "Maturity Measurement",
                                    desc: "Every project comes with a dedicated process maturity scanner, evaluating readiness against industry standard frameworks natively.",
                                    accentBorder: "hover:border-accent",
                                },
                                {
                                    icon: <Terminal className="w-5 h-5 text-blue-400" />,
                                    title: "Actionable Results",
                                    desc: "We instantly generate actionable insights representing your bottlenecks, ready for integration with zero config.",
                                    accentBorder: "hover:border-accent",
                                },
                                {
                                    icon: <Shield className="w-5 h-5 text-teal-400" />,
                                    title: "Built-in Auth",
                                    desc: "Karta provides an integrated authentication system out of the box, with row level security tightly coupled to your business data.",
                                    accentBorder: "hover:border-accent",
                                }
                            ].map((feature, i) => (
                                <div
                                    key={i}
                                    className={`p-6 rounded-lg transition-all group overflow-hidden relative font-mono ${feature.accentBorder}`}
                                    style={{
                                        backgroundColor: "var(--bg-3)",
                                        border: "1px solid var(--border)",
                                    }}
                                >
                                    <div className="absolute top-0 right-0 p-48 blur-3xl opacity-0 group-hover:opacity-50 transition-opacity" style={{ background: `radial-gradient(circle, color-mix(in srgb, var(--accent-from) 40%, transparent), transparent)` }} />
                                    <div
                                        className="w-10 h-10 rounded-md flex items-center justify-center mb-6 relative z-10"
                                        style={{
                                            backgroundColor: "var(--bg)",
                                            border: "1px solid var(--border)",
                                        }}
                                    >
                                        {feature.icon}
                                    </div>
                                    <h3
                                        className="text-lg font-medium mb-2 relative z-10"
                                        style={{ color: "var(--text-primary)" }}
                                    >
                                        {feature.title}
                                    </h3>
                                    <p
                                        className="text-sm leading-relaxed relative z-10"
                                        style={{ color: "var(--text-secondary)" }}
                                    >
                                        {feature.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
