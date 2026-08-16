import { ageToolResults } from '../optimizer/tool-result-aging.mjs';
const sizes=[8*1024,32*1024,64*1024,256*1024,1024*1024];
for(const size of sizes){const text='x'.repeat(size);const input=[{type:'function_call',call_id:'x',name:'shell'},{type:'function_call_output',call_id:'x',output:text},{type:'message',role:'assistant',content:[]}];const{stats}=await ageToolResults(input,{frontier:0,minBytes:32768});const pct=stats.bytesBefore?(100*stats.bytesSaved/stats.bytesBefore).toFixed(2):'0.00';console.log(`${size}\taged=${stats.aged}\tsaved=${stats.bytesSaved}\t${pct}%`);}
