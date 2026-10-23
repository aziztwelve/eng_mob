const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');
const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/components/flashcards/AddFlashcardSheet.tsx'), 'utf8'), {
 compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
function setup() {
 const slots = []; let cursor = 0, effects = [], dirty = true, tree, closed = 0;
 const calls = [], pending = [];
 const node = (type, props) => ({ type, props });
 const languages = ['en', 'ru', 'kk'].map(code => ({ code, nameI18n: { en: code } }));
 const hooks = {
  useState: initial => { const i = cursor++; if (!(i in slots)) slots[i] = { value: initial }; return [slots[i].value, v => { slots[i].value = v; dirty = true; }]; },
  useRef: initial => { const i = cursor++; return slots[i] ?? (slots[i] = { current: initial }); },
  useEffect: (fn, deps) => { const i = cursor++; if (!slots[i] || !deps.every((x, j) => Object.is(x, slots[i][j]))) { slots[i] = deps; effects.push(fn); } },
 };
 const mocks = {
  react: { ...hooks }, 'react/jsx-runtime': { jsx: node, jsxs: node },
  'react-native': Object.fromEntries(['Modal', 'Pressable', 'Text', 'View', 'TextInput', 'ScrollView', 'ActivityIndicator'].map(x => [x, x])),
  'react-native-reanimated': { default: { View: 'AnimatedView' }, FadeIn: { duration: () => null }, SlideInDown: { duration: () => null } },
  'react-native-safe-area-context': { useSafeAreaInsets: () => ({ bottom: 24 }) },
  'lucide-react-native': { X: 'X' }, '@/hooks/use-keyboard-height': { useKeyboardHeight: () => 0 },
  '@/hooks/use-flashcards': { useCreateFlashcard: () => ({ isPending: false, mutateAsync: value => { calls.push(value); return new Promise((resolve, reject) => pending.push({ resolve, reject })); } }) },
  '@/hooks/use-onboarding': { useOnboardingState: () => ({ data: { native_language: 'ru' } }) },
  '@/lib/supported-languages': { ALL_LANGUAGES: languages, getLanguage: code => languages.find(x => x.code === code) },
  'react-i18next': { useTranslation: () => ({ t: key => key, i18n: { resolvedLanguage: 'en' } }) },
 };
 const mod = { exports: {} };
 vm.runInNewContext(source, { exports: mod.exports, require: n => { if (!(n in mocks)) throw Error(n); return mocks[n]; } });
 function render() { for (let i = 0; i < 8; i++) { cursor = 0; dirty = false; tree = mod.exports.AddFlashcardSheet({ visible: true, onDismiss: () => closed++ }); const work = effects; effects = []; work.forEach(fn => fn()); if (!dirty) return tree; } throw Error('Render loop'); }
 function find(type, predicate = () => true, n = tree) { if (!n || typeof n !== 'object') return; if (n.type === type && predicate(n)) return n; for (const child of Object.values(n.props ?? {}).flat()) { const found = find(type, predicate, child); if (found) return found; } }
 const text = n => typeof n === 'string' ? n : Array.isArray(n) ? n.map(text).join('') : n && typeof n === 'object' ? text(n.props?.children) : '';
 const input = label => find('TextInput', n => n.props.placeholder === label);
 const button = label => find('Pressable', n => text(n) === label);
 function fill() { input('cards.word_ph').props.onChangeText(' help '); input('cards.translation_ph').props.onChangeText(' көмек '); render(); }
 render();
 return { render, fill, input, button, calls, pending, closed: () => closed, error: () => !!find('Text', n => text(n) === 'common.save_failed') };
}
test('chosen translation language is sent and duplicate taps cannot submit twice', async () => {
 const app = setup(); app.button('kk').props.onPress(); app.render(); app.fill();
 const submit = app.button('cards.add').props.onPress;
 submit(); submit();
 assert.equal(app.calls.length, 1);
 assert.equal(app.calls[0].language, 'en'); assert.equal(app.calls[0].target_language, 'kk');
 assert.equal(app.calls[0].word, 'help'); assert.equal(app.calls[0].translation, 'көмек');
 app.pending[0].resolve({}); await new Promise(setImmediate); app.render();
 assert.equal(app.closed(), 1);
});
test('failed save preserves entered text, shows an error and allows retry', async () => {
 const app = setup(); app.fill(); app.button('cards.add').props.onPress();
 app.pending[0].reject(Error('network')); await new Promise(setImmediate); app.render();
 assert.equal(app.input('cards.word_ph').props.value, ' help ');
 assert.equal(app.input('cards.translation_ph').props.value, ' көмек ');
 assert.equal(app.closed(), 0); assert.equal(app.error(), true);
 app.button('cards.add').props.onPress(); assert.equal(app.calls.length, 2);
 app.pending[1].resolve({}); await new Promise(setImmediate);
});
