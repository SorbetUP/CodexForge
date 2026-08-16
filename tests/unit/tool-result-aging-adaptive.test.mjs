import assert from 'node:assert/strict';
import test from 'node:test';
import { ageToolResults, effectiveMinBytes } from '../../optimizer/tool-result-aging.mjs';

const out = (n) => 'x'.repeat(n);
const decision = (id) => ({ type:'function_call', call_id:id, name:'noop', arguments:'{}' });

test('adaptive threshold decreases only for outputs far behind later model decisions', () => {
  assert.equal(effectiveMinBytes(32768, 0, true), 32768);
  assert.equal(effectiveMinBytes(32768, 1, true), 32768);
  assert.equal(effectiveMinBytes(32768, 2, true), 16384);
  assert.equal(effectiveMinBytes(32768, 4, true), 8192);
  assert.equal(effectiveMinBytes(32768, 10, false), 32768);
});

test('adaptive aging can compact a medium old output while protecting recent frontier', async () => {
  const input = [
    { type:'function_call_output', call_id:'old', output:out(20000) },
    decision('a'), { type:'function_call_output', call_id:'a', output:'a' },
    decision('b'), { type:'function_call_output', call_id:'b', output:'b' },
    decision('c'), { type:'function_call_output', call_id:'c', output:'c' },
    decision('d'), { type:'function_call_output', call_id:'d', output:out(50000) },
  ];
  const result = await ageToolResults(input, { minBytes:32768, frontier:1, adaptive:true });
  assert.equal(result.stats.aged, 1);
  assert.equal(result.stats.adaptiveAged, 1);
  assert.match(result.input[0].output, /sha256:/);
  assert.equal(result.input.at(-1).output, input.at(-1).output);
});
