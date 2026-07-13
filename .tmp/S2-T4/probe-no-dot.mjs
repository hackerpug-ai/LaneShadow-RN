import { readFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
function parseEnv(){const t=readFileSync('.env.local','utf8');const e={};for(const l of t.split('\n')){const m=l.match(/^([A-Z_]+)=(.*)$/);if(m)e[m[1]]=m[2].replace(/^["']|["']$/g,'')}return e}
const env=parseEnv();const KEY=env.LANGSMITH_API_KEY;const PROJECT=env.LANGSMITH_PROJECT??'LaneShadowDev';const BASE='https://api.smith.langchain.com'
const traceUuid = randomUUID()
const modelUuid = randomUUID()
const toolUuid = randomUUID()

// Format: YYYYMMDDTHHMMSSffffff (6 microsecond digits, NO dot, NO Z)
function dottedSegment(date, uuid) {
  const d = new Date(date)
  const pad = (n, w=2) => String(n).padStart(w, '0')
  const us = String(d.getUTCMilliseconds()*1000).padStart(6,'0')
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth()+1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}${us}${uuid}`
}
const baseTime = new Date()
const rootTime = new Date(baseTime.getTime())
const modelTime = new Date(baseTime.getTime() + 100)
const toolTime = new Date(baseTime.getTime() + 200)
const rootDotted = dottedSegment(rootTime, traceUuid)
const modelDotted = `${rootDotted}.${dottedSegment(modelTime, modelUuid)}`
const toolDotted = `${rootDotted}.${dottedSegment(toolTime, toolUuid)}`
const toNano = d => String(d.getTime() * 1_000_000)

const mk = (spanId, name, runType, parentUuid, runUuid, dotted, start, end) => ({
  traceId: traceUuid.replace(/-/g,'').padEnd(32,'0').slice(0,32),
  spanId, name, kind: 0,
  startTimeUnixNano: toNano(start), endTimeUnixNano: toNano(end),
  attributes: [
    { key: 'langsmith.span.id', value: { stringValue: runUuid } },
    { key: 'langsmith.trace.id', value: { stringValue: traceUuid } },
    { key: 'langsmith.span.kind', value: { stringValue: runType } },
    { key: 'langsmith.trace.name', value: { stringValue: name } },
    { key: 'langsmith.span.dotted_order', value: { stringValue: dotted } },
    { key: 'langsmith.span.parent_id', value: { stringValue: parentUuid ?? '' } },
    { key: 'langsmith.span.start_time', value: { stringValue: start.toISOString() } },
    { key: 'langsmith.span.end_time', value: { stringValue: end.toISOString() } },
    { key: 'service.name', value: { stringValue: 'laneshadow-agent' } },
    { key: 'inputs', value: { stringValue: '{"userMessage":"probe"}' } },
    { key: 'outputs', value: { stringValue: '{"reply":"probe-out"}' } },
  ],
  status: { code: 1 },
})

const payload = { resourceSpans:[{ resource:{attributes:[{key:'service.name',value:{stringValue:'laneshadow-agent'}}]}, scopeSpans:[{scope:{name:'@mastra/observability'}, spans:[
  mk('1111111111111111','agent-run','chain',undefined,traceUuid,rootDotted,rootTime,new Date(rootTime.getTime()+500)),
  mk('2222222222222222','llm: claude','llm',traceUuid,modelUuid,modelDotted,modelTime,new Date(modelTime.getTime()+400)),
  mk('3333333333333333','tool: geocode','tool',traceUuid,toolUuid,toolDotted,toolTime,new Date(toolTime.getTime()+300)),
]}] }] }

console.log('TRACE_UUID', traceUuid)
console.log('rootDotted', rootDotted)
const exp = await fetch(`${BASE}/otel/v1/traces`, { method:'POST', headers:{'Content-Type':'application/json','x-api-key':KEY,'x-langsmith-project':PROJECT}, body: JSON.stringify(payload) })
console.log('EXPORT', exp.status, await exp.text())
if (exp.status >= 400) process.exit(0)

const deadline = Date.now() + 30000
let found = null
for (let attempt = 1; Date.now() < deadline && !found; attempt++) {
  await new Promise(r=>setTimeout(r, 3000))
  try {
    const r1 = await fetch(`${BASE}/v2/traces/${traceUuid}/runs?project_name=${encodeURIComponent(PROJECT)}`, { headers:{'x-api-key':KEY} })
    if (r1.status === 200) { const j1=await r1.json(); const list=Array.isArray(j1)?j1:(j1?.runs??[]); if(list.length>=3){found={via:'v2/traces/{id}/runs',count:list.length,types:list.map(r=>r.run_type)};break} }
  } catch {}
  if (!found) console.log(`attempt ${attempt}: not yet`)
}
console.log('\nRESULT', found ? JSON.stringify(found) : 'NOT FOUND in 30s')
