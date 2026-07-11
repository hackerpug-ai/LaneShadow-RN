#!/usr/bin/env node
/* Geometry QUALITY audit: decoded path length vs claimed lengthMiles, density, top-200 quality. */
const fs = require('fs')
const path = require('path')
const polyline = require('/Users/justinrich/Projects/LaneShadow-RN/node_modules/@mapbox/polyline')

const DIR = path.join(__dirname, 'export')
const readJsonl = (t) =>
  fs.readFileSync(path.join(DIR, t, 'documents.jsonl'), 'utf8')
    .split('\n').filter(Boolean).map((l) => JSON.parse(l))

const routes = readJsonl('curated_routes')
const geomRows = readJsonl('curated_route_geometry')

const R = 3958.8 // earth radius miles
const hav = (a, b) => {
  const dLat = (b[0] - a[0]) * Math.PI / 180
  const dLng = (b[1] - a[1]) * Math.PI / 180
  const la1 = a[0] * Math.PI / 180, la2 = b[0] * Math.PI / 180
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}
const pathLen = (pts) => { let s = 0; for (let i = 1; i < pts.length; i++) s += hav(pts[i - 1], pts[i]); return s }

const geomQ = new Map()
for (const g of geomRows) {
  const prec = g.precision ?? 5
  let pts = 0, lenMi = 0, segs = 0
  try {
    const segments = g.format === 'multipolyline' && Array.isArray(g.segments) ? g.segments : (g.value ? [g.value] : [])
    for (const s of segments) {
      const d = polyline.decode(s, prec)
      if (d.length >= 2) { pts += d.length; lenMi += pathLen(d); segs++ }
    }
  } catch { }
  geomQ.set(g.routeId, { pts, lenMi, segs })
}

function quality(r) {
  const g = geomQ.get(r.routeId)
  if (!g || g.pts < 2) return 'NO_GEOM'
  const claimed = r.lengthMiles
  const ratio = claimed > 0 ? g.lenMi / claimed : null
  const ptsPerMile = g.lenMi > 0 ? g.pts / g.lenMi : 0
  if (g.pts <= 4 || ptsPerMile < 1) return 'DEGENERATE'          // straight-line junk
  if (ratio !== null && (ratio < 0.5 || ratio > 2.5)) return 'LENGTH_MISMATCH'
  return 'GOOD'
}

const N = routes.length
const buckets = {}
for (const r of routes) { const q = quality(r); (buckets[q] ||= []).push(r) }
console.log('=== GEOMETRY QUALITY (all routes) ===')
for (const [k, v] of Object.entries(buckets)) console.log(`${k}: ${v.length} (${(v.length / N * 100).toFixed(1)}%)`)

console.log('\nGEOMETRY QUALITY among geometryStatus=generated:')
const gen = routes.filter((r) => r.geometryStatus === 'generated')
const genB = {}
for (const r of gen) { const q = quality(r); genB[q] = (genB[q] || 0) + 1 }
console.log(genB, `of ${gen.length}`)

// quality by geometrySource
console.log('\nquality x geometrySource (generated only):')
const bySrc = {}
for (const r of gen) {
  const k = r.geometrySource || '(none)'
  ;(bySrc[k] ||= { GOOD: 0, DEGENERATE: 0, LENGTH_MISMATCH: 0, NO_GEOM: 0 })[quality(r)]++
}
console.table(bySrc)

// TOP-200 national by score: true quality
const ranked = [...routes].sort((a, b) => (b.compositeScore ?? 0) - (a.compositeScore ?? 0))
for (const [label, pool] of [['NATIONAL', ranked], ['CALIFORNIA', ranked.filter((r) => r.state === 'California')]]) {
  const top200 = pool.slice(0, 200)
  const q = {}
  for (const r of top200) { const k = quality(r); q[k] = (q[k] || 0) + 1 }
  console.log(`\nTOP-200 ${label} by compositeScore — quality:`, q)
  // what the app actually serves: first 10 with status=generated&pts>=2 (its current filter)
  const served = top200.filter((r) => r.geometryStatus === 'generated' && (geomQ.get(r.routeId)?.pts ?? 0) >= 2).slice(0, 10)
  const servedQ = {}
  for (const r of served) { const k = quality(r); servedQ[k] = (servedQ[k] || 0) + 1 }
  console.log(`  first-10 actually SERVED quality:`, servedQ)
}

// FHWA junk: freeway-segment names
const fhwa = routes.filter((r) => r.source === 'fhwa')
const fhwaSeg = fhwa.filter((r) => /--/.test(r.name) || /^(Route|I-|SR |US |Interstate)\s?\d+/i.test(r.name))
console.log(`\nFHWA entries: ${fhwa.length}; of which highway-inventory-segment names (e.g. "Route 680--Alameda County"): ${fhwaSeg.length}`)
const fhwaEmpty = fhwa.filter((r) => !((r.oneLiner || '') + (r.summary || '')).trim())
console.log(`FHWA with EMPTY description: ${fhwaEmpty.length}`)

// score scale by source
console.log('\ncompositeScore scale sanity by source:')
const srcScore = {}
for (const r of routes) {
  const k = r.source
  const s = (srcScore[k] ||= { n: 0, over1: 0, min: Infinity, max: -Infinity })
  s.n++; if (r.compositeScore > 1) s.over1++
  s.min = Math.min(s.min, r.compositeScore); s.max = Math.max(s.max, r.compositeScore)
}
console.table(srcScore)

// empty/whitespace descriptions overall
const emptyDesc = routes.filter((r) => !((r.oneLiner || '') + (r.summary || '')).trim())
console.log(`\nRoutes with EMPTY description: ${emptyDesc.length} (${(emptyDesc.length / N * 100).toFixed(1)}%)`)
console.log('empty-desc by source:', Object.entries(emptyDesc.reduce((m, r) => { m[r.source] = (m[r.source] || 0) + 1; return m }, {})))

// The full "rider-ready" bar: GOOD geometry + non-empty desc + sane length + sane score + not an area/freeway-segment name
const AREA_RE = /\bcounty\b/i
const riderReady = routes.filter((r) =>
  quality(r) === 'GOOD' &&
  ((r.oneLiner || '') + (r.summary || '')).trim().length > 0 &&
  r.lengthMiles > 3 && r.lengthMiles < 500 &&
  r.compositeScore > 0 && r.compositeScore <= 1 &&
  !AREA_RE.test(r.name) && !/--/.test(r.name))
console.log(`\n=== RIDER-READY (good geom + desc + sane length/score + real ride name): ${riderReady.length} / ${N} = ${(riderReady.length / N * 100).toFixed(1)}% ===`)

// how many centroid/degenerate routes could be FIXED by each lever
const polyInRow = (r) => { try { return !!r.routePolyline && polyline.decode(r.routePolyline, 5).length >= 2 } catch { return false } }
const broken = routes.filter((r) => ['NO_GEOM', 'DEGENERATE', 'LENGTH_MISMATCH'].includes(quality(r)))
const fixByInRow = broken.filter(polyInRow)
console.log(`\nBROKEN-GEOMETRY routes: ${broken.length}`)
console.log(`  lever 1 — in-row scraped polyline exists: ${fixByInRow.length}`)
const TURN_RE = /\b(turn (left|right)|take (a |the )?(left|right)|left (on|onto|at)|right (on|onto|at)|head (north|south|east|west)|exit \d+|continue (on|onto|straight)|merge onto|follow .{0,40} for .{0,15}(miles?|mi\b))/i
const remaining = broken.filter((r) => !polyInRow(r))
const fixByDesc = remaining.filter((r) => TURN_RE.test(`${r.oneLiner || ''} ${r.summary || ''}`))
console.log(`  lever 2 — description has turn-by-turn (LLM-reconstructable): ${fixByDesc.length}`)
const remaining2 = remaining.filter((r) => !TURN_RE.test(`${r.oneLiner || ''} ${r.summary || ''}`))
const ROADISH = /\b(road|rd\.?|highway|hwy\.?|route|rte|byway|pass|canyon|grade|pike|turnpike|parkway|pkwy|drive|dr\.?|blvd|skyway|trail)\b/i
const fixByName = remaining2.filter((r) => ROADISH.test(r.name) || / to /i.test(r.name))
console.log(`  lever 3 — name is geocodable road / A-to-B: ${fixByName.length}`)
console.log(`  unfixable without new source: ${remaining2.length - fixByName.length}`)
