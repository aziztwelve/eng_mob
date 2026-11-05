const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');
const mod = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/lib/avatar-expression.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports: mod.exports });
const { avatarExpression } = mod.exports;
test('expression follows the current text and thinking state', () => {
  assert.equal(avatarExpression('Great job!', 'speaking'), 'happy');
  assert.equal(avatarExpression('What do you think?', 'speaking'), 'thinking');
  assert.equal(avatarExpression('Let us begin.', 'idle'), 'neutral');
  assert.equal(avatarExpression('Great job!', 'thinking'), 'thinking');
});
