import test from 'node:test'; import assert from 'node:assert/strict';
import { rewriteManagedOpenAIBaseUrl, OPENCODEX_URL, OPTIMIZER_URL } from '../../optimizer/codex-config.mjs';
test('rewrites only exact managed OpenCodex loopback route',()=>{ const input=`model = "x"\nopenai_base_url = "${OPENCODEX_URL}"\n[features]\nfoo=true\n`; const enabled=rewriteManagedOpenAIBaseUrl(input,{enable:true}); assert.ok(enabled.changed); assert.ok(enabled.text.includes(OPTIMIZER_URL)); const disabled=rewriteManagedOpenAIBaseUrl(enabled.text,{enable:false}); assert.equal(disabled.text,input); });
test('refuses to overwrite user-owned/unknown base URLs',()=>assert.throws(()=>rewriteManagedOpenAIBaseUrl('openai_base_url = "https://corp.example/v1"\n',{enable:true}),/refusing/));
