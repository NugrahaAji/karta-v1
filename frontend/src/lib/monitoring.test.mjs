import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMonRows, emptyMonitoring, mergeMonitoringRows, monthStatuses, readMonitoringRows, serializeMonitoringRows } from './monitoring.ts';

const dimensions = [{ _id: 'data', name: 'Data' }, { _id: 'culture', name: 'Culture' }];
const subs = [{ subId: 'quality', subName: 'Quality', dimId: 'data' }, { subId: 'privacy', subName: 'Privacy', dimId: 'data' }, { subId: 'skills', subName: 'Skills', dimId: 'culture' }];
const group = (items, subdimensions = subs.map(sub => sub.subId), id = 'plan') => ({ _id: id, label: 'Improve maturity', items, subdimensions, order: 0 });
const details = extra => ({ ...emptyMonitoring(), pic: 'Process team', ...extra });

test('shared plans retain real dimensions and correctly merge action steps across them', () => {
    const rows = buildMonRows([group(['Review governance'])], subs, dimensions);
    assert.deepEqual(rows.map(row => row.dim._id), ['data', 'data', 'culture']);
    assert.deepEqual(rows.map(row => row.dimSpan), [2, 0, 1]);
    assert.deepEqual(rows.map(row => row.apSpan), [3, 0, 0]);
    assert.equal(serializeMonitoringRows(rows, { plan_0: details() }).length, 1);
});

test('extra action steps stay in the last sub-dimension with a merged score cell', () => {
    const rows = buildMonRows([group(['A', 'B', 'C', 'D', 'E'])], subs, dimensions);
    assert.deepEqual(rows.map(row => row.item), ['A', 'B', 'C', 'D', 'E']);
    assert.deepEqual(rows.map(row => row.subSpan), [1, 1, 3, 0, 0]);
    assert.deepEqual(rows.map(row => row.dimSpan), [2, 0, 3, 0, 0]);
});

test('overlapping plans consistently use the last assignment without duplicate monitoring steps', () => {
    const plans = [group(['Shared review']), group(['Specific review', 'Follow up'], ['privacy'], 'specific')];
    const rows = buildMonRows(plans, subs, dimensions);
    assert.deepEqual(rows.filter(row => row.sub.subId === 'privacy').map(row => row.item), ['Specific review', 'Follow up']);
    assert.deepEqual(rows.map(row => row.key), ['plan_0', 'specific_0', 'specific_1', 'plan_0']);
    const saved = serializeMonitoringRows(rows, { plan_0: details(), specific_0: details(), specific_1: details() });
    assert.equal(saved.length, 3);
    assert.deepEqual(saved.map(row => row.actionPlanGroupId), ['plan', 'specific', 'specific']);
});

test('every generated action step survives save and reload without an ObjectId group', () => {
    const rows = buildMonRows([group(['A', 'B', 'C'], ['privacy'], '__no_ap_privacy')], subs, dimensions);
    const draft = Object.fromEntries([0, 1, 2].map(index => [`__no_ap_privacy_${index}`, details({ subdimension: 'privacy', notes: `Step ${index}` })]));
    const payload = serializeMonitoringRows(rows, draft);
    assert.equal(payload.length, 3);
    assert.ok(payload.every(row => row.actionPlanGroupId === null));
    assert.deepEqual(payload.map(row => row.actionPlanItemIdx), [0, 1, 2]);
    const reloaded = readMonitoringRows(payload);
    assert.equal(reloaded.__no_ap_privacy_2.notes, 'Step 2');
});

test('legacy planned months are normalized so the server keeps them on save', () => {
    const rows = buildMonRows([], subs, dimensions);
    const data = details({ timeline: [1, 3], achievementStatus: '' });
    assert.deepEqual(monthStatuses(data), [{ month: 1, status: 'Targeted' }, { month: 3, status: 'Targeted' }]);
    const [saved] = serializeMonitoringRows(rows, { __no_ap_quality_0: data });
    assert.deepEqual(saved.timelineStatuses, monthStatuses(data));
    assert.equal(saved.actionPlanGroupId, null);
});

test('filtering does not hide the action plan cell or change its persistence key', () => {
    const rows = buildMonRows([group(['Shared action'])], subs, dimensions);
    const filtered = mergeMonitoringRows(rows.filter(row => row.dim._id === 'culture'));
    assert.equal(filtered[0].renderAp, true);
    assert.equal(filtered[0].apSpan, 1);
    assert.equal(filtered[0].item, 'Shared action');
    assert.equal(filtered[0].key, 'plan_0');
});

test('cleared details are omitted and a filtered save still uses all underlying rows', () => {
    const rows = buildMonRows([], subs, dimensions);
    assert.deepEqual(serializeMonitoringRows(rows, { __no_ap_quality_0: emptyMonitoring('quality') }), []);
    assert.equal(serializeMonitoringRows(rows, { __no_ap_skills_0: details() }).length, 1);
});

test('merged cells cover a complete rectangular table for different group sizes', () => {
    for (const count of [0, 1, 2, 3, 6]) {
        const rows = buildMonRows([group(Array.from({ length: count }, (_, i) => `Step ${i}`))], subs, dimensions);
        const occupancy = Array.from({ length: rows.length }, () => Array(16).fill(false));
        rows.forEach((row, index) => {
            const cells = [...(row.dimSpan ? [row.dimSpan] : []), ...(row.subSpan ? [row.subSpan, row.subSpan, row.subSpan] : []), ...(row.renderAp ? Array(12).fill(row.apSpan) : [])];
            let column = 0;
            for (const span of cells) {
                while (occupancy[index][column]) column++;
                assert.ok(column < 16, `too many cells for ${count} items`);
                for (let line = index; line < index + span; line++) {
                    assert.ok(!occupancy[line][column], 'overlapping cell spans');
                    occupancy[line][column] = true;
                }
                column++;
            }
        });
        assert.ok(occupancy.every(row => row.every(Boolean)), `missing cells for ${count} items`);
    }
});
