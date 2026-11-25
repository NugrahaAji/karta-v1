"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Keep the temporary workspace canvas separate from public navigation. */
export function PreviewChromeBoundary({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    if (process.env.NODE_ENV === "development" && pathname === "/test/dashboard") return null;
    return <>{children}</>;
}
