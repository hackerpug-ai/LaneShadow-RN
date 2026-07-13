import { readFileSync } from 'node:fs'
function parseEnv(){const t=readFileSync('.env.local','utf8');const e={};for(const l of t.split('\n')){const m=l.match(/^([A-Z_]+)=(.*)$/);if(m)e[m[1]]=m[2].replace(/^["']|["']$/g,'')}return e}
const env=parseEnv();const KEY=env.LANGSMITH_API_KEY;const BASE='https://api.smith.langchain.com'

// Find a project with runs, get a real run's dotted_order
const sessResp = await fetch(`${BASE}/api/v1/sessions?limit=50`, { headers:{'x-api-key':KEY} })
const sessions = await sessResp.json()
console.log('sessions:', sessions.map(s=>s.name).join(', '))

for (const s of sessions) {
  const r = await fetch(`${BASE}/runs/query`, {method:'POST',headers:{'x-api-key':KEY,'Content-Type':'application/json'},body:JSON.stringify({session:[s.id],limit:3})})
  if (r.status !== 200) continue
  const j = await r.json()
  const runs = j?.runs ?? []
  if (runs.length === 0) continue
  console.log(`\n=== SESSION ${s.name} (${runs.length} runs) ===`)
  for (const run of runs.slice(0,3)) {
    console.log(JSON.stringify({
      id: run.id, trace_id: run.trace_id, parent_run_id: run.parent_run_id,
      dotted_order: run.dotted_order, run_type: run.run_type, name: run.name,
      start_time: run.start_time, session: run.session,
    }))
  }
  break
}
