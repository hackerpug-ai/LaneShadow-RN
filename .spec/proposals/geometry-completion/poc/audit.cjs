#!/usr/bin/env node
/* Real audit of the curated route catalog from the prod Convex export. */
const fs = require('fs')
const path = require('path')
const polyline = require('/Users/justinrich/Projects/LaneShadow-RN/node_modules/@mapbox/polyline')

const DIR = path.join(__dirname, 'export')
const readJsonl = (t) =>
  fs.readFileSync(path.join(DIR, t, 'documents.jsonl'), 'utf8')
    .split('\n').filter(Boolean).map((l) => JSON.parse(l))

const routes = readJsonl('curated_routes')
const geomRows = readJsonl('curated_route_geometry')

// ---------- side-table geometry decode ----------
const geomByRouteId = new Map()
for (const g of geomRows) {
  let pts = 0, segs = 0
  const prec = g.precision ?? 5
  try {
    if (g.format === 'multipolyline' && Array.isArray(g.segments)) {
      for (const s of g.segments) {
        const d = polyline.decode(s, prec)
        if (d.length >= 2) { pts += d.length; segs++ }
      }
    } else if (g.value) {
      const d = polyline.decode(g.value, prec)
      if (d.length >= 2) { pts = d.length; segs = 1 }
    }
  } catch { /* undecodable */ }
  geomByRouteId.set(g.routeId, { pts, segs, format: g.format })
}

// ---------- helpers ----------
const count = (arr, fn) => arr.reduce((m, x) => { const k = fn(x) ?? '(none)'; m[k] = (m[k] || 0) + 1; return m }, {})
const pct = (n, d) => `${((n / d) * 100).toFixed(1)}%`

const plottable = (r) => {
  const g = geomByRouteId.get(r.routeId)
  return !!g && g.pts >= 2
}

// in-row legacy polyline
const inRowDecodable = (r) => {
  if (!r.routePolyline) return false
  try { return polyline.decode(r.routePolyline, 5).length >= 2 } catch { return false }
}

// ---------- name classification ----------
function classifyName(name) {
  const n = name.trim()
  if (/\bcounty\b/i.test(n) && !/\b(road|rd|route|hwy|highway|line rd)\b/i.test(n)) return 'AREA_COUNTY'
  if (/\b(national forest|national park|state park|wilderness|recreation area|reservoir|lake district)\b/i.test(n) && !/\b(road|rd|byway|highway|hwy|route|loop|run|trail)\b/i.test(n)) return 'AREA_LAND'
  if (/\b(to|thru|through)\b/i.test(n) && /^[A-Z]/.test(n)) return 'A_TO_B'
  if (/\bloop\b/i.test(n)) return 'LOOP'
  if (/\b(road|rd\.?|highway|hwy\.?|route|rte|byway|pass|canyon|grade|pike|turnpike|parkway|pkwy|drive|dr\.?|blvd|boulevard|trail|skyway|crest|ridge|run|gap|hollow|valley rd)\b/i.test(n)) return 'ROAD_NAME'
  if (/\b(SR|US|CA|I)-?\s?\d+/i.test(n)) return 'ROAD_REF'
  return 'OTHER'
}

// ---------- description richness ----------
const TURN_RE = /\b(turn (left|right)|take (a |the )?(left|right)|left (on|onto|at)|right (on|onto|at)|head (north|south|east|west)|exit \d+|continue (on|onto|straight|north|south|east|west)|merge onto|onto (the )?[A-Z0-9]|follow .{0,40} for .{0,15}(miles?|mi\b)|proceed (on|to|north|south|east|west))/i
const START_END_RE = /\b(from [A-Z][\w .']+ to [A-Z]|starts? (at|in|from|near)|ends? (at|in|near)|begins? (at|in|near)|between [A-Z][\w .']+ and [A-Z])/
const REF_RE = /\b((?:I|US|SR|Hwy|Highway|Route|Rte|Rt|CA|FM|CR|TX|WA|OR|NV|AZ|UT|CO|FL|NY|PA|NC|SC|TN|GA|VA|WV|KY|OH|MI|MN|WI|IL|IN|IA|MO|AR|LA|MS|AL|OK|KS|NE|SD|ND|MT|ID|WY|NM|ME|NH|VT|MA|RI|CT|NJ|DE|MD|AK|HI)[- .]?\d{1,4})\b/g
const NAMED_ROAD_RE = /\b[A-Z][a-z]+(?: [A-Z][a-z]+)? (Road|Rd|Boulevard|Blvd|Avenue|Ave|Pass|Canyon|Grade|Pike|Parkway|Pkwy|Skyway|Trail|Turnpike)\b/g

function descRichness(r) {
  const text = `${r.oneLiner || ''} ${r.summary || ''}`.trim()
  const len = text.length
  const refs = (text.match(REF_RE) || []).length
  const named = (text.match(NAMED_ROAD_RE) || []).length
  const roadMentions = refs + named
  const hasTurns = TURN_RE.test(text)
  const hasStartEnd = START_END_RE.test(text)
  let cls
  if (len === 0) cls = 'EMPTY'
  else if (hasTurns && roadMentions >= 2) cls = 'TURN_BY_TURN'
  else if (roadMentions >= 2) cls = 'MULTI_ROAD_REFS'
  else if (hasStartEnd || roadMentions === 1) cls = 'PARTIAL_HINTS'
  else cls = 'PROSE_ONLY'
  return { len, refs, named, hasTurns, hasStartEnd, cls }
}

// ---------- MAIN ROLLUPS ----------
const N = routes.length
console.log(`=== CATALOG: ${N} curated routes; ${geomRows.length} side-table geometry rows ===\n`)

console.log('--- geometryStatus ---')
console.table(count(routes, (r) => r.geometryStatus))
console.log('--- geometrySource ---')
console.table(count(routes, (r) => r.geometrySource))
console.log('--- source ---')
console.table(count(routes, (r) => r.source))

const plot = routes.filter(plottable)
console.log(`\nPLOTTABLE via side table (>=2 decoded pts): ${plot.length} / ${N} = ${pct(plot.length, N)}`)

const statusGen = routes.filter((r) => r.geometryStatus === 'generated')
const genNotPlottable = statusGen.filter((r) => !plottable(r))
console.log(`geometryStatus=generated: ${statusGen.length}; of those NOT actually plottable: ${genNotPlottable.length}`)

// in-row scraped polylines being ignored
const inRow = routes.filter(inRowDecodable)
const inRowNotPlottable = inRow.filter((r) => !plottable(r))
console.log(`\nIn-row legacy routePolyline decodable: ${inRow.length}`)
console.log(`  ...of which NOT plottable via side table (REAL GEOMETRY BEING IGNORED): ${inRowNotPlottable.length}`)
console.table(count(inRowNotPlottable, (r) => r.geometrySource))

// name classification
console.log('\n--- name classification (all routes) ---')
console.table(count(routes, (r) => classifyName(r.name)))
const centroidOnly = routes.filter((r) => !plottable(r))
console.log(`--- name classification (CENTROID-ONLY routes: ${centroidOnly.length}) ---`)
console.table(count(centroidOnly, (r) => classifyName(r.name)))

// description richness for centroid-only
console.log('\n--- description richness (CENTROID-ONLY routes) ---')
console.table(count(centroidOnly, (r) => descRichness(r).cls))

// recoverability: centroid-only, not plottable anywhere
const centroidNoInRow = centroidOnly.filter((r) => !inRowDecodable(r))
console.log(`\nCentroid-only AND no in-row polyline: ${centroidNoInRow.length}`)
console.table(count(centroidNoInRow, (r) => descRichness(r).cls))

// desc length stats
const lens = routes.map((r) => (`${r.oneLiner || ''} ${r.summary || ''}`).trim().length)
const withDesc = lens.filter((l) => l > 50).length
console.log(`\nRoutes with >50 chars of description: ${withDesc} / ${N} = ${pct(withDesc, N)}`)

// duplicates
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim()
const byName = {}
for (const r of routes) { const k = norm(r.name); (byName[k] ||= []).push(r) }
const dupGroups = Object.entries(byName).filter(([, v]) => v.length > 1)
const dupSameState = dupGroups.filter(([, v]) => new Set(v.map((r) => r.state)).size < v.length)
console.log(`\nDuplicate name groups: ${dupGroups.length} (${dupGroups.reduce((a, [, v]) => a + v.length, 0)} rows)`)
console.log(`  same-name+same-state groups: ${dupSameState.length}`)
console.log('  Top dups:', dupGroups.sort((a, b) => b[1].length - a[1].length).slice(0, 8).map(([k, v]) => `${k}(${v.length})`).join(', '))

// scores
const scores = routes.map((r) => r.compositeScore).filter((s) => typeof s === 'number')
const over1 = scores.filter((s) => s > 1).length
const zero = scores.filter((s) => s === 0).length
console.log(`\ncompositeScore: min=${Math.min(...scores)} max=${Math.max(...scores)} >1:${over1} =0:${zero}`)

// length sanity
const lengths = routes.map((r) => r.lengthMiles).filter((s) => typeof s === 'number')
console.log(`lengthMiles: max=${Math.max(...lengths)} >300mi:${lengths.filter((l) => l > 300).length} >1000mi:${lengths.filter((l) => l > 1000).length} <=0:${lengths.filter((l) => l <= 0).length}`)

// ---------- SUGGESTED SURFACE SIMULATION ----------
console.log('\n=== DISCOVERY SURFACE SIMULATION (mirrors discoverCuratedRoutes) ===')
const ranked = [...routes].sort((a, b) => (b.compositeScore ?? 0) - (a.compositeScore ?? 0))
for (const [label, pool] of [
  ['national best', ranked],
  ['California best', ranked.filter((r) => r.state === 'California')],
]) {
  const top200 = pool.slice(0, 200)
  const plottableTop = top200.filter((r) => r.geometryStatus === 'generated' && plottable(r))
  console.log(`${label}: top-200 candidates -> ${plottableTop.length} plottable (${pct(plottableTop.length, Math.min(200, top200.length))}); top10 served:`)
  const served = (plottableTop.length > 0 ? plottableTop : top200).slice(0, 10)
  for (const r of served) {
    const g = geomByRouteId.get(r.routeId)
    console.log(`   ${r.compositeScore?.toFixed(3)} | ${r.name} (${r.state}) | ${classifyName(r.name)} | ${r.lengthMiles}mi | plottable=${plottable(r)} pts=${g?.pts ?? 0} | desc=${descRichness(r).cls}`)
  }
}

// The user's examples
console.log('\n=== USER-CITED EXAMPLES ===')
for (const term of ['alameda', 'riverdale', 'castro valley']) {
  const hits = routes.filter((r) => norm(r.name).includes(term))
  for (const r of hits.slice(0, 4)) {
    const g = geomByRouteId.get(r.routeId)
    console.log(`\n"${r.name}" (${r.state}) source=${r.source} score=${r.compositeScore} len=${r.lengthMiles}mi status=${r.geometryStatus} plottable=${plottable(r)} pts=${g?.pts ?? 0} inRowPoly=${inRowDecodable(r)}`)
    const d = descRichness(r)
    console.log(`   desc[${d.cls}, ${d.len} chars]: ${((r.oneLiner || '') + ' ' + (r.summary || '')).slice(0, 450).replace(/\n/g, ' ')}`)
  }
}

// sample of recoverable centroid routes
console.log('\n=== SAMPLE: centroid-only routes with TURN_BY_TURN / MULTI_ROAD_REFS descriptions ===')
const recoverable = centroidNoInRow.filter((r) => ['TURN_BY_TURN', 'MULTI_ROAD_REFS'].includes(descRichness(r).cls))
for (const r of recoverable.slice(0, 6)) {
  console.log(`\n"${r.name}" (${r.state}) [${r.source}] ${r.lengthMiles}mi score=${r.compositeScore}`)
  console.log(`   ${((r.oneLiner || '') + ' ' + (r.summary || '')).slice(0, 350).replace(/\n/g, ' ')}`)
}
console.log(`\nTOTAL recoverable-from-description (centroid-only, no in-row poly): ${recoverable.length}`)

// dump per-route JSON for downstream use
const out = routes.map((r) => ({
  routeId: r.routeId, name: r.name, state: r.state, source: r.source,
  score: r.compositeScore, lengthMiles: r.lengthMiles, status: r.geometryStatus,
  geometrySource: r.geometrySource, plottable: plottable(r), inRowPoly: inRowDecodable(r),
  nameClass: classifyName(r.name), desc: descRichness(r),
}))
fs.writeFileSync(path.join(__dirname, 'audit-rows.json'), JSON.stringify(out))
console.log('\nWrote audit-rows.json')
