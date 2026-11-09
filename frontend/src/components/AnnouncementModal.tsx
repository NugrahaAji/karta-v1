"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Megaphone, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import styles from "./AnnouncementModal.module.css";

type AnnouncementModalProps = {
    announcementId: string;
    title: string;
    description: string;
    children?: ReactNode;
    dismissLabel?: string;
    secondaryAction?: { label: string; href: string };
};

export function AnnouncementModal({
    announcementId,
    title,
    description,
    children,
    dismissLabel = "Got it",
    secondaryAction,
}: AnnouncementModalProps) {
    const [open, setOpen] = useState(false);
    const titleRef = useRef<HTMLHeadingElement>(null);
    const storageKey = `karta:announcement:${announcementId}`;

    useEffect(() => {
        try {
            setOpen(sessionStorage.getItem(storageKey) !== "seen");
        } catch {
            setOpen(true);
        }
    }, [storageKey]);

    function dismiss() {
        setOpen(false);
        try {
            sessionStorage.setItem(storageKey, "seen");
        } catch {
            // The dialog can still be dismissed when browser storage is unavailable.
        }
    }

    return (
        <Dialog.Root open={open} onOpenChange={(nextOpen) => { if (!nextOpen) dismiss(); }}>
            <Dialog.Portal>
                <Dialog.Backdrop className={styles.backdrop} />
                <Dialog.Viewport className={styles.viewport}>
                    <Dialog.Popup className={styles.popup} initialFocus={titleRef} data-lenis-prevent>
                        <div className={styles.header}>
                            <div className={styles.headerRow}>
                                <span className={styles.eyebrow}>
                                    <Megaphone aria-hidden="true" />
                                    Platform announcement
                                </span>
                                <Dialog.Close className={styles.close} aria-label="Dismiss announcement">
                                    <X aria-hidden="true" />
                                </Dialog.Close>
                            </div>
                            <Dialog.Title ref={titleRef} tabIndex={-1} className={styles.title}>
                                {title}
                            </Dialog.Title>
                        </div>
                        <div className={styles.body}>
                            <Dialog.Description className={styles.description}>{description}</Dialog.Description>
                            {children}
                        </div>
                        <div className={styles.actions}>
                            {secondaryAction && (
                                <Link href={secondaryAction.href} onClick={dismiss} className={styles.actionLink}>
                                    {secondaryAction.label}
                                </Link>
                            )}
                            <Dialog.Close className={styles.primary}>{dismissLabel}</Dialog.Close>
                        </div>
                    </Dialog.Popup>
                </Dialog.Viewport>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
