import { readFileSync } from 'node:fs'
function parseEnv(){const t=readFileSync('.env.local','utf8');const e={};for(const l of t.split('\n')){const m=l.match(/^([A-Z_]+)=(.*)$/);if(m)e[m[1]]=m[2].replace(/^["']|["']$/g,'')}return e}
const env=parseEnv();const KEY=env.LANGSMITH_API_KEY;const PROJECT=env.LANGSMITH_PROJECT??'LaneShadowDev';const BASE='https://api.smith.langchain.com'

// Export a fresh trace with a KNOWN traceId, then query runs by trace_id
const tid = (Date.now().toString(16) + '0'.repeat(40)).slice(0,32)
const sid = '1234567890abcdef'
const nowNs = String(Date.now() * 1_000_000)
const payload = {
  resourceSpans: [{
    resource: { attributes: [{ key: 'service.name', value: { stringValue: 'laneshadow-agent' } }] },
    scopeSpans: [{ scope: { name: '@mastra/observability' }, spans: [
      { traceId: tid, spanId: sid, name: 'probe-root', kind: 0, startTimeUnixNano: nowNs, endTimeUnixNano: nowNs,
        attributes: [{ key:'mastra.span.type', value:{stringValue:'root'} }],
        status: { code: 1 } },
    ] }],
  }],
}
console.log('PROBE_TRACE_ID', tid)
const exp = await fetch(`${BASE}/otel/v1/traces`, { method:'POST', headers:{'Content-Type':'application/json','x-api-key':KEY,'x-langsmith-project':PROJECT}, body: JSON.stringify(payload) })
console.log('EXPORT', exp.status, await exp.text())

await new Promise(r=>setTimeout(r,5000))

// Probe POST /runs/query variants
const bodyVariants = [
  { name: 'A: {session, trace}', body: { session: PROJECT, trace: tid } },
  { name: 'B: {session_name, trace}', body: { session_name: PROJECT, trace: tid } },
]
for (const v of bodyVariants) {
  for (const path of ['/runs/query','/api/v1/runs/query']) {
    try {
      const r = await fetch(`${BASE}${path}`, { method:'POST', headers:{'x-api-key':KEY,'Content-Type':'application/json'}, body: JSON.stringify(v.body) })
      const txt = await r.text()
      let summary
      try { const j=JSON.parse(txt); summary = { status:r.status, runs: j?.runs?.length, first: j?.runs?.[0] ? {id:j.runs[0].id, name:j.runs[0].name, trace_id:j.runs[0].trace_id, session:j.runs[0].session, run_type:j.runs[0].run_type} : null } }
      catch { summary = `status=${r.status} nonjson head=${txt.slice(0,150)}` }
      console.log(`${v.name} POST ${path} =>`, JSON.stringify(summary))
    } catch(err){ console.log(`${v.name} POST ${path} => ERROR ${err.message}`) }
  }
}

// Also: GET /api/v1/runs/{id} won't work without id. Try listing recent runs in session via POST query with time filter
const listBody = { session: PROJECT, start_time: new Date(Date.now()-60000).toISOString(), limit: 10, select: ['id','name','trace_id','session','run_type'] }
try {
  const r = await fetch(`${BASE}/runs/query`, { method:'POST', headers:{'x-api-key':KEY,'Content-Type':'application/json'}, body: JSON.stringify(listBody) })
  const j = await r.json()
  console.log('\nLIST RECENT runs/query =>', { status: r.status, count: j?.runs?.length, sample: (j?.runs??[]).slice(0,3).map(x=>({id:x.id,name:x.name,trace_id:x.trace_id,run_type:x.run_type})) })
} catch(err){ console.log('LIST RECENT => ERROR', err.message) }
