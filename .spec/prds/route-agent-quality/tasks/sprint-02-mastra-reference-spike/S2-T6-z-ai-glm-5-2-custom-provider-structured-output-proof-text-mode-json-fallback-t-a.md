# S2-T6 — z.ai GLM-5.2 custom-provider structured-output proof + text-mode JSON fallback (T-AGT-024)

| Field | Value |
|-------|-------|
| TASK_ID | S2-T6 |
| SPRINT | [Sprint 02 — Mastra spike + z.ai proof + enrichment re-ratification](./SPRINT.md) |
| TASK_TYPE | FEATURE |
| AGENT | implementer=`aisdk-implementer` · reviewer=`aisdk-reviewer` |
| ESTIMATE | 120 min |
| EFFORT | M |
| PRIORITY | P0 |
| STATUS | Backlog |
| PROPOSED_BY | `aisdk-planner` |
| TDD_MODE | `red_first` |
| RED_GREEN_REQUIRED | yes |
| CAPABILITIES | CAP-AGT-01 |
| DEPENDS_ON | S2-T1 |
| BLOCKS | S2-T8 |

RUNTIME_COMMANDS:
- test: `pnpm test convex/actions/agent/lib/__tests__/zaiProvider.integration.test.ts`
- typecheck: `pnpm type-check`
- lint: `pnpm exec biome check`

## OUTCOME

A real z.ai GLM-5.2 completion through the custom provider returns a non-empty parsed object matching `zaiStructuredProofSchema` (AC-1), a second real completion generalizes and records which path (structured vs. text-fallback) actually resolved it (AC-2), the fallback parser correctly extracts+validates a captured real completion and returns a typed error for genuinely malformed or empty text (AC-3), and the provider factory is provably configured with the correct baseURL + apiKey source (AC-4).

## 🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)

**MUST**
- Depend on S2-T1's install: `@ai-sdk/openai-compatible` must already be present in node_modules (from S2-T1) — do not re-install; if absent, that is a blocking dependency failure to surface, not something to work around.
- Add `export const Z_AI_API_KEY = optionalEnv('Z_AI_API_KEY')` to `convex/lib/env.ts` (mirrors the existing `ANTHROPIC_API_KEY`/`GOOGLE_MAPS_API_KEY` optionalEnv pattern at lines 40-56). The key is confirmed present in `.env.local` (verified via Read 2026-07-12) but is currently NOT exported from env.ts and is NOT set on the Convex deployment (`npx convex env list` verified 2026-07-12 shows only ANTHROPIC_API_KEY) — flag the missing deployment env var explicitly in the PR as a follow-up for when this tier moves into a deployed Convex action; do not block this vitest-level spike proof on it. Read the key only through this export, never `process.env.Z_AI_API_KEY` directly in product code.
- Construct the z.ai provider via `createOpenAICompatible({ name: 'zai', baseURL: 'https://api.z.ai/api/coding/paas/v4', apiKey: Z_AI_API_KEY })` from `@ai-sdk/openai-compatible`, then request the `glm-5.2` model id (LOCKED per `.spec/prds/enrichment/09-technical-requirements/06-external-dependencies.md:26`, 2026-07-10) via `zai('glm-5.2')`.
- Use the SAME v7 structured-output shape already proven in `anchorExtraction.ts`: `generateText({ model, output: Output.object({ schema }), prompt })`, reading `result.output` — NOT `result.object`. `result.object` is the field name Mastra's `agent.generate({ structuredOutput })` returns (a DIFFERENT API — see brain/skills/mastra-patterns/ROSETTA.md); this task is a direct AI-SDK v7 completion, decoupled from Mastra, mirroring the S1-T1 precedent (extractAnchors() never touches @mastra/core). If `result.object` is used anywhere, VERIFY against `node_modules/ai/docs` first — it is not the return shape of `generateText` in installed `ai@7.0.22`.
- VERIFY the exact `thinkingFormat:'zai'` wiring against z.ai's own OpenAI-compatible docs (https://docs.z.ai/) and against `@ai-sdk/openai-compatible`'s actual installed type surface (`node_modules/@ai-sdk/openai-compatible/dist/index.d.ts` — `OpenAICompatibleProviderSettings`/chat option types) once installed. Do NOT invent a `thinkingFormat` config key that isn't present in the installed provider's real type surface — this is exactly the kind of gap to flag, not guess.
- Implement a typed text-mode JSON-parse fallback: if the structured-output attempt throws, OR `zaiStructuredProofSchema.safeParse(result.output)` fails, extract the first balanced `{...}` JSON object from the raw completion text, `JSON.parse` it, and re-validate against the SAME Zod schema; if that also fails, return a TYPED result object (e.g. `{ ok: false, reason: 'structured_and_fallback_both_failed', raw: string }`) — never silently coerce/default to a passing shape.
- Define the proof schema as a Sprint-02-SPIKE-ONLY shape, e.g. `zaiStructuredProofSchema = z.object({ summary: z.string().min(1), confidence: z.enum(['high','medium','low']) })` — explicitly NOT the production enrichment `whyText` schema (that is later enrichment-pipeline scope). Name exports so they cannot be mistaken for the real contract.
- Ground the proof prompt in real content: reuse the real Twist of Tepusquet Loop and Old Hwy 40 route descriptions already proven in `anchorExtraction.ts`'s fixture set (S1-T1) rather than synthetic filler text.
- During RED-phase implementation, capture the raw completion text from the real AC-1/AC-2 calls and record a verbatim excerpt as the `captured_zai_raw_completion` fixture (recorded_external) used by AC-3's fallback-parser unit test — do NOT fabricate this fixture upfront.
- `parseZaiFallback` must return `{ ok: false, reason: '...' }` (never `ok: true`) for empty/blank input (`''`) as well as for non-JSON prose and truncated JSON — treat empty string as just another malformed case, not a special-cased pass.
- The installed zod (verified 3.25.76 via node_modules/zod/package.json 2026-07-12) already satisfies @ai-sdk/openai-compatible@3.0.5's peer range (`^3.25.76 || ^4.1.8`) — confirm this holds after `pnpm add`; if a peer-dep warning appears, resolve it honestly (bump the declared floor in package.json), never suppress the warning.

**NEVER**
- NEVER mock `@ai-sdk/openai-compatible`/`generateText`/`createOpenAICompatible` for AC-1 or AC-2 (the PRIMARY + generalization ACs) — both hit the real z.ai API.
- NEVER route this proof through `@mariozechner/pi-ai` or the existing `models.ts` `low`/`high` pi-ai tiers — this is the net-new AI-SDK-native path (D1).
- NEVER construct a `@mastra/core` Agent in this task — S2-T6 proves the AI-SDK provider layer directly, decoupled from Mastra (mirroring S1-T1's precedent); Mastra's own consumption of this same provider instance in a future conversation/tool seam is S2-T2/T3+ scope, not blocked by this decision since any LanguageModelV4-compatible instance is Mastra-consumable later.
- NEVER hardcode `Z_AI_API_KEY` or its literal value as a string in source — read only via `convex/lib/env.ts`; never commit the raw key value anywhere (including test fixtures/evidence/PR text).
- NEVER swallow a real schema-validation failure by returning a fabricated/default object instead of exercising the documented fallback or the typed error.
- NEVER use v6-era API names (`system:`, `parameters:`, `.fullStream`, `onFinish`, `generateObject`, `require(`).

**STRICTLY**
- STRICTLY test_tier=integration on AC-1 (PRIMARY) and AC-2 against the real z.ai API — a MockLanguageModel-only pass does not satisfy either.
- STRICTLY SKIP-with-reason (never fake success) if `Z_AI_API_KEY` is absent or z.ai is unreachable during the integration run.
- STRICTLY the AC-3 fallback-parser test is pure text parsing over a captured/fixed string (zero network I/O) — it must NOT re-call the real API to force the fallback branch (that would make the test flaky/non-reproducible); it validates the parser function directly against captured + deliberately-malformed + empty text.

## SPECIFICATION

**Objective:** Prove 'one model layer' holds for the single non-stock provider (z.ai GLM-5.2) by porting it off pi-ai onto a custom AI-SDK v7 `createOpenAICompatible` provider instance, with a real structured-output completion and a documented, typed text-mode JSON fallback for when `thinkingFormat:'zai'` reasoning tokens break structured parsing — satisfying T-AGT-024 and unblocking S2-T8's re-ratification of the enrichment PRD's dependency section.

**Success state:** A real z.ai GLM-5.2 completion through the custom provider returns a non-empty parsed object matching `zaiStructuredProofSchema` (AC-1), a second real completion generalizes and records which path (structured vs. text-fallback) actually resolved it (AC-2), the fallback parser correctly extracts+validates a captured real completion and returns a typed error for genuinely malformed or empty text (AC-3), and the provider factory is provably configured with the correct baseURL + apiKey source (AC-4).

## FIXTURES (shared seed data — referenced by scenario `start_ref`)

- `zai_baseurl_and_key` (seed_method: `public_api`): z.ai OpenAI-compatible endpoint config: baseURL 'https://api.z.ai/api/coding/paas/v4'; model id 'glm-5.2' (LOCKED per enrichment PRD 2026-07-10). Z_AI_API_KEY confirmed present in .env.local (verified via Read 2026-07-12, value not reproduced here); NOT yet set on the Convex deployment (npx convex env list verified 2026-07-12 shows only ANTHROPIC_API_KEY).
- `twist_of_tepusquet_description` (seed_method: `recorded_external`): Real curated_routes row twist-of-tepusquet-loop (CA, 41mi loop) — the same real description proven in S1-T1's anchor-extraction fixture, reused here as grounding content for the z.ai proof prompt.
- `old_hwy_40_description` (seed_method: `recorded_external`): Real curated_routes row old-hwy-40 point-to-point route (S1-T1's second proven fixture), reused here for AC-2's generalization completion.
- `captured_zai_raw_completion` (seed_method: `recorded_external`): A raw completion string captured verbatim from a real z.ai GLM-5.2 call made during this task's own AC-1/AC-2 implementation. To be recorded by aisdk-implementer at RED-phase time from an actual API response (NOT fabricated upfront by the planner); must preserve any thinkingFormat reasoning preamble observed around the JSON payload.
- `malformed_proof_completion_texts` (seed_method: `public_api`): Deliberately malformed and empty raw completion strings fed to the fallback parser to prove the typed-error path when even the text-mode fallback cannot recover a valid object.

## ACCEPTANCE CRITERIA (TDD beads — RED → GREEN → REFACTOR per AC)

### AC-1

**Requirement:** GIVEN the real Twist of Tepusquet description WHEN the z.ai structured-completion function runs against real z.ai GLM-5.2 via createOpenAICompatible THEN it returns a non-empty parsed object validating against zaiStructuredProofSchema

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: real z.ai GLM-5.2 API via createOpenAICompatible (baseURL https://api.z.ai/api/coding/paas/v4)
- FLOW_REF: UC-AGT-01
- VERIFY: `pnpm test convex/actions/agent/lib/__tests__/zaiProvider.integration.test.ts -t "returns a non-empty parsed structured object from a real z.ai GLM-5.2 completion"`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: the completion is stubbed/mocked instead of the real createOpenAICompatible call hitting api.z.ai; Z_AI_API_KEY is never actually passed (empty/undefined apiKey sent, request silently fails auth and is swallowed); zaiStructuredProofSchema validation is bypassed so a malformed/empty completion silently passes
- EVIDENCE: `stdout` (required_capture: true)
- CASE 1 — start_ref `twist_of_tepusquet_description`
    - ACTION (api_client): call zaiStructuredComplete(twistOfTepusquetDescription) against the real z.ai completion with no model override
    - MUST_OBSERVE: result.ok === true; result.object.summary.length >= 1; result.object.confidence is one of 'high' | 'medium' | 'low'
    - MUST_NOT_OBSERVE: result.object.summary === '' (empty); result.ok === false with zero completion content (nothing returned); an unhandled/uncaught network or auth error

### AC-2

**Requirement:** GIVEN the real Old Hwy 40 description WHEN zaiStructuredComplete runs against real z.ai GLM-5.2 a second time THEN it returns a non-empty parsed object AND reports which path (structured vs text-fallback) actually resolved it — proving generalization and making the fallback conditionally observable, not asserted-on-faith

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: real z.ai GLM-5.2 API via createOpenAICompatible (baseURL https://api.z.ai/api/coding/paas/v4)
- VERIFY: `pnpm test convex/actions/agent/lib/__tests__/zaiProvider.integration.test.ts -t "generalizes to a second real z.ai GLM-5.2 completion and records which path resolved it"`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: zaiStructuredComplete only works for the single hardcoded Twist-of-Tepusquet golden case; the completion is stubbed/mocked instead of hitting the real z.ai API for this second fixture; the returned result never reports which path (structured/text-fallback) was taken, hiding whether the fallback logic ever actually executes
- EVIDENCE: `stdout` (required_capture: true)
- CASE 1 — start_ref `old_hwy_40_description`
    - ACTION (api_client): call zaiStructuredComplete(oldHwy40Description) against the real z.ai completion
    - MUST_OBSERVE: result.ok === true; result.object.summary.length >= 1; result.path is one of 'structured' | 'text-fallback'
    - MUST_NOT_OBSERVE: result.object.summary === '' (empty); result.path === none (undefined)

### AC-3

**Requirement:** GIVEN a captured real z.ai raw completion string, deliberately malformed strings, and an empty string WHEN parseZaiFallback runs against each THEN the captured real text is extracted+validated into a schema-conformant object, and genuinely malformed or empty text returns a typed error (never a silent pass)

- TEST_TIER: `unit`  ·  VERIFICATION_SERVICE: n/a — pure text-parsing + Zod validation, zero I/O
- UNIT_TEST_JUSTIFIED: Pure string-extraction and Zod re-validation over a fixed captured/malformed/empty text — deterministic parsing logic verifiable without a live provider call.
- VERIFY: `pnpm test convex/actions/agent/lib/__tests__/zaiProvider.integration.test.ts -t "parseZaiFallback extracts and validates a captured real completion, and returns a typed error for malformed text"`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: parseZaiFallback has no JSON-extraction logic and always throws/returns undefined on any text; parseZaiFallback is never invoked by zaiStructuredComplete (dead/disconnected fallback code); malformed or empty input is coerced/defaulted into a passing shape instead of returning a typed error
- EVIDENCE: `stdout` (required_capture: true)
- CASE 1 — start_ref `captured_zai_raw_completion`
    - ACTION (api_client): call parseZaiFallback(capturedRawCompletionText, zaiStructuredProofSchema)
    - MUST_OBSERVE: result.ok === true; result.object.summary.length >= 1
    - MUST_NOT_OBSERVE: result.ok === false for well-formed captured text; result.object is empty/undefined (no parsed object returned); an uncaught JSON.parse exception
- CASE 2 — start_ref `malformed_proof_completion_texts`
    - ACTION (api_client): call parseZaiFallback('not json at all, just prose', zaiStructuredProofSchema)
    - MUST_OBSERVE: result.ok === false; result.reason === 'structured_and_fallback_both_failed'
    - MUST_NOT_OBSERVE: result.ok === true; 0 issues reported for malformed input
- CASE 3 — start_ref `malformed_proof_completion_texts`
    - ACTION (api_client): call parseZaiFallback('', zaiStructuredProofSchema) with a zero-length empty-string completion
    - MUST_OBSERVE: result.ok === false; result.reason === 'structured_and_fallback_both_failed'
    - MUST_NOT_OBSERVE: result.ok === true for empty/blank input (0 issues); result.object is returned despite empty/blank input (no error)

### AC-4

**Requirement:** GIVEN createZaiProvider() and env.ts's Z_AI_API_KEY export WHEN the provider config is inspected THEN baseURL is exactly the z.ai endpoint and apiKey is sourced from the Z_AI_API_KEY export, not a hardcoded literal

- TEST_TIER: `unit`  ·  VERIFICATION_SERVICE: n/a — pure config assertion, zero network I/O
- UNIT_TEST_JUSTIFIED: Provider construction config is a deterministic object literal — verifiable by inspection without making a network call.
- VERIFY: `pnpm test convex/actions/agent/lib/__tests__/zaiProvider.integration.test.ts -t "createZaiProvider is configured with the z.ai baseURL and reads the apiKey from env.ts"`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: createZaiProvider() defaults to the stock OpenAI baseURL instead of the z.ai endpoint; apiKey is a hardcoded string literal in source instead of read from Z_AI_API_KEY; createZaiProvider() silently no-ops / returns undefined when Z_AI_API_KEY is unset instead of surfacing a clear error
- EVIDENCE: `stdout` (required_capture: true)
- CASE 1 — start_ref `zai_baseurl_and_key`
    - ACTION (api_client): call createZaiProvider() with process.env.Z_AI_API_KEY set to the real .env.local value and inspect its config
    - MUST_OBSERVE: provider config baseURL === 'https://api.z.ai/api/coding/paas/v4'; provider config apiKey === Z_AI_API_KEY (sourced from env.ts, not undefined)
    - MUST_NOT_OBSERVE: provider config baseURL is the OpenAI default or undefined; provider config apiKey is a literal string found verbatim in the source file

## TEST CRITERIA

| TC | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | zaiStructuredComplete() on the real Twist of Tepusquet description returns result.ok===true with a non-empty summary and a valid confidence enum value | AC-1 | `pnpm test convex/actions/agent/lib/__tests__/zaiProvider.integration.test.ts -t "returns a non-empty parsed structured object from a real z.ai GLM-5.2 completion"` |
| TC-2 | zaiStructuredComplete() on the real Old Hwy 40 description returns result.ok===true and a result.path of 'structured' or 'text-fallback' | AC-2 | `pnpm test convex/actions/agent/lib/__tests__/zaiProvider.integration.test.ts -t "generalizes to a second real z.ai GLM-5.2 completion and records which path resolved it"` |
| TC-3 | parseZaiFallback() recovers a valid object from a captured real completion and returns a typed error (not a throw, not a silent pass) for non-JSON prose and for an empty string | AC-3 | `pnpm test convex/actions/agent/lib/__tests__/zaiProvider.integration.test.ts -t "parseZaiFallback extracts and validates a captured real completion, and returns a typed error for malformed text"` |
| TC-4 | createZaiProvider() config exposes baseURL 'https://api.z.ai/api/coding/paas/v4' and an apiKey sourced from Z_AI_API_KEY | AC-4 | `pnpm test convex/actions/agent/lib/__tests__/zaiProvider.integration.test.ts -t "createZaiProvider is configured with the z.ai baseURL and reads the apiKey from env.ts"` |

## SCOPE (file-level write permissions)

**writeAllowed:**
- `convex/actions/agent/lib/zaiProvider.ts (NEW — createZaiProvider, zaiStructuredComplete, parseZaiFallback, zaiStructuredProofSchema)`
- `convex/actions/agent/lib/__tests__/zaiProvider.integration.test.ts (NEW)`
- `convex/lib/env.ts (MODIFY — add Z_AI_API_KEY export only)`

**writeProhibited:**
- `convex/actions/agent/lib/models.ts (S2-T1's file; the orchestrator/pi-ai tiers stay untouched by this task)`
- `any @mastra/core import anywhere in this diff`
- `convex/schema.ts and any table writes (zero persistence here)`
- `.env.local, .env, or any file containing the raw Z_AI_API_KEY value (never edit/print the secret)`

## READING LIST

- `.spec/prds/route-agent-quality/10-technical-requirements/06-external-dependencies.md`:112-127 — D1 GLM-5.2 port off pi-ai onto createOpenAICompatible; T-AGT-024 exact pass/fail bar; structured-output failure fallback
- `.spec/prds/route-agent-quality/11-e2e-testing-criteria.md`:208 — T-AGT-024 criterion row: non-empty parsed result.object, gates enrichment re-ratification
- `.spec/prds/route-agent-quality/10-technical-requirements/08-technical-risks.md`:31 — Risk #21 — GLM-5.2 port may not map cleanly to a stock AI-SDK provider
- `.spec/prds/enrichment/09-technical-requirements/06-external-dependencies.md`:11-48 — The PRD section this task's evidence gates the re-ratification of (S2-T8's target)
- `convex/actions/agent/lib/anchorExtraction.ts`:1-111 — [PRIMARY PATTERN] proven v7 generateText+Output.object shape, result.output field name, injectable-model pattern to mirror
- `convex/lib/env.ts`:40-56 — optionalEnv export pattern to mirror for Z_AI_API_KEY

## CODE PATTERN

- Pattern: Direct AI-SDK v7 completion against a custom OpenAI-compatible provider instance, decoupled from Mastra, with an explicit structured→text-mode-fallback→typed-error ladder.
- Pattern source: `convex/actions/agent/lib/anchorExtraction.ts:88-111 (structured-output + validation ladder) adapted with a fallback branch`
- Anti-pattern: Routing through pi-ai/Cerebras (the old zai-glm-4.7 MODEL_MAP comment in models.ts); constructing a Mastra Agent for this proof; using generateObject or reading result.object off generateText; silently defaulting on a validation failure; special-casing empty input as a pass.

## VERIFICATION GATES

- tests pass: `pnpm test convex/actions/agent/lib/__tests__/zaiProvider.integration.test.ts` → Exit 0
- typecheck: `pnpm type-check` → Exit 0
- lint: `pnpm exec biome check` → Exit 0
- no v6-era API names: `grep -RE 'system:|parameters:|\.fullStream|onFinish|generateObject|require\(' convex/actions/agent/lib/zaiProvider.ts` → no matches
- no Mastra coupling: `grep -c "@mastra/core" convex/actions/agent/lib/zaiProvider.ts` → 0
- no hardcoded secret: `grep -REIn "[0-9a-f]{32}" convex/actions/agent/lib/zaiProvider.ts` → no matches

## AGENT ASSIGNMENT

- Implementer: `aisdk-implementer` — aisdk-implementer owns AI-SDK v7 Core-surface provider work (generateText + Output.object structured output against a real, non-stock provider) — this is a direct extension of the proven anchorExtraction.ts pattern (S1-T1) onto a custom createOpenAICompatible provider instance, with no UI and no Mastra Agent coupling.
- Reviewer: `aisdk-reviewer`

## EVIDENCE GATES

- RED phase: each behavioral AC test went red before green (TDD_STATE history).
- Integration/E2E coverage: PRIMARY AC hits real services; captured EVIDENCE shows the seeded MUST_OBSERVE value (not merely "tests passed").
- Scenario un-fakeable: `validate_scenario` exit 0 on every behavioral AC.

## DEPENDENCIES

- Depends on: S2-T1
- Blocks: S2-T8

<details>
<summary>▸ Full agent specification (TASK-TEMPLATE v5.2 — machine-readable requirement contract)</summary>

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "version": "1",
  "task_id": "S2-T6",
  "tdd_mode": "red_first",
  "verification_policy": {
    "requires_tests": true,
    "requires_red_evidence": true,
    "requires_seeded_evidence": true
  },
  "fixtures": {
    "zai_baseurl_and_key": {
      "description": "z.ai OpenAI-compatible endpoint config: baseURL 'https://api.z.ai/api/coding/paas/v4'; model id 'glm-5.2' (LOCKED per enrichment PRD 2026-07-10). Z_AI_API_KEY confirmed present in .env.local (verified via Read 2026-07-12, value not reproduced here); NOT yet set on the Convex deployment (npx convex env list verified 2026-07-12 shows only ANTHROPIC_API_KEY).",
      "seed_method": "public_api",
      "records": [
        "baseURL = 'https://api.z.ai/api/coding/paas/v4'",
        "model id = 'glm-5.2'",
        "Z_AI_API_KEY present in .env.local; absent from `npx convex env list` output"
      ]
    },
    "twist_of_tepusquet_description": {
      "description": "Real curated_routes row twist-of-tepusquet-loop (CA, 41mi loop) — the same real description proven in S1-T1's anchor-extraction fixture, reused here as grounding content for the z.ai proof prompt.",
      "seed_method": "recorded_external",
      "records": [
        "routeId=motorcycleroads:twist-of-tepusquet-loop",
        "summary names Betteravia->Foxen Canyon->Santa Maria Mesa->Tepusquet Canyon->Hwy 166->US-101"
      ]
    },
    "old_hwy_40_description": {
      "description": "Real curated_routes row old-hwy-40 point-to-point route (S1-T1's second proven fixture), reused here for AC-2's generalization completion.",
      "seed_method": "recorded_external",
      "records": [
        "routeId=motorcycleroads:old-hwy-40-cisco-grove-to-donner-lake",
        "summary mixes POI + road names"
      ]
    },
    "captured_zai_raw_completion": {
      "description": "A raw completion string captured verbatim from a real z.ai GLM-5.2 call made during this task's own AC-1/AC-2 implementation. To be recorded by aisdk-implementer at RED-phase time from an actual API response (NOT fabricated upfront by the planner); must preserve any thinkingFormat reasoning preamble observed around the JSON payload.",
      "seed_method": "recorded_external",
      "records": [
        "captured by aisdk-implementer during RED phase from a real z.ai completion; raw response text recorded verbatim, including any reasoning-token preamble"
      ]
    },
    "malformed_proof_completion_texts": {
      "description": "Deliberately malformed and empty raw completion strings fed to the fallback parser to prove the typed-error path when even the text-mode fallback cannot recover a valid object.",
      "seed_method": "public_api",
      "records": [
        "'not json at all, just prose'",
        "'{\"summary\": \"unterminated'  (truncated JSON, no closing brace)",
        "''  (empty string — zero-length completion text)"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": false,
      "maps_to_ac": null,
      "description": "GIVEN the real Twist of Tepusquet description WHEN the z.ai structured-completion function runs against real z.ai GLM-5.2 via createOpenAICompatible THEN it returns a non-empty parsed object validating against zaiStructuredProofSchema",
      "verify": "pnpm test convex/actions/agent/lib/__tests__/zaiProvider.integration.test.ts -t \"returns a non-empty parsed structured object from a real z.ai GLM-5.2 completion\"",
      "scenario": {
        "id": "AC-1",
        "primary": true,
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "real z.ai GLM-5.2 API via createOpenAICompatible (baseURL https://api.z.ai/api/coding/paas/v4)",
        "negative_control": {
          "would_fail_if": [
            "the completion is stubbed/mocked instead of the real createOpenAICompatible call hitting api.z.ai",
            "Z_AI_API_KEY is never actually passed (empty/undefined apiKey sent, request silently fails auth and is swallowed)",
            "zaiStructuredProofSchema validation is bypassed so a malformed/empty completion silently passes"
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
                "call zaiStructuredComplete(twistOfTepusquetDescription) against the real z.ai completion with no model override"
              ]
            },
            "end_state": {
              "must_observe": [
                "result.ok === true",
                "result.object.summary.length >= 1",
                "result.object.confidence is one of 'high' | 'medium' | 'low'"
              ],
              "must_not_observe": [
                "result.object.summary === '' (empty)",
                "result.ok === false with zero completion content (nothing returned)",
                "an unhandled/uncaught network or auth error"
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
      "description": "GIVEN the real Old Hwy 40 description WHEN zaiStructuredComplete runs against real z.ai GLM-5.2 a second time THEN it returns a non-empty parsed object AND reports which path (structured vs text-fallback) actually resolved it — proving generalization and making the fallback conditionally observable, not asserted-on-faith",
      "verify": "pnpm test convex/actions/agent/lib/__tests__/zaiProvider.integration.test.ts -t \"generalizes to a second real z.ai GLM-5.2 completion and records which path resolved it\"",
      "scenario": {
        "id": "AC-2",
        "primary": false,
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "real z.ai GLM-5.2 API via createOpenAICompatible (baseURL https://api.z.ai/api/coding/paas/v4)",
        "negative_control": {
          "would_fail_if": [
            "zaiStructuredComplete only works for the single hardcoded Twist-of-Tepusquet golden case",
            "the completion is stubbed/mocked instead of hitting the real z.ai API for this second fixture",
            "the returned result never reports which path (structured/text-fallback) was taken, hiding whether the fallback logic ever actually executes"
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
                "call zaiStructuredComplete(oldHwy40Description) against the real z.ai completion"
              ]
            },
            "end_state": {
              "must_observe": [
                "result.ok === true",
                "result.object.summary.length >= 1",
                "result.path is one of 'structured' | 'text-fallback'"
              ],
              "must_not_observe": [
                "result.object.summary === '' (empty)",
                "result.path === none (undefined)"
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
      "description": "GIVEN a captured real z.ai raw completion string, deliberately malformed strings, and an empty string WHEN parseZaiFallback runs against each THEN the captured real text is extracted+validated into a schema-conformant object, and genuinely malformed or empty text returns a typed error (never a silent pass)",
      "verify": "pnpm test convex/actions/agent/lib/__tests__/zaiProvider.integration.test.ts -t \"parseZaiFallback extracts and validates a captured real completion, and returns a typed error for malformed text\"",
      "scenario": {
        "id": "AC-3",
        "primary": false,
        "tier": "visible",
        "test_tier": "unit",
        "verification_service": "n/a — pure text-parsing + Zod validation, zero I/O",
        "negative_control": {
          "would_fail_if": [
            "parseZaiFallback has no JSON-extraction logic and always throws/returns undefined on any text",
            "parseZaiFallback is never invoked by zaiStructuredComplete (dead/disconnected fallback code)",
            "malformed or empty input is coerced/defaulted into a passing shape instead of returning a typed error"
          ]
        },
        "evidence": {
          "artifact_type": "stdout",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "captured_zai_raw_completion",
            "action": {
              "actor": "api_client",
              "steps": [
                "call parseZaiFallback(capturedRawCompletionText, zaiStructuredProofSchema)"
              ]
            },
            "end_state": {
              "must_observe": [
                "result.ok === true",
                "result.object.summary.length >= 1"
              ],
              "must_not_observe": [
                "result.ok === false for well-formed captured text",
                "result.object is empty/undefined (no parsed object returned)",
                "an uncaught JSON.parse exception"
              ]
            }
          },
          {
            "start_ref": "malformed_proof_completion_texts",
            "action": {
              "actor": "api_client",
              "steps": [
                "call parseZaiFallback('not json at all, just prose', zaiStructuredProofSchema)"
              ]
            },
            "end_state": {
              "must_observe": [
                "result.ok === false",
                "result.reason === 'structured_and_fallback_both_failed'"
              ],
              "must_not_observe": [
                "result.ok === true",
                "0 issues reported for malformed input"
              ]
            }
          },
          {
            "start_ref": "malformed_proof_completion_texts",
            "action": {
              "actor": "api_client",
              "steps": [
                "call parseZaiFallback('', zaiStructuredProofSchema) with a zero-length empty-string completion"
              ]
            },
            "end_state": {
              "must_observe": [
                "result.ok === false",
                "result.reason === 'structured_and_fallback_both_failed'"
              ],
              "must_not_observe": [
                "result.ok === true for empty/blank input (0 issues)",
                "result.object is returned despite empty/blank input (no error)"
              ]
            }
          }
        ],
        "unit_test_justified": "Pure string-extraction and Zod re-validation over a fixed captured/malformed/empty text — deterministic parsing logic verifiable without a live provider call."
      }
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "primary": false,
      "maps_to_ac": null,
      "description": "GIVEN createZaiProvider() and env.ts's Z_AI_API_KEY export WHEN the provider config is inspected THEN baseURL is exactly the z.ai endpoint and apiKey is sourced from the Z_AI_API_KEY export, not a hardcoded literal",
      "verify": "pnpm test convex/actions/agent/lib/__tests__/zaiProvider.integration.test.ts -t \"createZaiProvider is configured with the z.ai baseURL and reads the apiKey from env.ts\"",
      "scenario": {
        "id": "AC-4",
        "primary": false,
        "tier": "visible",
        "test_tier": "unit",
        "verification_service": "n/a — pure config assertion, zero network I/O",
        "negative_control": {
          "would_fail_if": [
            "createZaiProvider() defaults to the stock OpenAI baseURL instead of the z.ai endpoint",
            "apiKey is a hardcoded string literal in source instead of read from Z_AI_API_KEY",
            "createZaiProvider() silently no-ops / returns undefined when Z_AI_API_KEY is unset instead of surfacing a clear error"
          ]
        },
        "evidence": {
          "artifact_type": "stdout",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "zai_baseurl_and_key",
            "action": {
              "actor": "api_client",
              "steps": [
                "call createZaiProvider() with process.env.Z_AI_API_KEY set to the real .env.local value and inspect its config"
              ]
            },
            "end_state": {
              "must_observe": [
                "provider config baseURL === 'https://api.z.ai/api/coding/paas/v4'",
                "provider config apiKey === Z_AI_API_KEY (sourced from env.ts, not undefined)"
              ],
              "must_not_observe": [
                "provider config baseURL is the OpenAI default or undefined",
                "provider config apiKey is a literal string found verbatim in the source file"
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
      "description": "zaiStructuredComplete() on the real Twist of Tepusquet description returns result.ok===true with a non-empty summary and a valid confidence enum value",
      "verify": "pnpm test convex/actions/agent/lib/__tests__/zaiProvider.integration.test.ts -t \"returns a non-empty parsed structured object from a real z.ai GLM-5.2 completion\""
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "primary": false,
      "maps_to_ac": "AC-2",
      "description": "zaiStructuredComplete() on the real Old Hwy 40 description returns result.ok===true and a result.path of 'structured' or 'text-fallback'",
      "verify": "pnpm test convex/actions/agent/lib/__tests__/zaiProvider.integration.test.ts -t \"generalizes to a second real z.ai GLM-5.2 completion and records which path resolved it\""
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "primary": false,
      "maps_to_ac": "AC-3",
      "description": "parseZaiFallback() recovers a valid object from a captured real completion and returns a typed error (not a throw, not a silent pass) for non-JSON prose and for an empty string",
      "verify": "pnpm test convex/actions/agent/lib/__tests__/zaiProvider.integration.test.ts -t \"parseZaiFallback extracts and validates a captured real completion, and returns a typed error for malformed text\""
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "primary": false,
      "maps_to_ac": "AC-4",
      "description": "createZaiProvider() config exposes baseURL 'https://api.z.ai/api/coding/paas/v4' and an apiKey sourced from Z_AI_API_KEY",
      "verify": "pnpm test convex/actions/agent/lib/__tests__/zaiProvider.integration.test.ts -t \"createZaiProvider is configured with the z.ai baseURL and reads the apiKey from env.ts\""
    }
  ]
}
-->
</details>
