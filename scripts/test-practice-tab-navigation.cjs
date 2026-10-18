const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const buttons = [];
const calls = [];
let prevented = false;
const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/components/home/home-tab-bar.tsx'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true },
}).outputText;
const moduleMock = { exports: {} };
vm.runInNewContext(code, { module: moduleMock, exports: moduleMock.exports, require(name) {
  if (name === 'react') return React;
  if (name === 'react-native') return {
    useWindowDimensions: () => ({ width: 375 }),
    View: ({ children }) => React.createElement('div', null, children),
    Text: ({ children }) => React.createElement('span', null, children),
    Pressable: props => { buttons.push(props); return React.createElement('button', null, props.children); },
  };
  if (name === 'expo-router') return { useRouter: () => ({ navigate: href => calls.push(['router', href]) }) };
  if (name === 'react-native-safe-area-context') return { useSafeAreaInsets: () => ({ bottom: 0 }) };
  if (name === 'react-i18next') return { useTranslation: () => ({ t: key => key }) };
  if (name === '@/components/figma/FigmaSvg') return { FigmaSvg: () => null };
  if (name.endsWith('.svg')) return 1;
  throw new Error(`Unexpected import: ${name}`);
} });
const { HomeTabBar } = moduleMock.exports;
function setup(current) {
  buttons.length = 0; calls.length = 0; prevented = false;
  const routes = ['index', 'practice', 'ai', 'social', 'profile', 'tracks'].map(name => ({ key: name, name,
    ...(name === 'practice' ? { state: { index: 0, routes: [{ name: 'mistakes' }] } } : {}),
  }));
  renderToStaticMarkup(React.createElement(HomeTabBar, { state: { routes, index: routes.findIndex(route => route.name === current) }, navigation: {
    emit: event => { calls.push(['emit', event.type]); return { defaultPrevented: prevented }; },
    navigate: name => calls.push(['tab', name]),
  } }));
}
for (const current of ['practice', 'profile', 'tracks']) {
  setup(current);
  buttons.find(button => button.accessibilityLabel === 'tabs.practice').onPress();
  assert(calls.some(call => call[0] === 'router' && call[1] === '/(tabs)/practice'), `Practice entry missing from ${current}`);
}
setup('practice'); prevented = true;
buttons.find(button => button.accessibilityLabel === 'tabs.practice').onPress();
assert(!calls.some(call => call[0] === 'router' || call[0] === 'tab'));
setup('practice'); buttons.find(button => button.accessibilityLabel === 'tabs.profile').onPress();
assert(calls.some(call => call[0] === 'tab' && call[1] === 'profile'));
setup('practice'); buttons.find(button => button.accessibilityLabel === 'tabs.ai').onPress();
assert.equal(calls.length, 0);
console.log('PASS: Practice always opens its index, including Mistakes as stack root; prevention and other tabs unchanged');
