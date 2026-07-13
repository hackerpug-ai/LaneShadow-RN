import { readFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
function parseEnv(){const t=readFileSync('.env.local','utf8');const e={};for(const l of t.split('\n')){const m=l.match(/^([A-Z_]+)=(.*)$/);if(m)e[m[1]]=m[2].replace(/^["']|["']$/g,'')}return e}
const env=parseEnv();const KEY=env.LANGSMITH_API_KEY;const PROJECT=env.LANGSMITH_PROJECT??'LaneShadowDev';const BASE='https://api.smith.langchain.com'

const traceUuid = randomUUID()
const rootUuid = randomUUID()
const modelUuid = randomUUID()
const toolUuid = randomUUID()
const nowNs = String(Date.now() * 1_000_000)
const startTime = new Date().toISOString()

const mk = (spanId, name, runType, parentUuid, runUuid) => ({
  traceId: traceUuid.replace(/-/g,'').padEnd(32,'0').slice(0,32),
  spanId,
  name,
  kind: 0,
  startTimeUnixNano: nowNs, endTimeUnixNano: nowNs,
  attributes: [
    { key: 'langsmith.span.id', value: { stringValue: runUuid } },
    { key: 'langsmith.trace.id', value: { stringValue: traceUuid } },
    { key: 'langsmith.span.kind', value: { stringValue: runType } },
    { key: 'langsmith.trace.name', value: { stringValue: name } },
    ...(parentUuid ? [{ key: 'langsmith.span.parent_id', value: { stringValue: parentUuid } }] : []),
    { key: 'langsmith.span.start_time', value: { stringValue: startTime } },
    { key: 'service.name', value: { stringValue: 'laneshadow-agent' } },
    { key: 'inputs', value: { stringValue: 'probe-input' } },
    { key: 'outputs', value: { stringValue: 'probe-output' } },
  ],
  status: { code: 1 },
})

const payload = { resourceSpans:[{ resource:{attributes:[{key:'service.name',value:{stringValue:'laneshadow-agent'}}]}, scopeSpans:[{scope:{name:'@mastra/observability'}, spans:[
  mk('1111111111111111','agent-run','chain',undefined,rootUuid),
  mk('2222222222222222','llm: claude','llm',rootUuid,modelUuid),
  mk('3333333333333333','tool: geocode','tool',rootUuid,toolUuid),
]}] }] }

console.log('TRACE_UUID', traceUuid)
const exp = await fetch(`${BASE}/otel/v1/traces`, { method:'POST', headers:{'Content-Type':'application/json','x-api-key':KEY,'x-langsmith-project':PROJECT}, body: JSON.stringify(payload) })
console.log('EXPORT', exp.status, await exp.text())

const deadline = Date.now() + 30000
let found = null
let lastV2Status = null
for (let attempt = 1; Date.now() < deadline && !found; attempt++) {
  await new Promise(r=>setTimeout(r, 3000))
  try {
    const r1 = await fetch(`${BASE}/v2/traces/${traceUuid}/runs?project_name=${encodeURIComponent(PROJECT)}`, { headers:{'x-api-key':KEY} })
    lastV2Status = r1.status
    if (r1.status === 200) {
      const j1 = await r1.json()
      const list = Array.isArray(j1) ? j1 : (j1?.runs ?? [])
      if (list.length >= 3) { found = { via: 'v2/traces/{id}/runs', count: list.length, sample: list.slice(0,2) }; break }
    }
  } catch {}
  try {
    const r2 = await fetch(`${BASE}/runs/query`, { method:'POST', headers:{'x-api-key':KEY,'Content-Type':'application/json'}, body: JSON.stringify({ trace: traceUuid, project_name: PROJECT, limit: 50 }) })
    if (r2.status === 200) {
      const j2 = await r2.json()
      const list = j2?.runs ?? []
      if (list.length >= 3) { found = { via: 'runs/query trace=uuid', count: list.length }; break }
    }
  } catch {}
  console.log(`attempt ${attempt}: not yet (last v2 status ${lastV2Status})`)
}
console.log('\nRESULT', found ? JSON.stringify(found).slice(0,500) : 'NOT FOUND in 30s')
