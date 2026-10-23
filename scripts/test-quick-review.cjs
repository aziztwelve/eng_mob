const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');
const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/components/practice/words-tab.tsx'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
function setup({ pinned = true } = {}) {
  const slots = []; let cursor = 0, dirty = true, effects = [], requestId = 0;
  const calls = [], pending = [];
  const cards = [{ id: 'help-id', word: 'help' }, { id: 'repeat-id', word: 'repeat' }];
  const query = items => ({ data: { items }, isLoading: false, isError: false });
  const today = query(pinned ? cards : []), all = query(cards);
  const depsEqual = (a, b) => a && b && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
  const memo = (fn, deps) => { const i = cursor++; if (!slots[i] || !depsEqual(slots[i].deps, deps)) slots[i] = { deps, value: fn() }; return slots[i].value; };
  const hooks = {
    useState: initial => { const i = cursor++; if (!(i in slots)) slots[i] = { value: typeof initial === 'function' ? initial() : initial }; return [slots[i].value, value => { slots[i].value = typeof value === 'function' ? value(slots[i].value) : value; dirty = true; }]; },
    useRef: value => { const i = cursor++; return slots[i] ?? (slots[i] = { current: value }); },
    useMemo: memo,
    useCallback: (fn, deps) => memo(() => fn, deps),
    useEffect: (fn, deps) => { const i = cursor++; if (!slots[i] || !depsEqual(slots[i].deps, deps)) { slots[i] = { deps }; effects.push(fn); } },
  };
  const node = (type, props) => ({ type, props });
  const mod = { exports: {} };
  const mocks = {
    react: { ...hooks, default: {} },
    'react/jsx-runtime': { jsx: node, jsxs: node },
    'react-native': { View: 'View', Text: 'Text', Pressable: 'Pressable', ActivityIndicator: 'ActivityIndicator', StyleSheet: { create: x => x } },
    'expo-router': { useRouter: () => ({}) },
    'phosphor-react-native': { SpeakerHigh: 'SpeakerHigh' },
    'react-i18next': { useTranslation: () => ({ t: key => key }) },
    '@/hooks/use-flashcards': {
      useFlashcardStats: () => ({ data: { total_count: 2 } }),
      useFlashcards: () => all, useTodayQueue: () => today,
      useSeedStarter: () => ({}),
      useReviewFlashcard: () => ({ mutateAsync: input => { calls.push(input); return new Promise((resolve, reject) => pending.push({ resolve, reject })); } }),
    },
    '@/lib/tts': {}, '@/components/lesson/sky-lesson-header': { SKY: {} },
    '@/components/lesson/sky-ui': { skyFont: {} }, './practice-ui': { SkyPanel: 'SkyPanel' },
    '@/lib/flashcard-review-queue': { drainFlashcardReviews: async () => {} },
    '@/lib/vocabulary-attempt-queue': { newVocabularyAttemptId: () => `attempt-${++requestId}` },
  };
  vm.runInNewContext(source, { exports: mod.exports, require: name => { if (!(name in mocks)) throw Error(name); return mocks[name]; }, Date, console });
  let tree;
  function render() { for (let rounds = 0; rounds < 12; rounds++) { dirty = false; cursor = 0; tree = mod.exports.WordsTab(); const work = effects; effects = []; work.forEach(fn => fn()); if (!dirty) return tree; } throw Error('Render loop'); }
  function nodes(tree, type, out = []) { if (!tree || typeof tree !== 'object') return out; if (tree.type === type) out.push(tree); Object.values(tree.props ?? {}).flat().forEach(child => nodes(child, type, out)); return out; }
  function text(node) { if (typeof node === 'string' || typeof node === 'number') return String(node); if (Array.isArray(node)) return node.map(text).join(''); return node && typeof node === 'object' ? text(node.props?.children) : ''; }
  function button(label) { return nodes(tree, 'Pressable').find(n => text(n) === label || n.props.accessibilityLabel === label); }
  async function settle() { await new Promise(setImmediate); render(); }
  render();
  return { render, settle, button, calls, pending, today, all, has: label => nodes(tree, 'Text').some(n => text(n) === label) };
}
test('quick review waits for confirmation, blocks double taps and keeps the current deck during refetch', async () => {
  const app = setup(); await app.settle();
  assert.equal(app.button('practice.remembered_btn').props.disabled, true);
  app.button('practice.tap_to_see').props.onPress(); app.render();
  const answer = app.button('practice.remembered_btn').props.onPress;
  answer(); answer(); app.render();
  assert.equal(app.calls.length, 1);
  assert.ok(app.has('help')); assert.ok(app.has('1 / 2'));
  assert.equal(app.button('practice.forgot_btn').props.disabled, true);
  app.today.data = { items: [{ id: 'other', word: 'other' }] };
  app.all.data = { items: [] };
  app.pending[0].resolve({}); await app.settle();
  assert.ok(app.has('repeat')); assert.ok(app.has('2 / 2'));
});
test('a failed review stays on the word and retries the same answer and attempt ID', async () => {
  const app = setup(); await app.settle();
  app.button('practice.tap_to_see').props.onPress(); app.render();
  app.button('practice.remembered_btn').props.onPress();
  app.pending[0].reject(Error('network')); await app.settle();
  assert.ok(app.has('help')); assert.ok(app.has('1 / 2')); assert.ok(app.has('common.save_failed'));
  assert.equal(app.button('practice.forgot_btn').props.disabled, true);
  app.button('practice.bank_player.retry_sync').props.onPress();
  assert.equal(app.calls.length, 2);
  assert.deepEqual(app.calls[1], app.calls[0]);
  app.pending[1].resolve({}); await app.settle();
  assert.ok(app.has('repeat'));
});
test('practice outside the pinned selection also persists the review', async () => {
  const app = setup({ pinned: false }); await app.settle();
  app.button('practice.tap_to_see').props.onPress(); app.render();
  app.button('practice.forgot_btn').props.onPress();
  assert.equal(app.calls.length, 1);
  assert.equal(app.calls[0].flashcardId, 'help-id');
  assert.equal(app.calls[0].data.remembered, false);
  app.pending[0].resolve({}); await app.settle();
  assert.ok(app.has('repeat'));
});
