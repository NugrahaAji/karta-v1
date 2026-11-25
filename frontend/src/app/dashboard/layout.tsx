"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import CompanyOnboardingPanel from "@/components/CompanyOnboardingPanel";
import WorkspaceSidebar from "@/components/WorkspaceSidebar";
import { LoadingState } from "@/components/ui";
import { AiAnalysisProvider } from "@/hooks/useAiAnalysis";
import styles from "@/components/WorkspaceSidebar.module.css";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const contentRef = useRef<HTMLElement>(null);
    const { user, loading, logout } = useAuth();

    useEffect(() => {
        if (!loading && !user) router.replace("/auth/login");
    }, [loading, user, router]);

    // Next controls window scrolling; this workspace has its own persistent scroll container.
    // Reset on page changes only. Queries, filters, and asynchronous results keep their position.
    useLayoutEffect(() => {
        if (contentRef.current) { contentRef.current.scrollTop = 0; contentRef.current.scrollLeft = 0; }
    }, [pathname, user?._id]);

    if (loading || !user) {
        return (
            <div className={styles.loadingScreen}>
                <LoadingState>Loading workspace.</LoadingState>
            </div>
        );
    }

    const isCompany = user.accountRole === "Company" && !user.createdBy;

    return (
        <AiAnalysisProvider key={user._id}><div className={styles.workspace}>
            <WorkspaceSidebar key={user._id} user={user} onLogout={logout} />
            <main ref={contentRef} id="workspace-content" className={styles.main}>{children}</main>
            {isCompany && user.isOnboarding === false && <CompanyOnboardingPanel />}
        </div></AiAnalysisProvider>
    );
}
