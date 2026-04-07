'use node'

import {
  stream,
  type Api,
  type AssistantMessage,
  type AssistantMessageEvent,
  type Context,
  type Message,
  type Model,
  type ToolCall,
  type ToolResultMessage,
} from '@mariozechner/pi-ai'
import { LoopDetector } from './loopDetector'
import { BudgetTracker } from './budgetTracker'
import { ERROR_CODES } from '../../errors'
import type { ExecuteContext } from './ridePlanningAgent'

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type RunAgentConfig = {
  /** pi-ai Model to invoke */
  model: Model<Api>
  /** Full pi-ai context: systemPrompt, messages, tools */
  context: Context
  /** Tool execution function — caller provides a closure capturing their state */
  executor: (call: ToolCall) => Promise<unknown>
  /** Optional lifecycle callback hooks (UI cards, persistence, streaming) */
  callbacks?: ExecuteContext
  /** Maximum ReAct steps before halting (default: 10) */
  maxSteps?: number
  /** Hard deadline in ms from call time (default: 30000) */
  timeoutMs?: number
  /** Optional loop detector — shared across steps */
  loopDetector?: LoopDetector
  /** Optional budget tracker — throws ConvexError when limit exceeded */
  budgetTracker?: BudgetTracker
  /** Optional fn to trim a tool result before injecting into LLM context.
   *  The untrimmed result still flows into RunAgentResult.toolResults. */
  summarizeForContext?: (toolName: string, result: unknown) => unknown
  /** Tool names that are safe to execute in parallel (Set<string>) */
  parallelSafeTools?: Set<string>
}

export type RunAgentResult = {
  /** Final text from the last (non-tool) assistant turn */
  response: string
  /** All tool call results in execution order */
  toolResults: { toolName: string; result: unknown }[]
  /** Full message array after the loop completes */
  messages: Message[]
}

// -----------------------------------------------------------------------------
// Generic Agent Loop
// -----------------------------------------------------------------------------

/**
 * A generic ReAct agent loop.
 *
 * Drives a model through a multi-step tool-use loop until the model stops
 * requesting tools, the step budget is exhausted, or a timeout fires.
 *
 * NOT LaneShadow-specific — contains no routing concepts, tool schemas, or
 * application context. Callers inject everything via RunAgentConfig.
 */
export async function runAgent(config: RunAgentConfig): Promise<RunAgentResult> {
  const {
    model,
    context,
    executor,
    callbacks,
    maxSteps = 100, // effectively uncapped — levelsetting resource needs
    timeoutMs = 600_000, // 10 min — effectively uncapped for levelsetting
    loopDetector,
    budgetTracker,
    summarizeForContext,
    parallelSafeTools = new Set<string>(),
  } = config

  const toolResults: { toolName: string; result: unknown }[] = []
  const deadline = Date.now() + timeoutMs

  console.info(`[runAgent] Starting agent loop: maxSteps=${maxSteps}, timeoutMs=${timeoutMs}, tools=${(context.tools ?? []).map(t => t.name).join(', ')}`)

  for (let step = 0; step < maxSteps; step++) {
    if (Date.now() > deadline) {
      console.warn(`[runAgent] TIMEOUT at step ${step} — breaking loop (levelsetting: log, don't throw)`)
      break
    }

    console.info(`[runAgent] Step ${step + 1}/${maxSteps}`)
    await callbacks?.onStepStart?.(step, maxSteps)

    // Always stream so we capture all event types.
    // Buffer text_delta events and flush them only on a final (non-tool) turn.
    // Thinking and toolcall_start events are forwarded immediately.
    const eventStream = stream(model, context)
    const bufferedTextDeltas: string[] = []

    for await (const event of eventStream) {
      const ev = event as AssistantMessageEvent
      if (ev.type === 'text_delta') {
        bufferedTextDeltas.push(ev.delta)
      } else if (ev.type === 'thinking_delta') {
        await callbacks?.onThinkingDelta?.(ev.delta)
      } else if (ev.type === 'toolcall_start') {
        const partialContent = ev.partial.content
        const partialToolCall = partialContent[ev.contentIndex]
        if (partialToolCall && partialToolCall.type === 'toolCall') {
          await callbacks?.onToolPending?.({ name: partialToolCall.name })
        }
      } else if (ev.type === 'done' && ev.reason !== 'toolUse') {
        // Flush buffered text deltas on a final (non-tool) turn.
        for (const delta of bufferedTextDeltas) {
          await callbacks?.onTextDelta?.(delta)
        }
      }
    }

    const assistant = await eventStream.result()

    // Track cumulative spend; throws ConvexError(AGENT_BUDGET_EXCEEDED) if over limit.
    budgetTracker?.add(assistant.usage)

    context.messages.push(assistant)

    if (assistant.stopReason !== 'toolUse') {
      // Notify caller of the final (text-only) assistant turn.
      await callbacks?.onFinalAssistant?.(assistant)
      break
    }

    const toolCalls = assistant.content.filter(
      (b): b is ToolCall => b.type === 'toolCall'
    )
    console.info(`[runAgent] Step ${step + 1} stopReason=${assistant.stopReason}, toolCalls=[${toolCalls.map(c => c.name).join(', ')}]`)
    if (toolCalls.length === 0) break

    // Notify caller that the assistant turn with tool calls is complete.
    await callbacks?.onAgentTurn?.(assistant)

    // Partition tool calls into parallel-safe and sequential groups.
    // LoopDetector check runs for ALL calls before any execution.
    const safeCalls = toolCalls.filter(c => parallelSafeTools.has(c.name))
    const unsafeCalls = toolCalls.filter(c => !parallelSafeTools.has(c.name))

    // Pre-allocate results map keyed by call id to preserve original ordering.
    type CallOutcome = { result: unknown; isError: boolean; loopDetected: boolean }
    const outcomes = new Map<string, CallOutcome>()

    // LoopDetector: record all calls BEFORE dispatching any execution.
    if (loopDetector) {
      for (const call of toolCalls) {
        if (loopDetector.record(call)) {
          outcomes.set(call.id, {
            result: { type: 'error', message: 'Loop detected' },
            isError: true,
            loopDetected: true,
          })
        }
      }
    }

    // Execute safe calls in parallel (excluding loop-detected ones).
    const safeCallsToRun = safeCalls.filter(c => !outcomes.has(c.id))
    if (safeCallsToRun.length > 0) {
      console.info(`[runAgent] Executing ${safeCallsToRun.length} parallel-safe tools: [${safeCallsToRun.map(c => c.name).join(', ')}]`)
    }
    await Promise.all(
      safeCallsToRun.map(async (call) => {
        let result: unknown
        let isError = false
        const t0 = Date.now()
        try {
          result = await executor(call)
          console.info(`[runAgent] ✅ ${call.name} completed in ${Date.now() - t0}ms → ${JSON.stringify(result ?? null).slice(0, 200)}`)
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err)
          const isValidation = errMsg.includes('Validation failed')
          result = {
            type: 'error',
            message: errMsg,
            hint: isValidation
              ? 'Your tool arguments were malformed. Fix the JSON structure (ensure all objects have curly braces) and retry the same tool call.'
              : "An unexpected error occurred. Ask the rider what they'd like to do.",
            retryGuidance: isValidation ? 'fix_args_and_retry' : 'ask_rider',
          }
          isError = true
          console.error(`[runAgent] ❌ ${call.name} FAILED in ${Date.now() - t0}ms: ${errMsg}`)
        }
        outcomes.set(call.id, { result, isError, loopDetected: false })
      })
    )

    // Execute unsafe calls sequentially (excluding loop-detected ones).
    for (const call of unsafeCalls) {
      if (outcomes.has(call.id)) continue
      let result: unknown
      let isError = false
      const t0 = Date.now()
      console.info(`[runAgent] Executing sequential tool: ${call.name}`)
      try {
        result = await executor(call)
        console.info(`[runAgent] ✅ ${call.name} completed in ${Date.now() - t0}ms → ${JSON.stringify(result ?? null).slice(0, 200)}`)
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err)
        const isValidation = errMsg.includes('Validation failed')
        result = {
          type: 'error',
          message: errMsg,
          hint: isValidation
            ? 'Your tool arguments were malformed. Fix the JSON structure (ensure all objects have curly braces) and retry the same tool call.'
            : "An unexpected error occurred. Ask the rider what they'd like to do.",
          retryGuidance: isValidation ? 'fix_args_and_retry' : 'ask_rider',
        }
        isError = true
        console.error(`[runAgent] ❌ ${call.name} FAILED in ${Date.now() - t0}ms: ${errMsg}`)
      }
      outcomes.set(call.id, { result, isError, loopDetected: false })
    }

    // Reconstruct results in original call order and push to context.
    for (const call of toolCalls) {
      const outcome = outcomes.get(call.id)!

      if (outcome.loopDetected) {
        const loopResult: ToolResultMessage = {
          role: 'toolResult',
          toolCallId: call.id,
          toolName: call.name,
          content: [{ type: 'text', text: JSON.stringify({
            type: 'error',
            message: `Already called ${call.name} with identical arguments ${loopDetector!.getCount(call)} times. Try different arguments or ask the rider for clarification.`,
          }) }],
          isError: true,
          timestamp: Date.now(),
        }
        toolResults.push({ toolName: call.name, result: { type: 'error', message: 'Loop detected' } })
        context.messages.push(loopResult)
        await callbacks?.onToolResultPiMessage?.(call.id, loopResult)
        continue
      }

      const { result, isError } = outcome

      // Full result stays in toolResults for callers to inspect (e.g. attachments).
      toolResults.push({ toolName: call.name, result })

      // Optionally trimmed result goes into the LLM context.
      const contextResult = summarizeForContext
        ? summarizeForContext(call.name, result)
        : result

      const toolResultMsg: ToolResultMessage = {
        role: 'toolResult',
        toolCallId: call.id,
        toolName: call.name,
        content: [{ type: 'text', text: JSON.stringify(contextResult) }],
        isError,
        timestamp: Date.now(),
      }
      context.messages.push(toolResultMsg)
      await callbacks?.onToolResultPiMessage?.(call.id, toolResultMsg)
    }
  }

  console.info(`[runAgent] Agent loop finished after ${context.messages.length} messages, ${toolResults.length} tool calls: [${toolResults.map(r => r.toolName).join(', ')}]`)

  // Extract final text from the last assistant message.
  const last = context.messages[context.messages.length - 1]
  let response = ''
  if (last && last.role === 'assistant') {
    const assistantLast = last as AssistantMessage
    response = assistantLast.content
      .filter((b): b is { type: 'text'; text: string } => b.type === 'text')
      .map((b) => b.text)
      .join('')
  }

  return {
    response,
    toolResults,
    messages: context.messages,
  }
}
