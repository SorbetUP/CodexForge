import test from 'node:test';
import assert from 'node:assert/strict';
import { ageToolResults } from '../../optimizer/tool-result-aging.mjs';
function big(label='X', n=40000) { return `${label}:` + 'x'.repeat(n); }
test('ages only old large consumed tool output and keeps exact output in store', async () => {
  const saved = new Map();
  const store = { async put(text) { const { createHash } = await import('node:crypto'); const hash = createHash('sha256').update(text).digest('hex'); saved.set(hash, text); return { hash }; } };
  const old = big('old'); const input = [{type:'function_call',call_id:'a',name:'read_file'},{type:'function_call_output',call_id:'a',output:old},{type:'message',role:'assistant',content:[{type:'output_text',text:'used'}]},{type:'function_call_output',call_id:'b',output:big('new')}];
  const result = await ageToolResults(input,{minBytes:1024,frontier:1,store});
  assert.equal(result.stats.aged,1); assert.ok(result.stats.bytesSaved>30000); assert.match(result.input[1].output,/exact original is stored locally/i); assert.match(result.input[1].output,/Do not repeat the original tool call/i); assert.equal(result.input[3].output,input[3].output); assert.equal([...saved.values()][0],old);
});
test('does not age an output until a later model action proves it was consumed', async () => { const input=[{type:'function_call_output',call_id:'a',output:big()}]; const result=await ageToolResults(input,{minBytes:1024,frontier:0}); assert.equal(result.stats.aged,0); assert.deepEqual(result.input,input); });
test('does not age small outputs', async () => { const input=[{type:'function_call_output',call_id:'a',output:'small'},{type:'message',role:'assistant',content:[]}]; const result=await ageToolResults(input,{minBytes:1024,frontier:0}); assert.equal(result.stats.aged,0); });
