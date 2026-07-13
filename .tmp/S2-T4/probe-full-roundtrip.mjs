import { readFileSync } from 'node:fs'
function parseEnv(){const t=readFileSync('.env.local','utf8');const e={};for(const l of t.split('\n')){const m=l.match(/^([A-Z_]+)=(.*)$/);if(m)e[m[1]]=m[2].replace(/^["']|["']$/g,'')}return e}
const env=parseEnv();const KEY=env.LANGSMITH_API_KEY;const PROJECT=env.LANGSMITH_PROJECT??'LaneShadowDev';const BASE='https://api.smith.langchain.com'

// 1. Export a fresh 3-span trace with a known traceId
const tid = (Date.now().toString(16).padStart(32,'0') + '0'.repeat(32)).slice(0,32)
const nowNs = String(Date.now() * 1_000_000)
const mkSpan = (spanId, name, pId) => ({ traceId: tid, spanId, parentSpanId: pId, name, kind: 0, startTimeUnixNano: nowNs, endTimeUnixNano: nowNs, attributes:[{key:'mastra.span.type',value:{stringValue:name}}], status:{code:1} })
const payload = { resourceSpans:[{ resource:{attributes:[{key:'service.name',value:{stringValue:'laneshadow-agent'}}]}, scopeSpans:[{scope:{name:'@mastra/observability'}, spans:[
  mkSpan('1111111111111111','root',undefined),
  mkSpan('2222222222222222','model','1111111111111111'),
  mkSpan('3333333333333333','tool','1111111111111111'),
]}] }] }
console.log('TRACE_ID', tid)
const exp = await fetch(`${BASE}/otel/v1/traces`, { method:'POST', headers:{'Content-Type':'application/json','x-api-key':KEY,'x-langsmith-project':PROJECT}, body: JSON.stringify(payload) })
console.log('EXPORT status', exp.status, await exp.text())

// 2. Poll retrieval by trace for up to 30s
const deadline = Date.now() + 30000
let found = false
let attempt = 0
while (Date.now() < deadline && !found) {
  attempt++
  await new Promise(r=>setTimeout(r, 3000))
  // Query by trace (string)
  for (const traceShape of [tid, [tid]]) {
    const r = await fetch(`${BASE}/runs/query`, { method:'POST', headers:{'x-api-key':KEY,'Content-Type':'application/json'}, body: JSON.stringify({ trace: traceShape, limit: 50 }) })
    const txt = await r.text()
    let j
    try { j = JSON.parse(txt) } catch { continue }
    if (r.status === 200 && Array.isArray(j.runs) && j.runs.length >= 3) {
      found = true
      console.log(`\nFOUND on attempt ${attempt} (trace shape: ${Array.isArray(traceShape)?'list':'string'})`)
      console.log('runs:', j.runs.length, 'sample trace_ids:', [...new Set(j.runs.map(x=>x.trace_id))])
      console.log('first run keys:', Object.keys(j.runs[0]))
      console.log('first run:', JSON.stringify({id:j.runs[0].id, name:j.runs[0].name, trace_id:j.runs[0].trace_id, run_type:j.runs[0].run_type}))
      break
    }
  }
  if (!found) console.log(`attempt ${attempt}: not found yet (${new Date().toISOString()})`)
}
console.log('\nRESULT:', found ? 'RETRIEVABLE' : 'NOT RETRIEVABLE within 30s')
