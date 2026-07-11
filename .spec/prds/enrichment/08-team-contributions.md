# Team Contributions

PRD authored 2026-07-10 by a planner team; the orchestrator consolidated and resolved
conflicts — no section was authored by the orchestrator alone.

## Phase 1: User Personas (product-manager + frontend-designer)

- 4 personas adapted from `.spec/USER-PROFILES.md`: Touring Terry (Butler-map depth-seeker),
  Weekend Warrior Mike (fast-trust decider), Returning Rider Rachel (cautious-trust rider —
  the human reason for the anti-hallucination bar), and Founder-Operator (the R2 gate actor).
- 4 journeys: couch-evaluation of a suggestion (J1, the core R1 moment), comparing two
  candidate roads (J2), night-before re-read of a saved road (J3), operator
  generation + couch test (J4).

## Phase 2: Architecture (product-manager + convex-planner)

- Live repo verification: `curated_route_enrichments` exists with 0 docs and a **leftover
  web-scraper validator** (fullDescription/history/photos/sources) — repurposed, with the
  consumer blast-radius (`convex/db/curation.ts`) realigned in the same change.
- Pipeline is a structural clone of the proven DATA-011 geometry backfill (data-access
  layer + `'use node'` action + QA action + resumable CLI driver).
- LLM rides the existing `@mariozechner/pi-ai` client + `getAgentModel` indirection; a new
  dedicated `enrichment` tier resolves to **z.ai GLM-5.2** (locked by the founder
  2026-07-10; `Z_AI_API_KEY` verified present in `.env.local`). pi-ai's native `zai`
  provider registry (this version: glm-4.7, glm-5-turbo, glm-5.1, glm-5v-turbo) lacks
  `glm-5.2` → registry-override Model literal or pi-ai bump, verified live at
  implementation. pi-ai's auto env lookup expects `ZAI_API_KEY` → apiKey passed explicitly.
- Cross-provider QA: generation on GLM-5.2 (z.ai), grounding verification on the `low`
  tier (OpenAI) — different models checking each other reduces correlated blind spots.
- Cost model: full 3k-route batch (generation + QA) in the low single-digit dollars.

## Phase 3: UI Infrastructure (convex-planner + frontend-designer)

- **Surface correction found by code-reading:** the R1 target is the full-screen pushed
  route `app/(app)/curated-route/[id].tsx` (`CuratedRouteDetailScreen` — 40% map + 60%
  ScrollView), NOT a bottom sheet. Route Delta = CHANGED (content states), no new routes.
- Placement: new "Why ride it" section between Summary and Scores; `EnrichmentSection`
  pure-presentational component mirroring `ScoreDimensionBarSection`'s architecture.
- Enrichment joins the existing `getCuratedRouteDetail` query (indexed side-lookup) —
  same loading gate, no separate spinner (deliberately NOT the async weather pattern).
- Honest-absence idiom reused a third time ("No write-up yet"); combined-absence rule when
  summary is also missing; provenance caption; length budget 180–260 chars (hard cap 320)
  with defensive `numberOfLines={6}` + measured read-more.

## Phase 4: Test Suite Authoring (product-manager + convex-planner)

- Visible + holdout scenarios per UC in `.spec/scenarios/UC-{GEN,QUAL,WHY,LIFE}-NN/`,
  following the repo's established scenario format (`scope: journey` markers for cross-UC
  arcs, matching the MVP retrofit convention — no separate journeys/ folder).
- UC×journey×tier coverage matrix embedded in
  [10-e2e-testing-criteria.md](./10-e2e-testing-criteria.md) (repo deviation from the
  skill's separate-file default, logged).
- Determinism seam: UI tests assert against seeded enrichment fixture rows; pipeline
  acceptance hits the REAL LLM on a 5–10 route sample against the real dev deployment.

## Conflict resolutions (orchestrator, ratified by founder 2026-07-10)

1. **Rider-invisible staleness in v1** (design seat over PM's visible marker): stale rows
   keep serving last QA-passed text; provenance caption ships instead.
2. **Paragraph-only v1** (design seat): tags/"best for"/generated headline are schema
   seams deferred to v1.1 — each structured claim is an independent hallucination surface.
3. **Single-query join** (design seat, engineering-confirmed): enrichment is precomputed
   pipeline data → joined in `getCuratedRouteDetail`, not fetched async like weather.
4. **Model = z.ai GLM-5.2** (founder directive): dedicated `enrichment` tier; fail-closed
   on provider errors (FIX-001 history), never silent substitution.
