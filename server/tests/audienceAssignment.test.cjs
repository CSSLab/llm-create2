const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  AUDIENCE_PROTOCOL_VERSION, AUDIENCE_PREVIOUS_PROTOCOL_VERSION, AUDIENCE_SAMPLING_STRATEGY,
  AUDIENCE_SOURCE_INTERPRETATION_PROTOCOL_VERSION, AUDIENCE_PRESENTATION,
  AUDIENCE_PASSAGE_POOL_VERSION, sampleAudienceCandidates,
  isValidAudienceAssignment, hasCompleteCreativityRatings,
} = require('../api/utils/audienceAssignment');

function seededRandom(seed) {
  return () => ((seed = (Math.imul(1664525, seed) + 1013904223) >>> 0) / 2 ** 32);
}
const candidates = Array.from({ length: 8 }, (_, i) => ({
  id: `poem-${i}`, condition: i < 4 ? 'LLM' : 'NO_AI', passageId: String(i % 5 + 1),
}));

test('sampling spans passages, keeps two poems per condition, and randomizes all six condition orders', () => {
  const patterns = new Set();
  const seen = new Set();
  for (let seed = 1; seed <= 600; seed++) {
    const poems = sampleAudienceCandidates(candidates, seededRandom(seed));
    assert.equal(poems.length, 4);
    assert.equal(new Set(poems.map(p => p.id)).size, 4);
    assert.equal(poems.filter(p => p.condition === 'LLM').length, 2);
    assert.equal(poems.filter(p => p.condition === 'NO_AI').length, 2);
    patterns.add(poems.map(p => p.condition).join(','));
    poems.forEach(p => seen.add(p.id));
  }
  assert.equal(patterns.size, 6);
  assert.equal(seen.size, candidates.length);
});

test('repeated source passages are allowed, but duplicate poems never fill the quota', () => {
  const sameSource = candidates.map(p => ({ ...p, passageId: '1' }));
  assert.equal(sampleAudienceCandidates(sameSource).length, 4);
  assert.equal(sampleAudienceCandidates([candidates[0], candidates[0], ...candidates.slice(4)]), null);
  assert.equal(sampleAudienceCandidates(candidates.slice(0, 5)), null);
  assert.equal(sampleAudienceCandidates([]), null);
});

function makeAssignment(sourceIds = ['1', '2', '2', '4']) {
  const poems = sourceIds.map((passageId, index) => ({
    id: `poem-${index}`, passageId,
    passage: { id: passageId, title: 'Source', author: 'Writer', text: 'A small light in the quiet evening' },
    selectedWordIndexes: [1, 2, 6],
  }));
  return {
    id: 'assignment-1', protocolVersion: AUDIENCE_PREVIOUS_PROTOCOL_VERSION,
    samplingStrategy: AUDIENCE_SAMPLING_STRATEGY,
    passagePoolVersion: AUDIENCE_PASSAGE_POOL_VERSION,
    tutorialPassageId: '5', roundPassageIds: sourceIds, poems,
    statementTrials: poems.map(p => ({ poemId: p.id, options: [
      { id: p.id, statement: 'The creator statement.' },
      ...[1, 2, 3].map(i => ({ id: `decoy-${i}`, statement: `Other statement ${i}.` })),
    ] })),
  };
}

test('validates mixed/repeated sources and also accepts the old single-source protocol', () => {
  assert.ok(isValidAudienceAssignment(makeAssignment()));
  const legacy = makeAssignment(['1', '1', '1', '1']);
  delete legacy.protocolVersion;
  delete legacy.samplingStrategy;
  delete legacy.roundPassageIds;
  legacy.passageId = legacy.taskPassageId = '1';
  assert.ok(isValidAudienceAssignment(legacy));
});

test('rejects malformed assignments, mismatched source IDs, invalid indexes, duplicate poems and broken trials', () => {
  for (const mutate of [
    a => { a.roundPassageIds[0] = '4'; },
    a => { a.poems[0].passage.id = '4'; },
    a => { a.poems[0].id = a.poems[1].id; },
    a => { a.tutorialPassageId = '1'; },
    a => { a.poems[0].selectedWordIndexes = [-1]; },
    a => { a.poems[0].selectedWordIndexes = [9999]; },
    a => { a.poems[0].selectedWordIndexes = []; },
    a => { a.protocolVersion = 'unknown'; },
    a => { a.statementTrials[0].options.pop(); },
    a => { a.statementTrials[0].poemId = 'wrong-poem'; },
  ]) {
    const assignment = structuredClone(makeAssignment());
    mutate(assignment);
    assert.equal(isValidAudienceAssignment(assignment), false);
  }
  for (const bad of [null, {}, [], 'invalid', { poems: [] }]) assert.equal(isValidAudienceAssignment(bad), false);
});

function makeSurvey(assignment) {
  return {
    poemAnswers: assignment.poems.map((p, i) => ({ poemId: p.id, creativity: i + 2 })),
    creativityRatings: assignment.poems.map((p, i) => ({ poemId: p.id, rating: i + 2 })),
    statementMatches: [], aiLikelihoodRatings: [], postAnswers: {},
  };
}

test('creativity requires exactly one matching 1–7 score in both logging fields for every poem', () => {
  const assignment = makeAssignment();
  const ids = assignment.poems.map(p => p.id);
  assert.ok(hasCompleteCreativityRatings(makeSurvey(assignment), ids));
  for (const mutate of [
    s => { s.creativityRatings.pop(); },
    s => { s.creativityRatings[0].rating = 8; },
    s => { s.creativityRatings[0].rating = 2.5; },
    s => { s.poemAnswers[0].creativity = 7; },
    s => { s.creativityRatings[0].poemId = ids[1]; },
  ]) {
    const survey = makeSurvey(assignment);
    mutate(survey);
    assert.equal(hasCompleteCreativityRatings(survey, ids), false);
  }
});

// Exercise the real Express handlers with an in-memory Firestore stub. No
// credentials, external calls, or production writes are used by these tests.
let artistDocs = [];
let writes = [];
let deletes = [];
let committed = false;
let generatedId = 0;
const documents = new Map();
const fakeDb = {
  collection: name => ({
    where: () => ({ get: async () => ({ docs: artistDocs }) }),
    doc: id => ({
      id: id ?? `generated-${++generatedId}`, collection: name,
      get: async () => ({ data: () => documents.get(`${name}/${id}`) }),
      create: async payload => { documents.set(`${name}/${id}`, payload); },
      set: async payload => { writes.push({ collection: name, payload }); },
    }),
  }),
  batch: () => ({
    set: (ref, payload) => { writes.push({ collection: ref.collection, payload }); },
    delete: ref => { deletes.push(ref); },
    commit: async () => { committed = true; },
  }),
};
const firebasePath = require.resolve('../api/firebase/firebase');
require.cache[firebasePath] = {
  id: firebasePath, filename: firebasePath, loaded: true,
  exports: { db: fakeDb, FieldValue: { serverTimestamp: () => 'SERVER_TIMESTAMP' } },
};
const router = require('../api/routes/firebaseAPI').default;
async function invoke(path, body = {}) {
  writes = []; deletes = []; committed = false;
  const response = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(payload) { this.payload = payload; return this; } };
  const handler = router.stack.find(layer => layer.route?.path === path).route.stack[0].handle;
  await handler({ body }, response);
  return response;
}
function artistDoc(candidate, testPid = false) {
  return { data: () => ({
    condition: candidate.condition,
    prolific: { prolificPid: testPid ? 'test-participant' : `real${candidate.id}` },
    assignment: { passagePoolVersion: AUDIENCE_PASSAGE_POOL_VERSION },
    poem: { get: async () => ({ exists: true, id: candidate.id, data: () => ({
      passageId: 'stale-id',
      passage: { id: candidate.passageId, title: 'Source', author: 'Writer', text: 'A small light in the quiet evening' },
      text: [1, 2, 6],
    }) }) },
    surveyResponse: { get: async () => ({ exists: true, data: () => ({ postAnswers: { final_intended_meaning: 'A quiet moment of hope.' } }) }) },
  }) };
}

test('assignment API samples 2+2 across sources, blinds conditions, and matches decoys to each source', async () => {
  artistDocs = candidates.map(c => artistDoc(c));
  await prepareCache();
  const response = await invoke('/audience-assignment');
  assert.equal(response.statusCode, 200);
  const assignment = response.payload;
  assert.ok(isValidAudienceAssignment(assignment));
  assert.equal(assignment.poems.filter(p => candidates.find(c => c.id === p.id).condition === 'LLM').length, 2);
  assignment.poems.forEach((poem, index) => {
    assert.equal(poem.condition, undefined);
    assert.equal(poem.passageId, poem.passage.id);
    const trial = assignment.statementTrials[index];
    assert.equal(trial.options.filter(o => o.id === poem.id).length, 1);
    assert.ok(trial.options.filter(o => o.id !== poem.id).every(o => o.id.startsWith(`static-decoy-${poem.passageId}-`)));
  });
  assert.equal(assignment.passageId, undefined);
  assert.equal(assignment.taskPassageId, undefined);
});

test('assignment API fails when either condition is short and excludes test submissions', async () => {
  artistDocs = candidates.map(c => artistDoc(c, c.condition === 'LLM'));
  const response = await invoke('/audience-assignment');
  assert.equal(response.statusCode, 409);
  assert.equal(response.payload.code, 'INSUFFICIENT_AUDIENCE_POOL');
});

test('final commit preserves ordered poem/source joins, option IDs, protocol and both creativity fields', async () => {
  const assignment = makeAssignment();
  const surveyResponse = makeSurvey(assignment);
  const response = await invoke('/commit-audience-session', {
    sessionId: 'session-1', audienceData: { assignment, surveyResponse, timeStamps: ['start', 'end'] },
  });
  assert.equal(response.statusCode, 200);
  assert.ok(committed);
  const record = writes.find(w => w.collection === 'audience').payload;
  assert.deepEqual(record.assignment.roundPassageIds, ['1', '2', '2', '4']);
  assert.deepEqual(record.assignment.rounds, assignment.poems.map((p, i) => ({ round: i + 1, poemId: p.id, passageId: p.passageId })));
  assert.equal(record.assignment.protocolVersion, AUDIENCE_PREVIOUS_PROTOCOL_VERSION);
  assert.equal(record.assignment.statementTrials[0].optionIds.length, 4);
  assert.deepEqual(writes.find(w => w.collection === 'audienceSurvey').payload.creativityRatings, surveyResponse.creativityRatings);
  assert.equal(deletes[0].collection, 'audienceIncompleteSession');
  assert.equal(deletes[0].id, 'session-1');
});

test('invalid final payload is rejected before any writes', async () => {
  const assignment = makeAssignment();
  const surveyResponse = makeSurvey(assignment);
  surveyResponse.creativityRatings = [];
  const response = await invoke('/commit-audience-session', { sessionId: 'session-1', audienceData: { assignment, surveyResponse } });
  assert.equal(response.statusCode, 400);
  assert.equal(writes.length, 0);
  assert.equal(committed, false);
});

test('autosave preserves per-round sources and ratings and uses audience completion stages', async () => {
  const assignment = makeAssignment();
  const surveyResponse = makeSurvey(assignment);
  const response = await invoke('/audience/autosave', {
    sessionId: 'session-1', data: { role: 'audience', data: { assignment, surveyResponse, timeStamps: [1, 2, 3, 4] } },
  });
  assert.equal(response.statusCode, 200);
  assert.equal(writes[0].payload.completionStatus, 'statement-match');
  assert.deepEqual(writes[0].payload.partialData.assignment.roundPassageIds, assignment.roundPassageIds);
  assert.deepEqual(writes[0].payload.partialData.surveyResponse.creativityRatings, surveyResponse.creativityRatings);
});

const { loadAudienceCandidates } = require('../api/utils/audienceCandidates');
const { interpretationIdentity, sha256, INTERPRETATION_COLLECTION } = require('../api/utils/audienceInterpretations');
const { INTERPRETATION_DISPLAY, assignInterpretationCondition } = require('../api/utils/audienceInterpretationProtocol');
const { hasCompleteInterpretationExposure } = require('../api/utils/audienceAssignment');
async function prepareCache() {
  for (const poem of await loadAudienceCandidates()) {
    const { id } = interpretationIdentity(poem);
    const text = 'The poem may express a quiet moment of hope.';
    documents.set(`${INTERPRETATION_COLLECTION}/${id}`, { id, text, textHash: sha256(text), status: 'ready' });
  }
}
function exposures(assignment) {
  const stamp = '2026-09-07T12:00:00.000Z';
  return assignment.poems.map(poem => ({
    poemId: poem.id, condition: assignment.interpretationCondition,
    interpretationId: assignment.interpretationCondition === 'AI' ? poem.interpretationId : null,
    displayVersion: INTERPRETATION_DISPLAY.version, scheduledDelayMs: 6000, characterIntervalMs: 20,
    screenOpenedAt: stamp, revealStartedAt: null, revealCompletedAt: null,
    recordedAt: stamp, submittedAt: stamp, elapsedMs: 1000,
    charactersDisplayed: 0, totalCharacters: assignment.interpretationCondition === 'AI' ? Array.from(poem.interpretationText).length : 0,
    panelVisibleMs: 0, documentHiddenMs: 0, maxCharactersVisible: 0,
  }));
}

test('interpretation assignment is 50/50 at participant level; both arms use the same complete pool', async () => {
  assert.equal(assignInterpretationCondition(() => 0.49999), 'AI');
  assert.equal(assignInterpretationCondition(() => 0.5), 'NO_AI');
  artistDocs = candidates.map(c => artistDoc(c));
  await prepareCache();
  for (const [random, condition] of [[0.1, 'AI'], [0.9, 'NO_AI']]) {
    const original = Math.random;
    let response;
    try { Math.random = () => random; response = await invoke('/audience-assignment'); }
    finally { Math.random = original; }
    const assignment = response.payload;
    assert.equal(response.statusCode, 200);
    assert.equal(assignment.interpretationCondition, condition);
    assert.equal(assignment.protocolVersion, AUDIENCE_PROTOCOL_VERSION);
    assert.equal(assignment.presentationVersion, AUDIENCE_PRESENTATION);
    assert.ok(isValidAudienceAssignment(assignment));
    assert.deepEqual(documents.get(`audienceAssignment/${assignment.id}`).assignment, assignment);
    assert.ok(assignment.poems.every(p => !!p.interpretationId && (condition === 'AI' ? !!p.interpretationText : p.interpretationText === undefined)));
    const surveyResponse = { ...makeSurvey(assignment), interpretationExposures: exposures(assignment) };
    assert.ok(hasCompleteInterpretationExposure(surveyResponse, assignment));
    const final = await invoke('/commit-audience-session', { sessionId: 'v3-session', audienceData: { assignment, surveyResponse } });
    assert.equal(final.statusCode, 200);
    const saved = writes.find(w => w.collection === 'audience').payload.assignment;
    assert.equal(saved.interpretationCondition, condition);
    assert.equal(saved.presentationVersion, AUDIENCE_PRESENTATION);
    assert.deepEqual(saved.rounds.map(r => r.interpretationId), assignment.poems.map(p => p.interpretationId));
    assert.deepEqual(writes.find(w => w.collection === 'audienceSurvey').payload.interpretationExposures, surveyResponse.interpretationExposures);
    const changed = structuredClone(assignment);
    changed.poems.reverse(); changed.roundPassageIds.reverse(); changed.statementTrials.reverse();
    assert.equal((await invoke('/commit-audience-session', { sessionId: 'v3-session', audienceData: { assignment: changed, surveyResponse } })).statusCode, 400);
    surveyResponse.interpretationExposures.pop();
    assert.equal((await invoke('/commit-audience-session', { sessionId: 'v3-session', audienceData: { assignment, surveyResponse } })).statusCode, 400);
  }
});

test('poem-only assignments require their presentation marker; legacy v3 sessions retain validation and logging', async () => {
  artistDocs = candidates.map(c => artistDoc(c));
  await prepareCache();
  const assignment = (await invoke('/audience-assignment')).payload;
  delete assignment.presentationVersion;
  assert.equal(isValidAudienceAssignment(assignment), false);
  assignment.protocolVersion = AUDIENCE_SOURCE_INTERPRETATION_PROTOCOL_VERSION;
  assert.equal(isValidAudienceAssignment(assignment), true);
  documents.set(`audienceAssignment/${assignment.id}`, { assignment });
  const surveyResponse = { ...makeSurvey(assignment), interpretationExposures: exposures(assignment) };
  let response = await invoke('/commit-audience-session', { sessionId: 'legacy-v3', audienceData: { assignment, surveyResponse } });
  assert.equal(response.statusCode, 200);
  const saved = writes.find(w => w.collection === 'audience').payload.assignment;
  assert.equal(saved.protocolVersion, AUDIENCE_SOURCE_INTERPRETATION_PROTOCOL_VERSION);
  assert.equal(saved.interpretationCondition, assignment.interpretationCondition);
  assert.equal(saved.presentationVersion, undefined);
  surveyResponse.interpretationExposures = [];
  response = await invoke('/commit-audience-session', { sessionId: 'legacy-v3', audienceData: { assignment, surveyResponse } });
  assert.equal(response.statusCode, 400);
});

test('missing or stale interpretations block all new assignments, without silently changing eligibility', async () => {
  artistDocs = candidates.map(c => artistDoc(c));
  documents.clear();
  assert.equal((await invoke('/audience-assignment')).payload.code, 'AUDIENCE_INTERPRETATIONS_NOT_READY');
  await prepareCache();
  const first = (await loadAudienceCandidates())[0];
  const key = `${INTERPRETATION_COLLECTION}/${interpretationIdentity(first).id}`;
  documents.get(key).text = 'An edited, no longer matching stimulus.';
  assert.equal((await invoke('/audience-assignment')).payload.code, 'AUDIENCE_INTERPRETATIONS_NOT_READY');
});
