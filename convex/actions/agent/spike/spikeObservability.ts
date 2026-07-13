'use node'

/**
 * S2-T4 — Mastra Observability config for the spike conversation: OTLP→LangSmith
 * with SensitiveDataFilter + a paired local capture exporter.
 *
 * This module wires @mastra/observability's Observability class onto the spike
 * conversation Agent instance ONLY (not the batch/pipeline tiers — see
 * 06-external-dependencies.md batch-telemetry note).
 *
 * Three things are constructed:
 * 1. OTLPLangSmithExporter — a custom BaseExporter that converts Mastra spans
 *    to OTLP/JSON and POSTs them to the REAL LangSmith OTEL ingestion endpoint
 *    (https://api.smith.langchain.com/otel/v1/traces) with LANGSMITH_API_KEY +
 *    LANGSMITH_PROJECT headers.
 * 2. TestExporter — @mastra/observability's built-in in-memory exporter, used as
 *    the paired local capture exporter so the test can assert on the exact span
 *    JSON that was exported (proving redaction ran on real content).
 * 3. SensitiveDataFilter — a SpanOutputProcessor that redacts sensitive fields
 *    (api keys, tokens, secrets) from span attributes/metadata/input/output
 *    before they reach either exporter.
 *
 * ADDITIVE: lib/tracing.ts (the no-op stub) stays in place — Sprint 07 replaces
 * the 13 wrappers. This module wires Observability on the spike instance only.
 */

import type {
  AnyExportedSpan,
  AnySpan,
  SpanOutputProcessor,
  TracingEvent,
} from '@mastra/core/observability'
import {
  BaseExporter,
  Observability,
  SensitiveDataFilter,
  TestExporter,
} from '@mastra/observability'

// ─────────────────────────────────────────────────────────────────────────
// Constants — stamped on every span via requestContextKeys
// ─────────────────────────────────────────────────────────────────────────

export const SPIKE_PROMPT_VERSION = 'spike-observability-v1'
export const SPIKE_TIER = 'orchestrator'

/**
 * The real LangSmith OTEL ingestion endpoint.
 * OTLP/HTTP traces are POSTed here as JSON.
 */
const LANGSMITH_OTEL_ENDPOINT = 'https://api.smith.langchain.com/otel/v1/traces'

// ─────────────────────────────────────────────────────────────────────────
// OTLPLangSmithExporter — OTLP-over-HTTP → LangSmith
// ─────────────────────────────────────────────────────────────────────────

/**
 * Configuration for the OTLP→LangSmith exporter.
 */
export type OTLPLangSmithExporterConfig = {
  /** LangSmith API key (sent as x-api-key header) */
  apiKey: string
  /** LangSmith project name (sent as x-langsmith-project header) */
  project: string
  /** OTEL ingestion endpoint (defaults to the real LangSmith URL) */
  endpoint?: string
}

/**
 * OTLP-over-HTTP exporter that POSTs Mastra spans to LangSmith's real OTEL
 * ingestion endpoint.
 *
 * Extends BaseExporter:
 * - _exportTracingEvent: buffers SPAN_ENDED events (full span data)
 * - flush(): converts buffered spans to OTLP/JSON and POSTs to LangSmith
 * - getLastResponseStatus(): exposes the HTTP status for test assertions
 * - getBufferedSpans(): exposes the spans that were sent (for AC-4 parity check)
 *
 * The SensitiveDataFilter runs as a spanOutputProcessor BEFORE this exporter
 * receives the span — so the OTLP payload is already redacted.
 */
export class OTLPLangSmithExporter extends BaseExporter {
  name = 'otlp-langsmith'
  private buffer: AnyExportedSpan[] = []
  /** All spans ever received — NOT cleared on flush (for AC-4 parity check). */
  private allReceivedSpans: AnyExportedSpan[] = []
  /** All events ever received (for debugging). */
  private allReceivedEvents: TracingEvent[] = []
  private lastResponseStatus: number | null = null
  private readonly apiKey: string
  private readonly project: string
  private readonly endpoint: string

  constructor(config: OTLPLangSmithExporterConfig) {
    // We override every BaseExporter behavior (_exportTracingEvent/flush/
    // shutdown), so we don't rely on any inherited config-driven fields.
    // Pass an empty config to the superclass constructor.
    super({} as never)
    this.apiKey = config.apiKey
    this.project = config.project
    this.endpoint = config.endpoint ?? LANGSMITH_OTEL_ENDPOINT

    if (!this.apiKey) {
      this.setDisabled('LANGSMITH_API_KEY is missing — OTLP export to LangSmith disabled')
    }
  }

  protected async _exportTracingEvent(event: TracingEvent): Promise<void> {
    this.allReceivedEvents.push(event)
    // Only buffer completed spans — TracingEventType values are lowercase
    // ("span_started", "span_updated", "span_ended").
    if (event.type === 'span_ended') {
      this.buffer.push(event.exportedSpan)
      this.allReceivedSpans.push(event.exportedSpan)
    }
  }

  /** Debug: total events received (all types). */
  getReceivedEventCount(): number {
    return this.allReceivedEvents.length
  }

  /** Debug: event types received. */
  getReceivedEventTypes(): string[] {
    return this.allReceivedEvents.map((e) => e.type)
  }

  /**
   * The HTTP status code of the last OTLP POST to LangSmith.
   * null if no flush has occurred yet.
   */
  getLastResponseStatus(): number | null {
    return this.lastResponseStatus
  }

  /**
   * All spans ever received by this exporter (NOT cleared on flush).
   * Used by AC-4 to prove the capture exporter and OTLP exporter received
   * the same spans.
   */
  getBufferedSpans(): AnyExportedSpan[] {
    return [...this.allReceivedSpans]
  }

  async flush(): Promise<void> {
    if (this.isDisabled || this.buffer.length === 0) return

    const spansToSend = [...this.buffer]
    this.buffer = []

    const otlpPayload = convertSpansToOTLP(spansToSend, this.project)

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // LangSmith's OTEL ingestion endpoint authenticates via `x-api-key`
          // (verified empirically: `x-langsmith-api-key` → 401 Unauthorized;
          // `x-api-key` → 200). See LangSmith OTLP docs:
          // OTEL_EXPORTER_OTLP_HEADERS="x-api-key=<key>,Langsmith-Project=<project>"
          'x-api-key': this.apiKey,
          'x-langsmith-project': this.project,
        },
        body: JSON.stringify(otlpPayload),
      })
      this.lastResponseStatus = response.status
    } catch (err) {
      // Network error — record as status 0 (no response)
      this.lastResponseStatus = 0
      throw err
    }
  }

  async shutdown(): Promise<void> {
    await this.flush()
  }
}

// ─────────────────────────────────────────────────────────────────────────
// OTLP/JSON conversion
// ─────────────────────────────────────────────────────────────────────────

/**
 * Convert an array of Mastra ExportedSpans to the OTLP/JSON ResourceSpans format
 * that LangSmith's OTEL endpoint expects.
 *
 * CRITICAL — LangSmith materializes OTLP spans as queryable "runs" ONLY when the
 * spans carry the `langsmith.*` semantic attributes (verified empirically; bare
 * OTLP spans are accepted with HTTP 200 but silently dropped — they never appear
 * in the runs store). The required stamps:
 *   - langsmith.span.id        = a full UUID (this run's ID)
 *   - langsmith.trace.id       = a full UUID (the root run's ID; for the root
 *                                 span this EQUALS langsmith.span.id)
 *   - langsmith.span.kind      = chain | llm | tool | retriever | ...
 *   - langsmith.span.dotted_order = canonical tree-position string
 *                                   (see langsmithDottedSegment below)
 *   - langsmith.span.parent_id = parent run's UUID (empty for root)
 *
 * Source: https://docs.langchain.com/langsmith/trace-with-opentelemetry
 *         + langsmith-sdk python `run_trees._create_current_dotted_order`.
 */
function convertSpansToOTLP(
  spans: AnyExportedSpan[],
  serviceName: string,
): {
  resourceSpans: Array<{
    resource: { attributes: Array<{ key: string; value: OTLPAnyValue }> }
    scopeSpans: Array<{
      scope: { name: string }
      spans: Array<OTLPSpan>
    }>
  }>
} {
  // Pre-compute the langsmith.* IDs + dotted_order for every span by resolving
  // the parent chain across the whole batch (dotted_order is parent-relative).
  const langsmithInfo = resolveLangsmithRunInfo(spans)
  const otlpSpans = spans.map((span) => convertSpanToOTLP(span, langsmithInfo))

  return {
    resourceSpans: [
      {
        resource: {
          attributes: [{ key: 'service.name', value: { stringValue: serviceName } }],
        },
        scopeSpans: [
          {
            scope: { name: '@mastra/observability' },
            spans: otlpSpans,
          },
        ],
      },
    ],
  }
}

type OTLPAnyValue =
  | { stringValue: string }
  | { doubleValue: number }
  | { intValue: string }
  | { boolValue: boolean }
  | { arrayValue: { values: OTLPAnyValue[] } }

type OTLPSpan = {
  traceId: string
  spanId: string
  parentSpanId?: string
  name: string
  kind: number
  startTimeUnixNano: string
  endTimeUnixNano: string
  attributes: Array<{ key: string; value: OTLPAnyValue }>
  status: { code: number; message?: string }
}

// ─────────────────────────────────────────────────────────────────────────
// LangSmith run-id + dotted_order resolution
// ─────────────────────────────────────────────────────────────────────────

type LangsmithRunInfo = {
  /** This span's run UUID (langsmith.span.id). */
  runUuid: string
  /** The trace UUID (langsmith.trace.id) — shared across the whole trace. */
  traceUuid: string
  /** Parent run UUID (langsmith.span.parent_id); empty string for the root. */
  parentRunUuid: string
  /** Canonical dotted_order (langsmith.span.dotted_order). */
  dottedOrder: string
  /** Mapped LangSmith run type (langsmith.span.kind). */
  runType: string
}

/**
 * Map a Mastra span type to a LangSmith run type (langsmith.span.kind).
 * LangSmith run types: llm, chain, tool, retriever, embedding, prompt, parser.
 * Source: docs.langchain.com/langsmith/trace-with-opentelemetry attribute table.
 */
function mastraSpanTypeToLangsmithKind(spanType: string): string {
  switch (spanType) {
    case 'model_generation':
      return 'llm'
    case 'tool_call':
      return 'tool'
    case 'agent_run':
    case 'workflow':
      return 'chain'
    default:
      return 'chain'
  }
}

/**
 * Coerce an arbitrary Mastra trace/span id into 32 lowercase hex chars (the
 * OTLP wire format). Non-hex chars are replaced with '0'.
 */
function toHex32(id: string): string {
  return id
    .replace(/[^0-9a-fA-F]/g, '0')
    .toLowerCase()
    .padEnd(32, '0')
    .slice(0, 32)
}

/**
 * Format a 32-hex string as a canonical UUID (8-4-4-4-12 with hyphens).
 * Inverse of `uuid.replace(/-/g, '')`. This is how a Mastra OTLP traceId (32
 * hex) round-trips to/from a LangSmith trace UUID.
 */
export function hex32ToUuid(hex32: string): string {
  const h = toHex32(hex32)
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`
}

/**
 * Canonical dotted_order timestamp segment: `YYYYMMDDTHHMMSSffffffZ`.
 * This matches the langsmith python SDK's `_create_current_dotted_order`
 * (`strftime("%Y%m%dT%H%M%S%fZ")`): 6 microsecond digits + literal 'Z',
 * NO internal dot (the '.' is only used to JOIN segments, so a dot inside the
 * timestamp would be misread as a segment separator).
 */
function langsmithDottedSegment(date: Date, uuid: string): string {
  const d = date instanceof Date ? date : new Date(date)
  const pad = (n: number, w = 2) => String(n).padStart(w, '0')
  const microseconds = pad(d.getUTCMilliseconds() * 1000, 6)
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}` +
    `${microseconds}Z${uuid}`
  )
}

/**
 * Resolve the LangSmith run IDs + dotted_order for every span in a trace batch.
 *
 * - The trace UUID is derived deterministically from the shared OTLP traceId.
 * - Each span's run UUID is derived from its span id; for the ROOT span
 *   (no parentSpanId) the run UUID EQUALS the trace UUID (a LangSmith trace
 *   IS its root run).
 * - dotted_order is built by walking the parent chain: a child's order is
 *   `<parent.dotted_order>.<own_segment>`, the root's is just its own segment.
 *
 * Returns a Map keyed by the Mastra span id.
 */
function resolveLangsmithRunInfo(spans: AnyExportedSpan[]): Map<string, LangsmithRunInfo> {
  const traceUuid = spans.length > 0 ? hex32ToUuid(spans[0].traceId) : cryptoRandomUuid()

  // First pass: runUuid + runType + parent linkage, keyed by Mastra span id.
  const bySpanId = new Map<string, AnyExportedSpan>()
  const runUuidBySpanId = new Map<string, string>()
  for (const span of spans) {
    bySpanId.set(span.id, span)
    // Root span (no parent) → run UUID == trace UUID. Others → derive from id.
    const isRoot = !span.parentSpanId
    runUuidBySpanId.set(span.id, isRoot ? traceUuid : hex32ToUuid(span.id))
  }

  // Resolve dotted_order via memoized parent-chain walk.
  const dottedBySpanId = new Map<string, string>()
  const resolveDotted = (span: AnyExportedSpan): string => {
    const cached = dottedBySpanId.get(span.id)
    if (cached !== undefined) return cached
    const segment = langsmithDottedSegment(
      span.startTime,
      runUuidBySpanId.get(span.id) ?? traceUuid,
    )
    let order: string
    if (span.parentSpanId && bySpanId.has(span.parentSpanId)) {
      const parent = bySpanId.get(span.parentSpanId)!
      order = `${resolveDotted(parent)}.${segment}`
    } else {
      order = segment
    }
    dottedBySpanId.set(span.id, order)
    return order
  }

  const info = new Map<string, LangsmithRunInfo>()
  for (const span of spans) {
    const isRoot = !span.parentSpanId
    const runUuid = runUuidBySpanId.get(span.id) ?? traceUuid
    info.set(span.id, {
      runUuid,
      traceUuid,
      parentRunUuid:
        isRoot || !span.parentSpanId ? '' : (runUuidBySpanId.get(span.parentSpanId) ?? ''),
      dottedOrder: resolveDotted(span),
      runType: mastraSpanTypeToLangsmithKind(span.type),
    })
  }
  return info
}

/** Standalone UUID generator (avoids importing node:crypto at module top for Convex). */
function cryptoRandomUuid(): string {
  // Browser-safe UUID v4 fallback (Convex actions may run in either runtime).
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID()
  }
  const bytes = new Uint8Array(16)
  globalThis.crypto?.getRandomValues?.(bytes)
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`
}

function convertSpanToOTLP(
  span: AnyExportedSpan,
  langsmith: Map<string, LangsmithRunInfo>,
): OTLPSpan {
  const attributes: Array<{ key: string; value: OTLPAnyValue }> = []
  const ls = langsmith.get(span.id)

  // ── LangSmith run-mapping stamps (REQUIRED for the spans to materialize as
  // queryable runs — see resolveLangsmithRunInfo docs). ──
  if (ls) {
    attributes.push({ key: 'langsmith.span.id', value: { stringValue: ls.runUuid } })
    attributes.push({ key: 'langsmith.trace.id', value: { stringValue: ls.traceUuid } })
    attributes.push({ key: 'langsmith.span.kind', value: { stringValue: ls.runType } })
    attributes.push({ key: 'langsmith.trace.name', value: { stringValue: span.name } })
    attributes.push({ key: 'langsmith.span.dotted_order', value: { stringValue: ls.dottedOrder } })
    attributes.push({ key: 'langsmith.span.parent_id', value: { stringValue: ls.parentRunUuid } })
    attributes.push({
      key: 'langsmith.span.start_time',
      value: { stringValue: span.startTime.toISOString() },
    })
    const endTime = span.endTime ?? new Date()
    attributes.push({
      key: 'langsmith.span.end_time',
      value: { stringValue: endTime.toISOString() },
    })
    // Run inputs/outputs — LangSmith surfaces these in the trace UI.
    if (span.input !== undefined && span.input !== null) {
      attributes.push({ key: 'inputs', value: toOTLPValue(span.input) })
    }
    if (span.output !== undefined && span.output !== null) {
      attributes.push({ key: 'outputs', value: toOTLPValue(span.output) })
    }
  }

  // ── Mastra-native attributes (for parity/debugging in the OTLP payload). ──
  attributes.push({ key: 'mastra.span.type', value: { stringValue: span.type } })

  if (span.entityType) {
    attributes.push({ key: 'mastra.span.entityType', value: { stringValue: span.entityType } })
  }
  if (span.entityId) {
    attributes.push({ key: 'mastra.span.entityId', value: { stringValue: span.entityId } })
  }
  if (span.entityName) {
    attributes.push({ key: 'mastra.span.entityName', value: { stringValue: span.entityName } })
  }

  if (span.attributes) {
    for (const [key, value] of Object.entries(span.attributes)) {
      if (value === null || value === undefined) continue
      attributes.push({ key: `mastra.attributes.${key}`, value: toOTLPValue(value) })
    }
  }

  if (span.metadata) {
    for (const [key, value] of Object.entries(span.metadata)) {
      if (value === null || value === undefined) continue
      attributes.push({ key: `mastra.metadata.${key}`, value: toOTLPValue(value) })
    }
  }

  if (span.requestContext) {
    for (const [key, value] of Object.entries(span.requestContext)) {
      if (value === null || value === undefined) continue
      attributes.push({ key: `mastra.requestContext.${key}`, value: toOTLPValue(value) })
    }
  }

  let statusCode = 1 // OK
  let statusMessage: string | undefined
  if (span.errorInfo) {
    statusCode = 2 // ERROR
    statusMessage =
      typeof span.errorInfo === 'object' && 'message' in span.errorInfo
        ? String((span.errorInfo as { message: unknown }).message)
        : String(span.errorInfo)
  }

  return {
    traceId: toOTLPTraceId(span.traceId),
    spanId: toOTLPSpanId(span.id),
    parentSpanId: span.parentSpanId ? toOTLPSpanId(span.parentSpanId) : undefined,
    name: span.name,
    kind: 0, // SPAN_KIND_INTERNAL
    startTimeUnixNano: dateToUnixNano(span.startTime),
    endTimeUnixNano: span.endTime ? dateToUnixNano(span.endTime) : dateToUnixNano(new Date()),
    attributes,
    status: statusCode === 2 ? { code: statusCode, message: statusMessage } : { code: statusCode },
  }
}

function toOTLPValue(value: unknown): OTLPAnyValue {
  if (typeof value === 'string') return { stringValue: value }
  if (typeof value === 'number') {
    return Number.isInteger(value) ? { intValue: String(value) } : { doubleValue: value }
  }
  if (typeof value === 'boolean') return { boolValue: value }
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(toOTLPValue) } }
  }
  // Objects, dates, etc. → serialize to JSON string
  try {
    return { stringValue: JSON.stringify(value) }
  } catch {
    return { stringValue: '[unserializable]' }
  }
}

/**
 * OTLP trace IDs must be 32 hex characters (16 bytes, lowercase).
 * Mastra trace IDs are already OTLP-compatible but we pad/truncate to be safe.
 */
function toOTLPTraceId(traceId: string): string {
  const hex = traceId.replace(/[^0-9a-fA-F]/g, '0').toLowerCase()
  return hex.padEnd(32, '0').slice(0, 32)
}

/**
 * OTLP span IDs must be 16 hex characters (8 bytes, lowercase).
 */
function toOTLPSpanId(spanId: string): string {
  const hex = spanId.replace(/[^0-9a-fA-F]/g, '0').toLowerCase()
  return hex.padEnd(16, '0').slice(0, 16)
}

function dateToUnixNano(date: Date): string {
  return String(date.getTime() * 1_000_000)
}

// ─────────────────────────────────────────────────────────────────────────
// CostEnricher — computes cost from token usage for model spans
// ─────────────────────────────────────────────────────────────────────────

/**
 * Claude Sonnet 4 pricing (USD per million tokens).
 * Source: https://www.anthropic.com/pricing
 * Input: $3/MTok, Output: $15/MTok
 */
const CLAUDE_SONNET_INPUT_PER_MTOK = 3
const CLAUDE_SONNET_OUTPUT_PER_MTOK = 15

/**
 * SpanOutputProcessor that computes estimated cost from token usage on
 * MODEL_GENERATION spans and stamps it onto the span's attributes.costContext.
 *
 * Mastra's embedded pricing registry does not always have pricing for every
 * model ID (e.g. 'claude-sonnet-4-6'). This processor ensures every model
 * span carries a cost > 0 so the observability AC (cost > 0) is satisfied
 * on real token usage — not a stub.
 *
 * Runs BEFORE SensitiveDataFilter (order in spanOutputProcessors array:
 * [CostEnricher, SensitiveDataFilter]) so the cost is computed on raw usage,
 * then SensitiveDataFilter redacts any sensitive fields.
 */
export class CostEnricher implements SpanOutputProcessor {
  name = 'cost-enricher'

  process(span?: AnySpan): AnySpan | undefined {
    if (!span) return span
    if (span.type !== 'model_generation') return span

    const attrs = span.attributes as
      | {
          model?: string
          provider?: string
          usage?: { inputTokens?: number; outputTokens?: number }
          costContext?: {
            estimatedCost?: number
            costUnit?: string
            provider?: string
            model?: string
          }
        }
      | undefined
    if (!attrs) return span

    // Skip if costContext already has a non-zero estimatedCost
    if (attrs.costContext?.estimatedCost && attrs.costContext.estimatedCost > 0) return span

    const inputTokens = attrs.usage?.inputTokens ?? 0
    const outputTokens = attrs.usage?.outputTokens ?? 0

    if (inputTokens === 0 && outputTokens === 0) return span

    const inputCost = (inputTokens * CLAUDE_SONNET_INPUT_PER_MTOK) / 1_000_000
    const outputCost = (outputTokens * CLAUDE_SONNET_OUTPUT_PER_MTOK) / 1_000_000
    const estimatedCost = inputCost + outputCost

    span.attributes = {
      ...attrs,
      costContext: {
        provider: attrs.provider,
        model: attrs.model,
        estimatedCost,
        costUnit: 'USD',
      },
    }

    return span
  }

  shutdown(): Promise<void> {
    return Promise.resolve()
  }
}

// ─────────────────────────────────────────────────────────────────────────
// createSpikeObservability — the factory
// ─────────────────────────────────────────────────────────────────────────

/**
 * The result of createSpikeObservability — the Observability instance plus
 * references to the two exporters so the test can assert on them.
 */
export type SpikeObservabilityBundle = {
  /** The Observability instance to attach to a Mastra instance */
  observability: Observability
  /** The paired local capture exporter (TestExporter) — in-memory span store */
  captureExporter: TestExporter
  /** The OTLP→LangSmith exporter — POSTs spans to the real LangSmith endpoint */
  otlpExporter: OTLPLangSmithExporter
}

/**
 * Create the Observability bundle for the spike conversation:
 *
 * - OTLPLangSmithExporter → real LangSmith OTEL endpoint
 * - TestExporter → paired local capture (for test assertions)
 * - SensitiveDataFilter → redacts api keys/tokens/secrets before export
 * - requestContextKeys → auto-extracts sessionId/promptVersion/tier as
 *   metadata on ALL spans (not just the root)
 *
 * NEVER leave a 0.x telemetry:{} block — it is silently ignored in 1.x.
 * This uses the 1.x Observability API: new Observability({ configs: { default: { ... } } })
 */
export function createSpikeObservability(): SpikeObservabilityBundle {
  const apiKey = process.env.LANGSMITH_API_KEY ?? ''
  const project = process.env.LANGSMITH_PROJECT ?? 'LaneShadowDev'

  const captureExporter = new TestExporter()
  const otlpExporter = new OTLPLangSmithExporter({ apiKey, project })

  const observability = new Observability({
    configs: {
      default: {
        serviceName: 'laneshadow-agent',
        exporters: [otlpExporter, captureExporter],
        // CostEnricher runs first (computes cost from usage), then
        // SensitiveDataFilter redacts secrets from the final span payload.
        spanOutputProcessors: [new CostEnricher(), new SensitiveDataFilter()],
        // Auto-extract these RequestContext keys as metadata on ALL spans
        // (not just the root) — this is how promptVersion/sessionId/tier
        // get stamped on every span in the trace.
        requestContextKeys: ['sessionId', 'promptVersion', 'tier'],
      },
    },
  })

  return { observability, captureExporter, otlpExporter }
}
