'use node'

import { internal } from '../../../_generated/api'
import type { Id } from '../../../_generated/dataModel'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PlanningEventType = 'tool_pending' | 'tool_complete' | 'agent_complete'

export type PlanningEvent =
  | { type: 'tool_pending'; tool: string; agent: string; ts: number }
  | {
      type: 'tool_complete'
      tool: string
      agent: string
      summary: string
      durationMs: number
      ts: number
    }
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

const getToolStatusLine = (tool: string): string => TOOL_STATUS_LINE[tool] ?? 'Working...'

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
    },
  ) {
    this.startTime = Date.now()
  }

  /**
   * Create the planning row on the first real planning event.
   */
  async init(): Promise<void> {
    const result = await this.opts.runMutation(
      internal.db.sessionMessages.createPendingAssistantMessage,
      {
        sessionId: this.opts.sessionId,
        kind: 'planning' as const,
      },
    )
    this.messageId = result.messageId
  }

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
   * Stream sub-agent thinking text.
   * Accumulates all thinking deltas in thinkingBuffer for display in the UI.
   * Throttles DB writes to avoid mutation spam while preserving full content.
   *
   * The thinkingText field contains the full accumulated thinking for the bottom sheet.
   * The statusLine shows a brief preview in the compact card.
   */
  async updateThinking(delta: string): Promise<void> {
    this.thinkingBuffer += delta

    if (this.messageId === null) return

    const now = Date.now()
    if (now - this.lastThinkingFlush < PlanningEventEmitter.THINKING_THROTTLE_MS) return

    this.lastThinkingFlush = now

    // Create a brief preview for the status line (last ~80 chars at word boundary)
    let statusPreview = this.thinkingBuffer.trim()
    if (statusPreview.length > 80) {
      statusPreview = statusPreview.slice(-80)
      const spaceIdx = statusPreview.indexOf(' ')
      if (spaceIdx > 0) statusPreview = statusPreview.slice(spaceIdx + 1)
    }

    if (statusPreview.length > 0) {
      // persistContent will include the full thinkingBuffer in thinkingText
      await this.persistContent(statusPreview)
    }
  }

  /**
   * Flush any remaining thinking buffer to the status line.
   * Call this when a tool starts or agent completes to ensure the last
   * thinking text is visible before switching to a tool status.
   *
   * NOTE: Does NOT clear thinkingBuffer - we preserve all thinking for display.
   */
  async flushThinking(): Promise<void> {
    if (this.thinkingBuffer.trim().length === 0 || this.messageId === null) return
    this.lastThinkingFlush = Date.now()

    // Create a brief preview for the status line (last ~80 chars at word boundary)
    let statusPreview = this.thinkingBuffer.trim()
    if (statusPreview.length > 80) {
      statusPreview = statusPreview.slice(-80)
      const spaceIdx = statusPreview.indexOf(' ')
      if (spaceIdx > 0) statusPreview = statusPreview.slice(spaceIdx + 1)
    }

    await this.persistContent(statusPreview)
    // Don't clear thinkingBuffer - preserve all accumulated thinking
  }

  async toolPending(tool: string, agent: string): Promise<void> {
    await this.ensureInit()

    const event: PlanningEvent = {
      type: 'tool_pending',
      tool,
      agent,
      ts: Date.now(),
    }
    this.events.push(event)

    // Use a brief indicator for tool activity, but keep thinking buffer intact
    const statusLine = getToolStatusLine(tool)

    await this.persistContent(statusLine)
  }

  async toolComplete(
    tool: string,
    agent: string,
    summary: string,
    durationMs: number,
  ): Promise<void> {
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

  async agentComplete(agent: string, summary: string, durationMs: number): Promise<void> {
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
      return
    }

    const totalDurationMs = Date.now() - this.startTime

    const content: PlanningContent = {
      events: this.events,
      statusLine:
        this.events.length > 0
          ? ((this.events[this.events.length - 1] as any).summary ?? 'Done')
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
