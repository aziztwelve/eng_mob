const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function setup(onSend) {
  const slots = [];
  let cursor = 0;
  const errors = [];
  const react = {
    createElement: (type, props, ...children) => ({ type, props: props || {}, children: children.flat() }),
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = initial;
      return [slots[index], value => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }];
    },
    useRef(initial) { const index = cursor++; return slots[index] ??= { current: initial }; },
    useEffect() {},
  };
  const modules = {
    react,
    'react-native': { View: 'View', TextInput: 'TextInput', Pressable: 'Pressable', ActivityIndicator: 'ActivityIndicator', StyleSheet: { create: value => value } },
    'lucide-react-native': { Mic: 'Mic', Send: 'Send', Square: 'Square' },
    'expo-audio': { useAudioRecorder: () => ({}) },
    'react-native-toast-message': { show: error => errors.push(error) },
    'expo-linear-gradient': { LinearGradient: 'LinearGradient' },
    '@/components/sunset': { glass: {}, CTA: [] },
    '@/hooks/use-ai': { useTranscribeAudio: () => ({ isPending: false }) },
    '@/lib/stt-recording': { STT_RECORDING_OPTIONS: {}, sttFormatMeta: () => ({}) },
    'react-i18next': { useTranslation: () => ({ t: key => key }) },
  };
  const source = fs.readFileSync(path.join(__dirname, '../src/components/ai/chat-input.tsx'), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.React, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
  const mod = { exports: {} };
  vm.runInNewContext(code, { exports: mod.exports, require: name => {
    if (!(name in modules)) throw new Error(`Unexpected dependency: ${name}`);
    return modules[name];
  } });
  function render() {
    cursor = 0;
    const tree = mod.exports.ChatInput({ onSend, showMic: false });
    const nodes = [];
    function scan(node) {
      if (!node || typeof node !== 'object') return;
      nodes.push(node);
      node.children?.forEach(scan);
    }
    scan(tree);
    return { input: nodes.find(node => node.type === 'TextInput').props, send: nodes.filter(node => node.type === 'Pressable').at(-1).props.onPress };
  }
  return { render, errors };
}

test('failed chat submission preserves the full draft and shows a retryable error', async () => {
  const screen = setup(async () => { throw new Error('offline'); });
  screen.render().input.onChangeText('  My unsent message  ');
  await screen.render().send();
  assert.equal(screen.render().input.value, '  My unsent message  ');
  assert.equal(screen.errors.length, 1);
});

test('chat clears its draft only after a confirmed send and prevents a second tap in flight', async () => {
  let resolve;
  let requests = 0;
  const screen = setup(() => { requests++; return new Promise(yes => { resolve = yes; }); });
  screen.render().input.onChangeText('Hello');
  const pending = screen.render().send();
  await screen.render().send();
  assert.equal(requests, 1);
  assert.equal(screen.render().input.value, 'Hello');
  resolve();
  await pending;
  assert.equal(screen.render().input.value, '');
});

test('a new draft typed during a pending send is not erased by its success', async () => {
  let resolve;
  const screen = setup(() => new Promise(yes => { resolve = yes; }));
  screen.render().input.onChangeText('First message');
  const pending = screen.render().send();
  screen.render().input.onChangeText('Next message');
  resolve();
  await pending;
  assert.equal(screen.render().input.value, 'Next message');
});
