const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');
const mod = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/lib/free-talk-avatar.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports: mod.exports });
const { parseAvatarId, avatarStorageKey } = mod.exports;
test('stored selection accepts every avatar and safely handles outdated or damaged data', () => {
  for (let i = 1; i <= 10; i++) assert.equal(parseAvatarId(String(i)), i);
  for (const value of [null, '', '0', '-2', '11', '1.5', 'bad']) assert.equal(parseAvatarId(value), 1);
});
test('different accounts keep independent local avatar preferences', () => {
  assert.notEqual(avatarStorageKey('account-a'), avatarStorageKey('account-b'));
});
