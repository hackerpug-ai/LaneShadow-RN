'use node'

import { internal } from '../../../_generated/api'
import type { Id } from '../../../_generated/dataModel'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PlanningEventType = 'tool_pending' | 'tool_complete' | 'agent_complete'

export type PlanningEvent =
  | { type: 'tool_pending'; tool: string; agent: string; ts: number }
  | { type: 'tool_complete'; tool: string; agent: string; summary: string; durationMs: number; ts: number }
  | { type: 'agent_complete'; agent: string; summary: string; durationMs: number; ts: number }

export type PlanningContent = {
  events: PlanningEvent[]
  statusLine: string
  thinkingText?: string // Full accumulated thinking text for streaming display
  totalDurationMs?: number
}

// ---------------------------------------------------------------------------
// Status line mapping
// ---------------------------------------------------------------------------

const TOOL_STATUS_LINE: Record<string, string> = {
  geocode: 'Looking up location...',
  createRouteSketch: 'Designing your route...',
  compileSketch: 'Finding the best roads...',
  planRoute: 'Planning your ride...',
  searchNearby: 'Looking for places nearby...',
  webSearch: 'Checking the latest info...',
  routing_agent: 'Planning your ride...',
  search_agent: 'Looking into that...',
  enrichment_agent: 'Checking your route...',
}

const getToolStatusLine = (tool: string): string =>
  TOOL_STATUS_LINE[tool] ?? 'Working...'

// ---------------------------------------------------------------------------
// PlanningEventEmitter
// ---------------------------------------------------------------------------

export class PlanningEventEmitter {
  private events: PlanningEvent[] = []
  private messageId: Id<'session_messages'> | null = null
  private startTime: number
  private thinkingBuffer = ''
  private lastThinkingFlush = 0
  private static THINKING_THROTTLE_MS = 600 // Don't update more than ~1.7x/sec

  constructor(
    private opts: {
      runMutation: (fn: any, args: any) => Promise<any>
      sessionId: Id<'planning_sessions'>
    }
  ) {
    this.startTime = Date.now()
  }

  /**
   * Create the planning row immediately. Call this right after construction.
   */
  async init(): Promise<void> {
    console.info('[PlanningEmitter] Creating planning row')
    const result = await this.opts.runMutation(
      internal.db.sessionMessages.createPendingAssistantMessage,
      {
        sessionId: this.opts.sessionId,
        kind: 'planning' as const,
      }
    )
    this.messageId = result.messageId
    console.info(`[PlanningEmitter] Planning row created: ${this.messageId}`)
  }

  /** @deprecated kept for internal consistency — just checks init happened */
  private async ensureInit(): Promise<void> {
    if (this.messageId !== null) return
    await this.init()
  }

  private async persistContent(statusLine: string): Promise<void> {
    if (this.messageId === null) return

    const content: PlanningContent = {
      events: this.events,
      statusLine,
      thinkingText: this.thinkingBuffer.trim() || undefined,
    }

    await this.opts.runMutation(internal.db.sessionMessages.updatePlanningContent, {
      messageId: this.messageId,
      content: JSON.stringify(content),
    })
  }

  /**
   * Stream sub-agent thinking text as the status line.
   * Buffers tokens and throttles DB writes to avoid mutation spam.
   * Shows the last ~80 chars of thinking as a rolling status.
   */
  async updateThinking(delta: string): Promise<void> {
    await this.ensureInit()

    this.thinkingBuffer += delta

    const now = Date.now()
    if (now - this.lastThinkingFlush < PlanningEventEmitter.THINKING_THROTTLE_MS) return

    this.lastThinkingFlush = now

    // Take the last meaningful chunk — trim to last ~80 chars at a word boundary
    let statusLine = this.thinkingBuffer.trim()
    if (statusLine.length > 80) {
      statusLine = statusLine.slice(-80)
      const spaceIdx = statusLine.indexOf(' ')
      if (spaceIdx > 0) statusLine = statusLine.slice(spaceIdx + 1)
    }

    if (statusLine.length > 0) {
      console.info(`[PlanningEmitter] thinking: "${statusLine}"`)
      await this.persistContent(statusLine)
    }
  }

  /**
   * Flush any remaining thinking buffer to the status line.
   * Call this when a tool starts or agent completes to ensure the last
   * thinking text is visible before switching to a tool status.
   */
  async flushThinking(): Promise<void> {
    if (this.thinkingBuffer.trim().length === 0 || this.messageId === null) return
    this.lastThinkingFlush = Date.now()
    let statusLine = this.thinkingBuffer.trim()
    if (statusLine.length > 80) {
      statusLine = statusLine.slice(-80)
      const spaceIdx = statusLine.indexOf(' ')
      if (spaceIdx > 0) statusLine = statusLine.slice(spaceIdx + 1)
    }
    await this.persistContent(statusLine)
    this.thinkingBuffer = ''
  }

  async toolPending(tool: string, agent: string): Promise<void> {
    await this.ensureInit()
    this.thinkingBuffer = '' // Clear thinking when a tool starts

    const event: PlanningEvent = {
      type: 'tool_pending',
      tool,
      agent,
      ts: Date.now(),
    }
    this.events.push(event)

    const statusLine = getToolStatusLine(tool)
    console.info(`[PlanningEmitter] toolPending: ${agent}/${tool} → "${statusLine}"`)
    await this.persistContent(statusLine)
  }

  async toolComplete(
    tool: string,
    agent: string,
    summary: string,
    durationMs: number
  ): Promise<void> {
    console.info(`[PlanningEmitter] toolComplete: ${agent}/${tool} → "${summary}" (${durationMs}ms)`)
    await this.ensureInit()

    const event: PlanningEvent = {
      type: 'tool_complete',
      tool,
      agent,
      summary,
      durationMs,
      ts: Date.now(),
    }
    this.events.push(event)

    const statusLine = `${summary}`
    await this.persistContent(statusLine)
  }

  async agentComplete(
    agent: string,
    summary: string,
    durationMs: number
  ): Promise<void> {
    console.info(`[PlanningEmitter] agentComplete: ${agent} → "${summary}" (${durationMs}ms)`)
    await this.ensureInit()

    const event: PlanningEvent = {
      type: 'agent_complete',
      agent,
      summary,
      durationMs,
      ts: Date.now(),
    }
    this.events.push(event)

    await this.persistContent(summary)
  }

  /**
   * Finalizes the planning row with status='complete' and total duration.
   * No-op if no events were emitted (no planning row was created).
   */
  async done(): Promise<void> {
    if (this.messageId === null) {
      console.info('[PlanningEmitter] done() — no events emitted, skipping')
      return
    }

    const totalDurationMs = Date.now() - this.startTime
    console.info(`[PlanningEmitter] done() — ${this.events.length} events, ${totalDurationMs}ms total`)
    const content: PlanningContent = {
      events: this.events,
      statusLine: this.events.length > 0
        ? (this.events[this.events.length - 1] as any).summary ?? 'Done'
        : 'Done',
      totalDurationMs,
    }

    await this.opts.runMutation(internal.db.sessionMessages.finalizeAssistantMessage, {
      messageId: this.messageId,
      content: JSON.stringify(content),
      status: 'complete',
    })
  }
}
