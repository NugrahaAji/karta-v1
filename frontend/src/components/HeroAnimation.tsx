"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import styles from "./HeroVisualizer.module.css";

export type HeroMotion = { seconds: number; pointerX: number; pointerY: number };
const restingPose: HeroMotion = { seconds: 0, pointerX: 0, pointerY: 0 };

function pointerOffset(position: number, center: number, start: number, end: number) {
    const span = position < center ? center - start : end - center;
    return Math.max(-1, Math.min(1, (position - center) / Math.max(1, span)));
}

export function HeroAnimation({ children }: { children: (motion: HeroMotion, phase: number) => ReactNode }) {
    const ref = useRef<HTMLDivElement>(null);
    const [motion, setMotion] = useState(restingPose);
    const [phase, setPhase] = useState(0);

    useEffect(() => {
        const element = ref.current;
        const hero = element?.closest<HTMLElement>("[data-hero]");
        if (!element || !hero) return;
        setPhase(Math.random() * 2 * Math.PI);
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
        let visible = false;
        let pose = restingPose;
        let targetX = 0;
        let targetY = 0;
        let frame = 0;
        let previous: number | null = null;

        const follow = (event: PointerEvent) => {
            if (event.pointerType !== "mouse" || reduced.matches) return;
            const bounds = hero.getBoundingClientRect();
            const art = element.getBoundingClientRect();
            targetX = pointerOffset(event.clientX, art.left + art.width / 2, bounds.left, bounds.right);
            targetY = pointerOffset(event.clientY, art.top + art.height / 2, bounds.top, bounds.bottom);
        };
        const release = () => { targetX = 0; targetY = 0; };
        const advance = (now: number) => {
            const delta = (now - (previous ?? now)) / 1000;
            previous = now;
            const blend = 1 - Math.exp(-9 * delta);
            pose = {
                seconds: pose.seconds + delta,
                pointerX: pose.pointerX + (targetX - pose.pointerX) * blend,
                pointerY: pose.pointerY + (targetY - pose.pointerY) * blend,
            };
            setMotion(pose);
            frame = requestAnimationFrame(advance);
        };
        const update = () => {
            if (visible && !document.hidden && !reduced.matches) {
                if (!frame) frame = requestAnimationFrame(advance);
                return;
            }
            cancelAnimationFrame(frame);
            frame = 0;
            previous = null;
            release();
            if (reduced.matches) {
                pose = restingPose;
                setMotion(pose);
            }
        };
        const observer = new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting;
            update();
        });
        observer.observe(element);
        hero.addEventListener("pointerenter", follow);
        hero.addEventListener("pointermove", follow);
        hero.addEventListener("pointerleave", release);
        hero.addEventListener("pointercancel", release);
        window.addEventListener("blur", release);
        reduced.addEventListener("change", update);
        document.addEventListener("visibilitychange", update);
        return () => {
            cancelAnimationFrame(frame);
            observer.disconnect();
            hero.removeEventListener("pointerenter", follow);
            hero.removeEventListener("pointermove", follow);
            hero.removeEventListener("pointerleave", release);
            hero.removeEventListener("pointercancel", release);
            window.removeEventListener("blur", release);
            reduced.removeEventListener("change", update);
            document.removeEventListener("visibilitychange", update);
        };
    }, []);

    return (
        <div ref={ref} className={styles.visualizer}>
            {children(motion, phase)}
        </div>
    );
}
