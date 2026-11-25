"use client";

import { useId } from "react";
import { Bar, BarChart, CartesianGrid, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { AssessmentResult } from "@/lib/assessment-detail";
import styles from "./assessment.module.css";

function splitLabel(value: string) {
    const lines: string[] = [];
    value.split(/\s+/).forEach(word => { const last = lines.length - 1; if (last < 0 || `${lines[last]} ${word}`.length > 22) lines.push(word); else lines[last] += ` ${word}`; });
    return lines;
}

function AxisLabel({ x = 0, y = 0, textAnchor, payload }: { x?: number; y?: number; textAnchor?: "start" | "middle" | "end"; payload?: { value: string } }) {
    const lines = splitLabel(payload?.value ?? "");
    return <text x={x} y={y} textAnchor={textAnchor} className={styles.axisLabel}>{lines.map((line, i) => <tspan key={i} x={x} dy={i === 0 ? `${-(lines.length - 1) * .55}em` : "1.1em"}>{line}</tspan>)}</text>;
}

export function AssessmentCharts({ results }: { results: AssessmentResult[] }) {
    const id = useId();
    const five = results.filter(result => result.levels.length === 5);
    const four = results.filter(result => result.levels.length === 4);
    const data = (items: AssessmentResult[]) => items.map(result => ({ name: result.subName, value: result.finalLevelIndex === null ? null : result.finalLevelIndex + 1 }));
    const tooltipStyle = { background: "var(--ui-paper)", border: "1px solid var(--ui-outline)", borderRadius: "var(--ui-radius-control)", color: "var(--ui-ink)", fontSize: "var(--ui-font-small)" };
    return <section className={styles.stack} aria-labelledby={`${id}-heading`}>
        <div><h2 id={`${id}-heading`} className={styles.sectionTitle}>Final result measurement</h2><p className={styles.copy}>Each chart uses the subdimension&apos;s own maturity scale. Unscored results are left empty.</p></div>
        <div className={styles.measurements}>
            <figure className={styles.radarPanel}><figcaption><h3>Five-level maturity results</h3><p>{five.length} subdimensions · Levels 1–5</p></figcaption>
                {five.length ? <>
                    <div className={styles.radarScroll} tabIndex={0} role="region" aria-label="Five-level spider chart. Scroll horizontally on small screens."><div className={styles.radarChart}><ResponsiveContainer width="100%" height="100%"><RadarChart data={data(five)} outerRadius="60%" margin={{ top: 32, right: 64, bottom: 32, left: 64 }}>
                        <PolarGrid stroke="var(--ui-outline)" />
                        <PolarAngleAxis dataKey="name" tick={<AxisLabel />} />
                        <PolarRadiusAxis angle={90} domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fill: "var(--ui-copy)", fontSize: 12 }} axisLine={false} />
                        <Radar name="Final result" dataKey="value" stroke="var(--ui-action-text)" fill="var(--ui-action)" fillOpacity={0.12} strokeWidth={2} isAnimationActive={false} connectNulls={false} dot={{ r: 3, fill: "var(--ui-action-text)" }} />
                        <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: "var(--ui-ink)" }} formatter={value => [`Level ${value}`, "Final result"]} />
                    </RadarChart></ResponsiveContainer></div></div>
                    <details className={styles.chartValues}><summary>Read all five-level scores</summary><ul>{five.map(result => <li key={result.subId}><span>{result.subName}</span><strong>{result.finalLevelIndex === null ? "Not scored" : `${result.finalLevelIndex + 1} / 5`}</strong></li>)}</ul></details>
                </> : <p className={styles.chartEmpty}>This assessment has no five-level subdimensions.</p>}
            </figure>
            <figure className={styles.barPanel}><figcaption><h3>Four-level capability results</h3><p>{four.length} subdimensions · Levels 1–4</p></figcaption>
                {four.length ? <>
                    <div className={styles.barChart}><ResponsiveContainer width="100%" height="100%"><BarChart data={data(four)} margin={{ top: 16, right: 16, left: -16, bottom: 16 }}>
                        <CartesianGrid stroke="var(--ui-outline)" vertical={false} />
                        <XAxis dataKey="name" interval={0} tick={<AxisLabel />} height={96} tickLine={false} axisLine={{ stroke: "var(--ui-outline)" }} />
                        <YAxis domain={[0, 4]} ticks={[0, 1, 2, 3, 4]} allowDecimals={false} tick={{ fill: "var(--ui-copy)", fontSize: 12 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: "var(--ui-ink)" }} cursor={{ fill: "var(--ui-hover)" }} formatter={value => [`Level ${value}`, "Final result"]} />
                        <Bar name="Final result" dataKey="value" fill="var(--ui-action)" maxBarSize={64} radius={[4, 4, 0, 0]} isAnimationActive={false} />
                    </BarChart></ResponsiveContainer></div>
                    <details className={styles.chartValues}><summary>Read all four-level scores</summary><ul>{four.map(result => <li key={result.subId}><span>{result.subName}</span><strong>{result.finalLevelIndex === null ? "Not scored" : `${result.finalLevelIndex + 1} / 4`}</strong></li>)}</ul></details>
                </> : <p className={styles.chartEmpty}>This assessment has no four-level subdimensions.</p>}
            </figure>
        </div>
    </section>;
}
