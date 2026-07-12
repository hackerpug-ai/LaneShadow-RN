# S2-T1 — Install @mastra/core + @ai-sdk/openai-compatible; assert-and-preserve ai@7/nodeVersion=22; add additive orchestrator tier as a Mastra ModelRouter string

| Field | Value |
|-------|-------|
| TASK_ID | S2-T1 |
| SPRINT | [Sprint 02 — Mastra spike + z.ai proof + enrichment re-ratification](./SPRINT.md) |
| TASK_TYPE | INFRA |
| AGENT | implementer=`aisdk-implementer` · reviewer=`aisdk-reviewer` |
| ESTIMATE | 90 min |
| EFFORT | M |
| PRIORITY | P0 |
| STATUS | Backlog |
| PROPOSED_BY | `aisdk-planner` |
| TDD_MODE | `skipped` |
| RED_GREEN_REQUIRED | no |
| CAPABILITIES | CAP-AGT-01 |
| DEPENDS_ON | — |
| BLOCKS | S2-T2, S2-T3, S2-T6 |

RUNTIME_COMMANDS:
- test: `pnpm test convex/actions/agent/lib/__tests__/models.orchestratorTier.test.ts`
- typecheck: `pnpm type-check`
- lint: `pnpm exec biome check`

## OUTCOME

`getOrchestratorModel()` returns `'anthropic/claude-sonnet-4-6'`; a minimal real `@mastra/core` Agent built on that model returns real, non-empty text from Anthropic; package.json and convex.json list the two new packages while every pre-existing dependency/config value (ai@7, @ai-sdk/anthropic, nodeVersion=22, @mariozechner/pi-ai, the pi-ai `low`/`high` tiers) is provably unchanged.

## 🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)

**MUST**
- Add `@mastra/core@^1.50.1` and `@ai-sdk/openai-compatible@^3.0.5` to package.json dependencies — verified NOT installed (`ls node_modules/@mastra` -> ENOENT; `ls node_modules/@ai-sdk` -> anthropic, gateway, provider, provider-utils only, no openai-compatible). `npm view @mastra/core version` verified 2026-07-12 = 1.50.1.
- Add BOTH `@mastra/core` and `@ai-sdk/openai-compatible` to convex.json `node.externalPackages` — current array is `["@workos-inc/node","papaparse","langchain","@langchain/core","@langchain/openai","@langchain/langgraph","jose","@mariozechner/pi-ai","ai","@ai-sdk/anthropic"]`; APPEND, do not remove or reorder any existing entry.
- ASSERT-AND-PRESERVE (do not re-perform): `convex.json` `node.nodeVersion` is already `"22"` and `ai@^7.0.22` + `@ai-sdk/anthropic@^4.0.12` are already in package.json dependencies (verified via Read 2026-07-12) — write a checklist test that fails loudly if any of these three facts regress, rather than re-doing the bump.
- Add an ADDITIVE `orchestrator` tier to `convex/actions/agent/lib/models.ts`: export `getOrchestratorModel(): string` returning the Mastra ModelRouter string `'anthropic/claude-sonnet-4-6'` — reuse the exact pinned model id `claude-sonnet-4-6` already proven live in `convex/actions/agent/lib/anchorExtraction.ts:38` (`DEFAULT_MODEL_ID`). Keep it a SEPARATE export from `getAgentModel`/`IntelligenceLevel` (`'low'|'high'`) — do not fold it into that union.
- Preserve the `'use node'` directive at the top of `models.ts` (line 1) — unchanged.
- Verify the router string actually resolves: construct ONE minimal `@mastra/core/agent` `Agent` (`new Agent({ id, name, instructions, model: getOrchestratorModel() })`) and call `.generate()` against real Anthropic (deployment `ANTHROPIC_API_KEY`, confirmed present via `npx convex env list` 2026-07-12) — assert a non-empty `result.text`. This is the landmine check from `11-e2e-testing.md` §4 ('verify each tier with one real completion') and risk #15.
- If the bare router string does NOT resolve for real (e.g. Mastra's ModelRouter needs a separate AI Gateway credential that isn't provisioned, rather than reading `ANTHROPIC_API_KEY` directly), apply the documented escape hatch: pass an explicit AI-SDK model instance (`anthropic('claude-sonnet-4-6')` from the already-installed `@ai-sdk/anthropic`) as `model:` to the Agent instead, and record in the PR/commit which form actually verified live — a real fix, never a silently swallowed auth failure.
- `getAgentModel('low'|'high')` and the `@mariozechner/pi-ai` import in `models.ts` MUST remain byte-identical in behavior — this task only adds exports, it never edits `MODEL_MAP`.

**NEVER**
- NEVER remove `@mariozechner/pi-ai` from package.json or convex.json `externalPackages` in this task — pi-ai teardown is a separate, later, atomic 13-file migration (06-external-dependencies 'pi-ai teardown inventory'), explicitly out of scope for this ADDITIVE spike.
- NEVER modify `MODEL_MAP`, `IntelligenceLevel`, `getAgentModel`, or `getAgentModelInfo` in `models.ts` — additive-only.
- NEVER use v6-era API names (`system:`, `parameters:`, `.fullStream`, `onFinish`, `generateObject`, `require(`).
- NEVER construct the orchestrator Agent with a hardcoded/canned `.generate()` response or a `MockLanguageModel` for the PRIMARY AC — it must hit real Anthropic.
- NEVER route the orchestrator tier through `@ai-sdk/openai-compatible` or z.ai — that provider is exclusively S2-T6's enrichment-tier proof.
- NEVER touch `convex/actions/agent/generateTripPlan.ts`, `orchestrator.ts`, `sendMessage.ts`, `runAgent.ts`, `ridePlanningAgent.ts`, or any other pi-ai-importing production file — Sprint 02 is additive-only; those are later-sprint/teardown scope.

**STRICTLY**
- STRICTLY test_tier=integration on AC-4 (PRIMARY) against real Anthropic via the real `@mastra/core` Agent — a MockLanguageModel-only pass does not satisfy it.
- STRICTLY SKIP-with-reason (never fake success) if ANTHROPIC_API_KEY is absent or the Mastra router/Anthropic API is unreachable during the integration run.
- STRICTLY no Convex schema changes and no changes to any file outside SCOPE.writeAllowed.

## SPECIFICATION

**Objective:** Install @mastra/core and @ai-sdk/openai-compatible alongside the live pi-ai path (nothing torn down), confirm the ai@7/nodeVersion=22 floor already in place stays in place, and add a net-new `orchestrator` tier to the existing tier-map file that resolves to a real, working Mastra ModelRouter string — proven against real Anthropic, not just asserted as a string literal.

**Success state:** `getOrchestratorModel()` returns `'anthropic/claude-sonnet-4-6'`; a minimal real `@mastra/core` Agent built on that model returns real, non-empty text from Anthropic; package.json and convex.json list the two new packages while every pre-existing dependency/config value (ai@7, @ai-sdk/anthropic, nodeVersion=22, @mariozechner/pi-ai, the pi-ai `low`/`high` tiers) is provably unchanged.

## FIXTURES (shared seed data — referenced by scenario `start_ref`)

- `repo_config_baseline` (seed_method: `public_api`): The real, current package.json/convex.json on disk before this task's edits, verified via Read 2026-07-12: ai@^7.0.22 + @ai-sdk/anthropic@^4.0.12 present in package.json dependencies; convex.json node.nodeVersion==="22"; node.externalPackages = [@workos-inc/node, papaparse, langchain, @langchain/core, @langchain/openai, @langchain/langgraph, jose, @mariozechner/pi-ai, ai, @ai-sdk/anthropic]; neither @mastra/core nor @ai-sdk/openai-compatible present anywhere in node_modules.
- `pinned_orchestrator_model_id` (seed_method: `public_api`): The real, already-proven Anthropic model id, sourced verbatim from convex/actions/agent/lib/anchorExtraction.ts:38 (DEFAULT_MODEL_ID = 'claude-sonnet-4-6'), reused as the Mastra router suffix so the orchestrator tier pins to a model already verified live in S1-T1 (5/5 integration passes).
- `orchestrator_probe_prompt` (seed_method: `public_api`): A trivial, deterministic single-word-reply prompt used only to prove Mastra router-string resolution at minimum real-API cost.

## ACCEPTANCE CRITERIA (TDD beads — RED → GREEN → REFACTOR per AC)

### AC-1

**Requirement:** GIVEN the repo's package.json after this task's edits WHEN it is read and parsed THEN it lists @mastra/core and @ai-sdk/openai-compatible as dependencies, AND still lists ai@^7 and @ai-sdk/anthropic@^4 unchanged

- TEST_TIER: `unit`  ·  VERIFICATION_SERVICE: n/a — pure filesystem/JSON read, zero network I/O
- UNIT_TEST_JUSTIFIED: Dependency-manifest presence is deterministically checkable by reading the committed package.json — no real provider call is needed to prove an install happened.
- VERIFY: `pnpm test convex/actions/agent/lib/__tests__/models.orchestratorTier.test.ts -t "package.json lists @mastra/core and @ai-sdk/openai-compatible while preserving ai@7 and @ai-sdk/anthropic"`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: @mastra/core or @ai-sdk/openai-compatible is missing from dependencies (install skipped); the test reads a stale/cached copy instead of the real committed package.json; the pre-existing ai/@ai-sdk/anthropic entries are silently removed or downgraded below the v7 floor
- EVIDENCE: `stdout` (required_capture: true)
- CASE 1 — start_ref `repo_config_baseline`
    - ACTION (api_client): read and JSON.parse the repo's package.json
    - MUST_OBSERVE: dependencies['@mastra/core'] is a non-empty string; dependencies['@ai-sdk/openai-compatible'] is a non-empty string; dependencies['ai'] matches /^\^?7\./
    - MUST_NOT_OBSERVE: dependencies['@mastra/core'] === undefined; dependencies['@mastra/core'] is empty/absent (0 entries); dependencies['ai'] matches /^\^?[456]\./ (regressed below v7)

### AC-2

**Requirement:** GIVEN the repo's convex.json after this task's edits WHEN it is read and parsed THEN node.nodeVersion is still "22" and node.externalPackages contains @mastra/core + @ai-sdk/openai-compatible while still containing ai, @ai-sdk/anthropic, and @mariozechner/pi-ai

- TEST_TIER: `unit`  ·  VERIFICATION_SERVICE: n/a — pure filesystem/JSON read, zero network I/O
- UNIT_TEST_JUSTIFIED: Convex bundler config presence/absence is deterministically checkable by reading the committed convex.json.
- VERIFY: `pnpm test convex/actions/agent/lib/__tests__/models.orchestratorTier.test.ts -t "convex.json preserves nodeVersion 22 and adds @mastra/core + @ai-sdk/openai-compatible to externalPackages without removing existing entries"`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: nodeVersion is silently changed away from "22"; @mastra/core or @ai-sdk/openai-compatible is missing from externalPackages (Convex bundler fails at deploy for any Node-only import); @mariozechner/pi-ai is removed from externalPackages (out-of-scope teardown sneaking into this additive task)
- EVIDENCE: `stdout` (required_capture: true)
- CASE 1 — start_ref `repo_config_baseline`
    - ACTION (api_client): read and JSON.parse the repo's convex.json
    - MUST_OBSERVE: node.nodeVersion === '22'; node.externalPackages.includes('@mastra/core') === true; node.externalPackages.includes('@ai-sdk/openai-compatible') === true
    - MUST_NOT_OBSERVE: node.nodeVersion !== '22'; node.externalPackages.includes('@mariozechner/pi-ai') === false; node.externalPackages is empty (0 entries) or omits '@mastra/core'/'@ai-sdk/openai-compatible' entirely

### AC-3

**Requirement:** GIVEN convex/actions/agent/lib/models.ts after this task's edits WHEN getOrchestratorModel() and getAgentModel/getAgentModelInfo are imported and called THEN getOrchestratorModel() returns the pinned router string as a plain string, and the existing pi-ai `high`/`low` behavior is provably unchanged

- TEST_TIER: `unit`  ·  VERIFICATION_SERVICE: n/a — pure function call, zero network I/O
- UNIT_TEST_JUSTIFIED: Verifying the exported function's return value and that sibling exports are untouched is deterministic module-shape logic, not a provider call.
- VERIFY: `pnpm test convex/actions/agent/lib/__tests__/models.orchestratorTier.test.ts -t "getOrchestratorModel returns the pinned Mastra router string without touching the existing pi-ai tiers"`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: getOrchestratorModel is undefined/not exported; it returns a pi-ai Model object (from getModel()) instead of a plain router string; calling getAgentModel('high')/getAgentModelInfo('high') no longer returns the pi-ai gpt-4.1 fallback (a regression in code this task must not touch); getOrchestratorModel is hardcoded/stubbed to a canned string that isn't wired into any Agent; the pi-ai high/low tiers are mocked so the regression guard never actually reads the real MODEL_MAP
- EVIDENCE: `stdout` (required_capture: true)
- CASE 1 — start_ref `pinned_orchestrator_model_id`
    - ACTION (api_client): import { getOrchestratorModel, getAgentModel, getAgentModelInfo } from 'convex/actions/agent/lib/models' → call getOrchestratorModel() and getAgentModelInfo('high')
    - MUST_OBSERVE: typeof getOrchestratorModel() === 'string'; getOrchestratorModel() === 'anthropic/claude-sonnet-4-6'; getAgentModelInfo('high').model === 'gpt-4.1'
    - MUST_NOT_OBSERVE: getOrchestratorModel() === undefined; typeof getOrchestratorModel() === 'object'; getOrchestratorModel() returns '' (empty string) or none

### AC-4

**Requirement:** GIVEN the additive orchestrator tier and a minimal @mastra/core Agent built on it WHEN a real .generate() call is made against real Anthropic (deployment ANTHROPIC_API_KEY) THEN it returns non-empty result.text — proving the ModelRouter string resolves for real, closing the risk #15 landmine

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: real Anthropic API via @mastra/core Agent + ModelRouter string resolution ('anthropic/claude-sonnet-4-6'), ANTHROPIC_API_KEY from convex/lib/env.ts
- FLOW_REF: UC-AGT-01
- VERIFY: `pnpm test convex/actions/agent/lib/__tests__/models.orchestratorTier.test.ts -t "resolves the orchestrator tier through a real @mastra/core Agent against real Anthropic"`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: the Agent's model is swapped for a MockLanguageModel/canned response instead of the real router string; the test only checks that getOrchestratorModel() returns a string, without ever constructing an Agent or calling .generate(); a thrown resolution/auth error is caught and silently downgraded to a passing assertion instead of failing the test
- EVIDENCE: `stdout` (required_capture: true)
- CASE 1 — start_ref `orchestrator_probe_prompt`
    - ACTION (api_client): construct new Agent({ id: 'orchestrator-spike-probe', name: 'Orchestrator Spike Probe', instructions: 'Answer concisely.', model: getOrchestratorModel() }) → call await agent.generate('Reply with exactly the single word: banana.') against real Anthropic with no model override
    - MUST_OBSERVE: typeof result.text === 'string'; result.text.length >= 1; result.text.toLowerCase().includes('banana') === true
    - MUST_NOT_OBSERVE: result.text === '' (empty); an unhandled/uncaught resolution or auth error

## TEST CRITERIA

| TC | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | package.json contains @mastra/core and @ai-sdk/openai-compatible as dependencies while still containing ai matching ^7.x and @ai-sdk/anthropic | AC-1 | `pnpm test convex/actions/agent/lib/__tests__/models.orchestratorTier.test.ts -t "package.json lists @mastra/core and @ai-sdk/openai-compatible while preserving ai@7 and @ai-sdk/anthropic"` |
| TC-2 | convex.json node.nodeVersion equals '22' and node.externalPackages includes @mastra/core, @ai-sdk/openai-compatible, ai, @ai-sdk/anthropic, and @mariozechner/pi-ai | AC-2 | `pnpm test convex/actions/agent/lib/__tests__/models.orchestratorTier.test.ts -t "convex.json preserves nodeVersion 22 and adds @mastra/core + @ai-sdk/openai-compatible to externalPackages without removing existing entries"` |
| TC-3 | getOrchestratorModel() returns the string 'anthropic/claude-sonnet-4-6' and getAgentModelInfo('high').model remains 'gpt-4.1' | AC-3 | `pnpm test convex/actions/agent/lib/__tests__/models.orchestratorTier.test.ts -t "getOrchestratorModel returns the pinned Mastra router string without touching the existing pi-ai tiers"` |
| TC-4 | A real @mastra/core Agent built on getOrchestratorModel() returns non-empty result.text from a real Anthropic completion containing the word 'banana' | AC-4 | `pnpm test convex/actions/agent/lib/__tests__/models.orchestratorTier.test.ts -t "resolves the orchestrator tier through a real @mastra/core Agent against real Anthropic"` |

## SCOPE (file-level write permissions)

**writeAllowed:**
- `package.json (MODIFY — add @mastra/core + @ai-sdk/openai-compatible)`
- `pnpm-lock.yaml (MODIFY — auto-regenerated by `pnpm add`)`
- `convex.json (MODIFY — add externalPackages entries only; nodeVersion untouched)`
- `convex/actions/agent/lib/models.ts (MODIFY — additive: new getOrchestratorModel export only)`
- `convex/actions/agent/lib/__tests__/models.orchestratorTier.test.ts (NEW)`

**writeProhibited:**
- `convex/actions/agent/lib/models.ts MODEL_MAP/IntelligenceLevel/getAgentModel/getAgentModelInfo internals (untouched, additive-only)`
- `convex/actions/agent/generateTripPlan.ts, orchestrator.ts, sendMessage.ts, budgetTracker.ts, runAgent.ts, ridePlanningAgent.ts, tools/enrichRoute.ts, tools/manageWaypoints.ts, lib/piTools.ts, tools/discoverCuratedRoutes.ts (later-sprint/teardown scope, not this task)`
- `convex/actions/agent/lib/zaiProvider.ts and convex/lib/env.ts (S2-T6's scope)`
- `convex/schema.ts and any table writes (zero persistence here)`

## READING LIST

- `.spec/prds/route-agent-quality/10-technical-requirements/06-external-dependencies.md`:61-87 — Agent layer: @mastra/core install, orchestrator tier as a ModelRouter string resolved against ANTHROPIC_API_KEY, the AI-SDK-instance escape hatch
- `.spec/prds/route-agent-quality/10-technical-requirements/08-technical-risks.md`:25 — Risk #15 — model-reference form mismatch (pi-ai Model object vs Mastra router string)
- `.spec/prds/route-agent-quality/10-technical-requirements/11-e2e-testing.md`:66-68 — Landmine: 'verify each tier with one real completion before its first batch'
- `convex/actions/agent/lib/models.ts`:1-49 — [PRIMARY PATTERN] existing pi-ai tier map to extend additively — do not restructure
- `convex/actions/agent/lib/anchorExtraction.ts`:38-46 — Proven pinned model id 'claude-sonnet-4-6' + injectable-model factory pattern to mirror
- `brain/skills/mastra-patterns/agents-core.md`:78-85 — Agent construction shape: model as a router STRING, e.g. 'openai/gpt-5.5' / 'anthropic/claude-sonnet-4-6'

## CODE PATTERN

- Pattern: Additive tier-map export mirroring the existing createDefaultAnchorExtractionModel injectable-factory shape, but returning a plain router string instead of an AI-SDK LanguageModel instance.
- Pattern source: `convex/actions/agent/lib/anchorExtraction.ts:40-46 + brain/skills/mastra-patterns/agents-core.md:78-85`
- Anti-pattern: Folding the orchestrator tier into the existing 'low'|'high' IntelligenceLevel union; returning a pi-ai Model object from getOrchestratorModel(); constructing the proof Agent with a MockLanguageModel.

## VERIFICATION GATES

- tests pass: `pnpm test convex/actions/agent/lib/__tests__/models.orchestratorTier.test.ts` → Exit 0
- typecheck: `pnpm type-check` → Exit 0
- lint: `pnpm exec biome check` → Exit 0
- no v6-era API names: `git diff -- convex/actions/agent/lib/models.ts | grep -E 'system:|parameters:|\.fullStream|onFinish|generateObject|require\('` → no matches
- pi-ai import preserved: `grep -c "@mariozechner/pi-ai" convex/actions/agent/lib/models.ts` → 1 (unchanged)
- no scope creep: `git diff --name-only` → only SCOPE.writeAllowed files

## AGENT ASSIGNMENT

- Implementer: `aisdk-implementer` — aisdk-implementer owns AI-SDK v7 + Mastra-adjacent dependency/tier-map work in this codebase (it built the proven anchorExtraction.ts pattern in S1-T1) — this task extends the same lib/models.ts tier map additively and proves the new Mastra ModelRouter string against a real provider, which is squarely Core-surface AI-SDK/Mastra installation work, not a generic Node/Convex change.
- Reviewer: `aisdk-reviewer`

## EVIDENCE GATES

- Integration/E2E coverage: PRIMARY AC hits real services; captured EVIDENCE shows the seeded MUST_OBSERVE value (not merely "tests passed").
- Scenario un-fakeable: `validate_scenario` exit 0 on every behavioral AC.

## DEPENDENCIES

- Depends on: —
- Blocks: S2-T2, S2-T3, S2-T6

<details>
<summary>▸ Full agent specification (TASK-TEMPLATE v5.2 — machine-readable requirement contract)</summary>

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "version": "1",
  "task_id": "S2-T1",
  "tdd_mode": "skipped",
  "verification_policy": {
    "requires_tests": true,
    "requires_red_evidence": false,
    "requires_seeded_evidence": true
  },
  "fixtures": {
    "repo_config_baseline": {
      "description": "The real, current package.json/convex.json on disk before this task's edits, verified via Read 2026-07-12: ai@^7.0.22 + @ai-sdk/anthropic@^4.0.12 present in package.json dependencies; convex.json node.nodeVersion===\"22\"; node.externalPackages = [@workos-inc/node, papaparse, langchain, @langchain/core, @langchain/openai, @langchain/langgraph, jose, @mariozechner/pi-ai, ai, @ai-sdk/anthropic]; neither @mastra/core nor @ai-sdk/openai-compatible present anywhere in node_modules.",
      "seed_method": "public_api",
      "records": [
        "package.json dependencies.ai === \"^7.0.22\"",
        "package.json dependencies[\"@ai-sdk/anthropic\"] === \"^4.0.12\"",
        "convex.json node.nodeVersion === \"22\"",
        "node_modules/@mastra does not exist (ls verified ENOENT)"
      ]
    },
    "pinned_orchestrator_model_id": {
      "description": "The real, already-proven Anthropic model id, sourced verbatim from convex/actions/agent/lib/anchorExtraction.ts:38 (DEFAULT_MODEL_ID = 'claude-sonnet-4-6'), reused as the Mastra router suffix so the orchestrator tier pins to a model already verified live in S1-T1 (5/5 integration passes).",
      "seed_method": "public_api",
      "records": [
        "DEFAULT_MODEL_ID = 'claude-sonnet-4-6' (convex/actions/agent/lib/anchorExtraction.ts:38)"
      ]
    },
    "orchestrator_probe_prompt": {
      "description": "A trivial, deterministic single-word-reply prompt used only to prove Mastra router-string resolution at minimum real-API cost.",
      "seed_method": "public_api",
      "records": [
        "\"Reply with exactly the single word: banana.\""
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": false,
      "maps_to_ac": null,
      "description": "GIVEN the repo's package.json after this task's edits WHEN it is read and parsed THEN it lists @mastra/core and @ai-sdk/openai-compatible as dependencies, AND still lists ai@^7 and @ai-sdk/anthropic@^4 unchanged",
      "verify": "pnpm test convex/actions/agent/lib/__tests__/models.orchestratorTier.test.ts -t \"package.json lists @mastra/core and @ai-sdk/openai-compatible while preserving ai@7 and @ai-sdk/anthropic\"",
      "scenario": {
        "id": "AC-1",
        "primary": false,
        "tier": "visible",
        "test_tier": "unit",
        "verification_service": "n/a — pure filesystem/JSON read, zero network I/O",
        "negative_control": {
          "would_fail_if": [
            "@mastra/core or @ai-sdk/openai-compatible is missing from dependencies (install skipped)",
            "the test reads a stale/cached copy instead of the real committed package.json",
            "the pre-existing ai/@ai-sdk/anthropic entries are silently removed or downgraded below the v7 floor"
          ]
        },
        "evidence": {
          "artifact_type": "stdout",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "repo_config_baseline",
            "action": {
              "actor": "api_client",
              "steps": [
                "read and JSON.parse the repo's package.json"
              ]
            },
            "end_state": {
              "must_observe": [
                "dependencies['@mastra/core'] is a non-empty string",
                "dependencies['@ai-sdk/openai-compatible'] is a non-empty string",
                "dependencies['ai'] matches /^\\^?7\\./"
              ],
              "must_not_observe": [
                "dependencies['@mastra/core'] === undefined",
                "dependencies['@mastra/core'] is empty/absent (0 entries)",
                "dependencies['ai'] matches /^\\^?[456]\\./ (regressed below v7)"
              ]
            }
          }
        ],
        "unit_test_justified": "Dependency-manifest presence is deterministically checkable by reading the committed package.json — no real provider call is needed to prove an install happened."
      }
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "primary": false,
      "maps_to_ac": null,
      "description": "GIVEN the repo's convex.json after this task's edits WHEN it is read and parsed THEN node.nodeVersion is still \"22\" and node.externalPackages contains @mastra/core + @ai-sdk/openai-compatible while still containing ai, @ai-sdk/anthropic, and @mariozechner/pi-ai",
      "verify": "pnpm test convex/actions/agent/lib/__tests__/models.orchestratorTier.test.ts -t \"convex.json preserves nodeVersion 22 and adds @mastra/core + @ai-sdk/openai-compatible to externalPackages without removing existing entries\"",
      "scenario": {
        "id": "AC-2",
        "primary": false,
        "tier": "visible",
        "test_tier": "unit",
        "verification_service": "n/a — pure filesystem/JSON read, zero network I/O",
        "negative_control": {
          "would_fail_if": [
            "nodeVersion is silently changed away from \"22\"",
            "@mastra/core or @ai-sdk/openai-compatible is missing from externalPackages (Convex bundler fails at deploy for any Node-only import)",
            "@mariozechner/pi-ai is removed from externalPackages (out-of-scope teardown sneaking into this additive task)"
          ]
        },
        "evidence": {
          "artifact_type": "stdout",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "repo_config_baseline",
            "action": {
              "actor": "api_client",
              "steps": [
                "read and JSON.parse the repo's convex.json"
              ]
            },
            "end_state": {
              "must_observe": [
                "node.nodeVersion === '22'",
                "node.externalPackages.includes('@mastra/core') === true",
                "node.externalPackages.includes('@ai-sdk/openai-compatible') === true"
              ],
              "must_not_observe": [
                "node.nodeVersion !== '22'",
                "node.externalPackages.includes('@mariozechner/pi-ai') === false",
                "node.externalPackages is empty (0 entries) or omits '@mastra/core'/'@ai-sdk/openai-compatible' entirely"
              ]
            }
          }
        ],
        "unit_test_justified": "Convex bundler config presence/absence is deterministically checkable by reading the committed convex.json."
      }
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "primary": false,
      "maps_to_ac": null,
      "description": "GIVEN convex/actions/agent/lib/models.ts after this task's edits WHEN getOrchestratorModel() and getAgentModel/getAgentModelInfo are imported and called THEN getOrchestratorModel() returns the pinned router string as a plain string, and the existing pi-ai `high`/`low` behavior is provably unchanged",
      "verify": "pnpm test convex/actions/agent/lib/__tests__/models.orchestratorTier.test.ts -t \"getOrchestratorModel returns the pinned Mastra router string without touching the existing pi-ai tiers\"",
      "scenario": {
        "id": "AC-3",
        "primary": false,
        "tier": "visible",
        "test_tier": "unit",
        "verification_service": "n/a — pure function call, zero network I/O",
        "negative_control": {
          "would_fail_if": [
            "getOrchestratorModel is undefined/not exported",
            "it returns a pi-ai Model object (from getModel()) instead of a plain router string",
            "calling getAgentModel('high')/getAgentModelInfo('high') no longer returns the pi-ai gpt-4.1 fallback (a regression in code this task must not touch)",
            "getOrchestratorModel is hardcoded/stubbed to a canned string that isn't wired into any Agent",
            "the pi-ai high/low tiers are mocked so the regression guard never actually reads the real MODEL_MAP"
          ]
        },
        "evidence": {
          "artifact_type": "stdout",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "pinned_orchestrator_model_id",
            "action": {
              "actor": "api_client",
              "steps": [
                "import { getOrchestratorModel, getAgentModel, getAgentModelInfo } from 'convex/actions/agent/lib/models'",
                "call getOrchestratorModel() and getAgentModelInfo('high')"
              ]
            },
            "end_state": {
              "must_observe": [
                "typeof getOrchestratorModel() === 'string'",
                "getOrchestratorModel() === 'anthropic/claude-sonnet-4-6'",
                "getAgentModelInfo('high').model === 'gpt-4.1'"
              ],
              "must_not_observe": [
                "getOrchestratorModel() === undefined",
                "typeof getOrchestratorModel() === 'object'",
                "getOrchestratorModel() returns '' (empty string) or none"
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
      "description": "GIVEN the additive orchestrator tier and a minimal @mastra/core Agent built on it WHEN a real .generate() call is made against real Anthropic (deployment ANTHROPIC_API_KEY) THEN it returns non-empty result.text — proving the ModelRouter string resolves for real, closing the risk #15 landmine",
      "verify": "pnpm test convex/actions/agent/lib/__tests__/models.orchestratorTier.test.ts -t \"resolves the orchestrator tier through a real @mastra/core Agent against real Anthropic\"",
      "scenario": {
        "id": "AC-4",
        "primary": true,
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "real Anthropic API via @mastra/core Agent + ModelRouter string resolution ('anthropic/claude-sonnet-4-6'), ANTHROPIC_API_KEY from convex/lib/env.ts",
        "negative_control": {
          "would_fail_if": [
            "the Agent's model is swapped for a MockLanguageModel/canned response instead of the real router string",
            "the test only checks that getOrchestratorModel() returns a string, without ever constructing an Agent or calling .generate()",
            "a thrown resolution/auth error is caught and silently downgraded to a passing assertion instead of failing the test"
          ]
        },
        "evidence": {
          "artifact_type": "stdout",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "orchestrator_probe_prompt",
            "action": {
              "actor": "api_client",
              "steps": [
                "construct new Agent({ id: 'orchestrator-spike-probe', name: 'Orchestrator Spike Probe', instructions: 'Answer concisely.', model: getOrchestratorModel() })",
                "call await agent.generate('Reply with exactly the single word: banana.') against real Anthropic with no model override"
              ]
            },
            "end_state": {
              "must_observe": [
                "typeof result.text === 'string'",
                "result.text.length >= 1",
                "result.text.toLowerCase().includes('banana') === true"
              ],
              "must_not_observe": [
                "result.text === '' (empty)",
                "an unhandled/uncaught resolution or auth error"
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
      "description": "package.json contains @mastra/core and @ai-sdk/openai-compatible as dependencies while still containing ai matching ^7.x and @ai-sdk/anthropic",
      "verify": "pnpm test convex/actions/agent/lib/__tests__/models.orchestratorTier.test.ts -t \"package.json lists @mastra/core and @ai-sdk/openai-compatible while preserving ai@7 and @ai-sdk/anthropic\""
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "primary": false,
      "maps_to_ac": "AC-2",
      "description": "convex.json node.nodeVersion equals '22' and node.externalPackages includes @mastra/core, @ai-sdk/openai-compatible, ai, @ai-sdk/anthropic, and @mariozechner/pi-ai",
      "verify": "pnpm test convex/actions/agent/lib/__tests__/models.orchestratorTier.test.ts -t \"convex.json preserves nodeVersion 22 and adds @mastra/core + @ai-sdk/openai-compatible to externalPackages without removing existing entries\""
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "primary": false,
      "maps_to_ac": "AC-3",
      "description": "getOrchestratorModel() returns the string 'anthropic/claude-sonnet-4-6' and getAgentModelInfo('high').model remains 'gpt-4.1'",
      "verify": "pnpm test convex/actions/agent/lib/__tests__/models.orchestratorTier.test.ts -t \"getOrchestratorModel returns the pinned Mastra router string without touching the existing pi-ai tiers\""
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "primary": false,
      "maps_to_ac": "AC-4",
      "description": "A real @mastra/core Agent built on getOrchestratorModel() returns non-empty result.text from a real Anthropic completion containing the word 'banana'",
      "verify": "pnpm test convex/actions/agent/lib/__tests__/models.orchestratorTier.test.ts -t \"resolves the orchestrator tier through a real @mastra/core Agent against real Anthropic\""
    }
  ]
}
-->
</details>
