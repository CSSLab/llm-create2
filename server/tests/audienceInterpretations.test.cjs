const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  getFinalPoemText, interpretationIdentity, interpretationRequest,
  INTERPRETATION_MODEL, INTERPRETATION_SYSTEM_PROMPT, INTERPRETATION_COLLECTION,
  INTERPRETATION_PROMPT_VERSION, isReadyInterpretation, sha256,
} = require('../api/utils/audienceInterpretations');

const poem = {
  id: 'fixture-poem', passageId: '1', passage: { text: 'A small light, in the quiet evening.' },
  ...getFinalPoemText('A small light, in the quiet evening.', [6, 2, 1]),
};

test('poem extraction follows source order, retains punctuation and preserves supplied line breaks verbatim', () => {
  assert.equal(poem.finalPoemText, 'small light, evening.');
  const formatted = 'small light,\nevening.';
  assert.equal(getFinalPoemText(poem.passage.text, [6, 2, 1], formatted).finalPoemText, formatted);
  assert.throws(() => getFinalPoemText(poem.passage.text, [1, 2, 6], 'A different poem'), /does not match/);
  const changed = { ...poem, finalPoemText: formatted };
  assert.notEqual(interpretationIdentity(poem).id, interpretationIdentity(changed).id);
});

test('generation receives only the poem, with low reasoning and no hard word limit', () => {
  const request = interpretationRequest({ ...poem, condition: 'LLM', statement: 'Private creator intentions' });
  assert.deepEqual(Object.keys(request).sort(), ['messages', 'model', 'provider', 'reasoning']);
  assert.equal(request.model, 'openai/gpt-6-astra');
  assert.deepEqual(request.reasoning, { effort: 'low' });
  assert.equal(request.verbosity, undefined);
  assert.deepEqual(request.provider, { require_parameters: true });
  assert.equal(request.messages[0].content, INTERPRETATION_SYSTEM_PROMPT);
  assert.equal(request.messages[1].content, `What do you think this blackout poem is expressing or about?

Blackout poem:
<poem>
small light, evening.
</poem>`);
  assert.ok(!JSON.stringify(request).includes('Private creator intentions'));
  assert.ok(!JSON.stringify(request).includes(poem.passage.text));
  assert.ok(!JSON.stringify(request).includes('<source_passage>'));
  assert.match(request.messages[0].content, /grounded only in the poem provided/);
  assert.match(request.messages[0].content, /Write one short paragraph/);
  assert.ok(!request.messages[0].content.includes('100'));
  assert.deepEqual(interpretationRequest({ ...poem, passage: { text: 'An unrelated original passage' } }), request);
});

test('poem-only prompt version cannot reuse the earlier source-informed interpretation cache', () => {
  const { id, input } = interpretationIdentity(poem);
  assert.equal(INTERPRETATION_PROMPT_VERSION, 'blackout-interpretation-poem-only-v3');
  assert.equal(input.inputContext, 'poem-only');
  assert.equal(input.sourceText, undefined);
  assert.deepEqual(input.generationConfig.reasoning, { effort: 'low' });
  assert.equal(input.generationConfig.verbosity, undefined);
  const { generationConfig, ...defaultSettingsInput } = input;
  assert.notEqual(sha256(JSON.stringify(defaultSettingsInput)), id);
  assert.notEqual(sha256(JSON.stringify({ ...input, generationConfig: { ...generationConfig, verbosity: 'medium' } })), id);
  assert.notEqual(sha256(JSON.stringify({ ...input, promptVersion: 'blackout-interpretation-poem-only-v2' })), id);
  const previousId = sha256(JSON.stringify({ ...input, promptVersion: 'blackout-interpretation-v1', sourceText: poem.passage.text }));
  const text = 'The poem suggests hope.';
  const previous = { id: previousId, status: 'ready', text, textHash: sha256(text) };
  assert.notEqual(previousId, id);
  assert.equal(isReadyInterpretation(previous, poem), false);
  assert.equal(isReadyInterpretation({ ...previous, id }, poem), true);
});

const documents = new Map();
let generatedId = 0;
const firebasePath = require.resolve('../api/firebase/firebase');
require.cache[firebasePath] = { id: firebasePath, filename: firebasePath, loaded: true, exports: {
  db: { collection: name => ({ doc: id => {
    const actualId = id ?? `attempt-${++generatedId}`;
    const key = `${name}/${actualId}`;
    return { id: actualId,
      get: async () => ({ exists: documents.has(key), data: () => documents.get(key) }),
      create: async data => { assert.ok(!documents.has(key), 'Immutable records must not be overwritten'); documents.set(key, structuredClone(data)); },
      update: async data => documents.set(key, { ...documents.get(key), ...data }),
    };
  } }) },
} };
const candidatesPath = require.resolve('../api/utils/audienceCandidates');
let candidates = [poem];
require.cache[candidatesPath] = { id: candidatesPath, filename: candidatesPath, loaded: true,
  exports: { loadAudienceCandidates: async () => candidates } };
const { prepareAudienceInterpretations } = require('../api/scripts/precompileAudienceInterpretations');

test('preparation plans without API calls, records actual model/config/access metadata, and resumes immutable cached results', async () => {
  documents.clear();
  const originalFetch = global.fetch;
  const originalKey = process.env.OPENROUTER_API_KEY;
  let calls = 0;
  const model = { id: INTERPRETATION_MODEL, canonical_slug: 'openai/gpt-6-astra', default_parameters: { temperature: null }, created: 1788508800 };
  const response = { id: 'generation-fixture', model: 'gpt-6-astra', provider: 'OpenAI',
    system_fingerprint: 'fixture-fingerprint', usage: { prompt_tokens: 110, completion_tokens: 20 },
    choices: [{ finish_reason: 'stop', message: { content: Array(10).fill('The poem may suggest a small moment of hope as the day ends.').join(' ') } }] };
  global.fetch = async (url, options) => {
    calls += 1;
    if (url.endsWith('/models')) return { ok: true, json: async () => ({ data: [model] }) };
    assert.equal(options.headers['X-OpenRouter-Metadata'], 'enabled');
    assert.deepEqual(JSON.parse(options.body), interpretationRequest(poem));
    return { ok: true, status: 200, json: async () => response };
  };
  process.env.OPENROUTER_API_KEY = 'test-key-never-sent-to-a-network';
  try {
    await prepareAudienceInterpretations([]);
    assert.equal(calls, 0);
    assert.equal(documents.size, 0);
    await prepareAudienceInterpretations(['--write']);
    assert.equal(calls, 2);
    const cache = documents.get(`${INTERPRETATION_COLLECTION}/${interpretationIdentity(poem).id}`);
    assert.equal(cache.status, 'ready');
    assert.ok(cache.text.split(/\s+/u).length > 100, 'There is no hidden 100-word validation limit');
    assert.equal(cache.text, response.choices[0].message.content, 'Accepted interpretations are not shortened');
    assert.equal(cache.returnedModel, response.model);
    assert.equal(cache.systemFingerprint, response.system_fingerprint);
    assert.deepEqual(cache.modelCatalog, model);
    assert.ok(Date.parse(cache.catalogAccessedAt) <= Date.parse(cache.receivedAt));
    assert.deepEqual(documents.get(`audienceInterpretationAttempt/${cache.attemptId}`).response, response);
    assert.ok(!JSON.stringify([...documents.values()]).includes(process.env.OPENROUTER_API_KEY));
    await prepareAudienceInterpretations(['--write']);
    assert.equal(calls, 2, 'A repeated run must not regenerate cached stimuli');
  } finally {
    global.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.OPENROUTER_API_KEY;
    else process.env.OPENROUTER_API_KEY = originalKey;
  }
});

test('invalid model outputs are retained for audit and never become usable stimuli', async () => {
  const originalFetch = global.fetch;
  const originalKey = process.env.OPENROUTER_API_KEY;
  process.env.OPENROUTER_API_KEY = 'test-key';
  try {
    for (const completion of [
      { choices: [{ finish_reason: 'length', message: { content: 'Cut short.' } }] },
      { choices: [{ finish_reason: 'stop', message: { content: '' } }] },
      { choices: [{ finish_reason: 'stop', message: { content: 'First paragraph.\n\nSecond paragraph.' } }] },
    ]) {
      documents.clear();
      global.fetch = async url => ({ ok: true, status: 200, json: async () => url.endsWith('/models')
        ? { data: [{ id: INTERPRETATION_MODEL }] } : completion });
      await assert.rejects(prepareAudienceInterpretations(['--write']), /interpretations failed/);
      assert.ok([...documents.keys()].every(key => key.startsWith('audienceInterpretationAttempt/')));
      assert.ok([...documents.values()].every(value => value.status === 'failed' && value.response));
    }
    documents.clear();
    global.fetch = async () => ({ ok: true, json: async () => ({ data: [] }) });
    await assert.rejects(prepareAudienceInterpretations(['--write']), /unavailable; no substitute/);
    assert.equal(documents.size, 0);
  } finally {
    global.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.OPENROUTER_API_KEY;
    else process.env.OPENROUTER_API_KEY = originalKey;
  }
});

test('HTTP failures stop the batch after one audited attempt', async () => {
  const originalFetch = global.fetch;
  const originalKey = process.env.OPENROUTER_API_KEY;
  process.env.OPENROUTER_API_KEY = 'test-key';
  documents.clear();
  candidates = [poem, { ...poem, id: 'second-fixture-poem' }];
  let completionCalls = 0;
  global.fetch = async url => {
    if (url.endsWith('/models')) return { ok: true, json: async () => ({ data: [{ id: INTERPRETATION_MODEL }] }) };
    completionCalls += 1;
    return { ok: false, status: 404, json: async () => ({ error: { code: 404, message: 'No compatible endpoint' } }) };
  };
  try {
    await assert.rejects(prepareAudienceInterpretations(['--write']), /interpretations failed/);
    assert.equal(completionCalls, 1);
    assert.equal(documents.size, 1);
    const [attempt] = documents.values();
    assert.equal(attempt.status, 'failed');
    assert.equal(attempt.httpStatus, 404);
    assert.equal(attempt.response.error.message, 'No compatible endpoint');
  } finally {
    candidates = [poem];
    global.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.OPENROUTER_API_KEY;
    else process.env.OPENROUTER_API_KEY = originalKey;
  }
});

test('pilot activation requires the complete cache and never replaces a fixed pool', async () => {
  const { activateAudiencePilot } = require('../api/scripts/activateAudiencePilot');
  const { AUDIENCE_PILOT_COLLECTION, AUDIENCE_PILOT_ID } = require('../api/utils/audiencePilot');
  documents.clear();
  candidates = Array.from({ length: 4 }, (_, index) => ({
    ...poem, id: `pilot-poem-${index}`, condition: index < 2 ? 'LLM' : 'NO_AI',
    passage: { ...poem.passage, title: 'Source', author: 'Writer' },
    selectedWordIndexes: [1, 2, 6], statement: 'A quiet moment of hope.',
  }));
  const addCache = candidate => {
    const id = interpretationIdentity(candidate).id;
    const text = 'The poem may suggest hope.';
    documents.set(`${INTERPRETATION_COLLECTION}/${id}`, { id, text, textHash: sha256(text), status: 'ready' });
  };
  try {
    await assert.rejects(activateAudiencePilot(['--write']), /Prepare all matching interpretations/);
    assert.equal(documents.size, 0);
    candidates.forEach(addCache);
    await activateAudiencePilot([]);
    assert.equal(documents.size, 4, 'Readiness checks do not write a manifest');
    await activateAudiencePilot(['--write']);
    assert.equal(documents.size, 5);
    const key = `${AUDIENCE_PILOT_COLLECTION}/${AUDIENCE_PILOT_ID}`;
    const manifest = structuredClone(documents.get(key));
    await activateAudiencePilot(['--write']);
    assert.deepEqual(documents.get(key), manifest);
    candidates.push({ ...candidates[0], id: 'arrived-later' });
    addCache(candidates.at(-1));
    await assert.rejects(activateAudiencePilot(['--write']), /different pool/);
    assert.deepEqual(documents.get(key), manifest);
  } finally { candidates = [poem]; }
});
