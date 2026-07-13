/**
 * S2-T4 — Integration tests for Mastra Observability → OTLP → LangSmith
 * with SensitiveDataFilter.
 *
 * REAL SERVICES ONLY — no mocks. These tests:
 * 1. Run a real 2-turn Ogden spike conversation with Observability attached
 * 2. Export spans to the REAL LangSmith OTEL ingestion endpoint via OTLP-over-HTTP
 * 3. Capture the same spans via a paired local TestExporter
 * 4. Assert on the captured spans: root/model/tool types, stamping, cost/tokens
 * 5. Assert on redaction: zero 'sk-ant-', 'sk-', 'AIza', no raw *_API_KEY values
 * 6. Assert the OTLP export returns 2xx and the trace is retrievable by traceId
 *
 * Deployment status: the cloud-dev action and its tool-call path are working.
 * This suite still runs in-process so it can capture Mastra Observability spans
 * directly; its route tool uses the documented CLI fallback, while the deployed
 * action injects its Convex query callback.
 *
 * Environment: @vitest-environment node — same quirk as S2-T3 (jsdom AbortSignal
 * identity doesn't match Node's undici fetch).
 */
// @vitest-environment node

import { randomUUID } from 'node:crypto'
import type { AnyExportedSpan } from '@mastra/core/observability'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { ANTHROPIC_API_KEY } from '../../../../lib/env'
import { runObservedSpikeTurn, type WorkingMemory } from '../rideAgentSpike'
import { createSpikeObservability, SPIKE_PROMPT_VERSION, SPIKE_TIER } from '../spikeObservability'

const hasAnthropicKey = Boolean(ANTHROPIC_API_KEY)
const hasLangsmithKey = Boolean(process.env.LANGSMITH_API_KEY)

const canRunIntegration = hasAnthropicKey && hasLangsmithKey

// Real Anthropic + real Google Geocoding + real Convex cloud-dev catalog + real LangSmith — generous timeout.
const REAL_SERVICE_TIMEOUT_MS = 180_000

/**
 * A shared result object populated by beforeAll — holds the captured spans,
 * the OTLP export response status, the traceId, and the serialized span JSON.
 */
type SpikeObservabilityResult = {
  traceId: string
  spans: AnyExportedSpan[]
  spanJson: string
  otlpResponseStatus: number | null
  otlpExporterSpanIds: string[]
  captureExporterSpanIds: string[]
  traceRetrieved: boolean
  retrievedSpanCount: number
}

let sharedResult: SpikeObservabilityResult | null = null

/**
 * Run the 2-turn Ogden spike conversation with Observability attached,
 * flush the exporters, and capture the results.
 */
async function runObservedConversation(): Promise<SpikeObservabilityResult> {
  const { observability, captureExporter, otlpExporter } = createSpikeObservability()

  // LangSmith trace IDs are UUIDs; a "trace" IS its root run. We generate a
  // canonical UUID, pass its 32-hex form to Mastra as the OTLP traceId, then
  // retrieve the trace from LangSmith by the UUID (the OTLP converter stamps
  // langsmith.trace.id = hex32ToUuid(otlpTraceId) deterministically).
  const langsmithTraceUuid = randomUUID()
  const traceId = langsmithTraceUuid.replace(/-/g, '')
  const sessionId = 'spike-ogden-obs-1'

  // Turn 1 — resolve Ogden
  const turn1 = await runObservedSpikeTurn({
    sessionId,
    userMessage: 'twisty roads near Ogden',
    observability,
    traceId,
    promptVersion: SPIKE_PROMPT_VERSION,
    tier: SPIKE_TIER,
  })

  // Turn 2 — inherit center, "what's scenic". The second turn must run (it
  // completes the 2-turn conversation and emits its own model/tool spans),
  // but its return value is unused — both turns' spans land in the shared
  // observability/capture exporters above.
  await runObservedSpikeTurn({
    sessionId,
    userMessage: "OK what's scenic",
    workingMemory: turn1.workingMemory as WorkingMemory,
    observability,
    traceId,
    promptVersion: SPIKE_PROMPT_VERSION,
    tier: SPIKE_TIER,
  })

  // Flush both exporters — OTLP POSTs to LangSmith, TestExporter finalizes in-memory
  await observability.flush()
  await otlpExporter.flush()
  await observability.shutdown()

  // Debug: check OTLP exporter state
  // biome-ignore lint/suspicious/noConsole: debug output for OTLP exporter state
  console.log(
    'OTLP_EXPORTER_DEBUG',
    JSON.stringify({
      isDisabled: otlpExporter.isDisabled,
      receivedEventCount: otlpExporter.getReceivedEventCount(),
      receivedEventTypes: otlpExporter.getReceivedEventTypes().slice(0, 10),
      bufferedSpansCount: otlpExporter.getBufferedSpans().length,
      lastResponseStatus: otlpExporter.getLastResponseStatus(),
      apiKeyPresent: Boolean(process.env.LANGSMITH_API_KEY),
      apiKeyLength: (process.env.LANGSMITH_API_KEY ?? '').length,
    }),
  )

  // Extract captured spans from the TestExporter (paired local capture)
  const spans = captureExporter.getCompletedSpans()
  const spanJson = JSON.stringify(spans)

  // Debug: log model span attributes for cost/tokens investigation
  const modelSpansDebug = spans.filter((s) => s.type === 'model_generation')
  // biome-ignore lint/suspicious/noConsole: debug output for model span attributes
  console.log(
    'MODEL_SPAN_DEBUG',
    JSON.stringify({
      modelSpanCount: modelSpansDebug.length,
      modelSpanAttributes: modelSpansDebug.map((s) => ({
        type: s.type,
        name: s.name,
        attributes: s.attributes,
        metadata: s.metadata,
      })),
    }),
  )

  // Extract spans buffered in the OTLP exporter (what was actually sent)
  const otlpSpans = otlpExporter.getBufferedSpans()

  // Try to retrieve the trace from LangSmith by traceId.
  // Verified path: POST /runs/query with { trace: <uuid>, project_name } +
  // x-api-key header. (GET /otel/v1/traces/{id} is ingestion-only → 404; the
  // OTLP endpoint materializes runs asynchronously and they become queryable
  // via the runs API — typically within ~5s.)
  let traceRetrieved = false
  let retrievedSpanCount = 0
  const apiKey = process.env.LANGSMITH_API_KEY ?? ''
  const project = process.env.LANGSMITH_PROJECT ?? 'LaneShadowDev'

  // Poll for up to 30s — LangSmith materializes OTLP-ingested runs async.
  const pollDeadline = Date.now() + 30_000
  while (Date.now() < pollDeadline && !traceRetrieved) {
    try {
      const retrievalResp = await fetch('https://api.smith.langchain.com/runs/query', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trace: langsmithTraceUuid,
          project_name: project,
          limit: 100,
        }),
      })
      if (retrievalResp.status >= 200 && retrievalResp.status < 300) {
        const parsed = (await retrievalResp.json()) as { runs?: unknown[] }
        const runs = Array.isArray(parsed?.runs) ? parsed.runs : []
        if (runs.length >= 3) {
          traceRetrieved = true
          retrievedSpanCount = runs.length
          break
        }
      }
    } catch {
      // Network error — keep polling
    }
    await new Promise((resolve) => setTimeout(resolve, 2000))
  }

  return {
    traceId,
    spans,
    spanJson,
    otlpResponseStatus: otlpExporter.getLastResponseStatus(),
    otlpExporterSpanIds: otlpSpans.map((s) => s.id),
    captureExporterSpanIds: spans.map((s) => s.id),
    traceRetrieved,
    retrievedSpanCount,
  }
}

describe('S2-T4 spikeObservability — OTLP→LangSmith with SensitiveDataFilter', () => {
  if (!canRunIntegration) {
    const missing: string[] = []
    if (!hasAnthropicKey) missing.push('ANTHROPIC_API_KEY')
    if (!hasLangsmithKey) missing.push('LANGSMITH_API_KEY')
    it.skip(`SKIP: integration test requires real API keys — missing: ${missing.join(', ')}`, () => {})
    return
  }

  // Run the conversation ONCE and share results across all ACs (the
  // conversation hits real Anthropic + real LangSmith — running it per-test
  // would be wasteful and slow). beforeAll runs a single time for the suite.
  beforeAll(async () => {
    sharedResult = await runObservedConversation()
  }, REAL_SERVICE_TIMEOUT_MS)

  afterAll(() => {
    sharedResult = null
  })

  // -----------------------------------------------------------------------
  // AC-1 — root/model/tool spans stamped and priced
  // -----------------------------------------------------------------------
  describe('AC-1: exports root/model/tool spans stamped and priced to LangSmith', () => {
    it(
      'captures root + model + tool spans, each stamped promptVersion/sessionId/tier, model span cost>0/tokens>0',
      () => {
        const result = sharedResult!
        const { spans } = result

        // MUST_OBSERVE: spans were exported (not empty)
        expect(
          spans.length,
          'spans must be exported — no-op exporter would produce 0',
        ).toBeGreaterThan(0)

        // MUST_OBSERVE: root span (agent_run) exists
        const rootSpans = spans.filter((s) => s.type === 'agent_run')
        expect(
          rootSpans.length,
          'must have at least one root (agent_run) span',
        ).toBeGreaterThanOrEqual(1)

        // MUST_OBSERVE: model span (model_generation) exists
        const modelSpans = spans.filter((s) => s.type === 'model_generation')
        expect(
          modelSpans.length,
          'must have at least one model (model_generation) span',
        ).toBeGreaterThanOrEqual(1)

        // MUST_OBSERVE: tool span (tool_call) exists
        const toolSpans = spans.filter((s) => s.type === 'tool_call')
        expect(
          toolSpans.length,
          'must have at least one tool (tool_call) span',
        ).toBeGreaterThanOrEqual(1)

        // MUST_OBSERVE: every span has promptVersion, sessionId, tier stamped
        // These are auto-extracted from RequestContext via requestContextKeys config
        for (const span of spans) {
          const metadata = span.metadata ?? {}
          const promptVersion = metadata.promptVersion ?? span.attributes?.promptVersion
          const sessionId = metadata.sessionId ?? span.attributes?.sessionId
          const tier = metadata.tier ?? span.attributes?.tier

          expect(
            String(promptVersion ?? '').length,
            `span ${span.type}:${span.name} must have promptVersion stamped (non-empty)`,
          ).toBeGreaterThanOrEqual(1)
          expect(
            String(sessionId ?? '').length,
            `span ${span.type}:${span.name} must have sessionId stamped (non-empty)`,
          ).toBeGreaterThanOrEqual(1)
          expect(tier, `span ${span.type}:${span.name} must have tier='orchestrator'`).toBe(
            'orchestrator',
          )
        }

        // MUST_OBSERVE: model span has cost > 0 and totalTokens > 0
        const modelSpan = modelSpans[0]
        const attrs = (modelSpan.attributes ?? {}) as {
          usage?: { inputTokens?: number; outputTokens?: number }
          costContext?: { estimatedCost?: number }
        }
        const inputTokens = attrs.usage?.inputTokens ?? 0
        const outputTokens = attrs.usage?.outputTokens ?? 0
        const totalTokens = inputTokens + outputTokens
        const cost = attrs.costContext?.estimatedCost ?? 0

        expect(totalTokens, 'model span must have totalTokens > 0').toBeGreaterThan(0)
        // Cost might be 0 if Mastra doesn't have pricing for the model —
        // but the task requires cost > 0, so we assert it
        expect(cost, 'model span must have cost > 0').toBeGreaterThan(0)

        // MUST_NOT_OBSERVE: spans.length === 0 (already checked above)
        // MUST_NOT_OBSERVE: empty sessionId/tier (already checked above)
        // MUST_NOT_OBSERVE: model span with cost === 0 || totalTokens === 0 (already checked above)

        // EVIDENCE
        // biome-ignore lint/suspicious/noConsole: required stdout evidence artifact for AC-1 scenario
        console.log(
          JSON.stringify({
            ac: 'AC-1',
            traceId: result.traceId,
            totalSpans: spans.length,
            spanTypes: spans.map((s) => s.type),
            rootSpanCount: rootSpans.length,
            modelSpanCount: modelSpans.length,
            toolSpanCount: toolSpans.length,
            modelSpanTokens: { inputTokens, outputTokens, totalTokens },
            modelSpanCost: cost,
            sampleStamping: {
              promptVersion: modelSpan.metadata?.promptVersion,
              sessionId: modelSpan.metadata?.sessionId,
              tier: modelSpan.metadata?.tier,
            },
          }),
        )
      },
      REAL_SERVICE_TIMEOUT_MS,
    )
  })

  // -----------------------------------------------------------------------
  // AC-2 — redaction: zero api-key signatures in span JSON
  // -----------------------------------------------------------------------
  describe('AC-2: exported span JSON is redacted of all api-key signatures', () => {
    it('span JSON has 0 occurrences of sk-ant-, sk-, AIza, and no raw *_API_KEY value, with >=1 model + >=1 tool span', () => {
      const result = sharedResult!
      const { spanJson, spans } = result

      // MUST_OBSERVE: the payload has real content (>=1 model + >=1 tool span)
      const modelSpans = spans.filter((s) => s.type === 'model_generation')
      const toolSpans = spans.filter((s) => s.type === 'tool_call')
      expect(
        modelSpans.length,
        'redaction must run on real content — >=1 model span',
      ).toBeGreaterThanOrEqual(1)
      expect(
        toolSpans.length,
        'redaction must run on real content — >=1 tool span',
      ).toBeGreaterThanOrEqual(1)

      // MUST_OBSERVE: zero occurrences of forbidden substrings
      const skAntCount = (spanJson.match(/sk-ant-/g) || []).length
      const skCount = (spanJson.match(/sk-/g) || []).length
      const aizaCount = (spanJson.match(/AIza/g) || []).length

      expect(skAntCount, 'span JSON must contain 0 occurrences of "sk-ant-"').toBe(0)
      expect(skCount, 'span JSON must contain 0 occurrences of "sk-"').toBe(0)
      expect(aizaCount, 'span JSON must contain 0 occurrences of "AIza"').toBe(0)

      // MUST_OBSERVE: no raw *_API_KEY values present
      const anthropicKey = process.env.ANTHROPIC_API_KEY
      const googleMapsKey = process.env.GOOGLE_MAPS_API_KEY
      const langsmithKey = process.env.LANGSMITH_API_KEY

      if (anthropicKey) {
        expect(
          spanJson.includes(anthropicKey),
          'span JSON must NOT contain the raw ANTHROPIC_API_KEY value',
        ).toBe(false)
      }
      if (googleMapsKey) {
        expect(
          spanJson.includes(googleMapsKey),
          'span JSON must NOT contain the raw GOOGLE_MAPS_API_KEY value',
        ).toBe(false)
      }
      if (langsmithKey) {
        expect(
          spanJson.includes(langsmithKey),
          'span JSON must NOT contain the raw LANGSMITH_API_KEY value',
        ).toBe(false)
      }

      // MUST_NOT_OBSERVE: >=1 occurrence of any forbidden substring (already checked above)
      // MUST_NOT_OBSERVE: spans.length === 0 (already checked — real content present)

      // EVIDENCE
      // biome-ignore lint/suspicious/noConsole: required stdout evidence artifact for AC-2 scenario
      console.log(
        JSON.stringify({
          ac: 'AC-2',
          spanJsonLength: spanJson.length,
          forbiddenCounts: { skAnt: skAntCount, sk: skCount, aiza: aizaCount },
          modelSpanCount: modelSpans.length,
          toolSpanCount: toolSpans.length,
          apiKeyChecks: {
            anthropicRedacted: anthropicKey ? !spanJson.includes(anthropicKey) : 'n/a',
            googleMapsRedacted: googleMapsKey ? !spanJson.includes(googleMapsKey) : 'n/a',
            langsmithRedacted: langsmithKey ? !spanJson.includes(langsmithKey) : 'n/a',
          },
        }),
      )
    })
  })

  // -----------------------------------------------------------------------
  // AC-3 — OTLP export returns 2xx and trace is retrievable
  // -----------------------------------------------------------------------
  describe('AC-3: OTLP export to LangSmith returns 2xx and the trace is retrievable', () => {
    it(
      'OTLP POST returns HTTP 2xx; trace retrievable by traceId within 30s with >=3 spans',
      () => {
        const result = sharedResult!

        // MUST_OBSERVE: export response status is 2xx
        expect(result.otlpResponseStatus, 'OTLP export must return HTTP 2xx').not.toBeNull()
        expect(
          result.otlpResponseStatus!,
          'OTLP export status must be >= 200',
        ).toBeGreaterThanOrEqual(200)
        expect(result.otlpResponseStatus!, 'OTLP export status must be < 300').toBeLessThan(300)

        // MUST_OBSERVE: trace retrievable from LangSmith by traceId within 30s
        expect(result.traceRetrieved, 'trace must be retrievable from LangSmith by traceId').toBe(
          true,
        )

        // MUST_OBSERVE: retrieved trace has >= 3 spans
        expect(
          result.retrievedSpanCount,
          'retrieved trace must have >= 3 spans',
        ).toBeGreaterThanOrEqual(3)

        // MUST_NOT_OBSERVE: 4xx/5xx response
        expect(result.otlpResponseStatus!, 'OTLP export must NOT return 4xx/5xx').toBeLessThan(400)

        // MUST_NOT_OBSERVE: no trace found
        expect(result.traceRetrieved, 'trace must NOT be missing from LangSmith').toBe(true)

        // EVIDENCE
        // biome-ignore lint/suspicious/noConsole: required stdout evidence artifact for AC-3 scenario
        console.log(
          JSON.stringify({
            ac: 'AC-3',
            traceId: result.traceId,
            otlpResponseStatus: result.otlpResponseStatus,
            traceRetrieved: result.traceRetrieved,
            retrievedSpanCount: result.retrievedSpanCount,
            langsmithEndpoint: 'https://api.smith.langchain.com/otel/v1/traces',
          }),
        )
      },
      REAL_SERVICE_TIMEOUT_MS,
    )
  })

  // -----------------------------------------------------------------------
  // AC-4 — paired capture exporter captures the same spans as OTLP export
  // -----------------------------------------------------------------------
  describe('AC-4: paired capture exporter captures the same spans as OTLP export', () => {
    it('capture exporter span IDs match OTLP exporter span IDs — proving redaction is on real content', () => {
      const result = sharedResult!

      // MUST_OBSERVE: both exporters captured spans
      expect(
        result.otlpExporterSpanIds.length,
        'OTLP exporter must have buffered spans',
      ).toBeGreaterThan(0)
      expect(
        result.captureExporterSpanIds.length,
        'capture exporter must have captured spans',
      ).toBeGreaterThan(0)

      // MUST_OBSERVE: the span IDs match (same spans went to both exporters)
      const otlpSet = new Set(result.otlpExporterSpanIds)
      const captureSet = new Set(result.captureExporterSpanIds)

      // Every span ID in the capture exporter should also be in the OTLP exporter
      for (const id of result.captureExporterSpanIds) {
        expect(otlpSet.has(id), `capture span ${id} must also be in OTLP export`).toBe(true)
      }

      // Every span ID in the OTLP exporter should also be in the capture exporter
      for (const id of result.otlpExporterSpanIds) {
        expect(captureSet.has(id), `OTLP span ${id} must also be in capture exporter`).toBe(true)
      }

      // The span counts should match
      expect(
        result.otlpExporterSpanIds.length,
        'both exporters must have the same span count',
      ).toBe(result.captureExporterSpanIds.length)

      // EVIDENCE
      // biome-ignore lint/suspicious/noConsole: required stdout evidence artifact for AC-4 scenario
      console.log(
        JSON.stringify({
          ac: 'AC-4',
          otlpSpanCount: result.otlpExporterSpanIds.length,
          captureSpanCount: result.captureExporterSpanIds.length,
          spanIdsMatch: result.otlpExporterSpanIds.length === result.captureExporterSpanIds.length,
          sampleSpanIds: result.captureExporterSpanIds.slice(0, 5),
        }),
      )
    })
  })
})
