// Probe LangSmith trace retrieval paths with correct auth (x-api-key).
// Export a real trace, then probe GET retrieval options.
import { readFileSync } from 'node:fs'

function parseEnv() {
  const txt = readFileSync('.env.local', 'utf8')
  const env = {}
  for (const line of txt.split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.*)$/)
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
  return env
}

const env = parseEnv()
const KEY = env.LANGSMITH_API_KEY
const PROJECT = env.LANGSMITH_PROJECT ?? 'LaneShadowDev'
const BASE = 'https://api.smith.langchain.com'

const traceId = 'abcdef0123456789abcdef0123456789'.slice(0,32)
// pad to 32
const tid = (traceId + '00000000000000000000000000000000').slice(0,32)
const spanId = ('fedcba9876543210' + '00000000').slice(0,16)
const nowNs = String(Date.now() * 1_000_000)

const payload = {
  resourceSpans: [{
    resource: { attributes: [{ key: 'service.name', value: { stringValue: 'probe-retrieval' } }] },
    scopeSpans: [{
      scope: { name: 'probe' },
      spans: [
        { traceId: tid, spanId, name: 'root', kind: 0, startTimeUnixNano: nowNs, endTimeUnixNano: nowNs, attributes: [{ key: 'mastra.span.type', value: { stringValue: 'root' } }, { key: 'lsiproject', value: { stringValue: PROJECT } }], status: { code: 1 } },
      ],
    }],
  }],
}

console.log('TRACE_ID', tid)
// 1. Export
const expResp = await fetch(`${BASE}/otel/v1/traces`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-api-key': KEY, 'x-langsmith-project': PROJECT },
  body: JSON.stringify(payload),
})
console.log('EXPORT status', expResp.status, await expResp.text())

// 2. Wait for indexing
await new Promise(r => setTimeout(r, 4000))

// 3. Probe retrieval paths
const paths = [
  { name: 'GET /otel/v1/traces/{tid}', url: `${BASE}/otel/v1/traces/${tid}`, headers: { 'x-api-key': KEY, 'x-langsmith-project': PROJECT } },
  { name: 'GET /runs?session=PROJECT (list)', url: `${BASE}/runs?session=${encodeURIComponent(PROJECT)}&limit=5`, headers: { 'x-api-key': KEY } },
  { name: 'GET /runs?trace=tid', url: `${BASE}/runs?trace=${tid}&limit=5`, headers: { 'x-api-key': KEY } },
  { name: 'GET /api/v1/sessions', url: `${BASE}/api/v1/sessions?limit=5`, headers: { 'x-api-key': KEY } },
]

for (const p of paths) {
  try {
    const r = await fetch(p.url, { method: 'GET', headers: p.headers })
    const body = await r.text()
    let summary = body.slice(0, 200)
    try {
      const parsed = JSON.parse(body)
      summary = JSON.stringify({ status: r.status, keys: Object.keys(parsed), isArray: Array.isArray(parsed), len: Array.isArray(parsed) ? parsed.length : (parsed?.runs?.length ?? parsed?.spans?.length ?? 'n/a'), sample: Array.isArray(parsed) ? parsed[0] : parsed })
    } catch { summary = `status=${r.status} non-json bodyLen=${body.length} head=${body.slice(0,100)}` }
    console.log(`\n${p.name} => ${summary}`)
  } catch (err) {
    console.log(`\n${p.name} => ERROR ${err.message}`)
  }
}
