---
stability: FEATURE_SPEC
last_validated: 2026-07-10
prd_version: 1.0.0
scope_posture: full
---

# Scope

**Scope Posture:** Full feature (complete, polished initiative — no sizing reduction).

## In Scope

- Batch, text-first generation of a one-paragraph "why" for every post-drop, plottable
  catalog route (~2.5–3k routes with `geometryStatus === 'generated'`), grounded only in
  each route's structured inputs. *Testable: every eligible route ends a full run in a
  ship-ready, abstained, or failed state — none silently unprocessed.*
- A dedicated `enrichment` model tier in the existing pi-ai indirection resolving to
  **z.ai GLM-5.2** (`Z_AI_API_KEY`), with explicit apiKey wiring and a verified live call.
  *Testable: one real completion against api.z.ai succeeds from a Convex action.*
- Honest handling of thin-grounding routes (~32% with no source prose): attribute-only
  generation or explicit abstention — never invented color. *Testable: thin-grounding
  enrichments contain no source-derived claims; insufficient-fact routes record `abstained`.*
- Automated grounding QA — every factual claim traces to a supplied input fact — as a
  blocking gate, using a cross-provider verifier model. *Testable: a seeded ungrounded claim
  yields `qa_failed` and never reaches the read path.*
- Automated tone + forbidden-content QA (rider voice; no invented businesses, landmarks,
  history, hazards; no ungrounded superlatives) as a blocking gate. *Testable: seeded
  fabrications and hype are rejected with recorded issue codes.*
- The R2 couch-test human gate: ~10 personally-known roads, pass = ≥9 read true AND zero
  fabricated specifics; fail routes back to regeneration/rule-tuning. *Testable: the
  rider-facing "why" cannot ship while the recorded gate state is red.*
- Rider-facing rendering inside the existing `curated-route/[id]` detail screen: a
  "Why ride it" section between Summary and Scores — no new screens or navigation.
  *Testable: the section renders on the existing route; no new route is registered.*
- Honest rider states: absence ("No write-up yet"), error-collapsed-to-absence, provenance
  caption on enriched routes, combined-absence handling when summary is also missing.
  *Testable: each state renders its defined copy; never a blank, spinner, or fabrication.*
- Rider-invisible staleness: stale enrichment keeps serving its last QA-passed text while
  regeneration queues; no rider-facing staleness badge in v1. *Testable: a stale row still
  renders its prior text; no "out of date" UI exists.*
- Lifecycle: staleness detection via inputs content-hash, scoped regeneration
  (stale/failed/new/single-route), idempotent skip of unchanged QA-passed rows.
  *Testable: mutating one route's inputs regenerates only that route.*
- Operator coverage/health report with per-state counts and an R1 verdict, computed from
  live enrichment state. *Testable: report counts match a direct table query.*
- The vision-ready seam as a design constraint only: `groundingFacts` carries an optional
  `visual` block, always absent in v1. *Testable: the schema slot exists; no vision code runs.*

## Out of Scope

- **Street View / satellite vision generation** — [DEFERRED: post-v1] the seam ships, the
  vision pass does not; adding it later bumps `promptVersion` and regenerates via LIFE.
- **Character tags, "best for" line, generated headline rendering & generation** —
  [DEFERRED: v1.1] each structured claim is an independent hallucination surface the QA
  gate must separately ground; v1 ships the paragraph only (schema seams remain).
- **Weather intelligence / weather-window** — [DEFERRED: separate PRD, O2] a different job
  ("is it worth riding *now*") from "why this road is good"; detail keeps existing conditions.
- **Waypoints / ride-loop composition** — [DEFERRED: separate PRD, O3] enrichment describes
  a single curated road, not a composed ride.
- **Personalized "why" / personalization** — [DEFERRED: O4] no usage data exists; the "why"
  is the same grounded paragraph for every rider.
- **Community / user-submitted or user-edited "why"** — [DEFERRED: community pillar] the
  "why" is system-generated and operator-gated.
- **Scoring recalibration** — [DEFERRED: curation-hardening] the "why" renders current
  scores honestly; tuning scores is the Trust track's job.
- **New detail screens or navigation** — [LOCKED OUT] enrichment renders inside the
  existing detail surface only.
- **In-ride / turn-by-turn surfacing** — [LOCKED OUT] navigation always hands off to Maps;
  the "why" is a pre-ride discovery artifact.
- **Rider-facing staleness indicators** — [DEFERRED: post-v1, schema-ready via
  `generatedAt`] staleness is operator-facing in v1.
