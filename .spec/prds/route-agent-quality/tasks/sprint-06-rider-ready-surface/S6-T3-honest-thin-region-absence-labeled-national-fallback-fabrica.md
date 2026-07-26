# S6-T3 — Honest thin-region absence + labeled national fallback + fabricated-0mi fix (index.tsx:350) + fellBackToBest exposure + a11y announce (SURF-04)

> Status: ⬜ Pending
> Proposed By: `react-native-ui-planner`

| Field | Value |
|---|---|
| TASK_ID | S6-T3 |
| SPRINT | [Sprint 06 — Rider-ready surface](./SPRINT.md) |
| TASK_TYPE | FEATURE |
| AGENT | `react-native-ui-implementer` |
| ESTIMATE | 180 min |
| EFFORT | M |
| PRIORITY | P0 |
| PROPOSED_BY | `react-native-ui-planner` |
| TDD_MODE | `red_first` |
| RED_GREEN_REQUIRED | yes |
| CAPABILITIES | touches CAP-GEO-03 |
| DEPENDS_ON | S6-T2 |
| BLOCKS | S6-T6 |

RUNTIME_COMMANDS:
- typecheck: `pnpm type-check`
- lint: `pnpm lint`
- test: `pnpm test`
- run: `pnpm ios`

## BACKGROUND
The home/browse surface is ONE screen with four behavioral states (loading / empty-thin-region / fallback-to-national / populated). Today three bugs obscure those states: (1) `app/(app)/(tabs)/index.tsx:350` fabricates `0mi` whenever `distanceMi` is null/undefined (the thin-region and fallback-to-national case) via `${r.name} · ${Math.round(r.distanceMi ?? 0)}mi`; (2) `hooks/use-curated-discovery.ts` computes `fellBackToBest` (line 123) but never returns it, so the UI cannot label the silent national-fallback substitution; (3) the empty-state string `No nearby routes` is a flat muted label with no screen-reader announcement on swap and no visual distinction from the loading and error affordances. This task fixes all three at the state-derivation layer — NO sibling screens, NO mock store — so the honest-absence and labeled-fallback messaging is served from the same rider-ready gate (`useCuratedDiscovery` → `api.curatedRoutes.listCuratedRoutes`) that powers discovery and browse.

## 🚫 CRITICAL CONSTRAINTS (Never tier)
- NEVER render a fabricated '0mi' — the `· Xmi` suffix is omitted ENTIRELY when `distanceMi` is null/undefined/non-finite (delete `Math.round(r.distanceMi ?? 0)` at index.tsx:350; do not substitute a placeholder).
- The honest-absence and fallback messaging MUST come from the same rider-ready gate as discovery — exactly ONE `useCuratedDiscovery` call site in index.tsx, reading `isEmpty`/`isLoading`/`fellBackToBest` (newly exposed); never a sibling query, never a mock store.
- NEVER inject routes via a mock store, redux selector, or parallel `useQuery` — seed the REAL Convex dev backend via public_api; the test must drive the real `useCuratedDiscovery` hook against the real `listCuratedRoutes` query.
- a11y MUST announce pill-row content swaps — `accessibilityLiveRegion='polite'` on the `chat-input-suggestion-chips` container (NOT 'assertive'); `accessibilityLabel` on `discovery-empty-honest` and `discovery-fallback-national`.
- The four states are STATE MUTATIONS of one screen — NO new screen, NO new route, NO `<ThinRegionEmptyScreen />` sibling; the tag-decoder lives in the existing index.tsx suggestion-prop wiring.

## SPECIFICATION

## ACCEPTANCE CRITERIA (TDD beads — RED → GREEN → REFACTOR)
### AC-1 [PRIMARY] — AC-1

**Requirement:** GIVEN the rider's location resolves to a thin-coverage region (real Convex dev seeded with a region that returns ZERO rider-ready routes within the nearest-mode radius) WHEN `useCuratedDiscovery({sort:'nearest',limit:5})` returns `isEmpty:true && fellBackToBest:false && isLoading:false` THEN the suggestion-pill row shows the literal honest-absence caption `no routes near you yet` (testID `discovery-empty-honest`) instead of centroid dots, padded junk, or the prior `No nearby routes` string; the caption is a display-only muted Text (not a tappable chip) and is visually/testID-distinct from the loading affordance (`chat-input-suggestion-chips` while `isLoading:true` yields zero pills) and the error affordance (`chat-error-message`).

TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: vitest-react-native  ·  FLOW_REF: UC-SURF-04  ·  VERIFY: `pnpm test --run app/(app)/(tabs)/index.discovery-honest-absence.integration.test.tsx`

SCENARIO:
- `start_ref` seed_method: `public_api`
- SEED: Seed a thin-coverage region on real Convex dev by creating rider-ready routes ONLY outside the test location's nearest-mode radius (e.g. routes in NC while the simulated device location is SLC 40.76,-111.89 — the documented empty-nearest case in hooks/use-curated-discovery.ts:115-120). The discovery hook is driven against this real backend via the REAL `useQuery(api.curatedRoutes.listCuratedRoutes)`; routes are NEVER view-injected.
- ACTION (api_client): Render the REAL HomeMapScreen (`app/(app)/(tabs)/index.tsx`) with the REAL `useCuratedDiscovery` hook subscribed to the real Convex dev deployment; simulate the device location at the thin-coverage region; wait for `isLoading` to resolve false; observe the rendered suggestion-pill row via the real ChatInput → SuggestionChips tree (the production chat-input.tsx:287 `chat-input-suggestion-chips` container).
- MUST_OBSERVE: ["literal string 'no routes near you yet' rendered inside testID 'discovery-empty-honest'", "testID 'discovery-empty-honest' has accessibilityRole='text' (display-only, NOT a button)", "0 elements matching testID 'discovery-suggestion-pill-'", "testID 'chat-error-message' is absent"]
- MUST_NOT_OBSERVE: ["literal string 'No nearby routes' (the legacy flat label)", "literal string '0mi'", "any element with testID 'discovery-fallback-national' (no fallback in thin-region-only seed)", "literal string 'No routes nearby'", "literal string 'Render Error' or 'ConvexError'", 'empty pill row with no caption node (the stub/static-shell signature)']
- NEGATIVE_CONTROL (would_fail_if): ['the test renders a mock store that view-injects routes into the pill row; OR the test asserts only `routes.length === 0` without observing the literal caption text (WEAK_ORACLE); OR the test does not drive the real `useCuratedDiscovery` hook against the real Convex `listCuratedRoutes` query (SEED_NOT_REAL); OR the test seeds NO thin-coverage region so the assertion is vacuous (DEGENERATE_ONLY).']
- EVIDENCE: `stdout` (required_capture=True)

### AC-2 — AC-2

**Requirement:** GIVEN the rider's location resolves to a region with zero nearby rider-ready routes BUT the catalog has national rider-ready rows (the documented `fellBackToBestFromEmptyNearest` path in hooks/use-curated-discovery.ts:121-123) WHEN `useCuratedDiscovery` falls back to `sort:'best'` THEN the UI renders a leading label chip with the literal copy `No routes nearby — here's our top-rated` (testID `discovery-fallback-national`) BEFORE the populated pill row, so distant routes are never presented as nearby.

TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: vitest-react-native  ·  FLOW_REF: UC-SURF-04  ·  VERIFY: `pnpm test --run app/(app)/(tabs)/index.discovery-fallback-labeled.integration.test.tsx`

SCENARIO:
- `start_ref` seed_method: `public_api`
- SEED: Seed real Convex dev with rider-ready routes ONLY outside the test location's nearest radius (so nearest-mode returns empty and `fellBackToBestFromEmptyNearest` latches true at use-curated-discovery.ts:234), PLUS national rider-ready rows in the catalog so the `sort:'best'` fallback has rows to return.
- ACTION (api_client): Render the REAL HomeMapScreen against real Convex dev; simulate the device location at the seeded thin-nearby region; wait for the `fellBackToBest` latch to flip (one render cycle after `routes.length === 0` on the nearest pass); observe the rendered pill row including the leading label chip and the populated pills.
- MUST_OBSERVE: ["literal string 'No routes nearby — here's our top-rated' rendered inside testID 'discovery-fallback-national'", "testID 'discovery-fallback-national' is rendered BEFORE (lower DOM index than) every testID matching /^discovery-suggestion-pill-/", 'useCuratedDiscovery return value exposes `fellBackToBest === true` to the caller (the production code path in index.tsx reads this signal to decide whether to prepend the label)']
- MUST_NOT_OBSERVE: ["any pill label ending in '· 0mi' (the fabricated suffix)", "literal string 'No nearby routes'", 'absence of the leading label when fellBackToBest is true (silent substitution)', 'the leading label rendered when fellBackToBest is false (false-positive label)']
- NEGATIVE_CONTROL (would_fail_if): ['the implementation hardcodes the label unconditionally without reading `fellBackToBest`; OR the implementation never exposes `fellBackToBest` from the hook (the signal stays private); OR the test stubs `useCuratedDiscovery` to return `fellBackToBest:true` without driving the real latch path (SEED_NOT_REAL).']
- EVIDENCE: `stdout` (required_capture=True)

### AC-3 — AC-3

**Requirement:** GIVEN a fallback-to-national or any case where a returned route has `distanceMi` of null OR undefined (the precise condition that today emits fabricated `0mi` via `Math.round(r.distanceMi ?? 0)`) WHEN the pill label is constructed at app/(app)/(tabs)/index.tsx around line 349-352 THEN the `· Xmi` suffix is omitted ENTIRELY for that pill — the label is the route name alone — and zero pill labels anywhere in the pill row contain the literal substring `0mi`.

TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: vitest-react-native  ·  FLOW_REF: UC-SURF-04  ·  VERIFY: `pnpm test --run app/(app)/(tabs)/index.discovery-no-fabricated-distance.integration.test.tsx`

SCENARIO:
- `start_ref` seed_method: `public_api`
- SEED: Seed real Convex dev with at least one rider-ready national route whose `distanceMi` field is null/undefined on the `listCuratedRoutes` return (the fallback-to-national case — these rows are returned via `sort:'best'` and have no distance to the user's location).
- ACTION (api_client): Render the REAL HomeMapScreen against real Convex dev; force the `fellBackToBest` path; observe every pill label rendered in the production SuggestionChips tree (chat-input.tsx:74-170).
- MUST_OBSERVE: ["at least 1 pill label equal to the bare route name (no '·' separator, no 'mi' suffix)", "the pill label builder at index.tsx:349-352 reads `r.distanceMi` and conditionally appends the suffix only when `typeof r.distanceMi === 'number' && isFinite(r.distanceMi)`"]
- MUST_NOT_OBSERVE: ["literal substring '0mi' in any pill label", "literal substring '· 0mi' in any pill label", 'Math.round(r.distanceMi ?? 0) anywhere in app/(app)/(tabs)/index.tsx (the buggy expression must be deleted, not commented)']
- NEGATIVE_CONTROL (would_fail_if): ["the fix only patches the label string but leaves the `?? 0` expression elsewhere; OR the fix substitutes a different placeholder like '· --mi' instead of omitting the suffix; OR the test asserts only the absence of `0mi` without observing the bare-name positive case (NEG_OBSERVE_EMPTY)."]
- EVIDENCE: `stdout` (required_capture=True)

### AC-4 — AC-4

**Requirement:** GIVEN the suggestion-pill container swaps content between any two of {loading, empty-thin-region, fallback-to-national, populated} WHEN the swap occurs THEN the container element with testID `chat-input-suggestion-chips` carries `accessibilityLiveRegion='polite'` so VoiceOver / TalkBack announces the new content once, without interrupting; AND the honest-absence caption node (testID `discovery-empty-honest`) and the fallback label node (testID `discovery-fallback-national`) each carry an `accessibilityLabel` distinct from any populated pill.

TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: vitest-react-native  ·  FLOW_REF: UC-SURF-04  ·  VERIFY: `pnpm test --run components/chat/chat-input.live-region.integration.test.tsx`

SCENARIO:
- `start_ref` seed_method: `public_api`
- SEED: Reuse the AC-1 / AC-2 seed scenarios; the test transitions the same real HomeMapScreen between states by re-rendering with different useCuratedDiscovery return values driven by the real backend.
- ACTION (api_client): Inspect the rendered output of the production ChatInput (components/chat/chat-input.tsx) for the `accessibilityLiveRegion` prop on the `chat-input-suggestion-chips` View (chat-input.tsx:287) and on the `discovery-empty-honest` and `discovery-fallback-national` nodes; assert via React Testing Library / react-test-renderer prop inspection.
- MUST_OBSERVE: ["testID 'chat-input-suggestion-chips' has prop accessibilityLiveRegion === 'polite'", "testID 'discovery-empty-honest' has a non-empty accessibilityLabel", "testID 'discovery-fallback-national' has a non-empty accessibilityLabel"]
- MUST_NOT_OBSERVE: ["accessibilityLiveRegion === 'assertive'", 'absent accessibilityLiveRegion prop']
- NEGATIVE_CONTROL (would_fail_if): ['live region on a child not the swap container', 'test inspects a stubbed ChatInput']
- EVIDENCE: `stdout` (required_capture=True)

### AC-5 — AC-5

**Requirement:** GIVEN the honest-absence caption (AC-1) and the labeled national-fallback indicator (AC-2) WHEN their underlying row sets are inspected THEN both derive from the SAME `useCuratedDiscovery` return value that powers discovery — i.e. the pill row reads `routes`, `isEmpty`, `isLoading`, and the newly-exposed `fellBackToBest` from the one hook backed by `api.curatedRoutes.listCuratedRoutes` (the rider-ready gated query inherited from S6-T2); the surface NEVER re-derives absence/fallback from a sibling query, a mock store, or a parallel client-side filter.

TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: vitest-react-native  ·  FLOW_REF: UC-SURF-04  ·  VERIFY: `pnpm test --run app/(app)/(tabs)/index.discovery-single-gate.integration.test.tsx`

SCENARIO:
- `start_ref` seed_method: `public_api`
- SEED: Same seed as AC-1/AC-2; additionally seed a shadow/retired/quarantined row in the same region and assert it appears in NEITHER the pill row NOR the honest-absence decision (proving the surface inherits the gate's exclusions).
- ACTION (api_client): Read the production code path at app/(app)/(tabs)/index.tsx and assert there is exactly ONE call site for `useCuratedDiscovery` (line ~344-348) and that the `isEmpty`, `isLoading`, `routes`, and `fellBackToBest` bindings drive BOTH the caption/label decision AND the populated pills; assert via a static-analysis test plus a runtime test that the shadow row never appears in the pill row.
- MUST_OBSERVE: ["exactly '1' call to useCuratedDiscovery in index.tsx", "the honest-absence branch gated by 'isEmpty && !isLoading && !fellBackToBest'"]
- MUST_NOT_OBSERVE: ['a second useQuery call to listCuratedRoutes in index.tsx', 'a client-side riderReady filter']
- NEGATIVE_CONTROL (would_fail_if): ['a parallel query for empty/fallback', 'riderReady read from the row instead of the gate']
- EVIDENCE: `stdout` (required_capture=True)

## TEST CRITERIA
- **TC-1** (→ AC-1): Component test: thin-coverage region renders testID 'discovery-empty-honest' with literal 'no routes near you yet'; zero discovery-suggestion-pill-* nodes; chat-error-message absent; isLoading false.
  - VERIFY: `pnpm test --run app/(app)/(tabs)/index.discovery-honest-absence.integration.test.tsx -t 'TC-1'`
- **TC-2** (→ AC-2): Component test: fellBackToBest path renders testID 'discovery-fallback-national' BEFORE any discovery-suggestion-pill-* node, with literal 'No routes nearby — here's our top-rated'.
  - VERIFY: `pnpm test --run app/(app)/(tabs)/index.discovery-fallback-labeled.integration.test.tsx -t 'TC-2'`
- **TC-3** (→ AC-3): Component test: route with distanceMi null OR undefined renders a pill label equal to the bare route name; no pill label contains substring '0mi'; route with real distanceMi:12.4 still renders '· 12mi'.
  - VERIFY: `pnpm test --run app/(app)/(tabs)/index.discovery-no-fabricated-distance.integration.test.tsx -t 'TC-3'`
- **TC-4** (→ AC-4): Component test: testID 'chat-input-suggestion-chips' has prop accessibilityLiveRegion === 'polite'; 'discovery-empty-honest' and 'discovery-fallback-national' each have a non-empty accessibilityLabel.
  - VERIFY: `pnpm test --run components/chat/chat-input.live-region.integration.test.tsx -t 'TC-4'`
- **TC-5** (→ AC-5): Static + runtime test: exactly one useCuratedDiscovery call site in index.tsx; isEmpty/isLoading/fellBackToBest drive all four state branches; seeded shadow row never appears in pills.
  - VERIFY: `pnpm test --run app/(app)/(tabs)/index.discovery-single-gate.integration.test.tsx -t 'TC-5'`
- **TC-6** (→ AC-2): Hook test: useCuratedDiscovery return object includes `fellBackToBest: boolean`; latches true on the empty-nearest path; latches true on the location-failure path; latches false on the populated-nearest path.
  - VERIFY: `pnpm test --run hooks/__tests__/use-curated-discovery.integration.test.ts -t 'fellBackToBest'`
- **TC-7** (→ AC-1): E2E (Maestro, human-surface proof): drive .maestro/discovery-honest-absence.yaml (created in S6-T6) on the iOS simulator against real Convex dev with a thin-coverage simulated location; observe literal 'no routes near you yet' on screen; observe absence of '0mi'; screenshot artifact archived.
  - VERIFY: `maestro test .maestro/discovery-honest-absence.yaml`

## SCOPE (file-level write permissions)
**writeAllowed:**
- `app/(app)/(tabs)/index.tsx`
- `app/(app)/(tabs)/index.discovery-*.integration.test.tsx`
- `hooks/use-curated-discovery.ts`
- `hooks/__tests__/use-curated-discovery.integration.test.ts`
- `components/chat/chat-input.tsx`
- `components/chat/chat-input.live-region.integration.test.tsx`
- `components/chat/chat-input.test.tsx`
**writeProhibited:**
- `convex/** (the backend gate is owned by S6-T2; this task CONSUMES the gated query, never writes to it)`
- `app/(app)/curated-route/[id].tsx (detail screen — owned by UC-SURF-05, not this task)`
- `.maestro/** (the new discovery Maestro flows are authored in S6-T6, not here; S6-T3 only declares TC-7 as the human-surface gate deference)`
- `any file under test-holders/ that view-injects routes (mock-store backdoor)`

## READING LIST
- app/(app)/(tabs)/index.tsx:343-352 [PRIMARY PATTERN — the discovery hook call site and the buggy curatedPills builder at line 350; this is the exact line to fix]
- app/(app)/(tabs)/index.tsx:1756-1763 [the four-state suggestion prop wiring on ChatInput]
- hooks/use-curated-discovery.ts:35-39 [UseCuratedDiscoveryResult interface — add fellBackToBest here]
- hooks/use-curated-discovery.ts:108-124 [the fellBackToBest computation that must be exposed]
- hooks/use-curated-discovery.ts:245-249 [the return object — add fellBackToBest here]
- components/chat/chat-input.tsx:74-170 [SuggestionChips component — where the testID and accessibilityLabel go]
- components/chat/chat-input.tsx:282-303 [the chat-input-suggestion-chips container — where accessibilityLiveRegion goes]
- hooks/__tests__/use-curated-discovery.integration.test.ts [existing hook test pattern to extend for TC-6]
- app/(app)/(tabs)/index.discovery.integration.test.tsx [existing screen-level discovery test pattern — mock structure to imitate for TC-1..TC-5]
- .spec/prds/route-agent-quality/07-uc-surf.md [UC-SURF-04 acceptance criteria — authoritative]
- .spec/prds/route-agent-quality/11-e2e-testing-criteria.md:170-178 [T-SURF-011..T-SURF-015 — the e2e/integration criteria this task satisfies]
- styles/theme.ts [semantic token reference — onSurface.muted, type.body.sm, space.sm/md]

## DESIGN
- Reference: .spec/prds/route-agent-quality/07-uc-surf.md (UC-SURF-04 — authoritative ACs)
- Reference: styles/theme.ts (semantic tokens: onSurface.muted, type.body.sm, space.sm/md, radius.md)
- Reference: components/chat/chat-input.tsx:74-170 (SuggestionChips — existing display-only muted-Text pattern at lines 101-127 to imitate for the honest-absence caption and fallback-label nodes)

**Pattern:** State-derived four-state surface: ONE useCuratedDiscovery hook instance drives a tagged-union suggestion prop on the existing ChatInput — `type SuggestionState = {kind:'loading'} | {kind:'empty-thin'} | {kind:'fallback-national', routes:CuratedPill[]} | {kind:'populated', routes:CuratedPill[]}`. The tag is derived from `isEmpty`, `isLoading`, `fellBackToBest` (a 2-bit decoder: loading beats all; then isEmpty && !fellBackToBest → empty-thin; then fellBackToBest && !isEmpty → fallback-national; else populated). ChatInput renders one of four sub-trees off the tag. NO sibling screens. NO route navigation. NO new components — only an extension of the existing SuggestionChips contract.
- pattern_source: `app/(app)/(tabs)/index.tsx:343-352,1756-1763 [the existing four-state branching via isEmpty/isLoading plus the buggy label builder]`

**Anti-pattern:** DO NOT add a `<ThinRegionEmptyScreen />` or `<NationalFallbackBanner />` sibling component. DO NOT view-inject routes via `useSelector` or a mock rest store. DO NOT replace the `?? 0` with `?? '--'` (still a fabricated suffix). DO NOT add a second `useQuery(api.curatedRoutes.listCuratedRoutes)` call to derive absence/fallback — that diverges the surface from the gate (UC-SURF-04 AC-5). DO NOT put `accessibilityLiveRegion='assertive'` — polite is the correct politeness for content-swap announcements.

## EVIDENCE / VERIFICATION GATES
- **typecheck** — `pnpm type-check` → 
- **lint** — `pnpm lint` → 
- **unit-and-component** — `pnpm test --run app/(app)/(tabs)/index.discovery-*.integration.test.tsx hooks/__tests__/use-curated-discovery.integration.test.ts components/chat/chat-input.live-region.integration.test.tsx` → 
- **full-suite** — `pnpm test` → 
- **rn-build-ios** — `pnpm ios` → 
- **e2e-maestro-thin-region** — `maestro test .maestro/discovery-honest-absence.yaml` → 

## DEPENDENCIES
- Depends on: S6-T2
- Blocks: S6-T6

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "version": "1",
  "task_id": "S6-T3",
  "tdd_mode": "red_first",
  "verification_policy": {
    "requires_tests": true,
    "requires_red_evidence": true,
    "requires_seeded_evidence": true
  },
  "fixtures": {},
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": true,
      "description": "GIVEN the rider's location resolves to a thin-coverage region (real Convex dev seeded with a region that returns ZERO rider-ready routes within the nearest-mode radius) WHEN `useCuratedDiscovery({sort:'nearest',limit:5})` returns `isEmpty:true && fellBackToBest:false && isLoading:false` THEN the suggestion-pill row shows the literal honest-absence caption `no routes near you yet` (testID `discovery-empty-honest`) instead of centroid dots, padded junk, or the prior `No nearby routes` string; the caption is a display-only muted Text (not a tappable chip) and is visually/testID-distinct from the loading affordance (`chat-input-suggestion-chips` while `isLoading:true` yields zero pills) and the error affordance (`chat-error-message`).",
      "verify": "pnpm test --run app/(app)/(tabs)/index.discovery-honest-absence.integration.test.tsx",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "integration",
        "verification_service": "vitest-react-native",
        "negative_control": {
          "would_fail_if": [
            "the test renders a mock store that view-injects routes into the pill row; OR the test asserts only `routes.length === 0` without observing the literal caption text (WEAK_ORACLE); OR the test does not drive the real `useCuratedDiscovery` hook against the real Convex `listCuratedRoutes` query (SEED_NOT_REAL); OR the test seeds NO thin-coverage region so the assertion is vacuous (DEGENERATE_ONLY)."
          ]
        },
        "evidence": {
          "artifact_type": "stdout"
        },
        "cases": [
          {
            "start_ref": "default",
            "action": {
              "actor": "api_client",
              "steps": []
            },
            "end_state": {
              "must_observe": [
                "literal string 'no routes near you yet' rendered inside testID 'discovery-empty-honest'",
                "testID 'discovery-empty-honest' has accessibilityRole='text' (display-only, NOT a button)",
                "0 elements matching testID 'discovery-suggestion-pill-'",
                "testID 'chat-error-message' is absent"
              ],
              "must_not_observe": [
                "literal string 'No nearby routes' (the legacy flat label)",
                "literal string '0mi'",
                "any element with testID 'discovery-fallback-national' (no fallback in thin-region-only seed)",
                "literal string 'No routes nearby'",
                "literal string 'Render Error' or 'ConvexError'",
                "empty pill row with no caption node (the stub/static-shell signature)"
              ]
            }
          },
          {
            "start_ref": "default",
            "action": {
              "actor": "api_client",
              "steps": []
            },
            "end_state": {
              "must_observe": [
                "literal string 'no routes near you yet' rendered inside testID 'discovery-empty-honest'",
                "testID 'discovery-empty-honest' has accessibilityRole='text' (display-only, NOT a button)",
                "0 elements matching testID 'discovery-suggestion-pill-'",
                "testID 'chat-error-message' is absent"
              ],
              "must_not_observe": [
                "literal string 'No nearby routes' (the legacy flat label)",
                "literal string '0mi'",
                "any element with testID 'discovery-fallback-national' (no fallback in thin-region-only seed)",
                "literal string 'No routes nearby'",
                "literal string 'Render Error' or 'ConvexError'",
                "empty pill row with no caption node (the stub/static-shell signature)"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN the rider's location resolves to a region with zero nearby rider-ready routes BUT the catalog has national rider-ready rows (the documented `fellBackToBestFromEmptyNearest` path in hooks/use-curated-discovery.ts:121-123) WHEN `useCuratedDiscovery` falls back to `sort:'best'` THEN the UI renders a leading label chip with the literal copy `No routes nearby — here's our top-rated` (testID `discovery-fallback-national`) BEFORE the populated pill row, so distant routes are never presented as nearby.",
      "verify": "pnpm test --run app/(app)/(tabs)/index.discovery-fallback-labeled.integration.test.tsx",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "integration",
        "verification_service": "vitest-react-native",
        "negative_control": {
          "would_fail_if": [
            "the implementation hardcodes the label unconditionally without reading `fellBackToBest`; OR the implementation never exposes `fellBackToBest` from the hook (the signal stays private); OR the test stubs `useCuratedDiscovery` to return `fellBackToBest:true` without driving the real latch path (SEED_NOT_REAL)."
          ]
        },
        "evidence": {
          "artifact_type": "stdout"
        },
        "cases": [
          {
            "start_ref": "default",
            "action": {
              "actor": "api_client",
              "steps": []
            },
            "end_state": {
              "must_observe": [
                "literal string 'No routes nearby — here's our top-rated' rendered inside testID 'discovery-fallback-national'",
                "testID 'discovery-fallback-national' is rendered BEFORE (lower DOM index than) every testID matching /^discovery-suggestion-pill-/",
                "useCuratedDiscovery return value exposes `fellBackToBest === true` to the caller (the production code path in index.tsx reads this signal to decide whether to prepend the label)"
              ],
              "must_not_observe": [
                "any pill label ending in '· 0mi' (the fabricated suffix)",
                "literal string 'No nearby routes'",
                "absence of the leading label when fellBackToBest is true (silent substitution)",
                "the leading label rendered when fellBackToBest is false (false-positive label)"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN a fallback-to-national or any case where a returned route has `distanceMi` of null OR undefined (the precise condition that today emits fabricated `0mi` via `Math.round(r.distanceMi ?? 0)`) WHEN the pill label is constructed at app/(app)/(tabs)/index.tsx around line 349-352 THEN the `· Xmi` suffix is omitted ENTIRELY for that pill — the label is the route name alone — and zero pill labels anywhere in the pill row contain the literal substring `0mi`.",
      "verify": "pnpm test --run app/(app)/(tabs)/index.discovery-no-fabricated-distance.integration.test.tsx",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "integration",
        "verification_service": "vitest-react-native",
        "negative_control": {
          "would_fail_if": [
            "the fix only patches the label string but leaves the `?? 0` expression elsewhere; OR the fix substitutes a different placeholder like '· --mi' instead of omitting the suffix; OR the test asserts only the absence of `0mi` without observing the bare-name positive case (NEG_OBSERVE_EMPTY)."
          ]
        },
        "evidence": {
          "artifact_type": "stdout"
        },
        "cases": [
          {
            "start_ref": "default",
            "action": {
              "actor": "api_client",
              "steps": []
            },
            "end_state": {
              "must_observe": [
                "at least 1 pill label equal to the bare route name (no '·' separator, no 'mi' suffix)",
                "the pill label builder at index.tsx:349-352 reads `r.distanceMi` and conditionally appends the suffix only when `typeof r.distanceMi === 'number' && isFinite(r.distanceMi)`"
              ],
              "must_not_observe": [
                "literal substring '0mi' in any pill label",
                "literal substring '· 0mi' in any pill label",
                "Math.round(r.distanceMi ?? 0) anywhere in app/(app)/(tabs)/index.tsx (the buggy expression must be deleted, not commented)"
              ]
            }
          },
          {
            "start_ref": "default",
            "action": {
              "actor": "api_client",
              "steps": []
            },
            "end_state": {
              "must_observe": [
                "at least 1 pill label equal to the bare route name (no '·' separator, no 'mi' suffix)",
                "the pill label builder at index.tsx:349-352 reads `r.distanceMi` and conditionally appends the suffix only when `typeof r.distanceMi === 'number' && isFinite(r.distanceMi)`"
              ],
              "must_not_observe": [
                "literal substring '0mi' in any pill label",
                "literal substring '· 0mi' in any pill label",
                "Math.round(r.distanceMi ?? 0) anywhere in app/(app)/(tabs)/index.tsx (the buggy expression must be deleted, not commented)"
              ]
            }
          },
          {
            "start_ref": "default",
            "action": {
              "actor": "api_client",
              "steps": []
            },
            "end_state": {
              "must_observe": [
                "at least 1 pill label equal to the bare route name (no '·' separator, no 'mi' suffix)",
                "the pill label builder at index.tsx:349-352 reads `r.distanceMi` and conditionally appends the suffix only when `typeof r.distanceMi === 'number' && isFinite(r.distanceMi)`"
              ],
              "must_not_observe": [
                "literal substring '0mi' in any pill label",
                "literal substring '· 0mi' in any pill label",
                "Math.round(r.distanceMi ?? 0) anywhere in app/(app)/(tabs)/index.tsx (the buggy expression must be deleted, not commented)"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN the suggestion-pill container swaps content between any two of {loading, empty-thin-region, fallback-to-national, populated} WHEN the swap occurs THEN the container element with testID `chat-input-suggestion-chips` carries `accessibilityLiveRegion='polite'` so VoiceOver / TalkBack announces the new content once, without interrupting; AND the honest-absence caption node (testID `discovery-empty-honest`) and the fallback label node (testID `discovery-fallback-national`) each carry an `accessibilityLabel` distinct from any populated pill.",
      "verify": "pnpm test --run components/chat/chat-input.live-region.integration.test.tsx",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "integration",
        "verification_service": "vitest-react-native",
        "negative_control": {
          "would_fail_if": [
            "live region on a child not the swap container",
            "test inspects a stubbed ChatInput"
          ]
        },
        "evidence": {
          "artifact_type": "stdout"
        },
        "cases": [
          {
            "start_ref": "default",
            "action": {
              "actor": "api_client",
              "steps": []
            },
            "end_state": {
              "must_observe": [
                "testID 'chat-input-suggestion-chips' has prop accessibilityLiveRegion === 'polite'",
                "testID 'discovery-empty-honest' has a non-empty accessibilityLabel",
                "testID 'discovery-fallback-national' has a non-empty accessibilityLabel"
              ],
              "must_not_observe": [
                "accessibilityLiveRegion === 'assertive'",
                "absent accessibilityLiveRegion prop"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-5",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN the honest-absence caption (AC-1) and the labeled national-fallback indicator (AC-2) WHEN their underlying row sets are inspected THEN both derive from the SAME `useCuratedDiscovery` return value that powers discovery — i.e. the pill row reads `routes`, `isEmpty`, `isLoading`, and the newly-exposed `fellBackToBest` from the one hook backed by `api.curatedRoutes.listCuratedRoutes` (the rider-ready gated query inherited from S6-T2); the surface NEVER re-derives absence/fallback from a sibling query, a mock store, or a parallel client-side filter.",
      "verify": "pnpm test --run app/(app)/(tabs)/index.discovery-single-gate.integration.test.tsx",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "integration",
        "verification_service": "vitest-react-native",
        "negative_control": {
          "would_fail_if": [
            "a parallel query for empty/fallback",
            "riderReady read from the row instead of the gate"
          ]
        },
        "evidence": {
          "artifact_type": "stdout"
        },
        "cases": [
          {
            "start_ref": "default",
            "action": {
              "actor": "api_client",
              "steps": []
            },
            "end_state": {
              "must_observe": [
                "exactly '1' call to useCuratedDiscovery in index.tsx",
                "the honest-absence branch gated by 'isEmpty && !isLoading && !fellBackToBest'"
              ],
              "must_not_observe": [
                "a second useQuery call to listCuratedRoutes in index.tsx",
                "a client-side riderReady filter"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "Component test: thin-coverage region renders testID 'discovery-empty-honest' with literal 'no routes near you yet'; zero discovery-suggestion-pill-* nodes; chat-error-message absent; isLoading false.",
      "verify": "pnpm test --run app/(app)/(tabs)/index.discovery-honest-absence.integration.test.tsx -t 'TC-1'",
      "maps_to_ac": "AC-1"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "Component test: fellBackToBest path renders testID 'discovery-fallback-national' BEFORE any discovery-suggestion-pill-* node, with literal 'No routes nearby — here's our top-rated'.",
      "verify": "pnpm test --run app/(app)/(tabs)/index.discovery-fallback-labeled.integration.test.tsx -t 'TC-2'",
      "maps_to_ac": "AC-2"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "Component test: route with distanceMi null OR undefined renders a pill label equal to the bare route name; no pill label contains substring '0mi'; route with real distanceMi:12.4 still renders '· 12mi'.",
      "verify": "pnpm test --run app/(app)/(tabs)/index.discovery-no-fabricated-distance.integration.test.tsx -t 'TC-3'",
      "maps_to_ac": "AC-3"
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "Component test: testID 'chat-input-suggestion-chips' has prop accessibilityLiveRegion === 'polite'; 'discovery-empty-honest' and 'discovery-fallback-national' each have a non-empty accessibilityLabel.",
      "verify": "pnpm test --run components/chat/chat-input.live-region.integration.test.tsx -t 'TC-4'",
      "maps_to_ac": "AC-4"
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "description": "Static + runtime test: exactly one useCuratedDiscovery call site in index.tsx; isEmpty/isLoading/fellBackToBest drive all four state branches; seeded shadow row never appears in pills.",
      "verify": "pnpm test --run app/(app)/(tabs)/index.discovery-single-gate.integration.test.tsx -t 'TC-5'",
      "maps_to_ac": "AC-5"
    },
    {
      "id": "TC-6",
      "type": "test_criterion",
      "description": "Hook test: useCuratedDiscovery return object includes `fellBackToBest: boolean`; latches true on the empty-nearest path; latches true on the location-failure path; latches false on the populated-nearest path.",
      "verify": "pnpm test --run hooks/__tests__/use-curated-discovery.integration.test.ts -t 'fellBackToBest'",
      "maps_to_ac": "AC-2"
    },
    {
      "id": "TC-7",
      "type": "test_criterion",
      "description": "E2E (Maestro, human-surface proof): drive .maestro/discovery-honest-absence.yaml (created in S6-T6) on the iOS simulator against real Convex dev with a thin-coverage simulated location; observe literal 'no routes near you yet' on screen; observe absence of '0mi'; screenshot artifact archived.",
      "verify": "maestro test .maestro/discovery-honest-absence.yaml",
      "maps_to_ac": "AC-1"
    }
  ]
}
-->