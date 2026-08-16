import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeUsage, parseCodexJsonl, percentDelta, summarizePairs } from '../../scripts/benchmark-live-ab.mjs';

test('parseCodexJsonl reads the final turn.completed usage', () => {
  const text = [
    JSON.stringify({ type: 'thread.started', thread_id: 't1' }),
    JSON.stringify({ type: 'turn.completed', usage: { input_tokens: 100, cached_input_tokens: 60, cache_write_input_tokens: 5, output_tokens: 20, reasoning_output_tokens: 7 } }),
  ].join('\n');
  const parsed = parseCodexJsonl(text);
  assert.equal(parsed.turnCompleted, true);
  assert.deepEqual(parsed.usage, {
    input_tokens: 100,
    cached_input_tokens: 60,
    cache_write_input_tokens: 5,
    output_tokens: 20,
    reasoning_output_tokens: 7,
    uncached_input_tokens: 40,
  });
});

test('parseCodexJsonl records malformed lines without losing valid metrics', () => {
  const parsed = parseCodexJsonl('{bad}\n' + JSON.stringify({ type: 'turn.completed', usage: { input_tokens: 10 } }));
  assert.equal(parsed.invalid.length, 1);
  assert.equal(parsed.usage.input_tokens, 10);
});

test('normalizeUsage is backward compatible with missing newer fields', () => {
  assert.deepEqual(normalizeUsage({ input_tokens: 20, cached_input_tokens: 3, output_tokens: 2 }), {
    input_tokens: 20,
    cached_input_tokens: 3,
    cache_write_input_tokens: 0,
    output_tokens: 2,
    reasoning_output_tokens: 0,
    uncached_input_tokens: 17,
  });
});

test('percentDelta uses baseline as denominator', () => {
  assert.equal(percentDelta(100, 75), -25);
  assert.equal(percentDelta(0, 10), null);
});

test('summarizePairs marks token savings as invalid quality win when optimized fails', () => {
  const base = { task:'t', round:1, arm:'baseline', pass:true, wall_ms:100, usage:normalizeUsage({input_tokens:100,cached_input_tokens:20,output_tokens:10}), optimizer:{} };
  const opt = { task:'t', round:1, arm:'optimized', pass:false, wall_ms:80, usage:normalizeUsage({input_tokens:50,cached_input_tokens:10,output_tokens:5}), optimizer:{toolResultsAged:2,toolResultBytesSaved:1000} };
  const [pair] = summarizePairs([base,opt]);
  assert.equal(pair.quality_equal, false);
  assert.equal(pair.input_delta_pct, -50);
  assert.equal(pair.optimizer_results_aged, 2);
});
