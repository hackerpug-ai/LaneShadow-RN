import { readFileSync } from 'node:fs'
function parseEnv(){const t=readFileSync('.env.local','utf8');const e={};for(const l of t.split('\n')){const m=l.match(/^([A-Z_]+)=(.*)$/);if(m)e[m[1]]=m[2].replace(/^["']|["']$/g,'')}return e}
const env=parseEnv();const KEY=env.LANGSMITH_API_KEY;const PROJECT=env.LANGSMITH_PROJECT??'LaneShadowDev';const BASE='https://api.smith.langchain.com'

// Minimal: just session as list
const r = await fetch(`${BASE}/runs/query`, { method:'POST', headers:{'x-api-key':KEY,'Content-Type':'application/json'}, body: JSON.stringify({ session: [PROJECT] }) })
console.log('status', r.status)
const t = await r.text()
console.log('body', t.slice(0, 800))
