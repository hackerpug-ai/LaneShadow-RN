# S1-T1 — Direct AI-SDK anchor-extraction completion

| Field | Value |
|-------|-------|
| TASK_ID | S1-T1 |
| SPRINT | [Sprint 01 — Geometry reference-flow spike](./SPRINT.md) |
| TASK_TYPE | FEATURE |
| AGENT | implementer=`aisdk-implementer` · reviewer=`aisdk-reviewer` |
| ESTIMATE | 60 min |
| EFFORT | S |
| PRIORITY | P0 |
| STATUS | Done (commit 5730b550; aisdk-reviewer APPROVED; 5/5 integration vs real Anthropic; AC-1..AC-4 satisfied) |
| PROPOSED_BY | `aisdk-planner` |
| TDD_MODE | `red_first` |
| RED_GREEN_REQUIRED | yes |
| CAPABILITIES | CAP-GEO-01 |
| DEPENDS_ON | — |
| BLOCKS | S1-T2 |

RUNTIME_COMMANDS:
- test: `pnpm test convex/actions/agent/lib/__tests__/anchorExtraction.integration.test.ts`
- typecheck: `pnpm type-check`
- lint: `pnpm exec biome check`

## OUTCOME

`extractAnchors()` turns a curated route's real turn-by-turn description into a validated, ordered `emit_anchors` object via a direct AI-SDK v7 completion against real Anthropic — decoupled from Mastra (T-REC-016) and exposing an injectable model seam S1-T2 can fixture.

## 🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)

**MUST**
- Use the v7 structured-output shape `generateText({ model, output: Output.object({ schema: emitAnchorsSchema }), prompt })` — NOT `generateObject` (not a v7 export).
- Expose the model instance as an injectable/overridable parameter (default = real `@ai-sdk/anthropic`) so S1-T2 can inject the determinism-seam fixture (canned `emit_anchors`).
- Add `ai@^7.0.20` + `@ai-sdk/anthropic@^4.0.12` to package.json (verified neither is installed).
- Bump convex.json `node.nodeVersion` "20"→"22" and add `ai` + `@ai-sdk/anthropic` to `node.externalPackages` — ai@7 requires Node ≥22 (installed convex@1.34.1 supports it).
- Assemble the prompt from the route's REAL oneLiner+summary per the proven PoC pattern; read ANTHROPIC_API_KEY via convex/lib/env.ts; validate every completion through emitAnchorsSchema before returning.

**NEVER**
- NEVER route this completion through Mastra (`@mastra/core`) — T-REC-016 decouples this spike from the §5b Mastra spike.
- NEVER route through convex/actions/agent/lib/models.ts (pi-ai) — pi-ai is being torn down; this is a net-new direct AI-SDK module.
- NEVER use v6-era API names (`system:`, `parameters:`, `.fullStream`, `onFinish`, `generateObject`, `require(`) or hand-roll JSON-regex parsing of raw completion text.
- NEVER persist to Convex / write to curated_routes|curated_route_geometry — zero persistence here (that is S1-T2).
- NEVER mock `@ai-sdk/anthropic`/`generateText` for the PRIMARY or generalization ACs — those hit the real Anthropic API.

**STRICTLY**
- STRICTLY test_tier=integration on AC-1 (PRIMARY) and AC-2 against the real Anthropic API — a MockLanguageModel-only pass does not satisfy either.
- STRICTLY SKIP-with-reason (never fake success) if ANTHROPIC_API_KEY is absent or Anthropic is unreachable during the integration run.
- STRICTLY no Convex schema/table changes and no persistence side effects in this diff.

## DONE WHEN

- `extractAnchors()` returns ≥5 ordered non-empty anchors on the real Twist of Tepusquet description (AC-1).
- `extractAnchors()` returns ≥3 non-empty anchors on the real Old Hwy 40 description (AC-2, generalization).
- `buildAnchorExtractionPrompt()` is deterministic and contains the real description text (AC-3).
- `emitAnchorsSchema` rejects malformed completions (AC-4).
- `ai` + `@ai-sdk/anthropic` installed; convex.json nodeVersion=22 + externalPackages updated.
- `pnpm test convex/actions/agent/lib/__tests__/anchorExtraction.integration.test.ts` passes + `pnpm type-check` clean + `pnpm exec biome check` clean
- Only SCOPE.writeAllowed files modified (`git diff --name-only`)
- Every behavioral AC scenario passes `validate_scenario` (exit 0); RED-against-start recorded before GREEN; seeded-value EVIDENCE artifact captured

## SPECIFICATION

**Objective:** Deliver a decoupled direct AI-SDK v7 completion (`extractAnchors`) proving UC-REC-02 AC-1 against the real reconstruction LLM without depending on the Mastra-in-Convex spike, with an injectable model seam for the determinism-seam fixture.

**Success state:** `extractAnchors()` returns ≥5 ordered non-empty anchors on the real Twist of Tepusquet description (PoC: 7 anchors, ratio 1.00) and generalizes to a second real route; `emitAnchorsSchema` rejects malformed completions; `ai` + `@ai-sdk/anthropic` installed; convex.json Node runtime bumped to 22.

## FIXTURES (shared seed data — referenced by scenario `start_ref`)

- `twist_of_tepusquet_description` (seed_method: `recorded_external`): Real curated_routes row twist-of-tepusquet-loop (CA, 41mi loop) — the PoC-proven description that scored 7 anchors at ratio 1.00.
- `old_hwy_40_description` (seed_method: `recorded_external`): Real curated_routes row old-hwy-40 point-to-point route, POI-mixed description (Rainbow Lodge, Donner Lake Vista Point); PoC extracted 6 anchors.
- `malformed_emit_anchors_responses` (seed_method: `public_api`): Deliberately malformed emit_anchors objects fed to emitAnchorsSchema.safeParse.

## ACCEPTANCE CRITERIA (TDD beads — RED → GREEN → REFACTOR per AC)

### AC-1 [PRIMARY]

**Requirement:** GIVEN the real Twist of Tepusquet description WHEN extractAnchors runs against real Anthropic THEN >=5 ordered non-empty anchors validate against emitAnchorsSchema

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: real Anthropic API via @ai-sdk/anthropic (claude-sonnet-4-6)
- VERIFY: `pnpm test convex/actions/agent/lib/__tests__/anchorExtraction.integration.test.ts -t "extracts ordered anchors from the real Twist of Tepusquet Loop description"`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: extractAnchors is stubbed/mocked to return a canned anchors array instead of the real @ai-sdk/anthropic generateText call; the route's real oneLiner/summary text is never interpolated into the prompt (empty prompt sent); the emit_anchors Zod schema is bypassed so a malformed/empty completion silently passes
- EVIDENCE: `stdout` (required_capture: true)
- CASE 1 — start_ref `twist_of_tepusquet_description`
    - ACTION (api_client): call extractAnchors(twistOfTepusquet) against the real Anthropic completion with no model override
    - MUST_OBSERVE: anchors.length >= 5; anchors[0].query is a non-empty string; confidence is one of 'high' | 'medium' | 'low'
    - MUST_NOT_OBSERVE: anchors.length === 0; anchors[0].query === '' (empty)

### AC-2

**Requirement:** GIVEN the real Old Hwy 40 point-to-point description WHEN extractAnchors runs against real Anthropic THEN >=3 ordered non-empty anchors validate — proving generalization

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: real Anthropic API via @ai-sdk/anthropic (claude-sonnet-4-6)
- VERIFY: `pnpm test convex/actions/agent/lib/__tests__/anchorExtraction.integration.test.ts -t "generalizes to the real Old Hwy 40 point-to-point description"`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: extractAnchors only works for the single hardcoded Twist-of-Tepusquet golden case; the completion is stubbed/mocked instead of hitting the real Anthropic API for this second fixture; schema validation is skipped, silently letting a malformed response through
- EVIDENCE: `stdout` (required_capture: true)
- CASE 1 — start_ref `old_hwy_40_description`
    - ACTION (api_client): call extractAnchors(oldHwy40) against the real Anthropic completion
    - MUST_OBSERVE: anchors.length >= 3; every anchors[i].query has length >= 1 (non-empty); confidence is one of 'high' | 'medium' | 'low'
    - MUST_NOT_OBSERVE: anchors.length === 0; an anchors entry with query === '' (empty)

### AC-3

**Requirement:** GIVEN identical input twice WHEN buildAnchorExtractionPrompt runs THEN byte-identical prompts that verbatim-contain the real description text (pure, zero I/O)

- TEST_TIER: `unit`  ·  VERIFICATION_SERVICE: n/a — pure function, zero I/O
- VERIFY: `pnpm test convex/actions/agent/lib/__tests__/anchorExtraction.integration.test.ts -t "prompt assembly is deterministic and includes the real description text"`
- UNIT_TEST_JUSTIFIED: Pure string concatenation, zero I/O — deterministic output verifiable without a real provider.

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: buildAnchorExtractionPrompt returns a static/hardcoded prompt string that never interpolates the input; the function is non-deterministic so two identical-input calls diverge; the route's real summary text is dropped/truncated out of the assembled prompt
- EVIDENCE: `stdout` (required_capture: true)
- CASE 1 — start_ref `twist_of_tepusquet_description`
    - ACTION (api_client): call buildAnchorExtractionPrompt(input) twice with the identical real Twist-of-Tepusquet input object
    - MUST_OBSERVE: the two returned prompt strings are strictly === equal; the returned string contains the substring 'Foxen Canyon Rd'
    - MUST_NOT_OBSERVE: empty string returned; prompt missing the route name 'Twist of Tepusquet Loop'

### AC-4

**Requirement:** GIVEN malformed emit_anchors objects WHEN emitAnchorsSchema.safeParse runs THEN success:false with an issue on the offending path (pure Zod, zero I/O)

- TEST_TIER: `unit`  ·  VERIFICATION_SERVICE: n/a — pure Zod validation, zero I/O
- VERIFY: `pnpm test convex/actions/agent/lib/__tests__/anchorExtraction.integration.test.ts -t "emitAnchorsSchema rejects malformed model responses"`
- UNIT_TEST_JUSTIFIED: Pure Zod validation, zero I/O — the malformed-input rejection is deterministic parsing logic.

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: emitAnchorsSchema has no min-length/required-field constraints so safeParse always returns success:true; the schema is never invoked by extractAnchors (validation is dead/disconnected code); malformed input is coerced/defaulted into a passing shape instead of rejected
- EVIDENCE: `stdout` (required_capture: true)
- CASE 1 — start_ref `malformed_emit_anchors_responses`
    - ACTION (api_client): emitAnchorsSchema.safeParse({ anchors: [], confidence: 'high' })
    - MUST_OBSERVE: result.success === false; result.error.issues.length >= 1; result.error.issues.some(i => i.path.includes('anchors')) === true
    - MUST_NOT_OBSERVE: result.success === true; 0 validation issues reported
- CASE 2 — start_ref `malformed_emit_anchors_responses`
    - ACTION (api_client): emitAnchorsSchema.safeParse({ anchors: [{ query: 'US-101 & Betteravia Rd' }] }) with confidence omitted
    - MUST_OBSERVE: result.success === false; result.error.issues.some(i => i.path.includes('confidence')) === true
    - MUST_NOT_OBSERVE: result.success === true; 0 validation issues reported

## TEST CRITERIA

| TC | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | extractAnchors() on the real Twist of Tepusquet description returns anchors.length >= 5 with every query non-empty and confidence in {high,medium,low} | AC-1 | `pnpm test convex/actions/agent/lib/__tests__/anchorExtraction.integration.test.ts -t "extracts ordered anchors from the real Twist of Tepusquet Loop description"` |
| TC-2 | extractAnchors() on the real Old Hwy 40 description returns anchors.length >= 3 with every query non-empty | AC-2 | `pnpm test convex/actions/agent/lib/__tests__/anchorExtraction.integration.test.ts -t "generalizes to the real Old Hwy 40 point-to-point description"` |
| TC-3 | buildAnchorExtractionPrompt() returns byte-identical output for byte-identical input and contains the route's real summary text verbatim | AC-3 | `pnpm test convex/actions/agent/lib/__tests__/anchorExtraction.integration.test.ts -t "prompt assembly is deterministic and includes the real description text"` |
| TC-4 | emitAnchorsSchema.safeParse() returns success:false for an empty anchors array and for a response missing the confidence field | AC-4 | `pnpm test convex/actions/agent/lib/__tests__/anchorExtraction.integration.test.ts -t "emitAnchorsSchema rejects malformed model responses"` |

## SCOPE (file-level write permissions)

**writeAllowed:**
- `convex/actions/agent/lib/anchorExtraction.ts` (NEW)
- `convex/actions/agent/lib/__tests__/anchorExtraction.integration.test.ts` (NEW)
- `package.json` (MODIFY — add `ai` + `@ai-sdk/anthropic`)
- `pnpm-lock.yaml` (MODIFY — auto-regenerated by `pnpm add`)
- `convex.json` (MODIFY — nodeVersion 20→22; add externalPackages)

**writeProhibited:**
- `convex/actions/agent/lib/models.ts` (pi-ai tier map — do not wire through it, do not edit)
- `convex/actions/curatedGeometry.ts` / `convex/curatedGeometry.ts` (S1-T2's scope)
- `convex/schema.ts` and any curated_routes / curated_route_geometry writes (zero persistence here)
- Any `@mastra/core` or `@mariozechner/pi-ai` import anywhere in this diff

## READING LIST

- `.spec/prds/route-agent-quality/05-uc-rec.md:52-64` — UC-REC-02 ACs (anchor extraction is AC-1; 41.1mi/7-anchor PoC numbers)
- `.spec/prds/route-agent-quality/10-technical-requirements/06-external-dependencies.md:26-43` — reconstruction LLM tier + AI-SDK-instance escape hatch
- `.spec/prds/route-agent-quality/10-technical-requirements/11-e2e-testing.md:71-81` — §5 reference flow + the direct-AI-SDK decoupling note
- `.spec/proposals/geometry-completion/poc/poc-reconstruct.mjs:37-86` [PRIMARY PATTERN] — proven prompt text; replace raw-fetch+regex-JSON with generateText+Output.object+Zod
- `convex/actions/agent/providers/routingProvider.ts:203-243` — injectable-factory shape to mirror for the model seam; `convex/lib/env.ts:40-56` — ANTHROPIC_API_KEY export

## CODE PATTERN

- Pattern source: `convex/actions/agent/providers/routingProvider.ts` (createRoutingProvider factory) + `.spec/proposals/geometry-completion/poc/poc-reconstruct.mjs:37-86` (proven prompt)
- Anti-pattern: Routing through pi-ai/getAgentModel or Mastra; hand-rolled `text.match(/\{[\s\S]*\}/)` JSON parsing (the PoC's superseded pattern).

## VERIFICATION GATES

- All tests pass: `pnpm test convex/actions/agent/lib/__tests__/anchorExtraction.integration.test.ts` → Exit 0
- Typecheck: `pnpm type-check` → Exit 0
- Lint: `pnpm exec biome check` → Exit 0
- No v6-era API names: grep the diff for `system:|parameters:|.fullStream|onFinish|generateObject|require(` → no matches

## AGENT ASSIGNMENT

- Implementer: `aisdk-implementer` — aisdk-implementer owns AI-SDK v7 Core-surface implementation (generateText + Output.object structured output, real-provider TDD) — a Core-only unit with no UI, no Mastra.
- Reviewer: `aisdk-reviewer`

## EVIDENCE GATES

- RED phase: each AC's test went red before green (TDD_STATE history).
- Integration/E2E coverage: PRIMARY AC is `integration`.
- Scenario un-fakeable: `validate_scenario` exit 0 on the PRIMARY AC; captured EVIDENCE shows the seeded MUST_OBSERVE value (not merely "tests passed").

## DEPENDENCIES

- Depends on: —
- Blocks: S1-T2

## CONTEXT

- **Current state:** No AI-SDK in the tree; anchor extraction only exists in the PoC script (raw fetch + regex JSON parse).
- **Gap:** No production, decoupled, Zod-validated anchor-extraction completion for S1-T2 to consume; Node runtime pinned below AI SDK v7's floor.

<details>
<summary>▸ Full agent specification (TASK-TEMPLATE v5.2 — machine-readable requirement contract)</summary>

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "version": "1",
  "task_id": "S1-T1",
  "verification_policy": {
    "requires_tests": true,
    "requires_red_evidence": true,
    "requires_seeded_evidence": true
  },
  "fixtures": {
    "twist_of_tepusquet_description": {
      "description": "Real curated_routes row twist-of-tepusquet-loop (CA, 41mi loop) \u2014 the PoC-proven description that scored 7 anchors at ratio 1.00.",
      "seed_method": "recorded_external",
      "records": [
        "routeId=motorcycleroads:twist-of-tepusquet-loop",
        "summary names Betteravia->Foxen Canyon->Santa Maria Mesa->Tepusquet Canyon->Hwy 166->US-101"
      ]
    },
    "old_hwy_40_description": {
      "description": "Real curated_routes row old-hwy-40 point-to-point route, POI-mixed description (Rainbow Lodge, Donner Lake Vista Point); PoC extracted 6 anchors.",
      "seed_method": "recorded_external",
      "records": [
        "routeId=motorcycleroads:old-hwy-40-cisco-grove-to-donner-lake",
        "summary mixes POI + road names"
      ]
    },
    "malformed_emit_anchors_responses": {
      "description": "Deliberately malformed emit_anchors objects fed to emitAnchorsSchema.safeParse.",
      "seed_method": "public_api",
      "records": [
        "{anchors:[],confidence:'high'}",
        "{anchors:[{query:''}],confidence:'high'}",
        "{anchors:[{query:'US-101 & Betteravia Rd'}]} (confidence omitted)"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": true,
      "maps_to_ac": null,
      "description": "GIVEN the real Twist of Tepusquet description WHEN extractAnchors runs against real Anthropic THEN >=5 ordered non-empty anchors validate against emitAnchorsSchema",
      "verify": "pnpm test convex/actions/agent/lib/__tests__/anchorExtraction.integration.test.ts -t \"extracts ordered anchors from the real Twist of Tepusquet Loop description\"",
      "scenario": {
        "id": "AC-1",
        "primary": true,
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "real Anthropic API via @ai-sdk/anthropic (claude-sonnet-4-6)",
        "negative_control": {
          "would_fail_if": [
            "extractAnchors is stubbed/mocked to return a canned anchors array instead of the real @ai-sdk/anthropic generateText call",
            "the route's real oneLiner/summary text is never interpolated into the prompt (empty prompt sent)",
            "the emit_anchors Zod schema is bypassed so a malformed/empty completion silently passes"
          ]
        },
        "evidence": {
          "artifact_type": "stdout",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "twist_of_tepusquet_description",
            "action": {
              "actor": "api_client",
              "steps": [
                "call extractAnchors(twistOfTepusquet) against the real Anthropic completion with no model override"
              ]
            },
            "end_state": {
              "must_observe": [
                "anchors.length >= 5",
                "anchors[0].query is a non-empty string",
                "confidence is one of 'high' | 'medium' | 'low'"
              ],
              "must_not_observe": [
                "anchors.length === 0",
                "anchors[0].query === '' (empty)"
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
      "description": "GIVEN the real Old Hwy 40 point-to-point description WHEN extractAnchors runs against real Anthropic THEN >=3 ordered non-empty anchors validate \u2014 proving generalization",
      "verify": "pnpm test convex/actions/agent/lib/__tests__/anchorExtraction.integration.test.ts -t \"generalizes to the real Old Hwy 40 point-to-point description\"",
      "scenario": {
        "id": "AC-2",
        "primary": false,
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "real Anthropic API via @ai-sdk/anthropic (claude-sonnet-4-6)",
        "negative_control": {
          "would_fail_if": [
            "extractAnchors only works for the single hardcoded Twist-of-Tepusquet golden case",
            "the completion is stubbed/mocked instead of hitting the real Anthropic API for this second fixture",
            "schema validation is skipped, silently letting a malformed response through"
          ]
        },
        "evidence": {
          "artifact_type": "stdout",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "old_hwy_40_description",
            "action": {
              "actor": "api_client",
              "steps": [
                "call extractAnchors(oldHwy40) against the real Anthropic completion"
              ]
            },
            "end_state": {
              "must_observe": [
                "anchors.length >= 3",
                "every anchors[i].query has length >= 1 (non-empty)",
                "confidence is one of 'high' | 'medium' | 'low'"
              ],
              "must_not_observe": [
                "anchors.length === 0",
                "an anchors entry with query === '' (empty)"
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
      "description": "GIVEN identical input twice WHEN buildAnchorExtractionPrompt runs THEN byte-identical prompts that verbatim-contain the real description text (pure, zero I/O)",
      "verify": "pnpm test convex/actions/agent/lib/__tests__/anchorExtraction.integration.test.ts -t \"prompt assembly is deterministic and includes the real description text\"",
      "scenario": {
        "id": "AC-3",
        "primary": false,
        "tier": "visible",
        "test_tier": "unit",
        "verification_service": "n/a \u2014 pure function, zero I/O",
        "negative_control": {
          "would_fail_if": [
            "buildAnchorExtractionPrompt returns a static/hardcoded prompt string that never interpolates the input",
            "the function is non-deterministic so two identical-input calls diverge",
            "the route's real summary text is dropped/truncated out of the assembled prompt"
          ]
        },
        "evidence": {
          "artifact_type": "stdout",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "twist_of_tepusquet_description",
            "action": {
              "actor": "api_client",
              "steps": [
                "call buildAnchorExtractionPrompt(input) twice with the identical real Twist-of-Tepusquet input object"
              ]
            },
            "end_state": {
              "must_observe": [
                "the two returned prompt strings are strictly === equal",
                "the returned string contains the substring 'Foxen Canyon Rd'"
              ],
              "must_not_observe": [
                "empty string returned",
                "prompt missing the route name 'Twist of Tepusquet Loop'"
              ]
            }
          }
        ],
        "unit_test_justified": "Pure string concatenation, zero I/O \u2014 deterministic output verifiable without a real provider."
      }
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "primary": false,
      "maps_to_ac": null,
      "description": "GIVEN malformed emit_anchors objects WHEN emitAnchorsSchema.safeParse runs THEN success:false with an issue on the offending path (pure Zod, zero I/O)",
      "verify": "pnpm test convex/actions/agent/lib/__tests__/anchorExtraction.integration.test.ts -t \"emitAnchorsSchema rejects malformed model responses\"",
      "scenario": {
        "id": "AC-4",
        "primary": false,
        "tier": "visible",
        "test_tier": "unit",
        "verification_service": "n/a \u2014 pure Zod validation, zero I/O",
        "negative_control": {
          "would_fail_if": [
            "emitAnchorsSchema has no min-length/required-field constraints so safeParse always returns success:true",
            "the schema is never invoked by extractAnchors (validation is dead/disconnected code)",
            "malformed input is coerced/defaulted into a passing shape instead of rejected"
          ]
        },
        "evidence": {
          "artifact_type": "stdout",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "malformed_emit_anchors_responses",
            "action": {
              "actor": "api_client",
              "steps": [
                "emitAnchorsSchema.safeParse({ anchors: [], confidence: 'high' })"
              ]
            },
            "end_state": {
              "must_observe": [
                "result.success === false",
                "result.error.issues.length >= 1",
                "result.error.issues.some(i => i.path.includes('anchors')) === true"
              ],
              "must_not_observe": [
                "result.success === true",
                "0 validation issues reported"
              ]
            }
          },
          {
            "start_ref": "malformed_emit_anchors_responses",
            "action": {
              "actor": "api_client",
              "steps": [
                "emitAnchorsSchema.safeParse({ anchors: [{ query: 'US-101 & Betteravia Rd' }] }) with confidence omitted"
              ]
            },
            "end_state": {
              "must_observe": [
                "result.success === false",
                "result.error.issues.some(i => i.path.includes('confidence')) === true"
              ],
              "must_not_observe": [
                "result.success === true",
                "0 validation issues reported"
              ]
            }
          }
        ],
        "unit_test_justified": "Pure Zod validation, zero I/O \u2014 the malformed-input rejection is deterministic parsing logic."
      }
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "primary": false,
      "maps_to_ac": "AC-1",
      "description": "extractAnchors() on the real Twist of Tepusquet description returns anchors.length >= 5 with every query non-empty and confidence in {high,medium,low}",
      "verify": "pnpm test convex/actions/agent/lib/__tests__/anchorExtraction.integration.test.ts -t \"extracts ordered anchors from the real Twist of Tepusquet Loop description\""
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "primary": false,
      "maps_to_ac": "AC-2",
      "description": "extractAnchors() on the real Old Hwy 40 description returns anchors.length >= 3 with every query non-empty",
      "verify": "pnpm test convex/actions/agent/lib/__tests__/anchorExtraction.integration.test.ts -t \"generalizes to the real Old Hwy 40 point-to-point description\""
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "primary": false,
      "maps_to_ac": "AC-3",
      "description": "buildAnchorExtractionPrompt() returns byte-identical output for byte-identical input and contains the route's real summary text verbatim",
      "verify": "pnpm test convex/actions/agent/lib/__tests__/anchorExtraction.integration.test.ts -t \"prompt assembly is deterministic and includes the real description text\""
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "primary": false,
      "maps_to_ac": "AC-4",
      "description": "emitAnchorsSchema.safeParse() returns success:false for an empty anchors array and for a response missing the confidence field",
      "verify": "pnpm test convex/actions/agent/lib/__tests__/anchorExtraction.integration.test.ts -t \"emitAnchorsSchema rejects malformed model responses\""
    }
  ]
}
-->
</details>
