import test from 'node:test';
import assert from 'node:assert/strict';
import { assessmentActionGroups, buildSubResults, expectedLevel, finalLevel, findSavedAnalysis, resultState, rowSpans } from './assessment-results.ts';

const levels = Array.from({ length: 5 }, (_, i) => ({ _id: `level${i}`, name: `Level ${i + 1}`, criteria: [{ _id: `criterion${i}`, name: `Evidence ${i + 1}` }] }));
const dimensions = [{ _id: 'data', name: 'Data', subdimensions: [{ _id: 'quality', name: 'Quality', levels }, { _id: 'privacy', name: 'Privacy', levels }] }];
const response = (id, level) => ({ user: { _id: id, name: id }, responses: [{ dimension: 'data', subdimension: 'quality', selectedLevelIndex: level, selectedCriteria: `criterion${level}`, note: `${id} evidence` }] });

test('results preserve unique-mode scoring, evidence, and absent scores', () => {
    const results = buildSubResults(dimensions, [response('A', 3), response('B', 3), response('C', 1)]);
    assert.equal(finalLevel(results[0]), 4);
    assert.equal(results[0].voteCounts[3], 2);
    assert.equal(results[0].evaluatorAnswers[0].criteriaName, 'Evidence 4');
    assert.equal(finalLevel(results[1]), null);
    assert.equal(resultState(results[1]), 'No responses');
});

test('tied votes remain unresolved until a saved adjustment supplies the score', () => {
    const responses = [response('A', 1), response('B', 3)];
    const [tied] = buildSubResults(dimensions, responses);
    assert.equal(finalLevel(tied), null);
    assert.equal(resultState(tied), 'Needs review');
    const [adjusted] = buildSubResults(dimensions, responses, [{ dimension: 'data', subdimension: 'quality', finalLevelIndex: 2, source: 'adjusted' }]);
    assert.equal(finalLevel(adjusted), 3);
    assert.equal(resultState(adjusted), 'Adjusted');
});

test('expected levels use saved targets and stay inside the configured scale', () => {
    const [sub] = buildSubResults(dimensions, []);
    assert.equal(expectedLevel({}, sub), 3);
    assert.equal(expectedLevel({ subdimensionAnalysis: [{ dimension: 'data', subdimension: 'quality', expectedLevel: 4 }] }, sub), 4);
    assert.equal(expectedLevel({}, { ...sub, levels: levels.slice(0, 2) }), 2);
    assert.equal(expectedLevel({}, { ...sub, levels: [] }), null);
});

test('AI analysis follows sub-dimension identity and never falls back to another identified row', () => {
    const subs = buildSubResults(dimensions, [response('A', 2)]);
    const session = { aiAnalysis: [{ sub_dimension_id: 'privacy', strength_weakness: 'Private evidence' }] };
    assert.equal(findSavedAnalysis(session, subs[0], subs), undefined);
    assert.equal(findSavedAnalysis(session, subs[1], subs).strength_weakness, 'Private evidence');
    assert.equal(findSavedAnalysis({ aiAnalysis: [{ strength_weakness: 'Legacy evidence' }] }, subs[0], subs).strength_weakness, 'Legacy evidence');
});

test('manual plans take precedence while generated plans retain every actionable step', () => {
    const subs = buildSubResults(dimensions, []);
    const session = { actionPlanGroups: [{ _id: 'manual', subdimensions: ['quality'], items: ['Review quality'] }], aiAnalysis: [
        { sub_dimension_id: 'quality', action_plan: ['Do not duplicate'] },
        { sub_dimension_id: 'privacy', action_plan: ['Inventory data', '', 'Review access', 'Document controls'] },
    ] };
    const groups = assessmentActionGroups(session, subs);
    assert.equal(groups.length, 2);
    assert.deepEqual(groups[1].items, ['Inventory data', 'Review access', 'Document controls']);
    assert.equal(groups[1]._id, '__no_ap_privacy');
});

test('saved analysis IDs take precedence over reused names and survive renamed labels', () => {
    const subs = buildSubResults(dimensions, [response('A', 2)]);
    const previous = { sub_dimension_id: 'retired-quality', dimension_id: 'data', sub_dimension_name: 'Quality', strength_weakness: 'Old evidence' };
    assert.equal(findSavedAnalysis({ aiAnalysis: [previous] }, subs[0], subs), undefined);
    const current = { sub_dimension_id: 'quality', dimension_id: 'data', sub_dimension_name: 'Previous name', strength_weakness: 'Current evidence' };
    assert.equal(findSavedAnalysis({ aiAnalysis: [previous, current] }, subs[0], subs), current);
    assert.equal(findSavedAnalysis({ aiAnalysis: [{ ...current, dimension_id: 'culture' }] }, subs[0], subs), undefined);
});

test('table spans merge only consecutive rows, including filtered groups', () => {
    assert.deepEqual(rowSpans(['data', 'data', 'culture', 'data']), [2, 0, 1, 1]);
    assert.deepEqual(rowSpans([]), []);
});
