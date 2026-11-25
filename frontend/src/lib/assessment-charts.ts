export interface MaturityPoint {
    x: number;
    y: number;
    value?: number | null;
    name?: string | number;
}

/** Recharts positions null radar values at the origin; never present those as zero scores. */
export function maturityRadarGeometry(points: MaturityPoint[]) {
    const scored = (point: MaturityPoint) => typeof point.value === "number" && Number.isFinite(point.value) && Number.isFinite(point.x) && Number.isFinite(point.y);
    const visible = points.filter(scored);
    const edges = points.flatMap((point, index) => {
        const next = points[(index + 1) % points.length];
        return points.length > 1 && scored(point) && scored(next) ? [{ from: point, to: next }] : [];
    });
    return { points: visible, edges, complete: points.length >= 3 && visible.length === points.length };
}
