const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

// Execute the real hooks with a tiny deterministic state/effect scheduler.
function loadHook(file, modules, globals = {}) {
  const slots = [];
  let cursor = 0;
  let pending = [];
  const same = (a, b) => a && b && a.length === b.length && a.every((value, index) => Object.is(value, b[index]));
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
      return [slots[index], value => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }];
    },
    useRef(initial) {
      const index = cursor++;
      return slots[index] ??= { current: initial };
    },
    useCallback(fn, deps) {
      const index = cursor++;
      if (!same(slots[index]?.deps, deps)) slots[index] = { fn, deps };
      return slots[index].fn;
    },
    useEffect(fn, deps) {
      const index = cursor++;
      if (!same(slots[index]?.deps, deps)) {
        pending.push(() => {
          slots[index]?.cleanup?.();
          slots[index] = { deps, cleanup: fn() };
        });
      }
    },
  };
  const mod = { exports: {} };
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
  vm.runInNewContext(compiled, {
    exports: mod.exports,
    require(name) {
      if (name === 'react') return react;
      if (name in modules) return modules[name];
      throw new Error(`Unexpected dependency: ${name}`);
    },
    ...globals,
  });
  return {
    render(name, ...args) {
      cursor = 0;
      pending = [];
      const output = mod.exports[name](...args);
      pending.forEach(run => run());
      return output;
    },
    unmount() { slots.forEach(slot => slot?.cleanup?.()); },
  };
}

function entryHarness({ quota = { chat_limit: 100, chat_used: 0 }, refetch, create = async () => ({ conversation: { id: 'new-chat' } }) } = {}) {
  const created = [];
  const pushed = [];
  const errors = [];
  const state = loadHook('src/hooks/use-start-free-talk.ts', {
    'expo-router': { useRouter: () => ({ push: params => pushed.push(params) }) },
    'react-i18next': { useTranslation: () => ({ t: key => key }) },
    'react-native-toast-message': { show: error => errors.push(error) },
    '@react-navigation/native': { useIsFocused: () => true },
    '@/components/ai/quota-widget': { hasQuotaLeft: q => q.chat_limit < 0 || q.chat_used < q.chat_limit },
    '@/hooks/use-ai': {
      useAIQuota: () => ({ data: quota, refetch: refetch ?? (async () => ({ isError: true, error: new Error('offline') })) }),
      useStartConversation: () => ({ mutateAsync: request => { created.push(request); return create(); } }),
    },
    '@/lib/ai-languages': { DEFAULT_TARGET_LANG: 'en' },
  });
  return { ...state, render: () => state.render('useStartFreeTalk'), created, pushed, errors };
}

test('one tap opens a ready-to-start English conversation; rapid double taps create only one', async () => {
  const response = deferred();
  const hook = entryHarness({ create: () => response.promise });
  const entry = hook.render();
  const first = entry.start();
  await entry.start();
  assert.equal(hook.created.length, 1);
  assert.equal(hook.render().isStarting, true);
  assert.equal(hook.created[0].target_language, 'en');
  assert.equal(hook.created[0].scenario, 'free_chat');
  response.resolve({ conversation: { id: 'new-chat' } });
  await first;
  assert.equal(hook.pushed.length, 1);
  assert.equal(hook.pushed[0].pathname, '/free-talk/[id]');
  assert.equal(hook.pushed[0].params.autoStart, '1');
  assert.equal(hook.pushed[0].params.id, 'new-chat');
  assert.equal(hook.render().isStarting, false);
});

test('no conversation is created when the account has exhausted its chat quota', async () => {
  const hook = entryHarness({ quota: { chat_limit: 10, chat_used: 10 } });
  await hook.render().start();
  assert.equal(hook.created.length, 0);
  assert.equal(hook.pushed.length, 0);
  assert.equal(hook.errors.length, 1);
});

test('a missing quota is fetched and an offline failure leaves the action retryable', async () => {
  const hook = entryHarness({ quota: null });
  await hook.render().start();
  assert.equal(hook.created.length, 0);
  assert.equal(hook.render().isStarting, false);
  assert.equal(hook.errors.length, 1);
});

test('failed creation can be retried and does not navigate before success', async () => {
  let attempts = 0;
  const hook = entryHarness({ create: async () => {
    if (++attempts === 1) throw new Error('offline');
    return { conversation: { id: 'retry-chat' } };
  } });
  await hook.render().start();
  assert.equal(hook.pushed.length, 0);
  await hook.render().start();
  assert.equal(hook.pushed.length, 1);
  assert.equal(hook.pushed[0].params.id, 'retry-chat');
});

test('a completed request does not redirect after the entry screen has unmounted', async () => {
  const response = deferred();
  const hook = entryHarness({ create: () => response.promise });
  const pending = hook.render().start();
  hook.unmount();
  response.resolve({ conversation: { id: 'late-chat' } });
  await pending;
  assert.equal(hook.pushed.length, 0);
});

test('session reservation is explicit, deduplicated and uses server time for the five-minute countdown', async () => {
  const response = deferred();
  let requests = 0;
  let now = 1_000_000;
  let tick;
  const hook = loadHook('src/hooks/use-free-talk-session.ts', {
    '@/lib/ai-api': { AIApi: { reserveFreeTalk: () => { requests++; return response.promise; } } },
  }, {
    Date: { now: () => now },
    setInterval: fn => { tick = fn; return 1; },
    clearInterval: () => {},
  });
  const session = hook.render('useFreeTalkSession', 'chat');
  assert.equal(requests, 0, 'opening history must not reserve a daily session');
  const pending = session.start();
  await session.start();
  assert.equal(requests, 1);
  response.resolve({ allowed: true, unlimited: false, server_now_ms: 10_000, expires_at_ms: 310_000, resets_at_ms: 86_400_000 });
  await pending;
  let current = hook.render('useFreeTalkSession', 'chat');
  assert.equal(current.remaining, 300);
  assert.equal(current.active, true);
  now += 10_000;
  tick();
  current = hook.render('useFreeTalkSession', 'chat');
  assert.equal(current.remaining, 290);
  now += 300_000;
  tick();
  current = hook.render('useFreeTalkSession', 'chat');
  assert.equal(current.remaining, 0);
  assert.equal(current.active, false);
});

test('history pagination advances by loaded records and stops at the server total', async () => {
  let options;
  let requested;
  const hook = loadHook('src/hooks/use-ai.ts', {
    '@tanstack/react-query': { useInfiniteQuery: config => { options = config; return config; } },
    '@/hooks/use-auth': { useIsAuthenticated: () => ({ isAuthenticated: true }) },
    '@/lib/ai-api': { AIApi: { listConversations: params => { requested = params; } } },
  });
  hook.render('useAIConversationHistory');
  await options.queryFn({ pageParam: 30 });
  assert.equal(requested.limit, 30);
  assert.equal(requested.offset, 30);
  const first = { conversations: Array(30).fill({}), total: 65 };
  const second = { conversations: Array(30).fill({}), total: 65 };
  const last = { conversations: Array(5).fill({}), total: 65 };
  assert.equal(options.getNextPageParam(first, [first]), 30);
  assert.equal(options.getNextPageParam(second, [first, second]), 60);
  assert.equal(options.getNextPageParam(last, [first, second, last]), undefined);
  assert.equal(options.getNextPageParam({ conversations: [], total: 100 }, [first]), undefined);
});

test('the server daily-limit denial cannot activate a conversation', async () => {
  const hook = loadHook('src/hooks/use-free-talk-session.ts', {
    '@/lib/ai-api': { AIApi: { reserveFreeTalk: async () => ({ allowed: false, unlimited: false, server_now_ms: 10_000, expires_at_ms: 20_000, resets_at_ms: 86_400_000 }) } },
  }, { Date: { now: () => 1_000_000 }, setInterval: () => 1, clearInterval: () => {} });
  await hook.render('useFreeTalkSession', 'blocked-chat').start();
  const session = hook.render('useFreeTalkSession', 'blocked-chat');
  assert.equal(session.started, true);
  assert.equal(session.active, false);
});

test('a test or premium account keeps the server-provided unlimited session', async () => {
  const hook = loadHook('src/hooks/use-free-talk-session.ts', {
    '@/lib/ai-api': { AIApi: { reserveFreeTalk: async () => ({ allowed: true, unlimited: true, server_now_ms: 10_000, resets_at_ms: 86_400_000 }) } },
  }, { Date: { now: () => 1_000_000 }, setInterval: () => 1, clearInterval: () => {} });
  await hook.render('useFreeTalkSession', 'unlimited-chat').start();
  const session = hook.render('useFreeTalkSession', 'unlimited-chat');
  assert.equal(session.active, true);
  assert.equal(session.remaining, null);
});

test('a failed reservation can be retried without leaving the microphone enabled', async () => {
  let attempts = 0;
  const hook = loadHook('src/hooks/use-free-talk-session.ts', {
    '@/lib/ai-api': { AIApi: { reserveFreeTalk: async () => {
      if (++attempts === 1) throw new Error('offline');
      return { allowed: true, unlimited: false, server_now_ms: 10_000, expires_at_ms: 310_000, resets_at_ms: 86_400_000 };
    } } },
  }, { Date: { now: () => 1_000_000 }, setInterval: () => 1, clearInterval: () => {} });
  await hook.render('useFreeTalkSession', 'retry-chat').start();
  let session = hook.render('useFreeTalkSession', 'retry-chat');
  assert.equal(session.failed, true);
  assert.equal(session.active, false);
  await session.start();
  session = hook.render('useFreeTalkSession', 'retry-chat');
  assert.equal(session.failed, false);
  assert.equal(session.active, true);
});
