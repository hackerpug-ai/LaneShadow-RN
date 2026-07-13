import { readFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
function parseEnv(){const t=readFileSync('.env.local','utf8');const e={};for(const l of t.split('\n')){const m=l.match(/^([A-Z_]+)=(.*)$/);if(m)e[m[1]]=m[2].replace(/^["']|["']$/g,'')}return e}
const env=parseEnv();const KEY=env.LANGSMITH_API_KEY;const PROJECT=env.LANGSMITH_PROJECT??'LaneShadowDev';const BASE='https://api.smith.langchain.com'
const traceUuid = randomUUID()
const modelUuid = randomUUID()
const toolUuid = randomUUID()
const SESSION_UUID='a8e13770-c510-4977-bb4a-87b7604b3cda'

function dottedSegment(date, uuid) {
  const d = new Date(date); const pad=(n,w=2)=>String(n).padStart(w,'0')
  const us = String(d.getUTCMilliseconds()*1000).padStart(6,'0')
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth()+1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}${us}Z${uuid}`
}
const baseTime = new Date()
const rootDotted = dottedSegment(baseTime, traceUuid)
const modelDotted = `${rootDotted}.${dottedSegment(new Date(baseTime.getTime()+100), modelUuid)}`
const toolDotted = `${rootDotted}.${dottedSegment(new Date(baseTime.getTime()+200), toolUuid)}`
const toNano = d => String(d.getTime() * 1_000_000)
const mk = (spanId, name, runType, parentUuid, runUuid, dotted) => ({
  traceId: traceUuid.replace(/-/g,'').padEnd(32,'0').slice(0,32), spanId, name, kind:0,
  startTimeUnixNano: toNano(baseTime), endTimeUnixNano: toNano(new Date(baseTime.getTime()+500)),
  attributes: [
    {key:'langsmith.span.id',value:{stringValue:runUuid}},
    {key:'langsmith.trace.id',value:{stringValue:traceUuid}},
    {key:'langsmith.span.kind',value:{stringValue:runType}},
    {key:'langsmith.trace.name',value:{stringValue:name}},
    {key:'langsmith.span.dotted_order',value:{stringValue:dotted}},
    {key:'langsmith.span.parent_id',value:{stringValue:parentUuid??''}},
    {key:'langsmith.span.start_time',value:{stringValue:baseTime.toISOString()}},
    {key:'langsmith.span.end_time',value:{stringValue:new Date(baseTime.getTime()+500).toISOString()}},
    {key:'langsmith.trace.session_name',value:{stringValue:PROJECT}},
    {key:'service.name',value:{stringValue:'laneshadow-agent'}},
    {key:'inputs',value:{stringValue:'{"userMessage":"probe"}'}},
    {key:'outputs',value:{stringValue:'{"reply":"probe-out"}'}},
  ], status:{code:1},
})
const payload = { resourceSpans:[{ resource:{attributes:[{key:'service.name',value:{stringValue:'laneshadow-agent'}}]}, scopeSpans:[{scope:{name:'@mastra/observability'}, spans:[
  mk('1111111111111111','agent-run','chain',undefined,traceUuid,rootDotted),
  mk('2222222222222222','llm: claude','llm',traceUuid,modelUuid,modelDotted),
  mk('3333333333333333','tool: geocode','tool',traceUuid,toolUuid,toolDotted),
]}] }] }
console.log('TRACE_UUID', traceUuid)
const exp = await fetch(`${BASE}/otel/v1/traces`, {method:'POST',headers:{'Content-Type':'application/json','x-api-key':KEY,'x-langsmith-project':PROJECT},body:JSON.stringify(payload)})
console.log('EXPORT', exp.status, await exp.text())

const deadline = Date.now() + 45000
for (let attempt=1; Date.now()<deadline; attempt++) {
  await new Promise(r=>setTimeout(r,5000))
  const results = {}
  // A) v2 traces by id
  try { const r=await fetch(`${BASE}/v2/traces/${traceUuid}/runs?project_name=${PROJECT}`,{headers:{'x-api-key':KEY}}); results.v2={status:r.status}; if(r.status===200){const j=await r.json();const l=Array.isArray(j)?j:(j?.runs??[]);results.v2.count=l.length} } catch(e){results.v2='err'}
  // B) runs/query trace=uuid
  try { const r=await fetch(`${BASE}/runs/query`,{method:'POST',headers:{'x-api-key':KEY,'Content-Type':'application/json'},body:JSON.stringify({trace:traceUuid,project_name:PROJECT,limit:50})}); results.rqTrace={status:r.status}; if(r.status===200){const j=await r.json();results.rqTrace.count=(j?.runs??[]).length} } catch(e){results.rqTrace='err'}
  // C) session runs listing
  try { const r=await fetch(`${BASE}/runs/query`,{method:'POST',headers:{'x-api-key':KEY,'Content-Type':'application/json'},body:JSON.stringify({session:[SESSION_UUID],limit:10})}); results.sess={status:r.status}; if(r.status===200){const j=await r.json();const runs=j?.runs??[];results.sess.count=runs.length; results.sess.tracePresent=runs.some(x=>x.trace_id===traceUuid)} } catch(e){results.sess='err'}
  console.log(`attempt ${attempt} (${new Date().toISOString()}):`, JSON.stringify(results))
  if (results.v2?.count>=3 || results.rqTrace?.count>=3 || results.sess?.tracePresent) { console.log('FOUND!'); break }
}
