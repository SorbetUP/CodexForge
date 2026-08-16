import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, stat } from 'node:fs/promises';
import os from 'node:os'; import path from 'node:path';
import { OutputStore } from '../../optimizer/output-store.mjs';
test('stores exact content addressably and supports range/grep recovery', async () => { const root=await mkdtemp(path.join(os.tmpdir(),'codex-forge-store-')); const store=new OutputStore({root,maxBytes:1024*1024,ttlMs:60000}); const text='alpha\nbeta needle\ngamma\n'; const saved=await store.put(text); assert.equal(await store.get(saved.hash),text); assert.equal(await store.get(saved.hash,{offset:6,length:4}),'beta'); assert.deepEqual(await store.grep(saved.hash,'needle'),[{line:2,text:'beta needle'}]); assert.equal((await stat(saved.file)).mode&0o777,0o600); });
test('evicts oldest entries when bounded store exceeds budget', async () => { const root=await mkdtemp(path.join(os.tmpdir(),'codex-forge-evict-')); const store=new OutputStore({root,maxBytes:10,ttlMs:60000}); const first=await store.put('12345678'); await new Promise(r=>setTimeout(r,15)); const second=await store.put('abcdefgh'); await assert.rejects(store.get(first.hash)); assert.equal(await store.get(second.hash),'abcdefgh'); });
