---
stability: FEATURE_SPEC
last_validated: 2026-07-11
prd_version: 3.1.0
scope_posture: full
---

# Scope

Scope Posture: **Full feature** (default — complete, polished initiative).

## In Scope

- **Editorial score-scale normalization**: divide the ~103 editorial rows scored 72–90 by 100
  at rest (stored values, not read-path patches). *Testable: no `curated_routes` row carries
  a composite score > 1.0.*
- **Duplicate-group merge**: collapse the ~50 duplicate name groups (~106 rows; Cherohala
  Skyway ×4, Skyline Drive ×4) to one canonical row each via a reversible `duplicateOf` flag.
  *Testable: a search for "Cherohala Skyway" returns exactly one row.*
- **Length quarantine**: flag the ~64 rows at ≤0 mi and ~41 rows over 1,000 mi (max
  710,430 mi) so a nonsensical length never reaches a rider; recovered geometry's measured
  length clears or corrects the quarantine. *Testable: no rider-ready row reports length ≤0
  or >1,000 mi.*
- **State-string normalization**: canonicalize dirty state values (`New-York`,
  `Alabama / Mississippi / Tennessee`) preserving multi-state routes as ordered sets.
  *Testable: idempotent pass; region checks treat variants identically.*
- **Test/seed-row cleanup** (FOUNDER-BAR T2): identify rows like `Test Route CO-04` and
  quarantine them from every surface. *Testable: no test-named row is rider-ready.*
- **Rescue waterfall over all ~4,050 broken-geometry routes** in lever order — promote
  (~1,752 in-row scraped polylines, $0), AI-reconstruct (~948 turn-by-turn descriptions),
  re-route (~1,076 name/endpoint routes) — with provenance recorded per line. *Testable:
  every broken route ends in exactly one terminal state (recovered / review /
  retirement-eligible); none silently unprocessed.*
- **Resumable batch orchestration** within the ~$0.07/route envelope. *Testable: a killed
  and restarted batch reprocesses zero already-PASSed routes.*
- **One deterministic geometry gate for ALL geometry going forward**: ratio ∈ [0.6, 1.6],
  ≥2 anchors each ≤150 mi from centroid, degenerate check (>4 pts ∧ ≥1 pt/mi). *Testable: a
  seeded out-of-band or degenerate line is rejected and never stored as `generated`.*
- **Bounded LLM repair round**: ≤2 attempts with geocode-log + length feedback; still-failing
  routes go to REVIEW, not the read path. *Testable: attempt count never exceeds 2; a
  post-budget failure is queued, not served.*
- **LLM ride-worthiness classifier over the whole catalog** (including FHWA freeway rows),
  stored as evidence feeding `riderReady`. *Testable: a plottable freeway segment classified
  `not_a_ride` is withheld from rider-ready.*
- **REVIEW queue + founder dispositions** (accept / retry / retire), audit-recorded.
  *Testable: every gate failure after budget appears in the queue with its failure reason.*
- **Founder couch-sample gate (~25 routes) before the full batch**. *Testable: the full batch
  cannot commit while the couch verdict is unrecorded or failed.*
- **Retirement gate**: retirement-eligible only after all levers fail; explicit founder
  confirmation; reversible; record preserved. *Testable: no route retired that a lever or
  classifier could still rescue; `unretire` restores.*
- **Stored `riderReady` flag** composed from gate-passed geometry, real ride name, sane 0–1
  score, sane length, positive ride-worthiness, not retired, not duplicate-shadow.
  *Testable: flipping any one input flips the stored flag.*
- **Hard gate on every suggestion surface**: discovery agent tool, browse queries (all
  `listCuratedRoutes` modes), and carousel serve ONLY rider-ready; the centroid fallback in
  `discoverCuratedRoutes` is removed. *Testable: no surface ever returns a non-rider-ready or
  centroid-only suggestion.*
- **Honest thin-region absence**, including the fallback-to-national case: distant top-rated
  results are labeled as such (never presented as nearby), and the fabricated `0mi` distance
  label is fixed. *Testable: a thin region yields an honest message; no pill shows a distance
  the data doesn't contain.*
- **Detail-view provenance caption** for `ai_reconstructed` and `name_routed` lines (calm,
  non-warning); `scraped_promoted` and pre-existing lines stay caption-silent. *Testable:
  caption text matches the stored provenance value.*
- **Saved-routes reachability guarantee**: a rider's saved/bookmarked curated routes are
  never retroactively hidden by the gate; un-recovered ones render the existing honest
  "Approximate location" state. *Testable: a saved non-rider-ready route still resolves to
  detail.*
- **Coverage reporting + realized-yield acceptance gate**: per-lever yields, gate PASS %,
  rider-ready counts by state; the batch is accepted on its *realized* rider-ready count and
  per-lever PASS rates against the expected-yield table (**no committed target number** — the
  4,300–4,700 figure is an unvalidated projection), and a far-below-projection lever escalates
  to the founder. *Testable: a low-yield batch does not read as complete; report counts
  reconcile with table queries.*
- **Founder-region coverage gate (the Saturday test)**: after the batch, on the real catalog
  with no seeding, the founder's home region (SLC/Ogden) returns a threshold count of
  rider-ready routes that browse → tap → plot → save end to end. *Testable: the previous
  catalog's near-Ogden failure (3 routes ≤30 mi, 0 plottable) is re-checked post-recovery on
  real data, not on a seeded fixture.*
- **Mastra rebuild of the conversation layer**: one `@mastra/core` agent loop (embedded in
  the existing Convex `'use node'` actions) replaces the orchestrator dispatch and the regex
  discovery shim; the deterministic routing pipeline is preserved as agent tools; a new
  Sonnet-class `orchestrator` model tier via the existing tier map. *Testable:
  `buildDiscoveryIntentFromQuery` and the place gazetteer are deleted; "Slc to park city"
  still compiles a route; no provider/model literals outside the tier map.*
- **Location-grounded discovery**: every discovery request resolves a center (session
  location or geocoded place name) and searches by radius, nearest first; silent state/
  national widening deleted. *Testable: "twisty near Ogden" returns only routes within the
  radius of Ogden, nearest first.*
- **Interrogation policy**: exactly one targeted clarifying question when intent is
  unresolvable; none when it is resolvable. *Testable: no-location + no-session-location
  discovery yields one question; known-location "scenic near SLC" yields results.*
- **Honesty policy**: real distance on every conversational suggestion; no prose proximity
  claims the data doesn't support; thin coverage stated with nearest real alternative +
  custom-route offer. *Testable: no reply contains "near {place}" for a route beyond the
  search radius; thin-region replies name the radius and nearest option.*
- **In-session conversation memory**: stated preferences and prior locations persist across
  turns via a Mastra memory adapter backed by the existing Convex session store. *Testable:
  "OK what's scenic" after an SLC turn searches near SLC.*
- **Agent eval harness + observability**: recorded transcripts (incl. the real SLC/Ogden
  failure) replay against a fixtured model seam with behavior graders; a cost-capped
  real-API smoke lane; per-turn traces wired to LangSmith. *Testable: replaying the Ogden
  transcript fails the eval if any suggestion exceeds the radius unlabeled; a trace exists
  per conversation turn.*
- **Intent-grounded discovery beyond location** (persona pass, `.spec/USER-PROFILES.md`):
  duration-expressed requests ("a 2–3 hour loop") translate to distance windows;
  waypoint-anchored requests ("a loop with a good BBQ stop halfway") compose route search
  with real waypoint lookup along the route. *Testable: captured tool args reflect the
  duration constraint; the named stop comes from a real POI result, never invented.*
- **Volunteered weather verdicts**: any suggestion tied to a stated ride date/time carries a
  go/no-go from real forecast data. *Testable: a "Saturday morning" request's reply contains
  a forecast-grounded verdict without the rider asking.*
- **Persona-fit reply shaping**: ≤3 best options by default with depth on request; honest
  comfort labels grounded in stored difficulty evidence; stated constraints persist for the
  session; suggestions close with the saveable next step (share-to-link deferred); "something
  new" excludes the rider's saved library. *Testable: replay graders assert option count, label
  honesty against technical scores, constraint persistence across turns, and save-close presence.*

## Out of Scope

- **Enrichment "why" paragraphs** — [DEFERRED: separate PRD, `.spec/prds/enrichment/`] this
  PRD raises enrichment's plottable base; it generates no prose.
- **New route sources / scraping / ingestion** — the waterfall rescues the existing
  5,757-row catalog only.
- **Navigation / turn-by-turn handoff changes** — navigation still hands off to Maps;
  geometry is a pre-ride discovery artifact.
- **Score recalibration beyond scale normalization** — [DEFERRED: curation-hardening] only
  the ÷100 scale fix ships; what scores *mean* is untouched.
- **New detail screens, navigation, or admin UI** — the provenance caption and absence states
  render inside existing views; the Founder-Operator works through `npx convex run` + driver
  scripts (mirrors the enrichment PRD's operator posture).
- **App-store release work** — data + read-path initiative, verified on the dev deployment.
- **Parallel batch execution** — batches are serial by construction in v1; a lease field is
  flagged as a future need, not built.
- **Cross-session personalization / long-term rider profiles** — [DEFERRED] memory in this
  PRD is in-session only; durable taste profiles are a future initiative.
- **Share a plan as a link / send-to-riding-group** — [DEFERRED: future PRD] no shareable-link
  affordance exists in the app today and planned multi-leg routes have no deep-link target;
  UC-AGT-06 closes suggestions with Save-to-library only. Building the share leaf (starting on
  the existing `laneshadow:///curated-route/{id}` deep link) is scoped to a later initiative.
- **Standalone Mastra server / new deployment infrastructure** — [LOCKED OUT] `@mastra/core`
  embeds in the existing Convex actions; Convex remains the only backend and store.
- **Voice, proactive notifications, or new chat surfaces** — the agent rebuild changes what
  the existing chat surface says, not where conversation happens.
- **Prompt-only fixes to the old orchestrator** — [SUPERSEDED] the dispatch architecture and
  regex intent path are replaced, not tuned.
