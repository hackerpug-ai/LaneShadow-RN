# S2-T3 — rideAgentSpike.ts — stateless @mastra/core Agent in a 'use node' action, 2-turn Ogden center inheritance (memory:undefined)

| Field | Value |
|-------|-------|
| TASK_ID | S2-T3 |
| SPRINT | [Sprint 02 — Mastra spike + z.ai proof + enrichment re-ratification](./SPRINT.md) |
| TASK_TYPE | FEATURE |
| AGENT | implementer=`mastra-implementer` · reviewer=`mastra-reviewer` |
| ESTIMATE | 150 min |
| EFFORT | L |
| PRIORITY | P0 |
| STATUS | Backlog |
| PROPOSED_BY | `mastra-planner` |
| TDD_MODE | `red_first` |
| RED_GREEN_REQUIRED | yes |
| CAPABILITIES | CAP-AGT-01, CAP-AGT-02 |
| DEPENDS_ON | S2-T1, S2-T2 |
| BLOCKS | S2-T4, S2-T5, S2-T7 |

RUNTIME_COMMANDS:
- test: `pnpm test convex/actions/agent/spike/__tests__/rideAgentSpike.integration.test.ts`
- typecheck: `pnpm type-check`
- lint: `pnpm exec biome check`

## OUTCOME

Turn 1 'twisty roads near Ogden' geocodes Ogden and calls searchCuratedRoutes with the Ogden center; turn 2 'OK what's scenic' in the same session calls searchCuratedRoutes with the SAME inherited Ogden center (not statewide); a concurrent Sacramento session does not inherit Ogden; the orchestrator tier resolves one real completion and the tripwire is handled at the call site.

## 🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)

**MUST**
- Import Agent from '@mastra/core/agent' (subpath — root exports only Mastra).
- model is the orchestrator tier ModelRouter STRING resolved from convex/actions/agent/lib/models.ts (S2-T1), e.g. 'anthropic/claude-sonnet-…' — no provider/model literal outside the tier map.
- Register S2-T2's tools: { geocodePlace, searchCuratedRoutes }.
- Construct the Agent with memory: undefined — NO @mastra/memory anywhere.
- The agent singleton is STATELESS by contract: all per-request data (sessionId, resolved center, prior turns) flows via RequestContext and per-call messages — NEVER module scope (risk #17; routingAgent.ts pendingSketches is the cited precedent).
- 2-turn center inheritance uses a DETERMINISTIC working-memory seam: after turn 1 resolves the Ogden center it is captured in a per-session working-memory object (agentMemory: resolved center) threaded through the action (arg/return or planning_sessions), and injected into turn 2 as a dynamic prompt block / prior message — not @mastra/memory.
- Handle the tripwire at the generate call site: check result.tripwire (and result.finishReason === 'other') on every agent.generate — a blocked turn is surfaced, never silently treated as a normal reply.
- Verify the orchestrator tier resolves with ONE real completion before the batch; if the router cannot resolve the pinned Sonnet id, use the documented explicit AI-SDK model-instance escape.

**NEVER**
- NEVER add @mastra/memory or pass a memory adapter to the Agent (risk #16 resolution: memory:undefined, deterministic working memory).
- NEVER store a per-request identifier (sessionId, center, rider location, prior turns) in module scope.
- NEVER let turn 2 devolve to a statewide/national-best search — it MUST carry the inherited Ogden center.
- NEVER mock @mastra/core or the model provider for the PRIMARY/inheritance ACs — they run real Anthropic + real tools on dev.
- NEVER read/assert on the reply PROSE for the center — assert on the tool-call arguments and persisted working-memory center (E2E constitution).
- NEVER pass a pi-ai Model object as the model (Mastra cannot consume it — risk #15).

**STRICTLY**
- STRICTLY test_tier=integration for AC-1..AC-4 against the deployed 'use node' action on cloud/dev with real Anthropic + real Google + real Convex.
- STRICTLY SKIP-with-reason (never fake success) if the orchestrator tier / Anthropic / dev deployment is unreachable.
- STRICTLY assert engine outcomes: turn-2 searchCuratedRoutes tool-call center argument and the persisted per-session working-memory center — never the assistant text.

## SPECIFICATION

**Objective:** Prove @mastra/core runs inside a Convex 'use node' action: a stateless Agent on the orchestrator tier with S2-T2's tools and memory:undefined answers a 2-turn Ogden conversation where turn 2 inherits the turn-1 center through a deterministic working-memory seam, with no cross-session bleed.

**Success state:** Turn 1 'twisty roads near Ogden' geocodes Ogden and calls searchCuratedRoutes with the Ogden center; turn 2 'OK what's scenic' in the same session calls searchCuratedRoutes with the SAME inherited Ogden center (not statewide); a concurrent Sacramento session does not inherit Ogden; the orchestrator tier resolves one real completion and the tripwire is handled at the call site.

## FIXTURES (shared seed data — referenced by scenario `start_ref`)

- `ogden_session_turn1` (seed_method: `recorded_external`): Turn 1 rider input 'twisty roads near Ogden' seeded through the REAL deployed spike action; expected resolved Ogden center ~41.223,-111.973.
- `ogden_session_turn2` (seed_method: `public_api`): Turn 2 follow-up 'OK what's scenic' in the same sessionId, run through the real action with turn-1's working-memory center threaded in.
- `sacramento_concurrent_session` (seed_method: `public_api`): A distinct concurrent session to prove no singleton bleed: 'scenic roads near Sacramento' must resolve Sacramento (~38.58,-121.49), never Ogden.
- `orchestrator_tier_probe` (seed_method: `recorded_external`): The orchestrator ModelRouter string + a trivial prompt used to verify the tier resolves one real completion (the pin-verification landmine).

## ACCEPTANCE CRITERIA (TDD beads — RED → GREEN → REFACTOR per AC)

### AC-1

**Requirement:** GIVEN the deployed spike action and turn 1 'twisty roads near Ogden' WHEN the stateless @mastra/core Agent runs on the orchestrator tier with the real tools THEN it calls geocodePlace then searchCuratedRoutes with a center resolved to Ogden (lat in [41.1,41.35], lng in [-112.1,-111.85]) and results carry server distanceMi

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: deployed Convex 'use node' action + real Anthropic (orchestrator tier) + real Google Geocoding + real curated_routes
- FLOW_REF: UC-AGT-01
- VERIFY: `pnpm test convex/actions/agent/spike/__tests__/rideAgentSpike.integration.test.ts -t "turn 1 grounds the search in the resolved Ogden center"`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: @mastra/core is mocked or the Agent never runs inside the 'use node' action (the loop is a faked/static return); the model reference is a pi-ai Model object so the Agent never instantiates (risk #15); the searchCuratedRoutes tool-call is invoked with center undefined so the search silently devolves to national-best; the resolved center is hardcoded to Ogden rather than produced by the real geocodePlace call
- EVIDENCE: `stdout` (required_capture: true)
- CASE 1 — start_ref `ogden_session_turn1`
    - ACTION (cli_user): invoke the deployed spike action with sessionId 'spike-ogden-1' and 'twisty roads near Ogden' → capture the ordered tool-calls and their arguments
    - MUST_OBSERVE: toolCalls.some(c => c.name === 'geocodePlace' && c.args.place.includes('Ogden')) === true; the searchCuratedRoutes tool-call arg center.lat >= 41.1 && center.lat <= 41.35; the searchCuratedRoutes tool-call arg center.lng >= -112.1 && center.lng <= -111.85; result.finishReason === 'stop' || result.finishReason === 'tool-calls'
    - MUST_NOT_OBSERVE: searchCuratedRoutes tool-call arg center === undefined; result.finishReason === 'other' with an unhandled tripwire; 0 tool-calls made (nothing invoked — the agent loop never ran)

### AC-2

**Requirement:** GIVEN the same session after turn 1 resolved Ogden WHEN turn 2 'OK what's scenic' runs with the deterministic working-memory center threaded in THEN turn 2's searchCuratedRoutes tool-call carries the inherited Ogden center and the persisted per-session working-memory center equals the turn-1 Ogden center — not a statewide search

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: deployed Convex 'use node' action + real Anthropic (orchestrator tier) + real tools; deterministic working memory, memory:undefined
- VERIFY: `pnpm test convex/actions/agent/spike/__tests__/rideAgentSpike.integration.test.ts -t "turn 2 inherits the Ogden center via deterministic working memory"`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: the agent uses @mastra/memory instead of the deterministic working-memory injection (memory !== undefined); turn 2 sends an empty/omitted center so the search silently devolves to statewide/national best (the original bug); the inherited center is stubbed/hardcoded to Ogden rather than carried from turn-1's real geocode; the working-memory center is stored in module singleton scope rather than threaded per-session
- EVIDENCE: `stdout` (required_capture: true)
- CASE 1 — start_ref `ogden_session_turn2`
    - ACTION (cli_user): invoke the deployed spike action turn 2 with sessionId 'spike-ogden-1' and 'OK what's scenic', threading turn-1 working memory → capture turn-2 tool-call args and the persisted per-session working-memory center
    - MUST_OBSERVE: turn2.searchCuratedRoutes tool-call arg center.lat >= 41.1 && center.lat <= 41.35 (Ogden inherited); turn2 center.lng >= -112.1 && center.lng <= -111.85; Math.abs(workingMemory.center.lat - turn1.center.lat) <= 0.05 && Math.abs(workingMemory.center.lng - turn1.center.lng) <= 0.05; agent.memory === undefined
    - MUST_NOT_OBSERVE: turn2.searchCuratedRoutes tool-call arg center === undefined (statewide devolution); turn2 resolves sort === 'best' with center absent (national-best); the persisted working-memory center is empty/null (0 center carried from turn 1)

### AC-3

**Requirement:** GIVEN a concurrent Sacramento session running alongside the Ogden session WHEN both sessions run through the same module-level Agent THEN the Sacramento session resolves Sacramento while the Ogden session stays Ogden — the two per-session working-memory centers differ, and no per-request identifier lives in module scope

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: deployed Convex 'use node' action + real Anthropic + real Google (two concurrent sessions)
- VERIFY: `pnpm test convex/actions/agent/spike/__tests__/rideAgentSpike.integration.test.ts -t "concurrent sessions do not bleed center through the singleton"`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: the resolved center is captured in module scope so session B inherits Ogden (the pendingSketches singleton-bleed pattern); the two sessions are run against a mocked/stubbed agent so bleed can't manifest; session state is keyed by module singleton rather than threaded through RequestContext / per-call messages
- EVIDENCE: `stdout` (required_capture: true)
- CASE 1 — start_ref `sacramento_concurrent_session`
    - ACTION (cli_user): run session 'spike-sac-2' with 'scenic roads near Sacramento' interleaved with the Ogden session → capture each session's searchCuratedRoutes center + persisted working-memory center
    - MUST_OBSERVE: sessionB.center.lat >= 38.4 && sessionB.center.lat <= 38.75 (Sacramento); sessionA.center.lat >= 41.1 && sessionA.center.lat <= 41.35 (Ogden); Math.abs(sessionA.center.lat - sessionB.center.lat) > 2 (distinct per session)
    - MUST_NOT_OBSERVE: sessionB.center.lat >= 41.1 && sessionB.center.lat <= 41.35 (session B inherited Ogden); sessionB working-memory center is empty/null (0 center resolved for Sacramento); a per-request sessionId or center found in the agent module's module scope

### AC-4

**Requirement:** GIVEN the orchestrator ModelRouter string from the tier map WHEN the spike agent runs one real completion THEN result.finishReason is a real terminal reason and the call site branches on result.tripwire — verifying the router resolves the pinned Sonnet id (else the AI-SDK-instance escape)

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: real Anthropic via the orchestrator ModelRouter string (or the documented explicit AI-SDK instance escape)
- VERIFY: `pnpm test convex/actions/agent/spike/__tests__/rideAgentSpike.integration.test.ts -t "orchestrator tier resolves a real completion and tripwire is handled"`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: the orchestrator tier is a pi-ai Model object so the Agent never instantiates (risk #15); the completion is mocked/stubbed instead of resolving the real orchestrator tier against real Anthropic; the tripwire is never inspected at the call site (a finishReason:'other' is silently dropped)
- EVIDENCE: `stdout` (required_capture: true)
- CASE 1 — start_ref `orchestrator_tier_probe`
    - ACTION (api_client): run one real generate on the orchestrator tier with a trivial prompt → inspect result.finishReason and result.tripwire at the call site
    - MUST_OBSERVE: result.finishReason === 'stop' || result.finishReason === 'tool-calls'; result.text.length >= 1 || result.toolCalls.length >= 1 (a real completion resolved); the call site branches on result.tripwire === undefined vs a { reason } object (finishReason === 'other' routes to handleBlocked)
    - MUST_NOT_OBSERVE: result.finishReason === 'other' with result.tripwire left unread (unhandled); result.text === '' && result.toolCalls.length === 0 (empty completion — the tier did not resolve); the model reference is a pi-ai Model object (Mastra cannot consume it)

## TEST CRITERIA

| TC | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | turn 1 'twisty roads near Ogden' through the deployed action makes a searchCuratedRoutes tool-call whose center.lat is in [41.1,41.35] and lng in [-112.1,-111.85] | AC-1 | `pnpm test convex/actions/agent/spike/__tests__/rideAgentSpike.integration.test.ts -t "turn 1 grounds the search in the resolved Ogden center"` |
| TC-2 | turn 2 'OK what's scenic' in the same session makes a searchCuratedRoutes tool-call carrying the inherited Ogden center and the persisted working-memory center is within 0.05 deg of turn 1, with memory===undefined | AC-2 | `pnpm test convex/actions/agent/spike/__tests__/rideAgentSpike.integration.test.ts -t "turn 2 inherits the Ogden center via deterministic working memory"` |
| TC-3 | a concurrent Sacramento session resolves center.lat in [38.4,38.75] while the Ogden session stays in [41.1,41.35] — the two working-memory centers differ by >2 deg latitude and no per-request id is in module scope | AC-3 | `pnpm test convex/actions/agent/spike/__tests__/rideAgentSpike.integration.test.ts -t "concurrent sessions do not bleed center through the singleton"` |
| TC-4 | one real orchestrator-tier completion returns finishReason in {stop,tool-calls} with text.length>=1 or toolCalls.length>=1, and the call site branches on result.tripwire | AC-4 | `pnpm test convex/actions/agent/spike/__tests__/rideAgentSpike.integration.test.ts -t "orchestrator tier resolves a real completion and tripwire is handled"` |

## SCOPE (file-level write permissions)

**writeAllowed:**
- `convex/actions/agent/spike/rideAgentSpike.ts (NEW — stateless Agent factory + deterministic working-memory injection)`
- `convex/actions/agent/spike/rideAgentSpikeAction.ts (NEW — the 'use node' action runSpikeTurn)`
- `convex/actions/agent/spike/__tests__/rideAgentSpike.integration.test.ts (NEW)`

**writeProhibited:**
- `any @mastra/memory import (memory:undefined is mandatory)`
- `convex/actions/agent/lib/models.ts (read-only — S2-T1 owns the orchestrator tier)`
- `convex/actions/agent/spike/spikeTools.ts (S2-T2 owns the tool defs; consume read-only)`
- `any @mariozechner/pi-ai file or teardown (additive spike only)`
- `the React Native app and convex/schema.ts`

## READING LIST

- `.spec/prds/route-agent-quality/08-uc-agt.md`:37-53 — UC-AGT-01 AC-1 (one agent loop replaces the dispatch) + AC-5 ('OK what's scenic' inherits prior center)
- `.spec/prds/route-agent-quality/10-technical-requirements/08-technical-risks.md`:26-27 — risk #16 memory:undefined + working memory rides the session; risk #17 singleton bleed (pendingSketches precedent)
- `convex/actions/agent/agents/routingAgent.ts`:70-95 — pendingSketches sessionId-keyed module map — the exact stateful-singleton anti-pattern to NOT repeat; thread state through RequestContext instead
- `convex/actions/agent/lib/models.ts`:1-48 — tier map — consume the orchestrator ModelRouter string added by S2-T1; no model literal outside this file
- `convex/actions/agent/spike/spikeTools.ts`:1-40 — S2-T2's geocodePlace + searchCuratedRoutes tool defs to register on the Agent

## CODE PATTERN

- Pattern: const agent = new Agent({ id:'ride-agent-spike', name, instructions, model: orchestratorTierString, tools: { geocodePlace, searchCuratedRoutes }, memory: undefined }); const res = await agent.generate(messages, { requestContext }); if (res.tripwire) handleBlocked(res.tripwire)
- Pattern source: `@mastra/core/agent (Rosetta KB) + 08-technical-risks #16/#17 resolutions`
- Anti-pattern: @mastra/memory adapter; per-request center/sessionId in module scope (pendingSketches); {threadId,resourceId} top-level; model object instead of tier string; pi-ai Model object

## VERIFICATION GATES

- integration tests pass against the deployed action + real services: `pnpm test convex/actions/agent/spike/__tests__/rideAgentSpike.integration.test.ts` → Exit 0
- typecheck: `pnpm type-check` → Exit 0
- lint: `pnpm exec biome check` → Exit 0
- no @mastra/memory anywhere in the spike: `grep -rn "@mastra/memory" convex/actions/agent/spike/` → no matches
- no per-request identifier held in module scope: `grep -nE "^(const|let|var) .*(session|center|resource|rider)" convex/actions/agent/spike/rideAgentSpike.ts` → no module-scope per-request state (reviewer confirms)
- deploy to cloud dev before the integration run: `npx convex deploy` → deploy succeeds; spike action registered

## AGENT ASSIGNMENT

- Implementer: `mastra-implementer` — A stateless @mastra/core Agent constructed inside a Convex 'use node' action, wired to S2-T2's tools on the orchestrator tier with memory:undefined and a deterministic working-memory seam — the core §5b Mastra-in-Convex proof, verified turn-by-turn against real Anthropic + real tools on the dev deployment. Exactly mastra-implementer's remit.
- Reviewer: `mastra-reviewer`

## EVIDENCE GATES

- RED phase: each behavioral AC test went red before green (TDD_STATE history).
- Integration/E2E coverage: PRIMARY AC hits real services; captured EVIDENCE shows the seeded MUST_OBSERVE value (not merely "tests passed").
- Scenario un-fakeable: `validate_scenario` exit 0 on every behavioral AC.

## DEPENDENCIES

- Depends on: S2-T1, S2-T2
- Blocks: S2-T4, S2-T5, S2-T7

<details>
<summary>▸ Full agent specification (TASK-TEMPLATE v5.2 — machine-readable requirement contract)</summary>

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "version": "1",
  "task_id": "S2-T3",
  "tdd_mode": "red_first",
  "verification_policy": {
    "requires_tests": true,
    "requires_red_evidence": true,
    "requires_seeded_evidence": true
  },
  "fixtures": {
    "ogden_session_turn1": {
      "description": "Turn 1 rider input 'twisty roads near Ogden' seeded through the REAL deployed spike action; expected resolved Ogden center ~41.223,-111.973.",
      "seed_method": "recorded_external",
      "records": [
        "sessionId='spike-ogden-1'",
        "riderInput='twisty roads near Ogden'",
        "expected geocodePlace center ~41.223,-111.973",
        "expected searchCuratedRoutes tool-call center ~Ogden"
      ]
    },
    "ogden_session_turn2": {
      "description": "Turn 2 follow-up 'OK what's scenic' in the same sessionId, run through the real action with turn-1's working-memory center threaded in.",
      "seed_method": "public_api",
      "records": [
        "sessionId='spike-ogden-1'",
        "riderInput='OK what's scenic'",
        "expected turn-2 searchCuratedRoutes tool-call center inherited ~Ogden"
      ]
    },
    "sacramento_concurrent_session": {
      "description": "A distinct concurrent session to prove no singleton bleed: 'scenic roads near Sacramento' must resolve Sacramento (~38.58,-121.49), never Ogden.",
      "seed_method": "public_api",
      "records": [
        "sessionId='spike-sac-2'",
        "riderInput='scenic roads near Sacramento'",
        "expected center ~38.58,-121.49"
      ]
    },
    "orchestrator_tier_probe": {
      "description": "The orchestrator ModelRouter string + a trivial prompt used to verify the tier resolves one real completion (the pin-verification landmine).",
      "seed_method": "recorded_external",
      "records": [
        "model=orchestrator tier string from lib/models.ts",
        "prompt='Reply with the single word OK.'",
        "expected finishReason in {stop, tool-calls}"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": false,
      "maps_to_ac": null,
      "description": "GIVEN the deployed spike action and turn 1 'twisty roads near Ogden' WHEN the stateless @mastra/core Agent runs on the orchestrator tier with the real tools THEN it calls geocodePlace then searchCuratedRoutes with a center resolved to Ogden (lat in [41.1,41.35], lng in [-112.1,-111.85]) and results carry server distanceMi",
      "verify": "pnpm test convex/actions/agent/spike/__tests__/rideAgentSpike.integration.test.ts -t \"turn 1 grounds the search in the resolved Ogden center\"",
      "scenario": {
        "id": "AC-1",
        "primary": true,
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "deployed Convex 'use node' action + real Anthropic (orchestrator tier) + real Google Geocoding + real curated_routes",
        "negative_control": {
          "would_fail_if": [
            "@mastra/core is mocked or the Agent never runs inside the 'use node' action (the loop is a faked/static return)",
            "the model reference is a pi-ai Model object so the Agent never instantiates (risk #15)",
            "the searchCuratedRoutes tool-call is invoked with center undefined so the search silently devolves to national-best",
            "the resolved center is hardcoded to Ogden rather than produced by the real geocodePlace call"
          ]
        },
        "evidence": {
          "artifact_type": "stdout",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "ogden_session_turn1",
            "action": {
              "actor": "cli_user",
              "steps": [
                "invoke the deployed spike action with sessionId 'spike-ogden-1' and 'twisty roads near Ogden'",
                "capture the ordered tool-calls and their arguments"
              ]
            },
            "end_state": {
              "must_observe": [
                "toolCalls.some(c => c.name === 'geocodePlace' && c.args.place.includes('Ogden')) === true",
                "the searchCuratedRoutes tool-call arg center.lat >= 41.1 && center.lat <= 41.35",
                "the searchCuratedRoutes tool-call arg center.lng >= -112.1 && center.lng <= -111.85",
                "result.finishReason === 'stop' || result.finishReason === 'tool-calls'"
              ],
              "must_not_observe": [
                "searchCuratedRoutes tool-call arg center === undefined",
                "result.finishReason === 'other' with an unhandled tripwire",
                "0 tool-calls made (nothing invoked — the agent loop never ran)"
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
      "maps_to_ac": null,
      "description": "GIVEN the same session after turn 1 resolved Ogden WHEN turn 2 'OK what's scenic' runs with the deterministic working-memory center threaded in THEN turn 2's searchCuratedRoutes tool-call carries the inherited Ogden center and the persisted per-session working-memory center equals the turn-1 Ogden center — not a statewide search",
      "verify": "pnpm test convex/actions/agent/spike/__tests__/rideAgentSpike.integration.test.ts -t \"turn 2 inherits the Ogden center via deterministic working memory\"",
      "scenario": {
        "id": "AC-2",
        "primary": false,
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "deployed Convex 'use node' action + real Anthropic (orchestrator tier) + real tools; deterministic working memory, memory:undefined",
        "negative_control": {
          "would_fail_if": [
            "the agent uses @mastra/memory instead of the deterministic working-memory injection (memory !== undefined)",
            "turn 2 sends an empty/omitted center so the search silently devolves to statewide/national best (the original bug)",
            "the inherited center is stubbed/hardcoded to Ogden rather than carried from turn-1's real geocode",
            "the working-memory center is stored in module singleton scope rather than threaded per-session"
          ]
        },
        "evidence": {
          "artifact_type": "stdout",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "ogden_session_turn2",
            "action": {
              "actor": "cli_user",
              "steps": [
                "invoke the deployed spike action turn 2 with sessionId 'spike-ogden-1' and 'OK what's scenic', threading turn-1 working memory",
                "capture turn-2 tool-call args and the persisted per-session working-memory center"
              ]
            },
            "end_state": {
              "must_observe": [
                "turn2.searchCuratedRoutes tool-call arg center.lat >= 41.1 && center.lat <= 41.35 (Ogden inherited)",
                "turn2 center.lng >= -112.1 && center.lng <= -111.85",
                "Math.abs(workingMemory.center.lat - turn1.center.lat) <= 0.05 && Math.abs(workingMemory.center.lng - turn1.center.lng) <= 0.05",
                "agent.memory === undefined"
              ],
              "must_not_observe": [
                "turn2.searchCuratedRoutes tool-call arg center === undefined (statewide devolution)",
                "turn2 resolves sort === 'best' with center absent (national-best)",
                "the persisted working-memory center is empty/null (0 center carried from turn 1)"
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
      "maps_to_ac": null,
      "description": "GIVEN a concurrent Sacramento session running alongside the Ogden session WHEN both sessions run through the same module-level Agent THEN the Sacramento session resolves Sacramento while the Ogden session stays Ogden — the two per-session working-memory centers differ, and no per-request identifier lives in module scope",
      "verify": "pnpm test convex/actions/agent/spike/__tests__/rideAgentSpike.integration.test.ts -t \"concurrent sessions do not bleed center through the singleton\"",
      "scenario": {
        "id": "AC-3",
        "primary": false,
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "deployed Convex 'use node' action + real Anthropic + real Google (two concurrent sessions)",
        "negative_control": {
          "would_fail_if": [
            "the resolved center is captured in module scope so session B inherits Ogden (the pendingSketches singleton-bleed pattern)",
            "the two sessions are run against a mocked/stubbed agent so bleed can't manifest",
            "session state is keyed by module singleton rather than threaded through RequestContext / per-call messages"
          ]
        },
        "evidence": {
          "artifact_type": "stdout",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "sacramento_concurrent_session",
            "action": {
              "actor": "cli_user",
              "steps": [
                "run session 'spike-sac-2' with 'scenic roads near Sacramento' interleaved with the Ogden session",
                "capture each session's searchCuratedRoutes center + persisted working-memory center"
              ]
            },
            "end_state": {
              "must_observe": [
                "sessionB.center.lat >= 38.4 && sessionB.center.lat <= 38.75 (Sacramento)",
                "sessionA.center.lat >= 41.1 && sessionA.center.lat <= 41.35 (Ogden)",
                "Math.abs(sessionA.center.lat - sessionB.center.lat) > 2 (distinct per session)"
              ],
              "must_not_observe": [
                "sessionB.center.lat >= 41.1 && sessionB.center.lat <= 41.35 (session B inherited Ogden)",
                "sessionB working-memory center is empty/null (0 center resolved for Sacramento)",
                "a per-request sessionId or center found in the agent module's module scope"
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
      "maps_to_ac": null,
      "description": "GIVEN the orchestrator ModelRouter string from the tier map WHEN the spike agent runs one real completion THEN result.finishReason is a real terminal reason and the call site branches on result.tripwire — verifying the router resolves the pinned Sonnet id (else the AI-SDK-instance escape)",
      "verify": "pnpm test convex/actions/agent/spike/__tests__/rideAgentSpike.integration.test.ts -t \"orchestrator tier resolves a real completion and tripwire is handled\"",
      "scenario": {
        "id": "AC-4",
        "primary": false,
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "real Anthropic via the orchestrator ModelRouter string (or the documented explicit AI-SDK instance escape)",
        "negative_control": {
          "would_fail_if": [
            "the orchestrator tier is a pi-ai Model object so the Agent never instantiates (risk #15)",
            "the completion is mocked/stubbed instead of resolving the real orchestrator tier against real Anthropic",
            "the tripwire is never inspected at the call site (a finishReason:'other' is silently dropped)"
          ]
        },
        "evidence": {
          "artifact_type": "stdout",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "orchestrator_tier_probe",
            "action": {
              "actor": "api_client",
              "steps": [
                "run one real generate on the orchestrator tier with a trivial prompt",
                "inspect result.finishReason and result.tripwire at the call site"
              ]
            },
            "end_state": {
              "must_observe": [
                "result.finishReason === 'stop' || result.finishReason === 'tool-calls'",
                "result.text.length >= 1 || result.toolCalls.length >= 1 (a real completion resolved)",
                "the call site branches on result.tripwire === undefined vs a { reason } object (finishReason === 'other' routes to handleBlocked)"
              ],
              "must_not_observe": [
                "result.finishReason === 'other' with result.tripwire left unread (unhandled)",
                "result.text === '' && result.toolCalls.length === 0 (empty completion — the tier did not resolve)",
                "the model reference is a pi-ai Model object (Mastra cannot consume it)"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "primary": false,
      "maps_to_ac": "AC-1",
      "description": "turn 1 'twisty roads near Ogden' through the deployed action makes a searchCuratedRoutes tool-call whose center.lat is in [41.1,41.35] and lng in [-112.1,-111.85]",
      "verify": "pnpm test convex/actions/agent/spike/__tests__/rideAgentSpike.integration.test.ts -t \"turn 1 grounds the search in the resolved Ogden center\""
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "primary": false,
      "maps_to_ac": "AC-2",
      "description": "turn 2 'OK what's scenic' in the same session makes a searchCuratedRoutes tool-call carrying the inherited Ogden center and the persisted working-memory center is within 0.05 deg of turn 1, with memory===undefined",
      "verify": "pnpm test convex/actions/agent/spike/__tests__/rideAgentSpike.integration.test.ts -t \"turn 2 inherits the Ogden center via deterministic working memory\""
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "primary": false,
      "maps_to_ac": "AC-3",
      "description": "a concurrent Sacramento session resolves center.lat in [38.4,38.75] while the Ogden session stays in [41.1,41.35] — the two working-memory centers differ by >2 deg latitude and no per-request id is in module scope",
      "verify": "pnpm test convex/actions/agent/spike/__tests__/rideAgentSpike.integration.test.ts -t \"concurrent sessions do not bleed center through the singleton\""
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "primary": false,
      "maps_to_ac": "AC-4",
      "description": "one real orchestrator-tier completion returns finishReason in {stop,tool-calls} with text.length>=1 or toolCalls.length>=1, and the call site branches on result.tripwire",
      "verify": "pnpm test convex/actions/agent/spike/__tests__/rideAgentSpike.integration.test.ts -t \"orchestrator tier resolves a real completion and tripwire is handled\""
    }
  ]
}
-->
</details>
