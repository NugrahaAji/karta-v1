"use client";

import { Dialog } from "@base-ui/react/dialog";
import { useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { IconButton } from "./Button";
import styles from "./modal.module.css";

/** Controlled dialog: the owner decides when a close request may discard work. */
export function Modal({ open, onClose, title, description, icon, children, closeLabel = "Close dialog", closeDisabled = false, dismissOnBackdrop = true, placement = "center" }: {
    open: boolean;
    onClose: () => void;
    title: string;
    description: string;
    icon?: ReactNode;
    children: ReactNode;
    closeLabel?: string;
    closeDisabled?: boolean;
    dismissOnBackdrop?: boolean;
    placement?: "center" | "right";
}) {
    const titleRef = useRef<HTMLHeadingElement>(null);
    return <Dialog.Root open={open} disablePointerDismissal={!dismissOnBackdrop} onOpenChange={(nextOpen, details) => {
        if (!nextOpen) {
            // Keep focus inside until the owner either closes or presents an exit prompt.
            details.cancel();
            if (!closeDisabled) onClose();
        }
    }}>
        <Dialog.Portal>
            <Dialog.Backdrop className={styles.backdrop} />
            <Dialog.Viewport className={styles.viewport} data-placement={placement}>
                <Dialog.Popup className={styles.popup} data-placement={placement} initialFocus={titleRef} data-lenis-prevent>
                    <header className={styles.header}>
                        {icon && <span className={styles.icon}>{icon}</span>}
                        <div className={styles.heading}>
                            <Dialog.Title ref={titleRef} tabIndex={-1} className={styles.title}>{title}</Dialog.Title>
                            <Dialog.Description className={styles.description}>{description}</Dialog.Description>
                        </div>
                        <Dialog.Close render={<IconButton aria-label={closeLabel} />} disabled={closeDisabled} className={styles.close}><X aria-hidden="true" /></Dialog.Close>
                    </header>
                    {children}
                </Dialog.Popup>
            </Dialog.Viewport>
        </Dialog.Portal>
    </Dialog.Root>;
}
