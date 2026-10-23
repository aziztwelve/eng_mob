const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const mod = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/lib/level-progress.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports: mod.exports });
const progress = mod.exports.levelProgress;
test('server remaining XP gives 10/300 instead of 10/1 at level 3', () => {
  const p = progress({ level: 3, total_xp: 310, next_level_xp: 290 });
  assert.equal(p.into, 10); assert.equal(p.span, 300); assert.equal(p.percent, 3);
});
test('crossing a level starts an empty bar with the new level cost', () => {
  for (const [level, total, remaining] of [[1, 0, 100], [2, 100, 200], [4, 600, 400]]) {
    const p = progress({ level, total_xp: total, next_level_xp: remaining });
    assert.equal(p.into, 0); assert.equal(p.span, remaining); assert.equal(p.percent, 0);
  }
});
test('one XP before the next level retains the full level cost', () => {
  const p = progress({ level: 3, total_xp: 599, next_level_xp: 1 });
  assert.equal(p.into, 299); assert.equal(p.span, 300);
});
