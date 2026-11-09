"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BrandLink } from "@/components/ui/BrandLink";
import { ThemeToggle } from "@/components/ThemeToggle";
import styles from "./Navbar.module.css";

const navigationLinks = [
    { href: "/#platform", label: "Platform" },
    { href: "/hp3m", label: "HP3M" },
    { href: "/docs", label: "Docs" },
];

function NavigationLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
    return (
        <ul className={styles.links} role="list">
            {navigationLinks.map(({ href, label }) => {
                const current = pathname === href ? "page" : pathname.startsWith(`${href}/`) ? "location" : undefined;
                return (
                    <li key={href}>
                        <Link href={href} className={styles.link} aria-current={current} onNavigate={onNavigate}>
                            {label}
                        </Link>
                    </li>
                );
            })}
        </ul>
    );
}

type NavigationMode = "flow" | "ready" | "visible" | "hidden";

function useScrollVisibility() {
    const [mode, setMode] = useState<NavigationMode>("flow");
    const slotRef = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const slot = slotRef.current;
        const header = headerRef.current;
        if (!slot || !header) return;

        const threshold = 12;
        const root = document.documentElement;
        const getScrollTop = () => Math.max(0, Math.min(window.scrollY, root.scrollHeight - root.clientHeight));
        let previousTop = getScrollTop();
        let directionStart = previousTop;
        let direction = 0;
        let frame = 0;
        let headerHeight = header.offsetHeight;
        let currentMode: NavigationMode = "flow";

        function update() {
            frame = 0;
            const top = getScrollTop();
            const movement = Math.sign(top - previousTop);
            if (movement && movement !== direction) {
                direction = movement;
                directionStart = previousTop;
            }
            previousTop = top;

            let nextMode = currentMode;
            if (top === 0) {
                nextMode = "flow";
            } else if (currentMode === "flow") {
                // Switch to an off-screen overlay only after the header has
                // scrolled out naturally. The ready state skips the exit animation.
                if (top >= headerHeight) nextMode = "ready";
            } else if (Math.abs(top - directionStart) >= threshold) {
                if (direction < 0) nextMode = "visible";
                else if (direction > 0 && currentMode === "visible") nextMode = "hidden";
            }

            if (nextMode !== currentMode) {
                currentMode = nextMode;
                setMode(nextMode);
            }
        }

        function onScroll() {
            if (!frame) frame = window.requestAnimationFrame(update);
        }

        const measureHeader = () => {
            headerHeight = header.offsetHeight;
            // Keep the document height stable when the header becomes fixed,
            // including after a breakpoint or text-size change.
            slot.style.setProperty("--navbar-slot-height", `${headerHeight}px`);
            onScroll();
        };

        const resizeObserver = new ResizeObserver(measureHeader);
        resizeObserver.observe(header);
        measureHeader();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => {
            resizeObserver.disconnect();
            window.removeEventListener("scroll", onScroll);
            window.cancelAnimationFrame(frame);
        };
    }, []);

    return { mode, slotRef, headerRef };
}

function PublicNavigation({ pathname }: { pathname: string }) {
    const { mode, slotRef, headerRef } = useScrollVisibility();
    const [open, setOpen] = useState(false);
    const signInCurrent = pathname === "/auth/login" ? "page" : undefined;

    useEffect(() => {
        const mobile = window.matchMedia("(max-width: 1023px)");
        const closeOnDesktop = (event: MediaQueryListEvent) => {
            if (!event.matches) setOpen(false);
        };
        mobile.addEventListener("change", closeOnDesktop);
        return () => mobile.removeEventListener("change", closeOnDesktop);
    }, []);

    return (
        <Dialog.Root open={open} onOpenChange={setOpen}>
            <div ref={slotRef} className={styles.headerSlot}>
                <header ref={headerRef} className={styles.header} data-mode={open && mode !== "flow" ? "visible" : mode}>
                    <nav className={styles.navigation} aria-label="Main navigation">
                        <BrandLink aria-current={pathname === "/" ? "page" : undefined} />
                        <div className={styles.desktopLinks}><NavigationLinks pathname={pathname} /></div>
                        <div className={styles.actions}>
                            <Link href="/auth/login" className={`${styles.link} ${styles.desktopSignIn}`} aria-current={signInCurrent}>Sign in</Link>
                            <ThemeToggle variant="icon" />
                            <Dialog.Trigger className={`${styles.iconButton} ${styles.menuToggle}`} aria-label="Open navigation menu">
                                <Menu aria-hidden="true" />
                            </Dialog.Trigger>
                        </div>
                    </nav>
                </header>
            </div>

            <Dialog.Portal>
                <Dialog.Backdrop className={styles.backdrop} />
                <Dialog.Popup className={styles.mobileMenu} data-lenis-prevent>
                    <div className={styles.menuHeader}>
                        <Dialog.Title className={styles.menuTitle}>Menu</Dialog.Title>
                        <Dialog.Close className={styles.iconButton} aria-label="Close navigation menu">
                            <X aria-hidden="true" />
                        </Dialog.Close>
                    </div>
                    <nav className={styles.mobileNavigation} aria-label="Mobile navigation">
                        <NavigationLinks pathname={pathname} onNavigate={() => setOpen(false)} />
                        <Link href="/auth/login" className={`${styles.link} ${styles.mobileSignIn}`} aria-current={signInCurrent} onNavigate={() => setOpen(false)}>
                            Sign in
                        </Link>
                    </nav>
                </Dialog.Popup>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

export function Navbar() {
    const pathname = usePathname() ?? "";

    if (pathname === "/dashboard" || pathname.startsWith("/dashboard/") || pathname.startsWith("/auth/")) return null;

    return <PublicNavigation key={pathname} pathname={pathname} />;
}
