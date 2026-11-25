import test from 'node:test';
import assert from 'node:assert/strict';
import { maturityRadarGeometry } from './assessment-charts.ts';

const points = [
    { x: 100, y: 20, value: 4, name: 'Quality' },
    { x: 160, y: 100, value: 3, name: 'Privacy' },
    { x: 100, y: 180, value: 4, name: 'Security' },
    { x: 40, y: 100, value: 3, name: 'Availability' },
];

test('a complete radar closes across all axes and permits a filled polygon', () => {
    const geometry = maturityRadarGeometry(points);
    assert.equal(geometry.complete, true);
    assert.equal(geometry.edges.length, 4);
    assert.deepEqual(geometry.edges.at(-1), { from: points[3], to: points[0] });
});

test('missing scores leave true gaps, including the first and last axes', () => {
    for (const missing of [0, 1, 3]) {
        const data = points.map((point, index) => index === missing ? { ...point, x: 100, y: 100, value: null } : point);
        const geometry = maturityRadarGeometry(data);
        assert.equal(geometry.complete, false);
        assert.equal(geometry.points.length, 3);
        assert.equal(geometry.edges.length, 2);
        assert.ok(geometry.edges.every(edge => edge.from.value !== null && edge.to.value !== null));
    }
});

test('isolated results are visible without inventing a line or filled area', () => {
    const data = points.map((point, index) => ({ ...point, value: index === 1 ? 3 : null }));
    const geometry = maturityRadarGeometry(data);
    assert.deepEqual(geometry.points, [data[1]]);
    assert.deepEqual(geometry.edges, []);
    assert.equal(geometry.complete, false);
    assert.deepEqual(maturityRadarGeometry([]), { points: [], edges: [], complete: false });
});
