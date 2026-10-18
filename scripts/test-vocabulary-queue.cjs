const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../src/lib/vocabulary-attempt-queue-core.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const sandbox = { exports: {} };
vm.runInNewContext(compiled, sandbox);
const { createVocabularyAttemptQueue } = sandbox.exports;
const item = (id) => ({ id, externalId: 'ACTION', step: 5, answer: { value: 'ACTION' }, timeSpentMs: 50 });
function store() {
  const data = new Map();
  return { getItem: async (key) => data.get(key) ?? null, setItem: async (key, value) => { data.set(key, value); } };
}
test('offline attempt survives a new queue instance and retains its id', async () => {
  const storage = store();
  const first = createVocabularyAttemptQueue(storage, async () => { throw new Error('offline'); });
  await first.enqueue('alice', item('one'));
  await assert.rejects(first.flush('alice', async () => true));
  const sent = [];
  const second = createVocabularyAttemptQueue(storage, async (entry) => { sent.push(entry.id); return {}; });
  await second.flush('alice', async () => true);
  assert.deepEqual(sent, ['one']);
  assert.equal((await second.pending('alice')).length, 0);
});
test('parallel enqueue and flush cannot lose new attempts or send twice', async () => {
  const storage = store(); const sent = []; let release;
  const wait = new Promise((resolve) => { release = resolve; });
  const queue = createVocabularyAttemptQueue(storage, async (entry) => { sent.push(entry.id); if (entry.id === 'one') await wait; return {}; });
  await queue.enqueue('alice', item('one'));
  const flushing = queue.flush('alice', async () => true);
  await new Promise(setImmediate);
  await Promise.all([queue.enqueue('alice', item('two')), queue.enqueue('alice', item('two'))]);
  const duplicateFlush = queue.flush('alice', async () => true);
  release(); await Promise.all([flushing, duplicateFlush]);
  assert.deepEqual(sent, ['one', 'two']);
});
test('account change leaves previous account attempts untouched', async () => {
  const storage = store(); let sent = 0;
  const queue = createVocabularyAttemptQueue(storage, async () => { sent++; return {}; });
  await queue.enqueue('alice', item('one'));
  await queue.flush('alice', async () => false);
  await queue.flush('bob', async () => true);
  assert.equal(sent, 0); assert.equal((await queue.pending('alice')).length, 1);
  assert.equal((await queue.pending('alice'))[0].answer.session_user_id, 'alice');
});
test('storage failure does not report the answer as saved', async () => {
  const queue = createVocabularyAttemptQueue({ getItem: async () => null, setItem: async () => { throw new Error('disk full'); } }, async () => ({}));
  await assert.rejects(queue.enqueue('alice', item('one')));
});
