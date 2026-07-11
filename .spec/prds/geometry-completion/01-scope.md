---
stability: FEATURE_SPEC
last_validated: 2026-07-10
prd_version: 1.0.0
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
- **Coverage reporting**: per-lever yields, gate PASS %, rider-ready counts by state — the
  live T1 verdict. *Testable: report counts reconcile with table queries.*

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
