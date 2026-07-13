// Probe which auth header LangSmith OTEL endpoint accepts.
// Sends a minimal valid OTLP/JSON payload with different header variants.
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
const URL = 'https://api.smith.langchain.com/otel/v1/traces'

// Minimal valid OTLP/JSON ResourceSpans payload with ONE span
const traceId = '0123456789abcdef0123456789abcdef'
const spanId = '0123456789abcdef'
const nowNs = String(Date.now() * 1_000_000)
const payload = {
  resourceSpans: [{
    resource: { attributes: [{ key: 'service.name', value: { stringValue: 'probe' } }] },
    scopeSpans: [{
      scope: { name: 'probe' },
      spans: [{
        traceId, spanId, name: 'probe-span', kind: 0,
        startTimeUnixNano: nowNs, endTimeUnixNano: nowNs,
        attributes: [{ key: 'probe', value: { stringValue: 'auth-header-probe' } }],
        status: { code: 1 },
      }],
    }],
  }],
}

const variants = [
  { name: 'A: x-api-key + x-langsmith-project', headers: { 'Content-Type': 'application/json', 'x-api-key': KEY, 'x-langsmith-project': PROJECT } },
  { name: 'B: x-langsmith-api-key + x-langsmith-project (current)', headers: { 'Content-Type': 'application/json', 'x-langsmith-api-key': KEY, 'x-langsmith-project': PROJECT } },
  { name: 'C: Authorization Bearer + x-langsmith-project', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${KEY}`, 'x-langsmith-project': PROJECT } },
  { name: 'D: x-api-key only (no project)', headers: { 'Content-Type': 'application/json', 'x-api-key': KEY } },
]

for (const v of variants) {
  try {
    const resp = await fetch(URL, { method: 'POST', headers: v.headers, body: JSON.stringify(payload) })
    const body = await resp.text()
    console.log(`${v.name} => status=${resp.status} bodyLen=${body.length} bodyHead=${body.slice(0, 120)}`)
  } catch (err) {
    console.log(`${v.name} => ERROR ${err.message}`)
  }
}
