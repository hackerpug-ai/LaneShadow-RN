import { readFileSync } from 'node:fs'
function parseEnv(){const t=readFileSync('.env.local','utf8');const e={};for(const l of t.split('\n')){const m=l.match(/^([A-Z_]+)=(.*)$/);if(m)e[m[1]]=m[2].replace(/^["']|["']$/g,'')}return e}
const env=parseEnv();const KEY=env.LANGSMITH_API_KEY;const PROJECT=env.LANGSMITH_PROJECT??'LaneShadowDev';const BASE='https://api.smith.langchain.com'

// Query ALL recent runs in the session (correct schema: session as list)
const body = { session: [PROJECT], limit: 100, order_by: 'start_time DESC' }
const r = await fetch(`${BASE}/runs/query`, { method:'POST', headers:{'x-api-key':KEY,'Content-Type':'application/json'}, body: JSON.stringify(body) })
console.log('LIST status', r.status)
const txt = await r.text()
let j
try { j = JSON.parse(txt) } catch { console.log('non-json', txt.slice(0,300)); process.exit(0) }
const runs = j?.runs ?? []
console.log('total runs in session:', runs.length)
// Show the most recent runs with their trace_ids
const byTrace = new Map()
for (const run of runs) {
  if (!byTrace.has(run.trace_id)) byTrace.set(run.trace_id, [])
  byTrace.get(run.trace_id).push(run)
}
console.log('distinct traces:', byTrace.size)
// Show 5 most recent traces
const sorted = [...byTrace.entries()].slice(0, 5)
for (const [tid, traceRuns] of sorted) {
  const sample = traceRuns[0]
  console.log(`\ntrace ${tid}: ${traceRuns.length} runs, session=${sample.session}, latest=${sample.start_time}`)
  console.log(`  sample run: name=${sample.name}, run_type=${sample.run_type}`)
}
// Check if our probe traceId from earlier shows up
const probeTid = '00000000000000000000019f599f6a05'
console.log('\nProbe trace in session runs?', runs.some(r => r.trace_id === probeTid))
