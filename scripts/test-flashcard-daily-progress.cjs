const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const mod = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/lib/flashcard-daily-progress.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports: mod.exports });
const progress = mod.exports.flashcardDailyProgress;
test('two reviewed selected cards finish the goal at 2/2', () => {
 const p = progress({ today_due: 2, today_completed: 2, today_remaining: 0 });
 assert.equal(p.goal, 2); assert.equal(p.remaining, 0);
});
test('reviews outside the selection and unfinished selected cards both count once', () => {
 const p = progress({ today_due: 2, today_completed: 3, today_remaining: 1 });
 assert.equal(p.goal, 4); assert.equal(p.selected, 2);
});
test('an older server does not produce a guessed denominator', () => {
 const p = progress({ today_due: 2, today_completed: 2 });
 assert.equal(p.goal, null); assert.equal(p.completed, 2);
});
