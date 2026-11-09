import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { Navbar } from "@/components/Navbar";
import LenisProvider from "@/components/LenisProvider";
import { BetaAnnouncement } from "@/components/BetaAnnouncement";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });


const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono" });

export const metadata: Metadata = {
    title: "Karta",
    description: "Discover, analyze, and optimize your business processes",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className={cn(inter.variable, jetbrains.variable, "font-sans")}>
            <body className="antialiased" style={{ backgroundColor: "var(--bg)", color: "var(--text-primary)" }}>
                <ThemeProvider>
                    <AuthProvider>
                        <LenisProvider>
                            <Navbar />
                            <BetaAnnouncement />
                            {children}
                            <Toaster
                                position="top-right"
                                toastOptions={{
                                    style: {
                                        background: "var(--bg-2)",
                                        color: "var(--text-primary)",
                                        border: "1px solid var(--border)",
                                        fontSize: "13px",
                                    },
                                }}
                            />
                        </LenisProvider>
                    </AuthProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
