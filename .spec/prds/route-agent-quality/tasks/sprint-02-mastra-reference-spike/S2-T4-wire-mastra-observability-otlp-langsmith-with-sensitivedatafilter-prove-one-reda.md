# S2-T4 — Wire Mastra Observability → OTLP → LangSmith with SensitiveDataFilter; prove one redacted trace

| Field | Value |
|-------|-------|
| TASK_ID | S2-T4 |
| SPRINT | [Sprint 02 — Mastra spike + z.ai proof + enrichment re-ratification](./SPRINT.md) |
| TASK_TYPE | FEATURE |
| AGENT | implementer=`convex-implementer` · reviewer=`convex-reviewer` |
| ESTIMATE | 120 min |
| EFFORT | M |
| PRIORITY | P0 |
| STATUS | completed |
| PROPOSED_BY | `mastra-planner` |
| TDD_MODE | `red_first` |
| RED_GREEN_REQUIRED | yes |
| CAPABILITIES | CAP-AGT-01, CAP-AGT-02 |
| DEPENDS_ON | S2-T3 |
| BLOCKS | S2-T5, S2-T7 |

RUNTIME_COMMANDS:
- test: `pnpm test convex/actions/agent/spike/__tests__/spikeObservability.integration.test.ts`
- typecheck: `pnpm type-check`
- lint: `pnpm exec biome check`

## OUTCOME

Completion evidence: `.tmp/S2-T4/requirement-results.json` records exit code 0 for
AC-1 through AC-3 and TC-1 through TC-3; deployed redaction and retrieval are also
captured in the fresh gate artifacts (`04d00eb0`, `b1c8ba41`).

Running one 2-turn spike conversation exports a single trace to real LangSmith whose captured span JSON has all three span types (each stamped promptVersion/sessionId/tier, model span cost>0/tokens>0), contains zero 'sk-ant-'/'sk-'/'AIza'/*_API_KEY occurrences, and the OTLP export returns 2xx with the trace retrievable by traceId.

## 🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)

**MUST**
- Import Observability + an OTLP exporter + SensitiveDataFilter from '@mastra/observability'.
- Construct new Observability({ configs: { default: { serviceName, exporters:[ OTLP-over-HTTP -> LangSmith OTEL endpoint, a paired local capture exporter ], spanOutputProcessors:[ new SensitiveDataFilter() ] } } }) and attach it to the Mastra instance the spike Agent runs under (conversation instance).
- The OTLP exporter targets the REAL LangSmith OTEL ingestion endpoint using LANGSMITH_API_KEY + LANGSMITH_PROJECT headers from convex/lib/env.ts.
- Emit three span types — per-turn root (input/reply sizes, finishReason, total tokens+cost, step count), per-model call (model id, tokens, cost, latency), per-tool call (name, arg/result sizes, latency, typed error code) — each STAMPED with promptVersion, sessionId, tier.
- SensitiveDataFilter redacts secrets: the exported span JSON must contain no 'sk-ant-', 'sk-', 'AIza', and no raw *_API_KEY value.
- Wire Observability on the CONVERSATION (spike) instance ONLY — batch/pipeline tiers stay unobserved (06-external-dependencies batch-telemetry note).
- This is ADDITIVE: leave the existing lib/tracing.ts no-op stub in place (Sprint 07 replaces the 13 wrappers) — do not rip it out.

**NEVER**
- NEVER leave a 0.x telemetry:{} block anywhere — it is silently ignored in 1.x and no spans export.
- NEVER assert redaction against an empty/stub span payload — the payload MUST contain real model + tool spans so the filter is exercised on real content.
- NEVER post to a fake/local endpoint and call it 'LangSmith wired' — the OTLP export must hit the real LangSmith ingestion URL.
- NEVER serialize Authorization/api-key headers into the span JSON unredacted.
- NEVER mock @mastra/observability or the LangSmith exporter for the redaction/ingestion ACs.

**STRICTLY**
- STRICTLY test_tier=integration on all ACs against real LangSmith + a real spike conversation on the dev deployment.
- STRICTLY SKIP-with-reason (never fake success) on a LangSmith outage or missing LANGSMITH_API_KEY.
- STRICTLY capture the exported span JSON (via the paired local capture exporter alongside the real export) so redaction and stamping are asserted on the actual serialized payload.

## SPECIFICATION

**Objective:** Replace the no-op tracing path for the spike conversation with real Mastra Observability exporting OTLP to LangSmith, redacted by SensitiveDataFilter, and prove ONE visible trace with root/model/tool spans stamped promptVersion/sessionId/tier/cost and zero api-key substrings.

**Success state:** Running one 2-turn spike conversation exports a single trace to real LangSmith whose captured span JSON has all three span types (each stamped promptVersion/sessionId/tier, model span cost>0/tokens>0), contains zero 'sk-ant-'/'sk-'/'AIza'/*_API_KEY occurrences, and the OTLP export returns 2xx with the trace retrievable by traceId.

## FIXTURES (shared seed data — referenced by scenario `start_ref`)

- `spike_conversation_trace` (seed_method: `recorded_external`): The 2-turn Ogden spike conversation (from S2-T3) run with Observability attached; its spans captured via a paired local capture exporter and exported to real LangSmith.
- `api_key_redaction_probe` (seed_method: `recorded_external`): The forbidden secret signatures that must NOT appear in any exported span JSON (prefixes + env-var names; secret VALUES are read from the deployment env, never hardcoded here).

## ACCEPTANCE CRITERIA (TDD beads — RED → GREEN → REFACTOR per AC)

### AC-1

**Requirement:** GIVEN the spike conversation instance with Observability attached WHEN one 2-turn conversation runs and spans export to real LangSmith THEN the captured span JSON contains root + model + tool span types, each stamped promptVersion/sessionId/tier, with the model span carrying cost>0 and totalTokens>0

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: real LangSmith OTEL ingestion + a real spike conversation on the dev deployment
- FLOW_REF: UC-AGT-01
- VERIFY: `pnpm test convex/actions/agent/spike/__tests__/spikeObservability.integration.test.ts -t "exports root/model/tool spans stamped and priced to LangSmith"`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: Observability is left as the lib/tracing.ts no-op stub so nothing is exported; a leftover 0.x telemetry:{} block is used (silently ignored, no spans emitted); the exporter is mocked/disconnected from the real LangSmith OTEL endpoint; spans are emitted with empty attributes (promptVersion/sessionId/tier absent)
- EVIDENCE: `stdout` (required_capture: true)
- CASE 1 — start_ref `spike_conversation_trace`
    - ACTION (cli_user): run the 2-turn Ogden spike conversation with Observability attached → capture the exported span JSON via the paired local capture exporter
    - MUST_OBSERVE: spans.some(s => s.type === 'root') === true; spans.filter(s => s.type === 'model').length >= 1; spans.filter(s => s.type === 'tool').length >= 1; every span satisfies span.attributes.promptVersion.length >= 1 && span.attributes.sessionId.length >= 1; every span.attributes.tier === 'orchestrator'; the model span has cost > 0 && totalTokens > 0
    - MUST_NOT_OBSERVE: spans.length === 0 (no spans exported — no-op exporter); a span with span.attributes.sessionId === '' (empty) or tier missing; the model span with cost === 0 || totalTokens === 0

### AC-2

**Requirement:** GIVEN the exported span JSON from a real conversation containing real model + tool spans WHEN SensitiveDataFilter runs as the span-output processor THEN the payload has zero occurrences of 'sk-ant-', 'sk-', 'AIza', and no raw *_API_KEY value, while still containing >=1 model span and >=1 tool span

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: real span export payload + SensitiveDataFilter (redaction proof, risk #20)
- VERIFY: `pnpm test convex/actions/agent/spike/__tests__/spikeObservability.integration.test.ts -t "exported span JSON is redacted of all api-key signatures"`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: SensitiveDataFilter is not registered as a spanOutputProcessor so keys pass through; the redaction is asserted against an empty/stub payload (no real spans) so it trivially passes; the exporter serializes Authorization/api-key headers into the span JSON unredacted
- EVIDENCE: `stdout` (required_capture: true)
- CASE 1 — start_ref `api_key_redaction_probe`
    - ACTION (cli_user): serialize the exported span JSON from the real conversation → grep it for the forbidden substrings and the deployment env-key values
    - MUST_OBSERVE: (spanJson.match(/sk-ant-/g) || []).length === 0; (spanJson.match(/sk-/g) || []).length === 0; (spanJson.match(/AIza/g) || []).length === 0; spanJson.includes(process.env.ANTHROPIC_API_KEY) === false && spanJson.includes(process.env.GOOGLE_MAPS_API_KEY) === false && spanJson.includes(process.env.LANGSMITH_API_KEY) === false; spans.filter(s => s.type === 'model').length >= 1 && spans.filter(s => s.type === 'tool').length >= 1 (redaction ran on real content)
    - MUST_NOT_OBSERVE: >= 1 occurrence of any 'sk-ant-' / 'sk-' / 'AIza' substring in the span JSON; a raw *_API_KEY value present in any span attribute; spans.length === 0 (redaction asserted against an empty payload — trivially passes)

### AC-3

**Requirement:** GIVEN the OTLP-over-HTTP exporter configured with LangSmith headers WHEN the spike conversation's spans export THEN the export returns HTTP 2xx and the trace is fetchable from the LangSmith API by traceId

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: real LangSmith OTEL ingestion endpoint (LANGSMITH_API_KEY + LANGSMITH_PROJECT)
- VERIFY: `pnpm test convex/actions/agent/spike/__tests__/spikeObservability.integration.test.ts -t "OTLP export to LangSmith returns 2xx and the trace is retrievable"`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: the exporter posts to a fake/local endpoint instead of the real LangSmith OTEL ingestion URL; LANGSMITH_API_KEY/project headers are omitted so ingestion silently drops the trace; the export promise is a fire-and-forget no-op that is never awaited so a failure is invisible
- EVIDENCE: `trace` (required_capture: true)
- CASE 1 — start_ref `spike_conversation_trace`
    - ACTION (cli_user): export the spike conversation trace over OTLP to real LangSmith → fetch the trace back from the LangSmith API by traceId
    - MUST_OBSERVE: exportResponse.status >= 200 && exportResponse.status < 300 (2xx); the trace is retrievable from LangSmith by its traceId within 30s; the retrieved trace has spans.length >= 3
    - MUST_NOT_OBSERVE: exportResponse.status >= 400 (4xx/5xx auth/endpoint failure); no trace found in LangSmith for the traceId (0 traces returned)

## TEST CRITERIA

| TC | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | one spike conversation exports root+model+tool spans, each with promptVersion.length>=1 / sessionId.length>=1 and tier==='orchestrator', model span cost>0 and totalTokens>0 | AC-1 | `pnpm test convex/actions/agent/spike/__tests__/spikeObservability.integration.test.ts -t "exports root/model/tool spans stamped and priced to LangSmith"` |
| TC-2 | the exported span JSON has 0 occurrences of 'sk-ant-','sk-','AIza' and 0 raw *_API_KEY values while still containing >=1 model span and >=1 tool span | AC-2 | `pnpm test convex/actions/agent/spike/__tests__/spikeObservability.integration.test.ts -t "exported span JSON is redacted of all api-key signatures"` |
| TC-3 | the OTLP export to the real LangSmith OTEL endpoint returns HTTP 2xx and the trace with >=3 spans is retrievable by traceId within 30s | AC-3 | `pnpm test convex/actions/agent/spike/__tests__/spikeObservability.integration.test.ts -t "OTLP export to LangSmith returns 2xx and the trace is retrievable"` |

## SCOPE (file-level write permissions)

**writeAllowed:**
- `convex/actions/agent/spike/spikeObservability.ts (NEW — Observability + SensitiveDataFilter + OTLP→LangSmith exporter + paired capture exporter)`
- `convex/actions/agent/spike/rideAgentSpike.ts (MODIFY — attach the Observability-configured Mastra instance to the spike Agent)`
- `convex/actions/agent/spike/__tests__/spikeObservability.integration.test.ts (NEW)`
- `package.json (MODIFY — add @mastra/observability + the OTLP exporter dep)`
- `pnpm-lock.yaml (MODIFY — regenerated by pnpm add)`
- `convex.json (MODIFY — add @mastra/observability to node.externalPackages)`

**writeProhibited:**
- `convex/actions/agent/lib/tracing.ts (the live no-op stub — additive; Sprint 07 owns its replacement)`
- `the 13 pi-ai importer files and any teardown`
- `convex/actions/agent/spike/spikeTools.ts (S2-T2) except read-only consumption`
- `the React Native app and convex/schema.ts`

## READING LIST

- `.spec/prds/route-agent-quality/10-technical-requirements/11-e2e-testing.md`:146-158 — §5d telemetry wiring — Observability + OTLP → LangSmith, SensitiveDataFilter, the three span types + stamped attributes
- `.spec/prds/route-agent-quality/10-technical-requirements/08-technical-risks.md`:30 — risk #20: LangSmith OTEL unverified + tracing.ts no-op stub; the redaction (no api-key substring) requirement
- `convex/actions/agent/lib/tracing.ts`:1-42 — the live no-op stub — additive: leave it in place (Sprint 07 replaces the 13 wrappers); this task wires Observability on the spike instance only
- `.spec/prds/route-agent-quality/10-technical-requirements/06-external-dependencies.md`:129-139 — batch-telemetry note — Observability on the conversation instance ONLY, not the pipeline/batch tiers
- `convex/lib/env.ts`:40-90 — LANGSMITH_API_KEY / LANGSMITH_PROJECT + ANTHROPIC_API_KEY / GOOGLE_MAPS_API_KEY exports (redaction targets + exporter headers)

## CODE PATTERN

- Pattern: new Mastra({ observability: new Observability({ configs: { default: { serviceName:'laneshadow-agent', exporters:[ otlpLangSmithExporter, captureExporter ], spanOutputProcessors:[ new SensitiveDataFilter() ] } } }) })
- Pattern source: `@mastra/observability (Rosetta KB) + 11-e2e-testing §5d`
- Anti-pattern: leftover telemetry:{} (silently ignored in 1.x); asserting redaction on an empty payload; posting to a local/fake endpoint; unredacted Authorization header in spans

## VERIFICATION GATES

- integration tests pass against real LangSmith + a real conversation: `pnpm test convex/actions/agent/spike/__tests__/spikeObservability.integration.test.ts` → Exit 0
- typecheck: `pnpm type-check` → Exit 0
- lint: `pnpm exec biome check` → Exit 0
- no 0.x telemetry:{} block anywhere in the spike: `grep -rn "telemetry\s*:" convex/actions/agent/spike/` → no matches (Observability only)
- SensitiveDataFilter registered as a spanOutputProcessor: `grep -n "SensitiveDataFilter" convex/actions/agent/spike/spikeObservability.ts` → matches

## AGENT ASSIGNMENT

- Implementer: `convex-implementer` — Convex-side Mastra observability and OTLP wiring.
- Reviewer: `convex-reviewer`

## EVIDENCE GATES

- RED phase: each behavioral AC test went red before green (TDD_STATE history).
- Integration/E2E coverage: PRIMARY AC hits real services; captured EVIDENCE shows the seeded MUST_OBSERVE value (not merely "tests passed").
- Scenario un-fakeable: `validate_scenario` exit 0 on every behavioral AC.

## DEPENDENCIES

- Depends on: S2-T3
- Blocks: S2-T5, S2-T7

<details>
<summary>▸ Full agent specification (TASK-TEMPLATE v5.2 — machine-readable requirement contract)</summary>

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "version": "1",
  "task_id": "S2-T4",
  "tdd_mode": "red_first",
  "verification_policy": {
    "requires_tests": true,
    "requires_red_evidence": true,
    "requires_seeded_evidence": true
  },
  "fixtures": {
    "spike_conversation_trace": {
      "description": "The 2-turn Ogden spike conversation (from S2-T3) run with Observability attached; its spans captured via a paired local capture exporter and exported to real LangSmith.",
      "seed_method": "recorded_external",
      "records": [
        "sessionId='spike-ogden-1'",
        "promptVersion stamped",
        "tier='orchestrator'",
        "spans: root + >=1 model + >=1 tool"
      ]
    },
    "api_key_redaction_probe": {
      "description": "The forbidden secret signatures that must NOT appear in any exported span JSON (prefixes + env-var names; secret VALUES are read from the deployment env, never hardcoded here).",
      "seed_method": "recorded_external",
      "records": [
        "forbidden substrings: 'sk-ant-', 'sk-', 'AIza'",
        "forbidden values: ANTHROPIC_API_KEY, GOOGLE_MAPS_API_KEY, LANGSMITH_API_KEY (from deployment env)"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": false,
      "maps_to_ac": null,
      "description": "GIVEN the spike conversation instance with Observability attached WHEN one 2-turn conversation runs and spans export to real LangSmith THEN the captured span JSON contains root + model + tool span types, each stamped promptVersion/sessionId/tier, with the model span carrying cost>0 and totalTokens>0",
      "verify": "pnpm test convex/actions/agent/spike/__tests__/spikeObservability.integration.test.ts -t \"exports root/model/tool spans stamped and priced to LangSmith\"",
      "scenario": {
        "id": "AC-1",
        "primary": true,
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "real LangSmith OTEL ingestion + a real spike conversation on the dev deployment",
        "negative_control": {
          "would_fail_if": [
            "Observability is left as the lib/tracing.ts no-op stub so nothing is exported",
            "a leftover 0.x telemetry:{} block is used (silently ignored, no spans emitted)",
            "the exporter is mocked/disconnected from the real LangSmith OTEL endpoint",
            "spans are emitted with empty attributes (promptVersion/sessionId/tier absent)"
          ]
        },
        "evidence": {
          "artifact_type": "stdout",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "spike_conversation_trace",
            "action": {
              "actor": "cli_user",
              "steps": [
                "run the 2-turn Ogden spike conversation with Observability attached",
                "capture the exported span JSON via the paired local capture exporter"
              ]
            },
            "end_state": {
              "must_observe": [
                "spans.some(s => s.type === 'root') === true",
                "spans.filter(s => s.type === 'model').length >= 1",
                "spans.filter(s => s.type === 'tool').length >= 1",
                "every span satisfies span.attributes.promptVersion.length >= 1 && span.attributes.sessionId.length >= 1",
                "every span.attributes.tier === 'orchestrator'",
                "the model span has cost > 0 && totalTokens > 0"
              ],
              "must_not_observe": [
                "spans.length === 0 (no spans exported — no-op exporter)",
                "a span with span.attributes.sessionId === '' (empty) or tier missing",
                "the model span with cost === 0 || totalTokens === 0"
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
      "description": "GIVEN the exported span JSON from a real conversation containing real model + tool spans WHEN SensitiveDataFilter runs as the span-output processor THEN the payload has zero occurrences of 'sk-ant-', 'sk-', 'AIza', and no raw *_API_KEY value, while still containing >=1 model span and >=1 tool span",
      "verify": "pnpm test convex/actions/agent/spike/__tests__/spikeObservability.integration.test.ts -t \"exported span JSON is redacted of all api-key signatures\"",
      "scenario": {
        "id": "AC-2",
        "primary": false,
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "real span export payload + SensitiveDataFilter (redaction proof, risk #20)",
        "negative_control": {
          "would_fail_if": [
            "SensitiveDataFilter is not registered as a spanOutputProcessor so keys pass through",
            "the redaction is asserted against an empty/stub payload (no real spans) so it trivially passes",
            "the exporter serializes Authorization/api-key headers into the span JSON unredacted"
          ]
        },
        "evidence": {
          "artifact_type": "stdout",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "api_key_redaction_probe",
            "action": {
              "actor": "cli_user",
              "steps": [
                "serialize the exported span JSON from the real conversation",
                "grep it for the forbidden substrings and the deployment env-key values"
              ]
            },
            "end_state": {
              "must_observe": [
                "(spanJson.match(/sk-ant-/g) || []).length === 0",
                "(spanJson.match(/sk-/g) || []).length === 0",
                "(spanJson.match(/AIza/g) || []).length === 0",
                "spanJson.includes(process.env.ANTHROPIC_API_KEY) === false && spanJson.includes(process.env.GOOGLE_MAPS_API_KEY) === false && spanJson.includes(process.env.LANGSMITH_API_KEY) === false",
                "spans.filter(s => s.type === 'model').length >= 1 && spans.filter(s => s.type === 'tool').length >= 1 (redaction ran on real content)"
              ],
              "must_not_observe": [
                ">= 1 occurrence of any 'sk-ant-' / 'sk-' / 'AIza' substring in the span JSON",
                "a raw *_API_KEY value present in any span attribute",
                "spans.length === 0 (redaction asserted against an empty payload — trivially passes)"
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
      "description": "GIVEN the OTLP-over-HTTP exporter configured with LangSmith headers WHEN the spike conversation's spans export THEN the export returns HTTP 2xx and the trace is fetchable from the LangSmith API by traceId",
      "verify": "pnpm test convex/actions/agent/spike/__tests__/spikeObservability.integration.test.ts -t \"OTLP export to LangSmith returns 2xx and the trace is retrievable\"",
      "scenario": {
        "id": "AC-3",
        "primary": false,
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "real LangSmith OTEL ingestion endpoint (LANGSMITH_API_KEY + LANGSMITH_PROJECT)",
        "negative_control": {
          "would_fail_if": [
            "the exporter posts to a fake/local endpoint instead of the real LangSmith OTEL ingestion URL",
            "LANGSMITH_API_KEY/project headers are omitted so ingestion silently drops the trace",
            "the export promise is a fire-and-forget no-op that is never awaited so a failure is invisible"
          ]
        },
        "evidence": {
          "artifact_type": "trace",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "spike_conversation_trace",
            "action": {
              "actor": "cli_user",
              "steps": [
                "export the spike conversation trace over OTLP to real LangSmith",
                "fetch the trace back from the LangSmith API by traceId"
              ]
            },
            "end_state": {
              "must_observe": [
                "exportResponse.status >= 200 && exportResponse.status < 300 (2xx)",
                "the trace is retrievable from LangSmith by its traceId within 30s",
                "the retrieved trace has spans.length >= 3"
              ],
              "must_not_observe": [
                "exportResponse.status >= 400 (4xx/5xx auth/endpoint failure)",
                "no trace found in LangSmith for the traceId (0 traces returned)"
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
      "description": "one spike conversation exports root+model+tool spans, each with promptVersion.length>=1 / sessionId.length>=1 and tier==='orchestrator', model span cost>0 and totalTokens>0",
      "verify": "pnpm test convex/actions/agent/spike/__tests__/spikeObservability.integration.test.ts -t \"exports root/model/tool spans stamped and priced to LangSmith\""
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "primary": false,
      "maps_to_ac": "AC-2",
      "description": "the exported span JSON has 0 occurrences of 'sk-ant-','sk-','AIza' and 0 raw *_API_KEY values while still containing >=1 model span and >=1 tool span",
      "verify": "pnpm test convex/actions/agent/spike/__tests__/spikeObservability.integration.test.ts -t \"exported span JSON is redacted of all api-key signatures\""
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "primary": false,
      "maps_to_ac": "AC-3",
      "description": "the OTLP export to the real LangSmith OTEL endpoint returns HTTP 2xx and the trace with >=3 spans is retrievable by traceId within 30s",
      "verify": "pnpm test convex/actions/agent/spike/__tests__/spikeObservability.integration.test.ts -t \"OTLP export to LangSmith returns 2xx and the trace is retrievable\""
    }
  ]
}
-->
</details>
