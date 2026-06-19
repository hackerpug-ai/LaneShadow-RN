# DATA-010: Verify + harden the agent start-location default so it plans from the rider's current/last-known location and does not ask "where are you starting from?"

**Sprint:** [SPRINT.md](./SPRINT.md)
**Type:** FEATURE · **Status:** ⬜ Backlog · **Priority:** P1 · **Effort:** M · **Estimate:** 105 min
**Agent:** convex-implementer · **Reviewer:** convex-reviewer
**Proposed By:** convex-planner
**Agent rationale:** The behavior spans the Convex agent prompt-building seam (`buildOrchestratorPrompt` / `buildRoutingPrompt`) and the `sendMessage` location-resolution path (lastKnownLocation fallback). A Read pass found the lastKnownLocation hardening lives in `sendMessage.ts` but the orchestrator/routing prompts the agent actually reads do NOT surface a last-known-location block — and the existing `ridePlanningAgent.test.ts` asserts wording the current builders do not produce, so those tests are out of sync with source. convex-implementer owns these prompt builders + the sendMessage location contract.

> **Remedial — Sprint 1 testing feedback (item 3):** "if there's not an obvious start point the start point should be my current location … right now the agent doesn't know." (Image #3)
>
> **Honesty note:** the happy path is LARGELY ALREADY DONE (commits #825–827 landed session-location fallback + the client first-send guarantee). This task is **VERIFY + HARDEN**, not a fabricated fix: it locks the working happy path with an integration test AND fixes a real source-vs-test drift gap. It must NOT invent a no-op change for already-correct behavior.

## Outcome

On live Convex dev: a planning session with a resolved location (live arg OR session `lastKnownLocation`) replies to a destination-only request by planning from that location with NO "where are you starting from" ask; a session that has only a `lastKnownLocation` also plans from it (surfaced as a possibly-stale default) and does not ask; only a brand-new session with no location ever captured produces the origin ask. The prompt builders and the `ridePlanningAgent.test.ts` assertions agree (no drift).

## Specification

Current state (verified by Read): `sendMessage.ts:393-420` already resolves `currentLocation = args.currentLocation ?? session.lastKnownLocation` and the client already guarantees location on first send (`app/(app)/(tabs)/index.tsx:394-409`); `buildRoutingPrompt` (`routingAgent.ts:1013-1026`) and `buildOrchestratorPrompt` (`orchestrator.ts:124-127`) instruct the agent never to ask the origin WHEN `ctx.currentLocation` is set. **GAP found:** (a) those builders surface only a binary current/unknown block — they do NOT distinguish a live location from a possibly-stale last-known one, and the unknown branch tells the agent to ASK rather than preferring last-known; (b) `ridePlanningAgent.test.ts:301-356` asserts a `buildSystemPrompt` that does a `lastKnownLocation` runQuery and emits "default origin" / "last known location" / "may be stale" / "Do NOT ask" wording the current `buildOrchestratorPrompt` does NOT produce — so the asserted contract and source are out of sync (this connects to the existing pending BOY-SCOUT migration of that same test file). This task: (1) proves the location-present happy path end-to-end on live dev; (2) reconciles the source prompts with the asserted last-known/no-ask contract by surfacing the resolved location (live vs possibly-stale) in the prompt the agent reads; (3) hardens the no-location branch to prefer last-known over asking, asking only when NO location was ever captured.

## Critical Constraints

- **MUST** prove end-to-end (live Convex dev `sendMessage`) that with a resolved location (live arg OR session lastKnownLocation), a destination-only request plans from that location and the assistant response does NOT ask "where are you starting from?".
- **MUST** resolve the source-vs-test drift: align `buildOrchestratorPrompt`/`buildRoutingPrompt` and the `ridePlanningAgent.test.ts` assertions ("default origin", "last known location", "may be stale", "Do NOT ask") so the prompt the agent actually reads matches the asserted contract — fix the SOURCE to honestly surface the resolved/last-known location, do NOT weaken the tests to pass broken behavior.
- **MUST** harden the unknown-location branch to PREFER the session's last-known location when present (surfacing it as a possibly-stale default origin) and only ask "where are you starting from?" as the LAST resort when no location was ever captured.
- **NEVER** fabricate a fix for already-correct behavior — if a sub-behavior is already fully correct, lock it with a verification test and say so; do not invent a no-op change and call it a fix.
- **NEVER** mock `sendMessage`/the agent in the PRIMARY integration assertion — drive a real planning session on live Convex dev with currentLocation present vs absent and assert the real assistant output / planning input.
- **STRICTLY** scope writes to the prompt builders, the sendMessage location-resolution path if a gap is found, and the location tests — do NOT change the routing pipeline, planRide, dedup (DATA-009), or any DISC-* client code (the client already guarantees location on first send).

## Acceptance Criteria

### AC-1: location present → plans from current location, never asks the origin
*(PRIMARY)*
- **GIVEN** a live Convex dev planning session and `sendMessage` called with `currentLocation = { lat:37.7749, lng:-122.4194 }` (San Francisco) and a destination-only message "plan a ride to Santa Cruz"
- **WHEN** the ride-planning agent runs end-to-end
- **THEN** the resolved start passed into planning is the current location (SF), a `route_plan` is produced from SF→Santa Cruz, and the assistant response text does NOT contain a "where are you starting from" ask
- **Test tier:** `integration` · **Service:** live Convex dev `sendMessage` → ride-planning agent (real planning session, currentLocation present)
- **Verify:** `pnpm test convex/actions/agent/__tests__/startLocationDefault.integration.test.ts`
- **Scenario** (start `session_with_live_location`):
  - must observe: the resolved planning start `=== { lat:37.7749, lng:-122.4194 }`; a route_plan with `planInput.start === ` the current location
  - must NOT observe: an assistant message containing `'where are you starting from'`; a `planInput.start` that is empty/defaulted (not the current location)
  - negative control (would fail if): the agent replies asking "where are you starting from?" despite a resolved location; the prompt builder ignores `ctx.currentLocation` (stub/no-op) so the agent has no origin and asks; the planning start is built from a hardcoded/default location instead of the provided current location

### AC-2: no live location but session has last-known → prefers it, does not ask
- **GIVEN** a live session whose `planning_sessions` row has a stored `lastKnownLocation` (e.g. `{lat:34.05,lng:-118.24}`) and a `sendMessage` call that OMITS `currentLocation`
- **WHEN** the agent runs a destination-only request
- **THEN** `sendMessage` resolves `currentLocation` from `session.lastKnownLocation`, the agent plans from it (surfaced in the prompt as a possibly-stale default origin), and the assistant response does NOT ask "where are you starting from?"
- **Test tier:** `integration` · **Service:** live Convex dev `sendMessage` with lastKnownLocation seeded, currentLocation omitted
- **Verify:** `pnpm test convex/actions/agent/__tests__/startLocationDefault.integration.test.ts`
- **Scenario** (start `session_with_last_known_only`):
  - must observe: the resolved planning origin `=== { lat:34.05, lng:-118.24 }` (last-known used); `currentLocation` resolves from `session.lastKnownLocation`
  - must NOT observe: an assistant message containing `'where are you starting from'`; `currentLocation` resolving to undefined/empty when a lastKnownLocation exists
  - negative control (would fail if): the lastKnownLocation fallback is dropped/removed so `currentLocation` resolves undefined and the agent asks; the prompt the agent reads omits the last-known block (empty) so the agent never sees the origin; the unknown branch is unchanged and still tells the agent to ask

### AC-3: prompt builders agree with the asserted last-known/no-ask contract (source-vs-test drift resolved)
- **GIVEN** the `buildSystemPrompt`/`buildOrchestratorPrompt` + `buildRoutingPrompt` builders and the `ridePlanningAgent.test.ts` location assertions
- **WHEN** the prompt is built for (a) currentLocation set, (b) currentLocation unset + session lastKnownLocation present, (c) no location anywhere
- **THEN** (a) the prompt names the location as the default origin and instructs NOT to ask; (b) the prompt surfaces the last-known location as a possibly-stale default origin and does NOT instruct asking; (c) only then does the prompt instruct asking — and the existing location tests pass against the real builders (no drift)
- **Test tier:** `integration` · **Service:** live Convex dev agent prompt builders (real `buildSystemPrompt`/`buildRoutingPrompt`, real session lastKnownLocation lookup)
- **Verify:** `pnpm test convex/actions/agent/__tests__/ridePlanningAgent.test.ts`
- **Scenario** (start `prompt_builder_three_location_states`):
  - must observe: the current-set prompt contains the resolved lat/lng (e.g. `'37.77'`) AND a no-ask/default-origin instruction; the last-known-only prompt surfaces `'last known location'` as a possibly-stale default origin; the no-location prompt contains the string `'where are you starting from'`
  - must NOT observe: the last-known-only prompt instructing the agent to ask the origin; the no-location prompt fabricating a lat/lng default origin
  - negative control (would fail if): the last-known-only prompt still instructs "ask where they are starting from" (unknown branch unchanged); the test is weakened/removed (empty assertions) to paper over the source; `buildOrchestratorPrompt` emits the same string for current-set and last-known states (stub) so the agent cannot tell live from stale

### AC-4: no location ever captured → asks the origin (last-resort path intact)
- **GIVEN** a brand-new live Convex dev session with NO `currentLocation` arg and NO session `lastKnownLocation`
- **WHEN** the rider sends a destination-only request
- **THEN** the agent asks "where are you starting from?" (the last-resort branch is preserved — hardening must NOT silently fabricate a fake origin)
- **Test tier:** `integration` · **Service:** live Convex dev `sendMessage` with no location anywhere
- **Verify:** `pnpm test convex/actions/agent/__tests__/startLocationDefault.integration.test.ts`
- **Scenario** (start `session_with_no_location`):
  - must observe: the assistant response contains the string `'where are you starting from'`; no route_plan is produced (planInput.start is absent)
  - must NOT observe: a route_plan whose start is a fabricated/hardcoded location (`0,0` or a default city); the agent silently planning without asking (no question, empty prompt)
  - negative control (would fail if): the agent fabricates a default origin (hardcoded `0,0` or a default city) instead of asking; the agent plans a route with an empty/invalid start; the agent crashes instead of asking

## Test Criteria

| ID | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | Integration (PRIMARY): with `currentLocation` present, a destination-only request plans from the current location and the assistant response does NOT ask "where are you starting from?". | AC-1 | `pnpm test convex/actions/agent/__tests__/startLocationDefault.integration.test.ts` |
| TC-2 | Integration: with only session `lastKnownLocation` (no live arg), the agent plans from it and does not ask the origin. | AC-2 | `pnpm test convex/actions/agent/__tests__/startLocationDefault.integration.test.ts` |
| TC-3 | Integration: the prompt builders surface current vs last-known-stale vs no-location distinctly and the `ridePlanningAgent.test.ts` location assertions pass against the real builders (drift resolved, tests not weakened). | AC-3 | `pnpm test convex/actions/agent/__tests__/ridePlanningAgent.test.ts` |
| TC-4 | Integration: with no location anywhere, the agent asks the origin (last-resort branch intact; no fabricated origin). | AC-4 | `pnpm test convex/actions/agent/__tests__/startLocationDefault.integration.test.ts` |

## Reading List

- `convex/actions/agent/sendMessage.ts` (393-420) — ALREADY-DONE — `currentLocation = args.currentLocation ?? session.lastKnownLocation` resolution + updateLastKnownLocation write; verify this path feeds `AgentContext.currentLocation` correctly (no change unless a gap is found)
- `convex/actions/agent/agents/routingAgent.ts` (1013-1030) — `buildRoutingPrompt` — current/unknown binary block; HARDEN: unknown branch must prefer last-known over asking, and surface a stale-default block when location came from lastKnownLocation
- `convex/actions/agent/agents/orchestrator.ts` (124-127) — `buildOrchestratorPrompt` locBlock — only current/unknown; reconcile with the asserted "default origin"/"last known location"/"may be stale"/"Do NOT ask" contract
- `convex/actions/agent/ridePlanningAgent.ts` (100-128) — `buildSystemPrompt` delegates to `buildOrchestratorPrompt`; AgentContext shape (23-31) carries currentLocation — confirm whether the lastKnownLocation lookup belongs here vs in sendMessage
- `convex/actions/agent/__tests__/ridePlanningAgent.test.ts` (301-356) — EXISTING ASSERTIONS out of sync with source — align the SOURCE to honor them (do NOT weaken these tests). Connects to pending BOY-SCOUT migration of this file.
- `convex/actions/agent/__tests__/sendMessage.test.ts` (300-380) — existing sendMessage location tests — extend with the lastKnownLocation-fallback + no-ask end-to-end assertions
- `app/(app)/(tabs)/index.tsx` (394-409) — CONTEXT ONLY (do not modify) — client already guarantees location on first send via `getCurrentLocation(2000)` fallback

## Guardrails

**WRITE-ALLOWED:**
- `convex/actions/agent/agents/orchestrator.ts` (MODIFY — buildOrchestratorPrompt locBlock: surface current vs last-known-stale vs none, honoring the asserted contract)
- `convex/actions/agent/agents/routingAgent.ts` (MODIFY — buildRoutingPrompt: harden the unknown branch to prefer last-known and surface a possibly-stale default origin)
- `convex/actions/agent/ridePlanningAgent.ts` (MODIFY ONLY IF the lastKnownLocation lookup the tests assert must live in buildSystemPrompt — otherwise leave unchanged)
- `convex/actions/agent/sendMessage.ts` (MODIFY ONLY IF a gap is found in the `args.currentLocation ?? session.lastKnownLocation` resolution — otherwise leave unchanged)
- `convex/actions/agent/__tests__/startLocationDefault.integration.test.ts` (NEW — end-to-end live-dev location tests)
- `convex/actions/agent/__tests__/ridePlanningAgent.test.ts` (MODIFY — only to keep the asserted contract in sync with the corrected source; tighten/realign, never weaken)

**WRITE-PROHIBITED:**
- `convex/actions/agent/lib/planRideOrchestrator.ts` — routing pipeline unchanged (DATA-009 owns dedup)
- `convex/actions/agent/planRide.ts`
- `app/(app)/(tabs)/index.tsx` and any DISC-* / `hooks/use-chat-planning.ts` client code — the client already guarantees location on first send; do NOT touch it
- `convex/db/planningSessions.ts` schema/lastKnownLocation shape (consume it, do not change it)
- Any file not listed in WRITE-ALLOWED

## Design

- **Pattern:** Resolve-then-instruct — `sendMessage` deterministically resolves the best available location (live arg → session last-known → none), and the agent prompt builders surface that resolved location to the LLM as the default origin (labelled live vs possibly-stale), instructing the agent never to ask the origin unless NO location was ever captured.
- **Pattern source:** `convex/actions/agent/sendMessage.ts` (393-420 resolution) + `buildRoutingPrompt` (the existing location-block pattern), per `convex/actions/agent/CLAUDE.md` "Deterministic logic wraps the probabilistic core".
- **Anti-pattern:** Fabricating a fake default origin (`0,0` or a hardcoded city) when no location exists instead of honestly asking; weakening the `ridePlanningAgent.test.ts` assertions to pass instead of fixing the source; emitting an identical prompt for live vs last-known so the agent cannot reflect staleness.
- ref: 09-routing.md (routing contract), 05-uc-disc.md#uc-disc-09

## Verification Gates

| Gate | Command |
|------|---------|
| typecheck | `pnpm type-check` |
| lint | `pnpm exec biome check 'convex/actions/agent/agents/orchestrator.ts' 'convex/actions/agent/agents/routingAgent.ts'` |
| prompt-builders | `pnpm test convex/actions/agent/__tests__/ridePlanningAgent.test.ts` |
| integration-location | `pnpm test convex/actions/agent/__tests__/startLocationDefault.integration.test.ts` |
| convex-build | `pnpm convex:dev -- --once` |
| scenario | `RED-against-bug: the AC-3 test must FAIL on the current builders (last-known block absent / drift) before the reconciliation makes it pass; AC-1 is a lock-in VERIFY` |
| human_gate | `Chat a ride without giving a start ("plan a ride to Santa Cruz") with location enabled → the agent plans from your current location WITHOUT asking; deny location → it falls back to last-known if available, asking only when no location was ever captured` |

## Coding Standards

- Honest verification: do NOT fabricate a fix for already-correct behavior — where the happy path is already correct, lock it with an integration test and document that it was a VERIFY; only the unknown-branch hardening + source-vs-test reconciliation are real changes.
- Non-degenerate assertion: AC-1 must observe BOTH the resolved start `===` current location AND the absence of the origin-ask string — a pass that only checks one is fakeable.
- Never weaken the `ridePlanningAgent.test.ts` location assertions to make them pass — fix the SOURCE prompt builders to honor the asserted contract.
- Never fabricate an origin: when no location exists, the agent must ask (AC-4), never silently plan from a fake start.
- Implementer judgment (flagged): whether the lastKnownLocation lookup belongs in `buildSystemPrompt` (as the test asserts) or stays in `sendMessage` with the resolved value passed through `ctx.currentLocation` — settle against the asserted test contract; it determines whether `ridePlanningAgent.ts` is touched.

## Dependencies

- Depends on: DATA-008 (the agent ReAct loop the prompt feeds)
- Blocks: (none) — coordinates with pending BOY-SCOUT migration of `ridePlanningAgent.test.ts` (task #831); land them consistently so the location assertions match the corrected builders.

## Notes

Verified by Read, not re-implemented blindly: the happy path is LARGELY DONE — `sendMessage.ts:393-420` resolves `args.currentLocation ?? session.lastKnownLocation`, `buildRoutingPrompt:1013-1026` already says "NEVER ask where are you starting from" when `ctx.currentLocation` is set, and the client already guarantees location on first send. So AC-1/AC-2's PRIMARY value is a locked-in VERIFY against live dev. The REAL gap (the honest hardening target): `ridePlanningAgent.test.ts:301-356` asserts a `buildSystemPrompt` lastKnownLocation runQuery + "default origin"/"last known location"/"may be stale"/"Do NOT ask" wording that the current `buildOrchestratorPrompt:124-127` does NOT produce. AC-3 resolves that drift by aligning the SOURCE to the asserted contract; AC-2/AC-4 harden the unknown branch to prefer last-known and only ask as a last resort. The PRIMARY assertions run against live Convex dev `sendMessage` (no mocking of the agent), per the project iron rule.

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "fixtures": {
    "session_with_live_location": {
      "description": "A live Convex dev planning session, sendMessage called with currentLocation={lat:37.7749,lng:-122.4194} (San Francisco) and a destination-only message 'plan a ride to Santa Cruz'. Exercises the location-present happy path (Item 3 expected behavior).",
      "seed_method": "public_api",
      "records": [
        "planning_sessions row owned by the test identity",
        "sendMessage(content='plan a ride to Santa Cruz', currentLocation={lat:37.7749,lng:-122.4194})"
      ]
    },
    "session_with_last_known_only": {
      "description": "A live session whose planning_sessions.lastKnownLocation = {lat:34.05,lng:-118.24} (seeded via a prior located turn / updateLastKnownLocation), with the next sendMessage OMITTING currentLocation. Exercises the lastKnownLocation fallback + hardened no-ask branch.",
      "seed_method": "public_api",
      "records": [
        "planning_sessions.lastKnownLocation = {lat:34.05,lng:-118.24}",
        "sendMessage(content='plan a ride to the coast') with no currentLocation arg"
      ]
    },
    "session_with_no_location": {
      "description": "A brand-new live session with NO currentLocation arg and NO stored lastKnownLocation. Exercises the last-resort origin-ask branch.",
      "seed_method": "public_api",
      "records": [
        "planning_sessions row with lastKnownLocation undefined",
        "sendMessage(content='plan a ride to Napa') with no currentLocation"
      ]
    },
    "prompt_builder_three_location_states": {
      "description": "Three AgentContext inputs for the prompt-builder assertions against the REAL builders: (a) currentLocation set; (b) currentLocation undefined + a session lastKnownLocation lookup returning {lat:34.05,lng:-118.24}; (c) no location anywhere.",
      "seed_method": "public_api",
      "records": [
        "ctx.currentLocation = {lat:37.77,lng:-122.42}",
        "ctx.currentLocation undefined; runQuery returns {lastKnownLocation:{lat:34.05,lng:-118.24}}",
        "ctx.currentLocation undefined; runQuery returns {lastKnownLocation:undefined}"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": true,
      "description": "GIVEN currentLocation present WHEN a destination-only request runs THEN the agent plans from current location and does NOT ask 'where are you starting from?'",
      "verify": "pnpm test convex/actions/agent/__tests__/startLocationDefault.integration.test.ts",
      "scenario": {
        "start_ref": "session_with_live_location",
        "tier": "integration",
        "test_tier": "integration",
        "verification_service": "live Convex dev sendMessage -> orchestrator -> routing agent (real session)",
        "negative_control": { "would_fail_if": [
          "the agent replies asking 'where are you starting from?' despite a resolved location (the bug from image #3)",
          "the prompt builder ignores ctx.currentLocation (stub/no-op) so the agent has no origin and asks",
          "the planning start is built from a hardcoded/default location instead of the provided current location"
        ] },
        "evidence": { "artifact_type": "api_response", "required_capture": true },
        "cases": [ {
          "start_ref": "session_with_live_location",
          "action": { "actor": "rider via sendMessage on live Convex dev", "steps": [
            "create a planning session",
            "call sendMessage(sessionId, 'plan a ride to Santa Cruz', currentLocation={lat:37.7749,lng:-122.4194})",
            "read the assistant response text and the produced route_plan's planInput.start"
          ] },
          "end_state": {
            "must_observe": [
              "the resolved planning start === { lat:37.7749, lng:-122.4194 } (current location used as origin)",
              "a route_plan is produced with planInput.start === the current location"
            ],
            "must_not_observe": [
              "an assistant message containing 'where are you starting from'",
              "a planInput.start that is empty/defaulted (not the current location)"
            ]
          }
        } ]
      }
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "GIVEN only session lastKnownLocation WHEN currentLocation omitted THEN the agent prefers last-known and does not ask the origin",
      "verify": "pnpm test convex/actions/agent/__tests__/startLocationDefault.integration.test.ts",
      "scenario": {
        "start_ref": "session_with_last_known_only",
        "tier": "integration",
        "test_tier": "integration",
        "primary": false,
        "verification_service": "live Convex dev sendMessage (lastKnownLocation fallback path)",
        "negative_control": { "would_fail_if": [
          "the lastKnownLocation fallback is dropped/removed so currentLocation resolves undefined and the agent asks",
          "the prompt the agent reads omits the last-known block (empty) so the agent never sees the origin",
          "the unknown branch is unchanged and still tells the agent to ask"
        ] },
        "evidence": { "artifact_type": "api_response", "required_capture": true },
        "cases": [ {
          "start_ref": "session_with_last_known_only",
          "action": { "actor": "rider via sendMessage on live Convex dev", "steps": [
            "seed the session's lastKnownLocation = {lat:34.05,lng:-118.24} via a prior located sendMessage / updateLastKnownLocation",
            "call sendMessage(sessionId, 'plan a ride to the coast') WITHOUT a currentLocation arg",
            "read the assistant response and the resolved planning origin"
          ] },
          "end_state": {
            "must_observe": [
              "the resolved planning origin === { lat:34.05, lng:-118.24 } (last-known used)",
              "currentLocation === session.lastKnownLocation { lat:34.05, lng:-118.24 } (resolved via the fallback)"
            ],
            "must_not_observe": [
              "an assistant message containing 'where are you starting from'",
              "currentLocation resolving to undefined/empty when a lastKnownLocation exists"
            ]
          }
        } ]
      }
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "description": "GIVEN the prompt builders WHEN built for current/last-known/none THEN they surface each state distinctly and the existing location tests pass against the real builders (drift resolved, not weakened)",
      "verify": "pnpm test convex/actions/agent/__tests__/ridePlanningAgent.test.ts",
      "scenario": {
        "start_ref": "prompt_builder_three_location_states",
        "tier": "integration",
        "test_tier": "integration",
        "primary": false,
        "verification_service": "real buildSystemPrompt + buildRoutingPrompt with a real session lastKnownLocation lookup",
        "negative_control": { "would_fail_if": [
          "the last-known-only prompt still instructs 'ask where they are starting from' (unknown branch unchanged)",
          "the test is weakened/removed (empty assertions) to paper over the source not emitting the last-known block",
          "buildOrchestratorPrompt emits the same string for current-set and last-known states (stub) so the agent cannot tell live from stale"
        ] },
        "evidence": { "artifact_type": "stdout", "required_capture": true },
        "cases": [ {
          "start_ref": "prompt_builder_three_location_states",
          "action": { "actor": "prompt builder", "steps": [
            "build prompt with currentLocation set -> assert it contains the default-origin / no-ask instruction and the lat/lng",
            "build prompt with currentLocation unset but session lastKnownLocation present -> assert it surfaces the last-known location as a possibly-stale default and does NOT instruct asking",
            "build prompt with no location anywhere -> assert it instructs asking the origin"
          ] },
          "end_state": {
            "must_observe": [
              "the current-set prompt contains the resolved lat/lng (e.g. '37.77') AND a no-ask/default-origin instruction",
              "the last-known-only prompt surfaces 'last known location' as a possibly-stale default origin",
              "the no-location prompt contains the string 'where are you starting from'"
            ],
            "must_not_observe": [
              "the last-known-only prompt instructing the agent to ask the origin",
              "the no-location prompt fabricating a lat/lng default origin"
            ]
          }
        } ]
      }
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "description": "GIVEN no location anywhere WHEN a destination-only request runs THEN the agent asks the origin (last-resort intact, no fabricated start)",
      "verify": "pnpm test convex/actions/agent/__tests__/startLocationDefault.integration.test.ts",
      "scenario": {
        "start_ref": "session_with_no_location",
        "tier": "integration",
        "test_tier": "integration",
        "primary": false,
        "verification_service": "live Convex dev sendMessage (no-location last-resort branch)",
        "negative_control": { "would_fail_if": [
          "the agent fabricates a default origin (hardcoded 0,0 or a default city) instead of asking when no location exists",
          "the agent plans a route with an empty/invalid start",
          "the agent crashes instead of asking"
        ] },
        "evidence": { "artifact_type": "api_response", "required_capture": true },
        "cases": [ {
          "start_ref": "session_with_no_location",
          "action": { "actor": "rider via sendMessage on live Convex dev", "steps": [
            "create a fresh session with no lastKnownLocation",
            "call sendMessage(sessionId, 'plan a ride to Napa') with NO currentLocation",
            "read the assistant response"
          ] },
          "end_state": {
            "must_observe": [
              "the assistant response contains the string 'where are you starting from'",
              "route_plan count === 0 (no plan produced from a missing origin)"
            ],
            "must_not_observe": [
              "a route_plan whose start is a fabricated/hardcoded location (0,0 or a default city)",
              "the agent silently planning without asking (no question, empty prompt)"
            ]
          }
        } ]
      }
    },
    { "id": "TC-1", "type": "test_criterion", "description": "location present -> plans from current location, no origin ask (PRIMARY)", "verify": "pnpm test convex/actions/agent/__tests__/startLocationDefault.integration.test.ts", "maps_to_ac": "AC-1" },
    { "id": "TC-2", "type": "test_criterion", "description": "last-known-only -> prefers it, no ask", "verify": "pnpm test convex/actions/agent/__tests__/startLocationDefault.integration.test.ts", "maps_to_ac": "AC-2" },
    { "id": "TC-3", "type": "test_criterion", "description": "prompt builders agree with asserted contract; existing tests pass unweakened", "verify": "pnpm test convex/actions/agent/__tests__/ridePlanningAgent.test.ts", "maps_to_ac": "AC-3" },
    { "id": "TC-4", "type": "test_criterion", "description": "no location -> asks origin (last-resort, no fabrication)", "verify": "pnpm test convex/actions/agent/__tests__/startLocationDefault.integration.test.ts", "maps_to_ac": "AC-4" }
  ]
}
-->
