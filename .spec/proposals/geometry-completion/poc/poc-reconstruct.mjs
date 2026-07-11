#!/usr/bin/env node
/**
 * PoC: AI route-geometry reconstruction from catalog descriptions.
 * Pipeline: LLM (Anthropic API) extracts ordered anchors → Google Geocoding →
 * Google Routes API (computeRoutes with intermediates) → length validation →
 * Mapbox static render.
 *
 * REAL SERVICES ONLY: real prod export rows, real Anthropic call, real Google
 * geocode/routes calls, real Mapbox render.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import polylineMod from '/Users/justinrich/Projects/LaneShadow-RN/node_modules/@mapbox/polyline/src/polyline.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY
const GOOGLE_KEY = process.env.GOOGLE_MAPS_API_KEY
const MAPBOX_TOKEN = process.env.MAPBOX_PUBLIC_TOKEN
if (!ANTHROPIC_KEY || !GOOGLE_KEY || !MAPBOX_TOKEN) {
  console.error('Missing keys'); process.exit(1)
}

const readJsonl = (t) =>
  fs.readFileSync(path.join(__dirname, 'export', t, 'documents.jsonl'), 'utf8')
    .split('\n').filter(Boolean).map((l) => JSON.parse(l))
const routes = readJsonl('curated_routes')

const R = 3958.8
const hav = (a, b) => {
  const dLat = (b[0] - a[0]) * Math.PI / 180, dLng = (b[1] - a[1]) * Math.PI / 180
  const la1 = a[0] * Math.PI / 180, la2 = b[0] * Math.PI / 180
  return 2 * R * Math.asin(Math.sqrt(Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2))
}
const pathLen = (pts) => { let s = 0; for (let i = 1; i < pts.length; i++) s += hav(pts[i - 1], pts[i]); return s }

// ---------- Step 1: LLM anchor extraction ----------
async function extractAnchors(route, feedback) {
  const feedbackBlock = feedback
    ? `

PREVIOUS ATTEMPT FAILED VALIDATION — fix it:
${feedback}
Diagnose which anchors are wrong (bad geocode, wrong place, causes detour/backtrack) and emit a corrected anchor list. Prefer plain road-intersection queries over business/POI names. Drop anchors that add ambiguity.`
    : ''
  const prompt = `You reconstruct motorcycle route geometry from ride descriptions.

ROUTE: "${route.name}" in ${route.state}
CLAIMED LENGTH: ${route.lengthMiles} miles
APPROX CENTER: lat ${route.centroidLat}, lng ${route.centroidLng}
DESCRIPTION:
${route.oneLiner || ''}
${route.summary || ''}

Extract an ORDERED list of geocodable anchor points tracing this exact route, start to end.
Rules:
- Use road-intersection queries ("Redwood Rd & Pinehurst Rd, Castro Valley, CA") or "place, city, state" queries a geocoder can resolve.
- One anchor at the start, one at each described turn/junction (so the router is forced onto the described roads), one at the end.
- Always append city/region + state abbreviation to every query.
- If the description says a road "turns into" another, add the transition point as an anchor.
- For loops, the last anchor must return to the first.
- Only use points the description supports. Do not invent scenic detours.

Respond with ONLY a JSON object:
{"anchors":[{"query":"...","why":"..."}],"confidence":"high|medium|low","roadChain":["road1","road2"]}${feedbackBlock}`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-5',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`)
  const data = await res.json()
  const text = data.content.map((c) => c.text ?? '').join('')
  const m = text.match(/\{[\s\S]*\}/)
  if (!m) throw new Error(`No JSON in LLM response: ${text.slice(0, 300)}`)
  return { parsed: JSON.parse(m[0]), usage: data.usage, model: data.model }
}

// ---------- Step 2: geocode ----------
async function geocode(query, bias) {
  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json')
  url.searchParams.set('address', query)
  url.searchParams.set('key', GOOGLE_KEY)
  if (bias) url.searchParams.set('bounds', `${bias.lat - 1.2},${bias.lng - 1.2}|${bias.lat + 1.2},${bias.lng + 1.2}`)
  const res = await fetch(url)
  const data = await res.json()
  if (data.status !== 'OK' || !data.results?.length) return null
  const loc = data.results[0].geometry.location
  return { lat: loc.lat, lng: loc.lng, formatted: data.results[0].formatted_address }
}

// ---------- Step 3: route through anchors ----------
async function computeRoute(coords) {
  const [origin, ...rest] = coords
  const destination = rest.pop()
  const body = {
    origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
    destination: { location: { latLng: { latitude: destination.lat, longitude: destination.lng } } },
    intermediates: rest.map((c) => ({ location: { latLng: { latitude: c.lat, longitude: c.lng } }, via: true })),
    travelMode: 'DRIVE',
    polylineQuality: 'HIGH_QUALITY',
  }
  const res = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_KEY,
      'X-Goog-FieldMask': 'routes.polyline.encodedPolyline,routes.distanceMeters,routes.duration',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Routes API ${res.status}: ${await res.text()}`)
  const data = await res.json()
  if (!data.routes?.length) throw new Error(`No route: ${JSON.stringify(data).slice(0, 300)}`)
  return data.routes[0]
}

// ---------- Step 4: validate + render ----------
function downsample(encoded, maxPts = 250) {
  const pts = polylineMod.decode(encoded, 5)
  if (pts.length <= maxPts) return encoded
  const stride = Math.ceil(pts.length / maxPts)
  const keep = pts.filter((_, i) => i % stride === 0)
  if (keep[keep.length - 1] !== pts[pts.length - 1]) keep.push(pts[pts.length - 1])
  return polylineMod.encode(keep, 5)
}

async function renderStatic(encoded, outPng) {
  // Mapbox static: path overlay via encoded polyline (URL-encoded, downsampled to fit URL limit)
  const overlay = `path-4+f44-0.9(${encodeURIComponent(downsample(encoded))})`
  const url = `https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/static/${overlay}/auto/900x700@2x?access_token=${MAPBOX_TOKEN}&padding=60`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Mapbox static ${res.status}: ${(await res.text()).slice(0, 200)}`)
  fs.writeFileSync(outPng, Buffer.from(await res.arrayBuffer()))
}

async function attempt(route, feedback) {
  const { parsed, usage, model } = await extractAnchors(route, feedback)
  console.log(`LLM (${model}) extracted ${parsed.anchors.length} anchors, confidence=${parsed.confidence}, tokens in/out=${usage.input_tokens}/${usage.output_tokens}`)
  parsed.anchors.forEach((a, i) => console.log(`  ${i + 1}. ${a.query}`))

  const bias = { lat: route.centroidLat, lng: route.centroidLng }
  const coords = []
  const geocodeLog = []
  for (const a of parsed.anchors) {
    const g = await geocode(a.query, bias)
    if (!g) { console.log(`  !! geocode MISS: ${a.query}`); geocodeLog.push(`MISS: ${a.query}`); continue }
    const d = hav([bias.lat, bias.lng], [g.lat, g.lng])
    if (d > 150) { console.log(`  !! geocode OFF-REGION (${d.toFixed(0)}mi): ${a.query} -> ${g.formatted}`); geocodeLog.push(`OFF-REGION ${d.toFixed(0)}mi: "${a.query}" -> ${g.formatted}`); continue }
    geocodeLog.push(`OK (${d.toFixed(1)}mi from centroid): "${a.query}" -> ${g.formatted} (${g.lat.toFixed(4)},${g.lng.toFixed(4)})`)
    coords.push(g)
  }
  console.log(`Geocoded ${coords.length}/${parsed.anchors.length} anchors`)
  if (coords.length < 2) throw new Error('not enough anchors')

  const r = await computeRoute(coords)
  const decoded = polylineMod.decode(r.polyline.encodedPolyline, 5)
  const lenMi = r.distanceMeters / 1609.34
  const ratio = route.lengthMiles > 0 ? lenMi / route.lengthMiles : null
  const verdict = ratio !== null && ratio >= 0.6 && ratio <= 1.6 ? 'PASS' : 'REVIEW'
  console.log(`Routed: ${lenMi.toFixed(1)}mi vs claimed ${route.lengthMiles}mi (ratio ${ratio?.toFixed(2)}) — ${verdict}; ${decoded.length} pts`)
  return { parsed, usage, coords, geocodeLog, r, decoded, lenMi, ratio, verdict }
}

async function reconstruct(routeId) {
  const route = routes.find((r) => r.routeId === routeId)
  if (!route) throw new Error(`route not found: ${routeId}`)
  console.log(`\n=== ${route.name} (${route.state}) — claimed ${route.lengthMiles}mi ===`)

  const t0 = Date.now()
  let a = await attempt(route, null)
  let attempts = 1

  if (a.verdict !== 'PASS') {
    console.log(`\n-- refinement round: feeding failure evidence back to LLM --`)
    const feedback = `Routed length came out ${a.lenMi.toFixed(1)} miles but the ride is claimed to be ${route.lengthMiles} miles.
Geocoding results were:
${a.geocodeLog.join('\n')}`
    const b = await attempt(route, feedback)
    attempts = 2
    // keep the better of the two
    if (b.ratio !== null && Math.abs(Math.log(b.ratio)) < Math.abs(Math.log(a.ratio ?? 100))) a = b
  }

  console.log(`FINAL: ${a.verdict} after ${attempts} attempt(s); ${((Date.now() - t0) / 1000).toFixed(1)}s total`)

  const slug = routeId.replace(/[^a-z0-9]+/gi, '-')
  const png = path.join(__dirname, `poc-${slug}.png`)
  await renderStatic(a.r.polyline.encodedPolyline, png)
  console.log(`Rendered: ${png}`)

  const out = {
    routeId, name: route.name, state: route.state,
    claimedMiles: route.lengthMiles, routedMiles: +a.lenMi.toFixed(2), ratio: +(a.ratio ?? 0).toFixed(3),
    verdict: a.verdict, attempts, anchors: a.parsed.anchors, geocoded: a.coords, confidence: a.parsed.confidence,
    encodedPolyline: a.r.polyline.encodedPolyline, points: a.decoded.length,
    elapsedSec: +((Date.now() - t0) / 1000).toFixed(1),
  }
  fs.writeFileSync(path.join(__dirname, `poc-${slug}.json`), JSON.stringify(out, null, 2))
  return out
}

const ids = process.argv.slice(2)
for (const id of ids) {
  try { await reconstruct(id) } catch (e) { console.error(`FAILED ${id}: ${e.message}`) }
}
