const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');
const mod = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/lib/free-talk.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports: mod.exports });
const { splitSpokenSentences, talkDuration } = mod.exports;

test('SSE boundaries preserve words and do not speak a partial sentence', () => {
  let buffer = ''; const spoken = [];
  for (const delta of ['How ar', 'e you? ', 'I am ', 'doing well', '.']) {
    const part = splitSpokenSentences(buffer + delta, false);
    spoken.push(...part.sentences); buffer = part.rest;
  }
  assert.deepEqual(spoken, ['How are you?']);
  spoken.push(...splitSpokenSentences(buffer, true).sentences);
  assert.deepEqual(spoken, ['How are you?', 'I am doing well.']);
});
test('final answer without punctuation is still spoken once', () => {
  const part = splitSpokenSentences('Tell me about your day', true);
  assert.deepEqual(Array.from(part.sentences), ['Tell me about your day']);
  assert.equal(part.rest, '');
});
test('practice clock handles minutes and never shows negative time', () => {
  assert.equal(talkDuration(0), '00:00');
  assert.equal(talkDuration(65), '01:05');
  assert.equal(talkDuration(-1), '00:00');
});

test('long spoken answers are chunked below the TTS cap without losing the tail', () => {
  const text = Array.from({ length: 250 }, (_, i) => `word${i}`).join(' ');
  const chunks = mod.exports.speechChunks(text);
  assert.ok(chunks.length > 1);
  assert.ok(chunks.every(chunk => chunk.length <= 450));
  assert.equal(chunks.join(' '), text);
});
