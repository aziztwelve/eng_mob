const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');
const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/components/lesson/listening-shadowing-step.tsx'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
function setup(result) {
  let cursor = 0;
  const state = [];
  const node = (type, props) => ({ type, props });
  const mod = { exports: {} };
  let submissions = 0;
  const mocks = {
    react: { useState: initial => { const i = cursor++; if (!(i in state)) state[i] = initial; return [state[i], value => { state[i] = value; }]; } },
    'react/jsx-runtime': { jsx: node, jsxs: node },
    'react-native': { View: 'View', Text: 'Text' },
    'lucide-react-native': { Volume2: 'Volume2' },
    'react-i18next': { useTranslation: () => ({ t: key => key }) },
    '@/components/ai/voice-recorder': { VoiceRecorder: 'VoiceRecorder' },
    '@/hooks/use-ai': { useCheckPronunciation: () => ({ mutateAsync: async () => result, isPending: false }) },
    '@/lib/tts': {},
    './FeedbackBar': { FeedbackBar: 'FeedbackBar' },
    './sky-lesson-header': { SKY: {} },
    './sky-ui': Object.fromEntries(['SkyCard', 'SkyIconButton', 'SkyLabel', 'SkyMissing', 'SkyStepLayout'].map(k => [k, k]).concat([['skyFont', {}]])),
    './step-types': { parseStepContent: () => ({ audio_text: 'Can you help me?', min_accuracy: .7 }) },
  };
  vm.runInNewContext(source, { exports: mod.exports, require: name => { if (!(name in mocks)) throw Error(name); return mocks[name]; }, console });
  function render() { cursor = 0; return mod.exports.ListeningShadowingStep({ step: { id: 'voice-step' }, onSubmit: async () => { submissions++; return { is_correct: true }; }, onContinue: () => {} }); }
  function find(tree, type) {
    if (!tree || typeof tree !== 'object') return undefined;
    if (tree.type === type) return tree;
    for (const child of Object.values(tree.props ?? {}).flat()) { const found = find(child, type); if (found) return found; }
  }
  return { render, find, submissions: () => submissions };
}
for (const [name, result] of [
  ['low score', { accuracy_score: .31, transcribed_text: 'Different words' }],
  ['unrecognized speech', { accuracy_score: 0, transcribed_text: '' }],
]) test(`${name} allows another recording without completing the lesson step`, async () => {
  const app = setup(result);
  app.find(app.render(), 'VoiceRecorder').props.onSubmit({ uri: 'recording.3gp' });
  await new Promise(setImmediate);
  const screen = app.render();
  assert.ok(app.find(screen, 'VoiceRecorder'));
  assert.equal(app.find(screen, 'FeedbackBar'), undefined);
  assert.equal(app.submissions(), 0);
});
test('passing pronunciation waits for a real step submission before showing success', async () => {
  const app = setup({ accuracy_score: 1, transcribed_text: 'Can you help me?' });
  app.find(app.render(), 'VoiceRecorder').props.onSubmit({ uri: 'recording.3gp' });
  await new Promise(setImmediate);
  const screen = app.render();
  assert.equal(app.submissions(), 1);
  assert.equal(app.find(screen, 'VoiceRecorder'), undefined);
  assert.equal(app.find(screen, 'FeedbackBar').props.state.kind, 'correct');
});
