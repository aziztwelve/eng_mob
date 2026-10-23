const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');
const storage = new Map(); let owner = 'alice';
const mod = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/lib/lesson-resume.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, {
 exports: mod.exports, require: name => ({
  '@react-native-async-storage/async-storage': { default: { getItem: async k => storage.get(k) ?? null, setItem: async (k, v) => storage.set(k, v), removeItem: async k => storage.delete(k) } },
  './auth-service': { AuthService: { getSessionUserID: async () => owner } },
 }[name]),
});
const { resolveLessonPosition: resolve, saveLessonPosition: save, readLessonPosition: read } = mod.exports;
const steps = ['a', 'b', 'c'].map(id => ({ id }));
const progress = ids => ({ step_progresses: ids.map(step_id => ({ step_id, completed: true })) });
test('resume from first unfinished server step when the device has no checkpoint', () => {
 assert.equal(resolve(steps, progress(['a', 'b']), null), 2);
 assert.equal(resolve(steps, null, null), 0);
});
test('checkpoint uses stable IDs and never skips new or unfinished content', () => {
 assert.equal(resolve(steps, progress(['a']), 'c'), 1);
 assert.equal(resolve(steps, progress(['a', 'b']), 'b'), 1);
 assert.equal(resolve([{ id: 'new' }, ...steps], progress(['a', 'b']), 'c'), 0);
 assert.equal(resolve(steps, progress(['a']), 'removed-step'), 1);
});
test('finished lessons and explicit replay start from the beginning', () => {
 assert.equal(resolve(steps, progress(['a', 'b', 'c']), 'c'), 0);
 assert.equal(resolve(steps, progress(['a', 'b']), 'b', true), 0);
});
test('account checkpoints are isolated and late writes from the previous account are ignored', async () => {
 await save('alice', 'lesson', 'b'); owner = 'bob';
 assert.equal(await read('bob', 'lesson'), null);
 await save('alice', 'lesson', 'c');
 assert.equal(await read('alice', 'lesson'), 'b');
 await save('bob', 'lesson', 'a');
 await save('bob', 'lesson', null);
 assert.equal(await read('bob', 'lesson'), null);
});
