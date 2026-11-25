"use client";

import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from "recharts";
import { finalLevel, type SubResult } from "@/lib/assessment-results";
import { maturityRadarGeometry, type MaturityPoint } from "@/lib/assessment-charts";
import { SectionHeading } from "./WorkspaceUI";
import styles from "./assessment-detail.module.css";

function RadarLabel({ x = 0, y = 0, textAnchor, payload }: { x?: number; y?: number; textAnchor?: "start" | "middle" | "end"; payload?: { value: string } }) {
    const words = (payload?.value ?? "").split(" ");
    const lines: string[] = [""];
    for (const word of words) {
        if ((lines[lines.length - 1] + word).length > 18 && lines[lines.length - 1]) lines.push(word);
        else lines[lines.length - 1] += `${lines[lines.length - 1] ? " " : ""}${word}`;
    }
    return <text x={x} y={y} textAnchor={textAnchor} fill="var(--ui-copy)" fontSize={14}>
        <title>{payload?.value}</title>{lines.map((line, index) => <tspan key={index} x={x} dy={index === 0 ? -((lines.length - 1) * 7) : 16}>{line}</tspan>)}
    </text>;
}

function MaturityRadar({ points = [] }: { points?: MaturityPoint[] }) {
    const geometry = maturityRadarGeometry(points);
    return <g>
        {geometry.complete && <polygon points={geometry.points.map(point => `${point.x},${point.y}`).join(" ")} fill="var(--ui-action-text)" fillOpacity={0.08} />}
        {geometry.edges.map(({ from, to }, index) => <line key={index} x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="var(--ui-action-text)" strokeWidth={2} />)}
        {geometry.points.map((point, index) => <circle key={index} cx={point.x} cy={point.y} r={3} fill="var(--ui-action-text)"><title>{point.name}: level {point.value}</title></circle>)}
    </g>;
}

export function ResultCharts({ results }: { results: SubResult[] }) {
    const five = results.filter(sub => sub.levels.length === 5).map(sub => ({ name: sub.subName, score: finalLevel(sub) }));
    const four = results.filter(sub => sub.levels.length === 4).map(sub => ({ name: sub.subName, score: finalLevel(sub) }));
    const tooltip = { backgroundColor: "var(--ui-paper)", color: "var(--ui-ink)", border: "1px solid var(--ui-outline)", borderRadius: "var(--ui-radius-control)", fontSize: "var(--ui-font-small)" };
    return <section className={styles.measurement} aria-label="Final result measurement">
        <SectionHeading title="Final result measurement" description="Maturity scores by sub-dimension, grouped by their level scale." />
        <div className={styles.chartGrid}>
            <section className={styles.chartPanel} aria-label="Five-level maturity spider chart">
                <h3>Five-level maturity overview</h3><p>{five.length} sub-dimensions · Scale from 1 to 5</p>
                {five.some(item => item.score !== null) ? <div className={styles.chartScroller} role="region" tabIndex={0} aria-label="Five-level spider chart. Scroll horizontally on small screens."><div className={styles.radar}><ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={five} outerRadius="76%" margin={{ top: 32, right: 80, bottom: 32, left: 80 }}>
                        <PolarGrid stroke="var(--ui-outline-input)" />
                        <PolarAngleAxis dataKey="name" tick={<RadarLabel />} />
                        <PolarRadiusAxis domain={[0, 5]} tickCount={6} tick={{ fill: "var(--ui-copy)", fontSize: 12 }} axisLine={false} />
                        <Radar name="Final result" dataKey="score" stroke="var(--ui-action-text)" isAnimationActive={false} shape={<MaturityRadar />} activeDot={false} />
                        <Tooltip contentStyle={tooltip} itemStyle={{ color: "var(--ui-action-text)" }} formatter={value => [value == null ? "Awaiting result" : `Level ${value}`, "Final result"]} />
                    </RadarChart>
                </ResponsiveContainer></div></div> : <div className={styles.chartEmpty}>{five.length ? "Five-level scores will appear as your team responds." : "This assessment has no five-level sub-dimensions."}</div>}
                <p>Unscored and unresolved results are left blank. All scores are also available in the table below.</p>
                {five.length > 0 && <ChartValues label="Read all five-level scores" items={five} max={5} />}
            </section>
            <section className={`${styles.chartPanel} ${styles.barPanel}`} aria-label="Four-level maturity bar chart">
                <h3>Four-level maturity results</h3><p>{four.length} sub-dimensions · Scale from 1 to 4</p>
                {four.some(item => item.score !== null) ? <div className={styles.chartScroller} role="region" tabIndex={0} aria-label="Four-level bar chart. Scroll horizontally to see all sub-dimensions."><div className={styles.barChart} style={{ minWidth: `calc(var(--space-64) * ${Math.max(3, four.length * 2)})` }}><ResponsiveContainer width="100%" height="100%">
                    <BarChart data={four} margin={{ top: 24, right: 16, bottom: 8, left: -16 }}>
                        <CartesianGrid vertical={false} stroke="var(--ui-outline)" />
                        <XAxis dataKey="name" tick={{ fill: "var(--ui-copy)", fontSize: 12 }} interval={0} tickFormatter={name => name.length > 22 ? `${name.slice(0, 21)}…` : name} angle={four.length > 2 ? -25 : 0} textAnchor={four.length > 2 ? "end" : "middle"} height={four.length > 2 ? 72 : 48} axisLine={false} tickLine={false} />
                        <YAxis domain={[0, 4]} ticks={[0, 1, 2, 3, 4]} tick={{ fill: "var(--ui-copy)", fontSize: 12 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={tooltip} itemStyle={{ color: "var(--ui-action-text)" }} cursor={{ fill: "var(--ui-hover)" }} formatter={value => [`Level ${value}`, "Final result"]} />
                        <Bar name="Final result" dataKey="score" fill="var(--ui-action-text)" maxBarSize={64} radius={[4, 4, 0, 0]} isAnimationActive={false}><LabelList dataKey="score" position="top" fill="var(--ui-ink)" fontSize={12} formatter={value => typeof value === "number" ? `${value} / 4` : ""} /></Bar>
                    </BarChart>
                </ResponsiveContainer></div></div> : <div className={styles.chartEmpty}>{four.length ? "Four-level scores will appear as your team responds." : "This assessment has no four-level sub-dimensions."}</div>}
                {four.length > 0 && <ChartValues label="Read all four-level scores" items={four} max={4} />}
            </section>
        </div>
    </section>;
}

function ChartValues({ label, items, max }: { label: string; items: { name: string; score: number | null }[]; max: number }) {
    return <details className={styles.chartValues}><summary>{label}</summary><ul>{items.map((item, index) => <li key={index}><span>{item.name}</span><strong>{item.score === null ? "Not scored" : `${item.score} / ${max}`}</strong></li>)}</ul></details>;
}
