---
title: "Ultra-Decomposition: Breaking Down Failing Micro-Tasks"
date: "2026-04-09"
category: "research"
tags: [swarm, decomposition, micro-tasks, qwen, task-analysis]
---

# Ultra-Decomposition: Can We Break Down Failing Tasks Further?

## Executive Summary

**Maybe, but with diminishing returns.** Breaking down failing tasks further reveals that **creative reasoning cannot be decomposed away**. However, some sub-components might be extractable.

## Analysis of Failing Tasks

### Task 1: Scenic Highlights (0% validity)

**Current prompt:** "Generate 3-5 short phrases highlighting scenic features"

**What makes this hard:**
1. Requires understanding what's scenic about the route
2. Needs geographic knowledge of the area
3. Must generate evocative language
4. Demands world knowledge (landmarks, features)

**Potential decompositions:**

#### Option A: Extract Feature Types
```typescript
// Sub-task 1a: Identify feature categories (deterministic)
const featureTypes = identifyFeatureTypes({
  route: "SF to Point Reyes via coast"
})
// Returns: ["coastal", "highway", "bridge", "forest"]

// Sub-task 1b: Map to templates (deterministic)
const templates = mapToTemplates(featureTypes)
// Returns: ["Coastal views", "Highway riding", "Bridge crossing", "Forest roads"]
```

**Pros:** Fully deterministic, no LLM needed
**Cons:** Generic, not evocative, loses local context

#### Option B: Extract from Context
```typescript
// Sub-task 1a: Extract waypoints (deterministic)
const waypoints = extractWaypoints(route)
// Returns: ["San Francisco", "Sausalito", "Stinson Beach", "Point Reyes"]

// Sub-task 1b: Query knowledge base for each waypoint
const features = await Promise.all(
  waypoints.map(w => queryKnowledgeBase(w, "scenic_features"))
)
// Returns: ["Golden Gate Bridge", "Muir Woods", "Stinson Beach", "Point Reyes National Seashore"]
```

**Pros:** Accurate, local-specific
**Cons:** Requires external knowledge base, not generative

**Verdict:** Scenic highlights should be **template-based** or **knowledge-base retrieval**, not LLM generation.

---

### Task 2: Route Labels (Quality failure)

**Current prompt:** "Generate a punchy, memorable name (≤8 words)"

**What makes this hard:**
1. Requires creative synthesis
2. Needs to evoke emotion/imagery
3. Must be brandable/marketable
4. Demands linguistic creativity

**Potential decompositions:**

#### Option A: Template-Based Generation
```typescript
// Sub-task 2a: Identify route characteristics (deterministic)
const characteristics = analyzeRoute({
  waypoints: ["SF", "Sausalito", "Stinson Beach", "Point Reyes"],
  scenicBias: "coastal"
})
// Returns: { hasCoast: true, hasMountains: false, hasCities: true }

// Sub-task 2b: Select template (deterministic)
const template = selectTemplate(characteristics)
// Returns: "Pacific {noun} {verb}"

// Sub-task 2c: Fill template (deterministic)
const label = fillTemplate(template, waypoints)
// Returns: "Pacific Coast Journey"
```

**Pros:** Predictable, fast, no LLM needed
**Cons:** Not creative, repetitive across routes

#### Option B: Hybrid Approach
```typescript
// Sub-task 2a: Generate candidates with Qwen (fast, cheap)
const candidates = await generateCandidatesQwen({
  waypoints: ["SF", "Sausalito", "Stinson Beach", "Point Reyes"],
  count: 10
})
// Returns: ["SF Coastal Ride", "Bay Area Route", ...]

// Sub-task 2b: Rank with Haiku (quality filter)
const ranked = await rankLabelsHaiku({
  candidates,
  criteria: ["evocative", "memorable", "punchy"]
})
// Returns: ["SF Coastal Ride" (ranked 1), ...]
```

**Pros:** Leverages Qwen speed, Haiku quality
**Cons:** Still needs Haiku for final selection

**Verdict:** Route labels should be **template-based** or use **candidate generation + ranking**.

---

### Task 3: Route Rationales (Hallucination failure)

**Current prompt:** "Explain why this route is scenic (1-2 sentences)"

**What makes this hard:**
1. Requires geographic accuracy
2. Must reason about route characteristics
3. Needs to synthesize multiple waypoints
4. Demands world knowledge

**Potential decompositions:**

#### Option A: Fact Extraction + Template
```typescript
// Sub-task 3a: Extract route facts (deterministic)
const facts = extractRouteFacts({
  waypoints: ["SF", "Sausalito", "Stinson Beach", "Point Reyes"],
  geometry: routeGeometry
})
// Returns: { followsCoast: true, hasElevationGain: true, passesThrough: ["Sausalito"] }

// Sub-task 3b: Select template (deterministic)
const template = selectTemplate(facts)
// Returns: "This route follows the {feature} through {waypoints}, offering {views}."

// Sub-task 3c: Fill template (deterministic)
const rationale = fillTemplate(template, facts)
// Returns: "This route follows the Pacific coast through Sausalito and Stinson Beach, offering ocean views."
```

**Pros:** Accurate, no hallucinations
**Cons:** Generic, not evocative

#### Option B: Sentence-by-Sentence Generation
```typescript
// Sub-task 3a: Generate opening (Qwen)
const opening = await generateOpeningQwen({
  route: "SF to Point Reyes",
  characteristic: "coastal"
})
// Returns: "This coastal route offers..."

// Sub-task 3b: Generate specifics (Haiku - geographic accuracy)
const specifics = await generateSpecificsHaiku({
  waypoints: ["Sausalito", "Stinson Beach", "Point Reyes"],
  focus: "landmarks"
})
// Returns: "...highlighting the dramatic cliffs of Point Reyes and the vibrant waters of Sausalito."

// Sub-task 3c: Combine (deterministic)
const rationale = `${opening} ${specifics}`
```

**Pros:** Uses Qwen for structure, Haiku for accuracy
**Cons:** Complex orchestration, still needs Haiku

**Verdict:** Route rationales should be **template-based** or **fact extraction + templating**.

---

## Proposed Ultra-Decomposed Architecture

### Current: 1 Haiku call
```typescript
const enrichment = await enrichRoute({ routes })
```

### Proposed: Template + Hybrid + Qwen
```typescript
async function enrichRouteUltraDecomposed({ routes }) {
  // 1. Scenic Highlights: Template-based (no LLM)
  const highlights = routes.map(route =>
    generateHighlightsFromTemplates({
      waypoints: route.waypoints,
      templates: SCENIC_TEMPLATES
    })
  )

  // 2. Route Labels: Template-based (no LLM)
  const labels = routes.map(route =>
    generateLabelFromTemplates({
      characteristics: analyzeRoute(route),
      templates: LABEL_TEMPLATES
    })
  )

  // 3. Route Rationales: Template-based (no LLM)
  const rationales = routes.map(route =>
    generateRationaleFromTemplates({
      facts: extractRouteFacts(route),
      templates: RATIONALE_TEMPLATES
    })
  )

  // 4. Leg Labels: Qwen3.5 (validated)
  const legLabels = await generateLegLabelsQwen({ routes })

  return { labels, rationales, highlights, legLabels }
}
```

**Result:** 100% offline capability (if templates are local), but **quality trade-off**.

---

## Template-Based Approach

### Scenic Highlight Templates

```typescript
const SCENIC_TEMPLATES = {
  coastal: [
    "Ocean views",
    "Coastal cliffs",
    "Beach scenery",
    "Pacific vistas",
    "Marine atmosphere"
  ],
  mountain: [
    "Mountain vistas",
    "Elevation gains",
    "Alpine scenery",
    "Forest roads",
    "Summit views"
  ],
  urban: [
    "City skyline",
    "Urban riding",
    "Street scenery",
    "Architecture",
    "City lights"
  ]
}
```

### Route Label Templates

```typescript
const LABEL_TEMPLATES = {
  coastal: [
    "Pacific {noun}",
    "{location} Coastal Ride",
    "{start} to {end} Scenic",
    "Coastal {noun}"
  ],
  mountain: [
    "{location} Mountain Run",
    "Alpine Adventure",
    "{mountain} Madness",
    "Peak to Peak"
  ]
}
```

### Route Rationale Templates

```typescript
const RATIONALE_TEMPLATES = {
  coastal: "This route follows the {feature} through {waypoints}, offering {views}.",
  mountain: "This route climbs through {terrain} past {landmarks}, with {characteristics}.",
  urban: "This route traverses {area} via {roads}, showcasing {features}."
}
```

---

## Quality Comparison: Template vs LLM

### Scenic Highlights

| Approach | Example | Quality |
|----------|---------|---------|
| **Template** | "Ocean views", "Coastal cliffs" | Generic but accurate |
| **Haiku** | "Golden Gate Views", "Coastal Cliff Rides" | Specific and evocative |
| **Qwen** | `[]` | Complete failure |

### Route Labels

| Approach | Example | Quality |
|----------|---------|---------|
| **Template** | "Pacific Coast Journey" | Generic but usable |
| **Haiku** | "Coastal Curve Chronicles" | Creative and brandable |
| **Qwen** | "San Francisco to Point Reyes" | Boring, repeats input |

### Route Rationales

| Approach | Example | Quality |
|----------|---------|---------|
| **Template** | "This route follows the coast through Sausalito, offering ocean views." | Accurate but generic |
| **Haiku** | "The route highlights the dramatic Pacific coastline with its scenic drive from Stinson Beach along Highway 1..." | Evocative and specific |
| **Qwen** | "...breathtaking coastal journey... dramatic cliffs... vibrant turquoise waters..." | Verbose, some hallucinations |

---

## Recommendation

### Option 1: Template-First with Haiku Fallback

```typescript
async function enrichRouteTemplateFirst({ routes }) {
  try {
    // Try template-based (fast, free, offline)
    return enrichWithTemplates({ routes })
  } catch (error) {
    // Fallback to Haiku for quality
    return enrichRouteHaiku({ routes })
  }
}
```

**Pros:**
- 100% offline capability
- Zero cost
- Fast execution
- Graceful degradation

**Cons:**
- Generic quality
- Repetitive across routes
- Not brandable

### Option 2: Hybrid (Current Recommended)

```typescript
async function enrichRouteHybrid({ routes }) {
  const [labels, rationales, highlights, legLabels] = await Promise.all([
    enrichWithHaiku({ routes, task: 'labels' }),        // Best quality
    enrichWithHaiku({ routes, task: 'rationales' }),     // Most accurate
    enrichWithHaiku({ routes, task: 'highlights' }),     // Only working option
    enrichWithQwen({ routes, task: 'legLabels' }),       // Validated
  ])

  return { labels, rationales, highlights, legLabels }
}
```

**Pros:**
- Best quality
- Optimized cost (only leg labels on Qwen)
- Proven approach

**Cons:**
- 12.5% cost savings (not 100%)
- 25% offline capability (not 100%)

---

## Conclusion

**Ultra-decomposition reveals a fundamental truth:**

> **Creative reasoning cannot be decomposed into deterministic sub-tasks.**

The failing tasks (labels, rationales, highlights) all require **creative synthesis** that small models cannot provide, no matter how much we break them down.

**Our options:**

1. **Accept generic quality** (template-based) - 100% offline, 0% cost
2. **Pay for quality** (Haiku) - 25% offline, 12.5% cost savings
3. **Hybrid approach** (current recommendation) - Balance of both

**Reality check:** We cannot decompose our way to 100% offline + 100% quality + 0% cost. Something has to give.

**Final recommendation:** Stick with the hybrid approach. Use Qwen for leg labels (validated), Haiku for everything else (quality required).

## Next Steps

1. **Build template system** for offline fallback
2. **Implement hybrid architecture** with graceful degradation
3. **A/B test** template vs Haiku quality
4. **Monitor user feedback** on quality vs cost trade-offs
