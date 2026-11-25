import test from 'node:test';
import assert from 'node:assert/strict';
import { selectAssessments, toLocalDateTime, requestError } from './workspace.ts';

const session = (id, extra = {}) => ({ _id: id, title: id, description: '', status: 'draft', assignedTo: [], createdAt: '2026-11-01', updatedAt: '2026-11-01', ...extra });
const sessions = [session('Operations', { status: 'active', assignedTo: [{ name: 'Ayu' }], endDate: '2026-11-20' }), session('Finance', { status: 'completed', updatedAt: '2026-11-03', endDate: '2026-11-15' }), session('Draft')];

test('assessment search matches team members and combines with status without mutating API data', () => {
    assert.deepEqual(selectAssessments(sessions, '  AYU ', 'active', 'updated').map(item => item._id), ['Operations']);
    assert.equal(selectAssessments(sessions, 'Ayu', 'completed', 'updated').length, 0);
    assert.deepEqual(sessions.map(item => item._id), ['Operations', 'Finance', 'Draft']);
});
test('date sorting puts unscheduled work last and supports recently updated and alphabetical views', () => {
    assert.deepEqual(selectAssessments(sessions, '', 'all', 'due').map(item => item._id), ['Finance', 'Operations', 'Draft']);
    assert.equal(selectAssessments(sessions, '', 'all', 'updated')[0]._id, 'Finance');
    assert.deepEqual(selectAssessments(sessions, '', 'all', 'name').map(item => item._id), ['Draft', 'Finance', 'Operations']);
});
test('editing datetime-local preserves the instant in a non-UTC timezone', () => {
    const previous = process.env.TZ;
    process.env.TZ = 'Asia/Jakarta';
    try {
        const instant = '2026-11-10T08:30:00.000Z';
        const local = toLocalDateTime(instant);
        assert.equal(local, '2026-11-10T15:30');
        assert.equal(new Date(local).toISOString(), instant);
        assert.equal(toLocalDateTime(), '');
        assert.equal(toLocalDateTime('invalid'), '');
    } finally { if (previous === undefined) delete process.env.TZ; else process.env.TZ = previous; }
});
test('server field validation errors remain actionable', () => {
    assert.equal(requestError({ response: { data: { errors: [{ msg: 'Valid email is required' }] } } }, 'Retry'), 'Valid email is required');
    assert.equal(requestError(new Error('network'), 'Check your connection and retry'), 'Check your connection and retry');
});
