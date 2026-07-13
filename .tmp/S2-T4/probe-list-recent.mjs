import { readFileSync } from 'node:fs'
function parseEnv(){const t=readFileSync('.env.local','utf8');const e={};for(const l of t.split('\n')){const m=l.match(/^([A-Z_]+)=(.*)$/);if(m)e[m[1]]=m[2].replace(/^["']|["']$/g,'')}return e}
const env=parseEnv();const KEY=env.LANGSMITH_API_KEY;const PROJECT=env.LANGSMITH_PROJECT??'LaneShadowDev';const BASE='https://api.smith.langchain.com'

// List recent runs in LaneShadowDev (no filters beyond session + limit)
const body = { session_name: PROJECT, limit: 20 }
const r = await fetch(`${BASE}/runs/query`, { method:'POST', headers:{'x-api-key':KEY,'Content-Type':'application/json'}, body: JSON.stringify(body) })
console.log('status', r.status)
const j = await r.json()
console.log('runs count', j?.runs?.length)
if (j?.runs) {
  for (const run of j.runs.slice(0, 8)) {
    console.log(JSON.stringify({ id: run.id, name: run.name, trace_id: run.trace_id, session: run.session, run_type: run.run_type, start_time: run.start_time, extra_keys: Object.keys(run).filter(k=>!['id','name','trace_id','session','run_type','start_time','end_time'].includes(k)) }))
  }
}
// Check what fields exist
if (j?.runs?.[0]) {
  console.log('\nALL KEYS on first run:', Object.keys(j.runs[0]))
}
