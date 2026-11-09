import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Your account | Karta",
    description: "Sign in or create a Karta account to assess your process mining maturity.",
    robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return children;
}
