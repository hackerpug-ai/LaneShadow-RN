import { readFileSync } from 'node:fs'
function parseEnv(){const t=readFileSync('.env.local','utf8');const e={};for(const l of t.split('\n')){const m=l.match(/^([A-Z_]+)=(.*)$/);if(m)e[m[1]]=m[2].replace(/^["']|["']$/g,'')}return e}
const env=parseEnv();const KEY=env.LANGSMITH_API_KEY;const PROJECT=env.LANGSMITH_PROJECT??'LaneShadowDev';const BASE='https://api.smith.langchain.com'

// 1. Find LaneShadowDev session id
const sessResp = await fetch(`${BASE}/api/v1/sessions?limit=100`, { headers: { 'x-api-key': KEY } })
const sessions = await sessResp.json()
const mySession = sessions.find(s => s.name === PROJECT)
console.log('MY_SESSION', mySession ? { id: mySession.id, name: mySession.name } : 'NOT FOUND among', sessions.map(s=>s.name).slice(0,10))

if (mySession) {
  // 2. Probe runs endpoints for this session
  const probes = [
    { name: 'GET /api/v1/sessions/{id}/runs', url: `${BASE}/api/v1/sessions/${mySession.id}/runs?limit=3` },
    { name: 'GET /api/v1/runs?session=...', url: `${BASE}/api/v1/runs?session=${encodeURIComponent(PROJECT)}&limit=3` },
    { name: 'GET /api/v1/runs?session_id=...', url: `${BASE}/api/v1/runs?session_id=${mySession.id}&limit=3` },
  ]
  for (const p of probes) {
    try {
      const r = await fetch(p.url, { headers: { 'x-api-key': KEY } })
      const body = await r.text()
      let summary
      try { const j=JSON.parse(body); summary = { status: r.status, isArray: Array.isArray(j), len: Array.isArray(j)?j.length:(j?.runs?.length??'?'), keys: Array.isArray(j)?null:Object.keys(j), sample: Array.isArray(j)?(j[0]?{id:j[0].id, name:j[0].name, trace_id:j[0].trace_id, session:j[0].session}:null):null } }
      catch { summary = `status=${r.status} non-json head=${body.slice(0,150)}` }
      console.log(`\n${p.name} =>`, JSON.stringify(summary))
    } catch (err) { console.log(`\n${p.name} => ERROR ${err.message}`) }
  }
}
