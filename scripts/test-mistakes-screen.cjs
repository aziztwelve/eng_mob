const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

const root = path.resolve(__dirname, '..');
function loadTs(file, imports) {
  const code = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(code, { module, exports: module.exports, require: imports }, { filename: file });
  return module.exports.default;
}
let state;
let locale;
let filter;
let stateCall;
let buttons;
let refetches = 0;
const resources = Object.fromEntries(['ru', 'en', 'kk'].map(lang => [lang,
  loadTs(`src/locales/${lang}.ts`, name => { throw new Error(`Unexpected locale dependency: ${name}`); }),
]));
function t(key, values = {}) {
  const value = key.split('.').reduce((node, part) => node?.[part], resources[locale]);
  assert.equal(typeof value, 'string', `Missing translation: ${locale}:${key}`);
  return value.replace(/{{(\w+)}}/g, (_, name) => String(values[name] ?? ''));
}
const primitive = tag => ({ children, accessibilityRole }) => React.createElement(tag, { role: accessibilityRole }, children);
const native = {
  View: primitive('div'), Text: primitive('span'), ScrollView: primitive('div'),
  ActivityIndicator: () => React.createElement('span', { 'data-loading': true }),
  Pressable: props => {
    buttons.push(props);
    return React.createElement('button', { disabled: props.disabled }, props.children);
  },
};
const Screen = loadTs('src/app/(tabs)/practice/mistakes.tsx', name => {
  if (name === 'react') return { ...React, useState: initial => React.useState(stateCall++ === 0 ? filter : initial) };
  if (name === 'react-native') return native;
  if (name === 'expo-router') return { Stack: { Screen: () => null }, router: { back() {} } };
  if (name === 'lucide-react-native') return new Proxy({}, { get: () => () => null });
  if (name === '@/hooks/use-srs') return { useMistakes: () => state };
  if (name === '@/lib/api-client') return { tsToDate: () => null };
  if (name === 'react-i18next') return { useTranslation: () => ({ t }) };
  throw new Error(`Unexpected dependency: ${name}`);
});
function render(lang, query, tab = 'unresolved') {
  locale = lang; filter = tab; stateCall = 0; buttons = [];
  state = { isPending: false, isError: false, isFetching: false, refetch() { refetches++; }, ...query };
  return renderToStaticMarkup(React.createElement(Screen));
}
const mistake = { id: 'qa', step_id: 'qa-step', times_made: 2, is_resolved: false };
for (const lang of ['ru', 'en', 'kk']) {
  let markup = render(lang, { isError: true });
  assert(markup.includes(t('practice.mistakes_load_error')));
  assert(!markup.includes(t('practice.all_fixed')));
  assert(!markup.includes(t('practice.mistakes_empty')));
  const retry = buttons.find(button => button.children?.props?.children === t('practice.retry'));
  assert(retry && !retry.disabled);
  const before = refetches; retry.onPress(); assert.equal(refetches, before + 1);

  markup = render(lang, { isError: true, isFetching: true, data: { mistakes: [mistake], total: 40 } });
  assert(buttons.find(button => button.children?.props?.children === t('practice.retry')).disabled);
  assert(!markup.includes('qa-step')); // Failed refresh must not claim stale data is current.
  assert(!markup.includes(t('practice.mistakes_pagination', { page: 1, pages: 2, total: 40 })));

  markup = render(lang, { isPending: true });
  assert(markup.includes('data-loading'));
  assert(!markup.includes(t('practice.all_fixed')));
  for (const tab of ['unresolved', 'resolved', 'all']) {
    markup = render(lang, { data: { mistakes: [], total: 0 } }, tab);
    const key = tab === 'unresolved' ? 'all_fixed' : tab === 'resolved' ? 'no_resolved' : 'mistakes_none';
    assert(markup.includes(t(`practice.${key}`)));
  }
  markup = render(lang, { data: { mistakes: [mistake], total: 21 } });
  assert(markup.includes(t('practice.mistakes_step', { id: 'qa-step' })));
  assert(markup.includes(t('practice.mistakes_pagination', { page: 1, pages: 2, total: 21 })));
  if (lang === 'en') assert(!/[А-Яа-яЁё]/.test(markup), 'English screen contains hardcoded Russian');
}
console.log('PASS: loading, failed request/refresh, retry, empty filters, rows and pagination in ru/en/kk');
