import { readFileSync } from 'node:fs'
function parseEnv(){const t=readFileSync('.env.local','utf8');const e={};for(const l of t.split('\n')){const m=l.match(/^([A-Z_]+)=(.*)$/);if(m)e[m[1]]=m[2].replace(/^["']|["']$/g,'')}return e}
const env=parseEnv();const KEY=env.LANGSMITH_API_KEY;const PROJECT=env.LANGSMITH_PROJECT??'LaneShadowDev';const BASE='https://api.smith.langchain.com'
const SESSION_UUID='a8e13770-c510-4977-bb4a-87b7604b3cda'

const r = await fetch(`${BASE}/runs/query`, { method:'POST', headers:{'x-api-key':KEY,'Content-Type':'application/json'}, body: JSON.stringify({ session: [SESSION_UUID], limit: 50 }) })
console.log('status', r.status)
const t = await r.text()
const j = JSON.parse(t)
const runs = j?.runs ?? []
console.log('total runs:', runs.length)
const byTrace = new Map()
for (const run of runs) {
  if (!byTrace.has(run.trace_id)) byTrace.set(run.trace_id, [])
  byTrace.get(run.trace_id).push(run)
}
console.log('distinct traces:', byTrace.size)
// Most recent traces
const recent = [...byTrace.entries()].sort((a,b)=>{
  const ta = a[1][0].start_time ?? ''; const tb = b[1][0].start_time ?? ''
  return tb.localeCompare(ta)
}).slice(0, 5)
for (const [tid, truns] of recent) {
  const s = truns[0]
  console.log(`\ntrace ${tid}: ${truns.length} runs, session=${s.session}, start=${s.start_time}`)
  console.log(`  sample: name="${s.name}", run_type="${s.run_type}", status="${s.status}"`)
}
// Do the probe trace IDs from earlier appear?
const probeTids = ['00000000000000000000019f599f6a05','19f599ddef1000000000000000000000','abcdef0123456789abcdef0123456789']
for (const pt of probeTids) console.log(`probe ${pt} present?`, runs.some(r=>r.trace_id===pt))
