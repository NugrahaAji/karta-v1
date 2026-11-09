import type { CSSProperties } from "react";
import { HeroAnimation } from "./HeroAnimation";
import styles from "./HeroVisualizer.module.css";

type Point = readonly [number, number, number];
type SurfacePoint = { point: Point; normal: Point };
type Mesh = { front: string[]; back: string[] };

// Preserve the six directions of app/icon.svg. Scores below are illustrative.
const logoCenter = [94.5, 94] as const;
const logoEndpoints = [[157.5, 58.5625], [67.5, 159], [60, 45], [157.5, 129.438], [101, 24], [27, 80]] as const;
const directions = logoEndpoints.map(([x, y]) => {
    const length = Math.hypot(x - logoCenter[0], y - logoCenter[1]);
    return [(x - logoCenter[0]) / length, (y - logoCenter[1]) / length] as const;
});
const scale = 2.25;
const tubeRadius = 20;
// A fixed intersection keeps the branches joined throughout their score cycles.
const jointLength = 64;
const yaw = -Math.PI / 10;
const tilt = Math.PI / 7;

function rotate([x, y, z]: Point): Point {
    const side = x * Math.cos(yaw) + z * Math.sin(yaw);
    const depth = -x * Math.sin(yaw) + z * Math.cos(yaw);
    return [side, y * Math.cos(tilt) - depth * Math.sin(tilt), y * Math.sin(tilt) + depth * Math.cos(tilt)];
}

// An orthographic projection lets rings and tips move without changing width.
function project(point: Point) {
    const [x, y] = rotate(point);
    return `${(260 + x).toFixed(2)},${(225 + y).toFixed(2)}`;
}

function addLine(mesh: Mesh, points: SurfacePoint[], visible = (_point: Point) => true) {
    let previousFace = "";
    for (let i = 1; i < points.length; i++) {
        const previous = points[i - 1];
        const current = points[i];
        if (!visible(previous.point) || !visible(current.point)) {
            previousFace = "";
            continue;
        }
        const face = rotate(current.normal)[2] + rotate(previous.normal)[2] >= 0 ? "front" : "back";
        if (face !== previousFace) mesh[face].push(`M${project(previous.point)}`);
        mesh[face].push(`L${project(current.point)}`);
        previousFace = face;
    }
}

function paths(mesh: Mesh) {
    return { front: mesh.front.join(""), back: mesh.back.join("") };
}

function travelStyle(x: number, y: number): CSSProperties {
    return { "--branch-travel-x": `${x.toFixed(3)}px`, "--branch-travel-y": `${y.toFixed(3)}px` } as CSSProperties;
}

function createSpoke([x, y]: readonly [number, number], index: number) {
    const length = Math.hypot(x - logoCenter[0], y - logoCenter[1]) * scale;
    const direction = directions[index];
    const extension = length - jointLength;
    const axis = rotate([direction[0], direction[1], 0]);
    const angle = Math.atan2(axis[1], axis[0]) * 180 / Math.PI;
    const projectedExtension = extension * Math.hypot(axis[0], axis[1]);

    function surface(distance: number, angle: number, capAngle = 0): SurfacePoint {
        const radius = tubeRadius * Math.cos(capAngle);
        const axial = distance + tubeRadius * Math.sin(capAngle);
        const perpendicular = radius * Math.cos(angle);
        const normalAxial = Math.sin(capAngle);
        const normalPerpendicular = Math.cos(capAngle) * Math.cos(angle);
        return {
            point: [direction[0] * axial - direction[1] * perpendicular, direction[1] * axial + direction[0] * perpendicular, radius * Math.sin(angle)],
            normal: [direction[0] * normalAxial - direction[1] * normalPerpendicular, direction[1] * normalAxial + direction[0] * normalPerpendicular, Math.cos(capAngle) * Math.sin(angle)],
        };
    }

    // Hide wire segments inside neighboring branches to form one direct joint,
    // instead of drawing a separate sphere over the intersection.
    function outsideNeighbors([px, py, pz]: Point) {
        return !directions.some(([dx, dy], otherIndex) => {
            if (index === otherIndex) return false;
            const axial = px * dx + py * dy;
            const perpendicular = -px * dy + py * dx;
            return axial >= 0 && perpendicular * perpendicular + pz * pz < tubeRadius * tubeRadius - .01;
        });
    }

    const joint: Mesh = { front: [], back: [] };
    for (let i = 0; i <= 8; i++) {
        addLine(joint, Array.from({ length: 49 }, (_, j) => surface(jointLength * i / 8, j * Math.PI / 24)), outsideNeighbors);
    }
    for (let i = 0; i < 12; i++) {
        addLine(joint, Array.from({ length: 33 }, (_, j) => surface(jointLength * j / 32, i * Math.PI / 6)), outsideNeighbors);
    }

    const rings = Array.from({ length: 10 }, (_, i) => {
        const progress = (i + 1) / 10;
        const ring: Mesh = { front: [], back: [] };
        addLine(ring, Array.from({ length: 33 }, (_, j) => surface(jointLength + extension * progress, j * Math.PI / 16)));
        return { ...paths(ring), travel: travelStyle(axis[0] * extension * progress, axis[1] * extension * progress) };
    });

    const fibers = Array.from({ length: 12 }, (_, i) => {
        const start = surface(jointLength, i * Math.PI / 6);
        return {
            transform: `translate(${project(start.point)}) rotate(${angle.toFixed(3)})`,
            opacity: rotate(start.normal)[2] >= 0 ? .85 : .28,
        };
    });

    const cap: Mesh = { front: [], back: [] };
    for (let i = 1; i <= 4; i++) {
        addLine(cap, Array.from({ length: 33 }, (_, j) => surface(length, j * Math.PI / 16, i * Math.PI / 10)));
    }
    for (let i = 0; i < 12; i++) {
        addLine(cap, Array.from({ length: 9 }, (_, j) => surface(length, i * Math.PI / 6, j * Math.PI / 16)));
    }

    return {
        joint: paths(joint), rings, fibers, cap: paths(cap),
        fiberPath: `M0,0H${projectedExtension.toFixed(3)}`,
        travel: travelStyle(axis[0] * extension, axis[1] * extension),
    };
}

// Geometry is generated on the server. CSS animates the reusable mesh parts.
const spokes = logoEndpoints.map(createSpoke);
const cycles = [
    { duration: 10, delay: -1 }, { duration: 13, delay: -6 },
    { duration: 11.5, delay: -4 }, { duration: 14, delay: -9 },
    { duration: 12, delay: -2 }, { duration: 15, delay: -10 },
];

function Wireframe({ front, back }: { front: string; back: string }) {
    return <><path d={back} strokeWidth=".75" opacity=".28" /><path d={front} strokeWidth=".9" opacity=".85" /></>;
}

export default function HeroVisualizer() {
    return (
        <HeroAnimation>
            <svg className={styles.artwork} viewBox="0 0 520 450" fill="none" aria-hidden="true" focusable="false">
                <g className={styles.sculpture} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                    {spokes.map((spoke, index) => (
                        <g key={index} className={styles.branch} style={{ "--branch-duration": `${cycles[index].duration}s`, "--branch-delay": `${cycles[index].delay}s` } as CSSProperties}>
                            <Wireframe {...spoke.joint} />
                            {spoke.fibers.map((fiber, i) => (
                                <g key={i} transform={fiber.transform}>
                                    <g className={styles.fiber}>
                                        <path d={spoke.fiberPath} strokeWidth=".9" opacity={fiber.opacity} vectorEffect="non-scaling-stroke" />
                                    </g>
                                </g>
                            ))}
                            {spoke.rings.map((ring, i) => (
                                <g key={i} className={styles.extension} style={ring.travel}>
                                    <Wireframe {...ring} />
                                </g>
                            ))}
                            <g className={styles.extension} style={spoke.travel}>
                                <Wireframe {...spoke.cap} />
                            </g>
                        </g>
                    ))}
                </g>
            </svg>
        </HeroAnimation>
    );
}
