"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { useAuth } from "@/hooks/useAuth";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthLoading } from "@/components/auth/AuthControls";

function CallbackInner() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { refreshUser } = useAuth();

    useEffect(() => {
        const token = searchParams.get("token");
        const error = searchParams.get("error");

        if (error) {
            router.replace("/auth/login?error=google_auth_failed");
            return;
        }

        if (!token) {
            router.replace("/auth/login");
            return;
        }

        // Simpan cookie dulu
        Cookies.set("token", token, { expires: 7, sameSite: "lax" });

        // Set auth state di AuthProvider yang SAMA (soft nav — tidak remount)
        // sehingga dashboard langsung punya user, tidak perlu /auth/me ulang.
        refreshUser(token)
            .then(() => {
                router.push("/dashboard");
            })
            .catch(() => {
                // Token valid di URL tapi /auth/me gagal (server error, dsb)
                // Tetap coba masuk dashboard — AuthProvider akan retry dari cookie.
                router.push("/dashboard");
            });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    return <AuthLoading message="Signing you in…" />;
}

export default function AuthCallbackPage() {
    return (
        <AuthShell><Suspense fallback={<AuthLoading message="Signing you in…" />}>
            <CallbackInner />
        </Suspense></AuthShell>
    );
}
