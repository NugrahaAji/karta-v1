import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DashboardPreview from "./dashboard-preview";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
    title: "Dashboard layout preview | Karta",
    robots: { index: false, follow: false },
};

export default function DashboardTestPage() {
    if (process.env.NODE_ENV !== "development") notFound();
    return <DashboardPreview />;
}
