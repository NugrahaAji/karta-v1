"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import Logo from "@/components/Logo";
import { IconButton } from "@/components/ui";
import styles from "./NotFoundArtwork.module.css";

/** Decorative 404 artwork. Geometry is local; branding and controls use the UI kit. */
export function NotFoundArtwork() {
    const ref = useRef<HTMLDivElement>(null);
    const [paused, setPaused] = useState(false);
    const [active, setActive] = useState(false);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        let visible = false;
        const update = () => setActive(visible && !document.hidden);
        const observer = new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting;
            update();
        });
        observer.observe(element);
        document.addEventListener("visibilitychange", update);
        return () => {
            observer.disconnect();
            document.removeEventListener("visibilitychange", update);
        };
    }, []);

    const label = paused ? "Play illustration" : "Pause illustration";

    return (
        <div ref={ref} className={styles.artwork} data-paused={paused || !active}>
            <div className={styles.canvas} aria-hidden="true">
                <svg className={styles.drawing} viewBox="0 0 640 480" fill="none" focusable="false">
                    <g className={styles.guides}>
                        <path d="M32 96H608M32 384H608M224 64V416M416 64V416" />
                        <path d="M24 96H40M32 88V104M600 384H616M608 376V392" className={styles.registration} />
                    </g>
                    <g className={styles.numerals}>
                        <path className={styles.firstFour} d="M152 128 64 276H194M162 128V352" />
                        <rect x="244" y="128" width="152" height="224" rx="76" />
                        <path className={styles.lastFour} d="M534 128 446 276H576M544 128V352" />
                    </g>
                    <rect className={styles.tracer} x="244" y="128" width="152" height="224" rx="76" pathLength="100" />
                </svg>
                <div className={styles.markPosition}><Logo className={styles.mark} /></div>
            </div>
            <IconButton className={styles.control} aria-label={label} title={label} onClick={() => setPaused(value => !value)}>
                {paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
            </IconButton>
        </div>
    );
}
