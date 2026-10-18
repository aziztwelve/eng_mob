const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function environment(initial = {}) {
  const data = new Map(Object.entries(initial));
  const storage = {
    getItem: async key => data.get(key) ?? null,
    setItem: async (key, value) => { data.set(key, value); },
    removeItem: async key => { data.delete(key); },
  };
  const modules = new Map();
  function load(name) {
    if (modules.has(name)) return modules.get(name);
    const source = fs.readFileSync(path.join(__dirname, '../src/lib', name + '.ts'), 'utf8');
    const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
    const sandbox = { exports: {}, __DEV__: false, console, require: request => {
      if (request === '@react-native-async-storage/async-storage') return storage;
      if (request === './analytics') return { analytics: { track() {} } };
      return load(request.replace('./', ''));
    } };
    vm.runInNewContext(compiled, sandbox);
    modules.set(name, sandbox.exports);
    return sandbox.exports;
  }
  return { data, load };
}

test('migrates old saved answers without losing the retained profile or completion', async () => {
  const old = { completed_at: '2026-10-01T00:00:00Z', target_language: 'en', native_language: 'ru', goal: 'travel', age_bracket: '25-34', level: 'a1', reminder_slot: 'evening', daily_goal_xp: 30, current_step: 'paywall', pain_point: 'lack_vocab', daily_commit_minutes: 15, paywall_choice: 'annual', notifications_prompted: true };
  const env = environment({ '@onboarding_v3': JSON.stringify(old) });
  const api = env.load('onboarding-storage');
  const actual = await api.getOnboardingState();
  assert.equal(actual.completed_at, old.completed_at);
  for (const key of ['target_language','native_language','goal','age_bracket','level','reminder_slot','daily_goal_xp']) assert.equal(actual[key], old[key]);
  assert.equal(actual.current_step, 'signup');
  const saved = JSON.parse(env.data.get('@onboarding_v3'));
  for (const key of ['pain_point','daily_commit_minutes','paywall_choice','notifications_prompted']) assert.equal(Object.hasOwn(saved, key), false);
  await api.patchOnboardingState({ goal: 'work', pain_point: 'fear_speaking' });
  assert.equal((await api.getOnboardingState()).goal, 'work');
  assert.equal(Object.hasOwn(JSON.parse(env.data.get('@onboarding_v3')), 'pain_point'), false);
});

test('purges retired-only offline entries and sends only retained parts of mixed patches', async () => {
  const item = patch => ({ id: Math.random().toString(), patch, createdAt: 1, attempts: 0 });
  const env = environment({ onboarding_patch_queue_v1: JSON.stringify([
    item({ daily_commit_minutes: 25, paywall_choice: 'annual' }),
    item({ motivation: ['travel'], motivation_set: true, reminder_slot: 'morning', pain_point: 'lack_vocab' }),
  ]) });
  const queue = env.load('onboarding-mutation-queue').onboardingMutationQueue;
  const sent = [];
  await queue.drain(async patch => { sent.push(JSON.parse(JSON.stringify(patch))); });
  assert.deepEqual(sent, [{ motivation: ['travel'], motivation_set: true, reminder_slot: 'morning' }]);
  assert.equal(await queue.size(), 0);
  await queue.enqueue({ paywall_seen_at: '2026-10-01T00:00:00Z' });
  assert.equal(await queue.size(), 0);
});

test('a fresh onboarding also clears an offline queue from the previous attempt', async () => {
  const env = environment({ '@onboarding_v3': '{}', '@onboarding_v1': '{}', onboarding_patch_queue_v1: JSON.stringify([{ id: 'old', patch: { age_bracket: '55+' }, attempts: 0, createdAt: 1 }]) });
  await env.load('onboarding-storage').resetOnboarding();
  for (const key of ['@onboarding_v3', '@onboarding_v1', 'onboarding_patch_queue_v1']) assert.equal(env.data.has(key), false);
});

test('offline retry preserves retained answers while retired data stays removed', async () => {
  const env = environment({ onboarding_patch_queue_v1: JSON.stringify([
    { id: 'pending', patch: { age_bracket: '25-34', reminder_slot: 'evening', paywall_choice: 'annual' }, attempts: 0, createdAt: 1 },
  ]) });
  const queue = env.load('onboarding-mutation-queue').onboardingMutationQueue;
  const offline = await queue.drain(async () => { throw new Error('offline'); });
  assert.equal(offline.remaining, 1);
  const persisted = JSON.parse(env.data.get('onboarding_patch_queue_v1'));
  assert.equal(persisted[0].attempts, 1);
  assert.deepEqual(persisted[0].patch, { age_bracket: '25-34', reminder_slot: 'evening' });
  const sent = [];
  const online = await queue.drain(async patch => { sent.push(JSON.parse(JSON.stringify(patch))); });
  assert.equal(online.remaining, 0);
  assert.deepEqual(sent, [{ age_bracket: '25-34', reminder_slot: 'evening' }]);
});
