"use client";

import { useId, useRef, type ReactNode } from "react";
import { AlertCircle, CheckCircle2, CircleDashed, Clock3, Flag, Minus, Target } from "lucide-react";
import type { AssessmentResult } from "@/lib/assessment-detail";
import type { Dimension, MonitoringStatus } from "@/types";
import styles from "./assessment.module.css";

export function DetailTabs<T extends string>({ value, onChange, items, children }: {
    value: T; onChange: (value: T) => void; items: { value: T; label: string }[]; children: ReactNode;
}) {
    const id = useId();
    const refs = useRef<(HTMLButtonElement | null)[]>([]);
    return <div className={styles.stack}>
        <div className={styles.tabs} role="tablist" aria-label="Assessment sections">{items.map((item, index) =>
            <button key={item.value} ref={element => { refs.current[index] = element; }} id={`${id}-${item.value}`} type="button" role="tab"
                aria-selected={value === item.value} aria-controls={`${id}-panel`} tabIndex={value === item.value ? 0 : -1}
                onClick={() => onChange(item.value)} onKeyDown={event => {
                    const next = event.key === "ArrowRight" ? (index + 1) % items.length : event.key === "ArrowLeft" ? (index - 1 + items.length) % items.length : event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : -1;
                    if (next < 0) return;
                    event.preventDefault(); refs.current[next]?.focus(); onChange(items[next].value);
                }}>{item.label}</button>)}</div>
        <div id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-${value}`} className={styles.stack}>{children}</div>
    </div>;
}

export function DetailMetrics({ items }: { items: { label: string; value: ReactNode; detail: string }[] }) {
    return <dl className={styles.summary}>{items.map(item => <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd><p>{item.detail}</p></div>)}</dl>;
}

export function ResultStatus({ status }: { status: string }) {
    const attention = status === "Needs review" || status === "Delayed";
    const active = ["Adjusted", "Ongoing", "Targeted"].includes(status);
    const Icon = attention ? AlertCircle : status === "Majority" || status === "Completed" ? CheckCircle2 : status === "Adjusted" ? Flag : Clock3;
    return <span className={styles.status} data-tone={attention ? "attention" : active ? "action" : "neutral"}><Icon aria-hidden="true" />{status}</span>;
}

export const monthIcons = { Targeted: Target, "Not Started": CircleDashed, Ongoing: Clock3, Completed: CheckCircle2, Delayed: AlertCircle };

export function MonthStatus({ month, status, onClick, disabled }: { month: number; status?: MonitoringStatus; onClick?: () => void; disabled?: boolean }) {
    const Icon = status ? monthIcons[status] : Minus;
    const label = `Month ${month}: ${status || "Not scheduled"}`;
    const content = <><span>M{month}</span><Icon aria-hidden="true" /></>;
    return onClick ? <button type="button" className={styles.month} data-status={status} aria-label={`${label}. Edit timeline`} title={label} onClick={onClick} disabled={disabled}>{content}</button>
        : <span className={styles.month} data-status={status} aria-label={label} title={label}>{content}</span>;
}

function ScoreBar({ label, value, max, detail }: { label: string; value: number | null; max: number; detail: string }) {
    return <div className={styles.scoreRow}>
        <div><span>{label}</span><strong>{value === null ? "—" : Number.isInteger(value) ? value : value.toFixed(1)} <span className={styles.copy}>/ {max}</span></strong></div>
        <div className={styles.meter} role="img" aria-label={`${label}: ${value === null ? "no results yet" : `${value.toFixed(1)} out of ${max}`}`}><span style={{ width: `${value === null ? 0 : value / max * 100}%` }} /></div>
        <span className={styles.chartNote}>{detail}</span>
    </div>;
}

export function ScoreOverview({ results, dimensions }: { results: AssessmentResult[]; dimensions: Dimension[] }) {
    const maturity = dimensions.map(dimension => {
        const subs = results.filter(result => result.dimId === dimension._id && result.levels.length === 5);
        const scored = subs.filter(result => result.finalLevelIndex !== null);
        return { dimension, subs, scored, average: scored.length ? scored.reduce((total, result) => total + result.finalLevelIndex! + 1, 0) / scored.length : null };
    }).filter(item => item.subs.length > 0);
    const technology = results.filter(result => result.levels.length === 4);
    if (!maturity.length && !technology.length) return null;
    return <section className={styles.overview} aria-label="Assessment score overview">
        <div className={styles.chartPanel}><h2>Maturity overview</h2><p>Average of available results on the five-level scale.</p>
            <div className={styles.scoreList}>{maturity.length ? maturity.map(({ dimension, subs, scored, average }) => <ScoreBar key={dimension._id} label={dimension.name} value={average} max={5} detail={`${scored.length} of ${subs.length} subdimensions scored`} />) : <p className={styles.copy}>No five-level dimensions in this assessment.</p>}</div>
        </div>
        <div className={styles.sidePanel}><div className={styles.panel}><h2>Technology capability</h2><p>Four-level results are shown separately.</p>
            <div className={styles.scoreList}>{technology.length ? technology.map(result => <ScoreBar key={result.subId} label={result.subName} value={result.finalLevelIndex === null ? null : result.finalLevelIndex + 1} max={4} detail={result.finalLevelIndex === null ? "Awaiting a final result" : result.levels[result.finalLevelIndex]?.name} />) : <p className={styles.copy}>No four-level subdimensions in this assessment.</p>}</div>
        </div></div>
    </section>;
}
