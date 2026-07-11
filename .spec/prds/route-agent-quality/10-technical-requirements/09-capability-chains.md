---
stability: CONSTITUTION
last_validated: 2026-07-10
prd_version: 1.0.0
---

# Capability Chains

Per `~/Projects/brain/docs/CAPABILITY-CHAIN-PLANNING.md`. Trigger verbs present in this PRD:
`restore/resume` (batch), `import/migrate` (lever 1 promotion), `sync` (flag recompute),
`archive` (retirement), `export` (couch sample) — chains required.

## CAP-GEO-01 — Lever-2 reconstruction (description → validated line + provenance)

- **Promise:** a turn-by-turn route ends a run gate-PASSed as `ai_reconstructed`, or held in
  `review`, or retirement-eligible — never a fabricated or silently-unprocessed line.
- **Trigger:** operator runs `scripts/reconstruct-curated-geometry.ts --lever=2` (`--all`
  only after the couch gate passes).
- **Ordered hops:** driver → `backfillReconstruct` → `listForLever2Reconstruct` → per route:
  LLM anchors (geometry tier, forced `emit_anchors`) → Google Geocoding (region bias, 150-mi
  check) → Google Routes `computeRoutes(via)` → pure `gate()` → PASS
  `persistGeometryVerified('ai_reconstructed')` / FAIL repair round (≤2) → `setReviewVerdict`
  → cursor advance.
- **Boundary contracts:** external calls only from the `'use node'` action; validators on
  every function; static `_generated` imports; keys from deployment env, redacted from logs;
  per-route idempotent (skip `generated`); retry = the repair round, never a blind re-call.
- **Failure modes:** LLM timeout/parse-fail → `review` + reason, no line; <2 geocoded anchors
  → `review`; gate fail after 2 attempts → `review` (fail-closed); N consecutive provider
  errors → batch halts with resumable cursor; cost cap ~$0.07/route.
- **Proof:** `--sample` against the real dev deployment hitting real Anthropic + Google
  reproduces the PoC outcomes — Twist of Tepusquet Loop persists as `generated` (ratio 1.00);
  Old Hwy 40 held closed as `review`.
- **Owners:** convex-implementer.

## CAP-GEO-02 — Lever-1 promotion (legacy in-row polyline → side table)

- **Promise:** every legacy `routePolyline` that passes the gate becomes a first-class
  `scraped_promoted` side-table line at $0; the ~1,752 ignored rider-drawn lines become
  visible.
- **Trigger:** `--lever=1 --all`.
- **Ordered hops:** driver → `backfillPromote` → `listForLever1Promote` → decode → gate →
  `persistGeometryVerified('scraped_promoted')` / `setReviewVerdict`.
- **Boundary contracts:** default runtime, zero external calls; deterministic; idempotent;
  the in-row field is read-only input, never mutated.
- **Failure modes:** undecodable/degenerate → `review`; ratio out of band → `review` with the
  legacy line kept as the candidate for human eyes.
- **Proof:** vitest integration on the real dev deployment: a known BBR row promotes to a
  `generated` side-table row with `verification.verdict='pass'` + `scraped_promoted`.
- **Owners:** convex-implementer.

## CAP-GEO-03 — Rider-ready gating (flag → indexed query → discovery → render)

- **Promise:** only rider-ready routes reach any suggestion surface; thin regions say so
  honestly; failure fails closed to absence, never a centroid dot.
- **Trigger:** `recomputeRiderReady` after each lever write; rider opens discovery/browse.
- **Ordered hops:** recompute (pure predicate) → `curated_routes.riderReady` →
  `listCuratedRoutes` via `by_riderReady_and_composite_score` → `discoverCuratedRoutes`
  (centroid fallback removed) → RN pills/pins/carousel/detail render.
- **Boundary contracts:** public reads stay Clerk-gated; the predicate is pure; retired +
  shadows + quarantined excluded in the same query; no rider write path.
- **Failure modes:** no ready routes in region → honest empty (existing chat path + new pill
  copy); side-table lookup miss → route omitted, never plotted as a point.
- **Proof:** Maestro `discovery-full-gate.yaml` cold-boot on iOS sim against the dev
  deployment — every plotted route is rider-ready; a seeded thin region shows absence, not a
  dot. Backend: `listCuratedRoutes` integration test asserts non-ready rows never appear.
- **Owners:** react-native-ui-implementer (surface) + convex-implementer (gate/query).

## CAP-GEO-04 — Retirement (all-levers-failed evidence → founder decision → reversible exclusion)

- **Promise:** a route is retired only after every lever fails AND the classifier/founder
  agree; retirement is reversible and excludes the row from suggestions everywhere while
  preserving saved-route reachability.
- **Trigger:** operator adjudicates the residual via `rejectReviewItem` / `retireRoute`.
- **Ordered hops:** waterfall exhaustion + classifier verdict → `listGeometryReviewQueue` →
  founder decision → `retireRoute(reason)` → `recomputeRiderReady` → excluded from
  list/discovery.
- **Boundary contracts:** `retiredAt`/`retirementReason` persisted as queryable evidence;
  reversible via `unretireRoute`; operator-only.
- **Failure modes:** classifier false-negative → mitigated by rescue-first ordering,
  `marginal` never auto-retires, reversible flag + founder gate.
- **Proof:** integration test — a route failing all three levers on real APIs + classified
  `not_a_ride` retires; suggestions omit it; saved-route detail still resolves;
  `unretireRoute` restores it.
- **Owners:** convex-implementer (plumbing) + Founder-Operator (decision).

## CAP-GEO-05 — Couch-sample gate (sample export → founder verdict → batch unlock)

- **Promise:** the full lever-2 backfill cannot run until the founder couch-tests a
  ~25-route sample and it comes back green (R2 pattern).
- **Trigger:** `scripts/geometry-couch-sample.ts` after a `--sample` reconstruct.
- **Ordered hops:** internalQuery top-25 candidates (stratified across provenance +
  difficulty) → driver renders Mapbox static PNGs locally + manifest → founder verdicts via
  `recordCouchVerdict` → deterministic `couchGateStatus` (pass iff sampled ≥ target ∧ zero
  `wrong` ∧ true-rate ≥ threshold) → green unlocks `--all`; red routes failures to
  regenerate/rule-tune → re-gate.
- **Boundary contracts:** verdicts persisted on route docs; a single `wrong`
  (fabricated-but-passing line) forces red regardless of count; render runs offline in the
  driver (no image bytes through Convex).
- **Failure modes:** unrepresentative sample → stratification requirement; systematic `off`
  verdicts → gate-band recalibration before `--all`.
- **Proof:** the gate run itself — real reconstructed rows, real founder verdicts via the
  real mutation, real PNGs; driver refuses `--all` while status ≠ pass.
- **Owners:** convex-implementer (plumbing) + Founder-Operator (verdicts).

## CAP-GEO-06 — Lever-3 reroute (endpoint/road-name → routed line)

- **Promise:** A-to-B and highway-ref routes get a gate-PASSed `name_routed` line with no LLM
  spend.
- **Trigger:** `--lever=3 --all`.
- **Ordered hops:** `backfillReroute` → `listForLever3Reroute` → deterministic
  `parseRouteEndpoints`/`highwayNumber` → Google Geocoding (per endpoint,
  nearest-to-centroid) → Google Routes → gate → `persistGeometryVerified('name_routed')` /
  `setReviewVerdict`.
- **Boundary contracts:** `'use node'` only for external calls; same gate as CAP-GEO-01; keys
  redacted; idempotent.
- **Failure modes:** endpoint geocode miss / ratio fail → `review`; wrong same-name town →
  caught by region check + ratio gate.
- **Proof:** integration on a real endpoint-named row → `name_routed` PASS on real Google
  APIs.
- **Owners:** convex-implementer.

## CAP-AGT-01 — Location-grounded conversational discovery (utterance → grounded suggestions)

- **Promise:** a rider's discovery utterance ends as rider-ready suggestions within a stated
  radius of a real center, an honest thin-coverage statement with the nearest alternative, or
  one targeted clarifying question — never ungrounded results presented as "near."
- **Trigger:** rider sends a discovery message through the chat surface.
- **Ordered hops:** `sendMessage` action → Mastra agent (orchestrator tier) → resolve center
  (session location ∨ `geocodePlace`) → `searchCuratedRoutes({center, radiusMi})` (SURF-gated
  query, per-route `distanceMi`) → reply composed only from tool results (distances echoed) →
  attachments/cards persisted via the existing session-message path → RN render.
- **Boundary contracts:** `searchCuratedRoutes` throws without `center` (grounding is
  structural, not prompted); tool args validated at the boundary; model resolved through the
  tier map with deployment-env keys, redacted from logs and traces; reply claims sourced from
  tool results only; the rider-ready gate is the same one browse uses (no agent side-door).
- **Failure modes:** no session location ∧ no place in utterance → one clarifying question;
  geocode miss → clarifying question naming the miss; zero results in radius → honest
  thin-coverage statement + nearest alternative + custom-route offer; model/provider outage →
  existing error message path, never fabricated suggestions.
- **Proof:** transcript-replay eval (fixtured model seam) asserts tool selection + center
  args + outcome states on the real SLC/Ogden session; the smoke lane proves the wiring on
  the real orchestrator model + dev deployment; Maestro drives the chat surface cold-boot.
- **Owners:** mastra-implementer (agent layer) + convex-implementer (tools/queries).

## CAP-AGT-02 — Eval replay + observability (transcript → graded verdict → trace)

- **Promise:** any recorded conversation can be replayed deterministically and graded
  against the behavior policies, and any live conversation can be inspected per-turn — a
  behavior regression is visible as a failed artifact before a build reaches the founder.
- **Trigger:** `pnpm agent:eval` (fixtured) / `pnpm agent:eval --smoke` (real-API,
  cost-capped) / any live conversation (traces).
- **Ordered hops:** transcript fixture → replay driver → Mastra agent with the model signal
  fixtured at the tool-call seam → captured tool calls + final states → policy graders →
  `agent-evals/report.json`; live path: Mastra telemetry export → LangSmith project.
- **Boundary contracts:** fixtures contain no secrets; the fixtured seam is the model call
  ONLY (tools, queries, gates run real against the dev deployment — principled seam, not
  core-logic stubbing); smoke lane spend-capped; trace payloads redact keys.
- **Failure modes:** grader violation → non-zero exit + named policy + turn; fixture drift
  after a tool-contract change → replay fails loudly (fixtures are versioned with the
  contract); LangSmith outage degrades to console traces, never blocks the rider.
- **Proof:** the captured 2026-07-10 failure session replays RED against the old behavior
  and GREEN against the rebuilt agent; a deliberately-injected false-proximity reply fails
  the grader (negative control).
- **Owners:** mastra-evals-implementer (harness) + observability wiring: mastra-implementer.
