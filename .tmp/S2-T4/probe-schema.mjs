import { readFileSync } from 'node:fs'
function parseEnv(){const t=readFileSync('.env.local','utf8');const e={};for(const l of t.split('\n')){const m=l.match(/^([A-Z_]+)=(.*)$/);if(m)e[m[1]]=m[2].replace(/^["']|["']$/g,'')}return e}
const env=parseEnv();const KEY=env.LANGSMITH_API_KEY;const PROJECT=env.LANGSMITH_PROJECT??'LaneShadowDev';const BASE='https://api.smith.langchain.com'

// Try a few body shapes, print RAW responses
const variants = [
  { name: 'session_name+limit', body: { session_name: PROJECT, limit: 5 } },
  { name: 'session+limit', body: { session: PROJECT, limit: 5 } },
  { name: 'session_name only', body: { session_name: PROJECT } },
  { name: 'empty body', body: {} },
]
for (const v of variants) {
  const r = await fetch(`${BASE}/runs/query`, { method:'POST', headers:{'x-api-key':KEY,'Content-Type':'application/json'}, body: JSON.stringify(v.body) })
  const t = await r.text()
  console.log(`\n=== ${v.name} (status ${r.status}) ===`)
  console.log(t.slice(0, 500))
}
