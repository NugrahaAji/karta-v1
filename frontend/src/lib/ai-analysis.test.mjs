import test from 'node:test';
import assert from 'node:assert/strict';
import { createAiAnalysisStore, readAiResults } from './ai-analysis.ts';

const assessment = { dimension: 'Data', dimension_id: 'data', sub_dimension: 'Quality', sub_dimension_id: 'quality', final_result: 3, expected_level: 4 };
const result = { dimension_id: 'data', sub_dimension_id: 'quality', dimension_name: 'Data', sub_dimension_name: 'Quality', classification: 'Gap', strength_weakness: 'Improve quality controls.', opportunity_analysis: ['Review controls'], action_plan: ['Assign an owner'] };
function deferred() { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; }

test('closing and reopening subscribers preserves the running request, history, and automatic save', async () => {
    const request = deferred();
    let runs = 0, saves = 0, updates = 0;
    const store = createAiAnalysisStore({ analyze: () => { runs++; return request.promise; }, save: async (_id, items) => { saves++; return items; } });
    const close = store.subscribe('session', () => updates++);
    const task = store.run('session', [assessment]);
    const submittedHistory = store.getSnapshot('session').history;
    close();
    await Promise.resolve();
    assert.equal(store.getSnapshot('session').status, 'running');
    const reopen = store.subscribe('session', () => updates++);
    assert.equal(store.getSnapshot('session').history, submittedHistory);
    assert.equal(store.run('session', [assessment]), task);
    request.resolve([result]);
    await task;
    const state = store.getSnapshot('session');
    assert.equal(state.status, 'saved');
    assert.equal(state.locked, true);
    assert.deepEqual(state.results, [result]);
    assert.equal(state.history.length, 3);
    assert.equal(runs, 1);
    assert.equal(saves, 1);
    assert.ok(updates > 1);
    reopen();
    await store.run('session', [assessment]);
    assert.equal(runs, 1, 'saved analysis cannot be regenerated');
});

test('a save failure retains findings and retries saving without generating again', async () => {
    let runs = 0, saves = 0;
    const store = createAiAnalysisStore({ analyze: async () => { runs++; return [result]; }, save: async (_id, items) => { if (++saves === 1) throw new Error('offline'); return items; } });
    await store.run('session', [assessment]);
    assert.equal(store.getSnapshot('session').status, 'save-error');
    assert.deepEqual(store.getSnapshot('session').results, [result]);
    await store.run('session', [assessment]);
    assert.equal(runs, 1);
    const retry = store.retrySave('session');
    assert.equal(store.retrySave('session'), retry);
    await retry;
    assert.equal(store.getSnapshot('session').status, 'saved');
    assert.equal(saves, 2);
    assert.equal(runs, 1);
});

test('failed generation keeps the earlier request history when retried', async () => {
    let runs = 0;
    const store = createAiAnalysisStore({ analyze: async () => { if (++runs === 1) throw new Error('timeout'); return [result]; }, save: async (_id, items) => items });
    await store.run('session', [assessment]);
    assert.equal(store.getSnapshot('session').status, 'error');
    assert.equal(store.getSnapshot('session').history.at(-1).error, true);
    await store.run('session', [assessment]);
    assert.equal(store.getSnapshot('session').history.filter(message => message.role === 'user').length, 2);
    assert.equal(store.getSnapshot('session').status, 'saved');
});

test('requests and cached findings remain isolated by assessment and workspace owner', async () => {
    const request = deferred();
    const transport = { analyze: () => request.promise, save: async (_id, items) => items };
    const store = createAiAnalysisStore(transport);
    const otherOwner = createAiAnalysisStore(transport);
    const task = store.run('first', [assessment]);
    assert.equal(store.getSnapshot('second').status, 'idle');
    assert.equal(otherOwner.getSnapshot('first').status, 'idle');
    request.resolve([result]);
    await task;
    assert.equal(store.getSnapshot('first').results.length, 1);
    assert.equal(store.getSnapshot('second').results.length, 0);
    assert.equal(otherOwner.getSnapshot('first').history.length, 0);
});

test('saved server analysis restores findings and locks generation without duplicating history', async () => {
    let runs = 0;
    const store = createAiAnalysisStore({ analyze: async () => { runs++; return []; }, save: async (_id, items) => items });
    store.seed('session', [result], true);
    store.seed('session', [result], true);
    await store.run('session', [assessment]);
    assert.equal(runs, 0);
    assert.equal(store.getSnapshot('session').history.length, 1);
    assert.deepEqual(store.getSnapshot('session').results, [result]);
    assert.deepEqual(readAiResults([{ _error: 'Server failed' }, null, { ...result, action_plan: [null] }]), []);
});

test('ending the workspace aborts the request and prevents a late result from saving', async () => {
    const request = deferred();
    let signal, saves = 0;
    const store = createAiAnalysisStore({ analyze: (_items, value) => { signal = value; return request.promise; }, save: async (_id, items) => { saves++; return items; } });
    const task = store.run('session', [assessment]);
    await Promise.resolve();
    store.cancelAll();
    assert.equal(signal.aborted, true);
    request.resolve([result]);
    await task;
    assert.equal(saves, 0);
    assert.equal(store.getSnapshot('session').status, 'error');
});

test('analysis uses the submitted scores even if targets change while it runs', async () => {
    const submitted = { ...assessment };
    let captured;
    const store = createAiAnalysisStore({ analyze: async items => { captured = items; return [result]; }, save: async (_id, items) => items });
    const task = store.run('session', [submitted]);
    submitted.expected_level = 5;
    await task;
    assert.equal(captured[0].expected_level, 4);
});

test('empty generation results remain retryable and are never saved', async () => {
    let saves = 0;
    const store = createAiAnalysisStore({ analyze: async () => [], save: async (_id, items) => { saves++; return items; } });
    await store.run('session', [assessment]);
    assert.equal(store.getSnapshot('session').status, 'error');
    assert.equal(store.getSnapshot('session').locked, false);
    assert.equal(saves, 0);
});
