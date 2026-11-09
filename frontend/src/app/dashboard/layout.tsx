"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import CompanyOnboardingPanel from "@/components/CompanyOnboardingPanel";
import WorkspaceSidebar from "@/components/WorkspaceSidebar";
import { LoadingState } from "@/components/ui";
import styles from "@/components/WorkspaceSidebar.module.css";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { user, loading, logout } = useAuth();

    useEffect(() => {
        if (!loading && !user) router.replace("/auth/login");
    }, [loading, user, router]);

    if (loading || !user) {
        return (
            <div className={styles.loadingScreen}>
                <LoadingState>Loading workspace.</LoadingState>
            </div>
        );
    }

    const isCompany = user.accountRole === "Company" && !user.createdBy;

    return (
        <div className={styles.workspace}>
            <WorkspaceSidebar key={user._id} user={user} onLogout={logout} />
            <main id="workspace-content" className={styles.main}>{children}</main>
            {isCompany && user.isOnboarding === false && <CompanyOnboardingPanel />}
        </div>
    );
}
