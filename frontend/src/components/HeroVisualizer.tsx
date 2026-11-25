"use client";

import { HeroAnimation, type HeroMotion } from "./HeroAnimation";
import styles from "./HeroVisualizer.module.css";

const halfWidth = 8; // Half the 16-unit square stroke in app/icon.svg.
const tau = Math.PI * 2;
const endpoints = [[157.5, 58.5625], [76.5, 138.5], [63, 49.5], [157.5, 129.438], [101, 24], [27, 80], [111.5, 160.5]];
const rays = endpoints.map(([x, y]) => ({
    angle: Math.atan2(y - 94, x - 94.5),
    length: Math.hypot(x - 94.5, y - 94) + halfWidth,
})).sort((a, b) => a.angle - b.angle);

// Adjacent square strokes meet on their angle bisector. These fixed corners
// give the seven arms one continuous top surface throughout their travel.
const arms = rays.map(({ angle, length }, i) => {
    const previous = rays[(i + rays.length - 1) % rays.length].angle;
    const next = rays[(i + 1) % rays.length].angle;
    return {
        x: Math.cos(angle), y: Math.sin(angle), length,
        left: halfWidth / Math.tan(((angle - previous + tau) % tau) / 2),
        right: halfWidth / Math.tan(((next - angle + tau) % tau) / 2),
    };
});

type Point = [number, number];

function camera({ seconds: time, pointerX, pointerY }: HeroMotion) {
    const yaw = -.30 + .43 * Math.sin(time * .32) + .32 * pointerX;
    const pitch = .42 + .21 * Math.sin(time * .39) - .23 * pointerY;
    const roll = -.045 + .085 * Math.sin(time * .27);
    const cy = Math.cos(yaw), sy = Math.sin(yaw);
    const cp = Math.cos(pitch), sp = Math.sin(pitch);
    const cr = Math.cos(roll), sr = Math.sin(roll);

    return (x: number, y: number, z: number): Point => {
        const side = cy * x + sy * z;
        const depth = cy * z - sy * x;
        const vertical = cp * y - sp * depth;
        return [cr * side - sr * vertical, sr * side + cr * vertical];
    };
}

function closedPath(points: Point[]) {
    return `M${points.map(([x, y]) => `${x.toFixed(3)},${y.toFixed(3)}`).join("L")}Z`;
}

function drawLogo(motion: HeroMotion, seed: number) {
    const { seconds: time, pointerX, pointerY } = motion;
    const project = camera(motion);
    const easeIn = 1 - Math.exp(-time);
    const perimeter: Point[] = [];

    for (const [i, arm] of arms.entries()) {
        const phase = seed * (i + 1) + i * 2.4;
        const reach = .34 * Math.sin(time * (.83 + i * .063) + phase)
            + .13 * Math.sin(time * (.47 + i * .041) - phase);
        const length = arm.length + easeIn * (arm.length - Math.max(arm.left, arm.right)) * reach;
        for (const [x, y] of [[arm.left, -halfWidth], [length, -halfWidth], [length, halfWidth]]) {
            perimeter.push([arm.x * x - arm.y * y, arm.y * x + arm.x * y]);
        }
    }

    const front = perimeter.map(([x, y]) => project(x, y, halfWidth));
    const back = perimeter.map(([x, y]) => project(x, y, -halfWidth));
    const [depthX, depthY] = project(0, 0, -2 * halfWidth);
    const frontFace = closedPath(front);
    let silhouette = frontFace;
    for (let i = 0; i < front.length; i++) {
        const next = (i + 1) % front.length;
        const edgeX = front[next][0] - front[i][0];
        const edgeY = front[next][1] - front[i][1];
        // Include the side when the extrusion extends outside this front edge.
        if (edgeX * depthY - edgeY * depthX < 0) {
            silhouette += closedPath([front[next], front[i], back[i], back[next]]);
        }
    }

    return <svg className={styles.artwork} viewBox="-112 -100 224 200" aria-hidden="true" focusable="false">
        <g transform={`translate(${1.8 * Math.sin(time * .29) + 10 * pointerX} ${-3.2 * Math.sin(time * .48) + 7 * pointerY})`}>
            <path d={silhouette} className={styles.shadedSide} />
            <path d={frontFace} fill="currentColor" />
        </g>
    </svg>;
}

export default function HeroVisualizer() {
    return <HeroAnimation>{drawLogo}</HeroAnimation>;
}
