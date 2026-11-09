"use client";

import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import styles from "./HeroVisualizer.module.css";

export function HeroAnimation({ children }: { children: ReactNode }) {
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

    const label = paused ? "Play hero animation" : "Pause hero animation";

    return (
        <div ref={ref} className={styles.visualizer} data-paused={paused || !active}>
            {children}
            <button type="button" className={styles.control} onClick={() => setPaused(value => !value)} aria-label={label} title={label}>
                {paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
            </button>
        </div>
    );
}
