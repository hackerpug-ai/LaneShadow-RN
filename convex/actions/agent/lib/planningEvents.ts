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

  constructor(
    private opts: {
      runMutation: (fn: any, args: any) => Promise<any>
      sessionId: Id<'planning_sessions'>
    }
  ) {
    this.startTime = Date.now()
  }

  /**
   * Lazy init — creates the planning row on first event, so simple "hello"
   * responses that never call tools produce no planning row.
   */
  private async ensureInit(): Promise<void> {
    if (this.messageId !== null) return

    const result = await this.opts.runMutation(
      internal.db.sessionMessages.createPendingAssistantMessage,
      {
        sessionId: this.opts.sessionId,
        kind: 'planning' as const,
      }
    )
    this.messageId = result.messageId
  }

  private async persistContent(statusLine: string): Promise<void> {
    if (this.messageId === null) return

    const content: PlanningContent = {
      events: this.events,
      statusLine,
    }

    await this.opts.runMutation(internal.db.sessionMessages.updatePlanningContent, {
      messageId: this.messageId,
      content: JSON.stringify(content),
    })
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

    const statusLine = getToolStatusLine(tool)
    await this.persistContent(statusLine)
  }

  async toolComplete(
    tool: string,
    agent: string,
    summary: string,
    durationMs: number
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

  async agentComplete(
    agent: string,
    summary: string,
    durationMs: number
  ): Promise<void> {
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
    if (this.messageId === null) return

    const totalDurationMs = Date.now() - this.startTime
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
