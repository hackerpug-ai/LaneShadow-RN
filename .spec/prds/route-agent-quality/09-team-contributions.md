# Team Contributions

PRD authored 2026-07-10 by a planner team against the live repo, the full prod-export audit
(`.spec/proposals/geometry-completion/STRATEGY.md`), and the real-service reconstruction PoC.
v2.0.0 adds the AGT group from the same-day agent-failure diagnosis (Phase 5).

## Phase 1 — User Personas (product-manager + frontend-designer)

- 3 personas: Returning Rider Rachel (reused from the enrichment sibling), Founder-Operator,
  System. Pain points grounded in audit numbers (7-of-10 junk top-10, 49.9% centroid dots,
  20.3% rider-ready).
- 5 user journeys: recovered-route preview, rescue-waterfall run, couch-sample gate,
  thin-region honesty, REVIEW-queue adjudication.

## Phase 2 — Architecture (product-manager + convex-planner)

- Deterministic-vs-probabilistic split: the LLM appears at exactly two seams (anchor
  extraction, ride-worthiness classifier); everything else — gate, promotion, flags, status
  transitions, resume — is deterministic code.
- 15 system components (5 new modules, 4 modified read paths, driver scripts); status-field
  review queue (no new table — mirrors enrichment's rejected-queue-table precedent);
  `by_riderReady_and_composite_score` + `by_geometry_status` indexes.
- 6 capability chains (CAP-GEO-01 … 06); 9-row technical risk register.
- Superseded: the Nominatim/Overpass name-anchored backfill (documented root cause) retires
  once the levers land.

## Phase 3 — UI Infrastructure (convex-planner + frontend-designer)

- Verified surface inventory: discovery pills/pins/carousel/chat-cards all inherit gating
  from one query source; the map renderer needs zero changes (already draws multipolyline
  segments); browse-by-state UI does not exist (deleted in MVP v3.0.0) — the query-level gate
  covers conversational reach.
- Two pre-existing honesty bugs surfaced and folded into scope: the fabricated "0mi" distance
  label and the silent fallback-to-national substitution.
- Reuse-first: existing Badge/empty-pill-chip/DESIGN-003 "Approximate location" states and
  design tokens; the only new UI is a caption leaf and a fallback label chip (both inline per
  Rule of 2). `react-native-paper` verified; no new libraries.
- Corrected a stale doc comment: chat cards do NOT navigate to detail (map pin + saved-route
  redirect are the real paths).

## Phase 4 — Test Suite Authoring (product-manager + convex-planner)

- Two-tier scenarios (visible TDD contracts + differently-framed holdouts) per UC in
  `.spec/scenarios/UC-{HYG|REC|VER|SURF}-NN/`; 3 cross-UC journeys anchored on the PoC's real
  routes (Tepusquet PASS, Von Hoak PASS, Old Hwy 40 held).
- Harness constitution: no INFRA sprint needed — `detect_e2e_framework` verified mobile
  (Maestro) and service (Convex vitest integration) frameworks present; determinism seam =
  fixture the LLM signal only, always paired with a cost-capped real-API smoke lane; assert
  engine outcomes (verdicts, flags, gated query results), never LLM prose.
- E2E testing criteria: every AC referenced by ≥1 typed criterion (T-{PREFIX}-{NNN}).

## Phase 5 — Agent Diagnosis & Rebuild Direction (v2.0.0, founder + lead)

- Live-evidence diagnosis of the founder's failed session (real `session_messages`
  transcripts + orchestrator source + near-SLC/Ogden catalog replay): discovery ran through
  a regex keyword matcher (`buildDiscoveryIntentFromQuery`) with a one-entry gazetteer that
  never passed the rider's known location and hardcoded best-first sort; the orchestrator's
  "high" tier was gpt-4.1 as an emergency fallback from a budget model; near Ogden the
  catalog held 3 routes ≤30 mi, zero plottable — both halves broken.
- Founder-ratified decisions: full rebuild of the conversation layer on an agent framework
  (Mastra confirmed); Sonnet-class quality-first model; interrogate-when-ambiguous + honest
  distances; fold into this PRD as the AGT group (initiative renamed Route & Agent Quality).
- Preservation ruling: the deterministic routing pipeline (proven working in the same
  session) is wrapped as tools, not rewritten; behavior policies are eval-enforced with the
  captured failure session as the permanent regression suite.
