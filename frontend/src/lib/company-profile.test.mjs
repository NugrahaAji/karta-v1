import test from 'node:test';
import assert from 'node:assert/strict';
import { PRESET_SECTORS, PROFILE_STEPS, firstIncompleteStep, formatIndustry, normalizeCompanyProfile, parseIndustry, validateCompanyProfile } from './company-profile.ts';

const complete = () => normalizeCompanyProfile({
    businessIndustry: 'Manufacturing & Automotive', processMiningTeam: ['Operations (OPS)'],
    processMiningStart: 'Not started yet', processMiningProcesses: 'Planning purchase-to-pay',
    processMiningTechnology: 'Evaluating options', managementReadiness: 'Sponsor identified',
    measurementScope: 'Procurement department',
});

test('existing industry names and descriptions survive editing without duplication', () => {
    for (const sector of PRESET_SECTORS) {
        for (const raw of [sector, `${sector} — Company context`, `${sector}: Company context`]) {
            const parsed = parseIndustry(raw);
            assert.equal(parsed.sector, sector);
            assert.equal(formatIndustry(parsed.sector, parsed.custom, parsed.detail), raw.replace(': ', ' — '));
        }
    }
});
test('custom industry and multiline context survive a save/resume round trip', () => {
    const raw = 'Aerospace — Components\nfor regional aircraft';
    const parsed = parseIndustry(raw);
    assert.equal(parsed.sector, 'Other');
    assert.equal(formatIndustry(parsed.sector, parsed.custom, parsed.detail), raw);
    assert.equal(formatIndustry('', '', 'Description without an industry'), '');
});
test('legacy teams normalize safely without duplicating roles by casing', () => {
    const profile = normalizeCompanyProfile({ processMiningTeam: ' Finance, finance; PMO\nOperations (OPS) ' });
    assert.deepEqual(profile.processMiningTeam, ['Finance', 'PMO', 'Operations (OPS)']);
    assert.deepEqual(normalizeCompanyProfile({ processMiningTeam: [' Finance ', '', 'FINANCE', 'Custom unit'] }).processMiningTeam, ['Finance', 'Custom unit']);
});
test('completion requires the same seven answers as the API, with extra context optional', () => {
    assert.deepEqual(validateCompanyProfile(complete()), {});
    const empty = validateCompanyProfile(normalizeCompanyProfile());
    assert.equal(Object.keys(empty).length, 7);
    assert.equal(empty.additionalInfo, undefined);
    assert.ok(validateCompanyProfile({ ...complete(), measurementScope: '   ' }).measurementScope);
});
test('each step validates only its own answers', () => {
    const profile = normalizeCompanyProfile({ businessIndustry: 'Technology', processMiningTeam: ['PMO'] });
    assert.deepEqual(validateCompanyProfile(profile, PROFILE_STEPS[0].fields), {});
    assert.equal(Object.keys(validateCompanyProfile(profile, PROFILE_STEPS[1].fields)).length, 3);
});
test('saved drafts resume at the first incomplete step, and complete drafts open review', () => {
    assert.equal(firstIncompleteStep(normalizeCompanyProfile()), 0);
    assert.equal(firstIncompleteStep({ ...complete(), processMiningTechnology: '' }), 1);
    assert.equal(firstIncompleteStep({ ...complete(), measurementScope: '' }), 2);
    assert.equal(firstIncompleteStep(complete()), 3);
});
test('drafts allow missing answers but enforce server length limits', () => {
    assert.deepEqual(validateCompanyProfile(normalizeCompanyProfile(), undefined, false), {});
    const long = { ...complete(), businessIndustry: 'a'.repeat(3001), processMiningStart: 'a'.repeat(3001), additionalInfo: 'a'.repeat(5001) };
    assert.deepEqual(Object.keys(validateCompanyProfile(long, undefined, false)).sort(), ['additionalInfo', 'businessIndustry', 'processMiningStart']);
});
