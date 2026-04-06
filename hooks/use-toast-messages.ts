import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChatMessage, ChatMessageStatus } from '../components/ui/chat-transcript'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ToastMessage {
  id: string
  content: string
  status?: ChatMessageStatus
}

interface UseToastMessagesOptions {
  transcriptMessages: ChatMessage[]
  chatMode: boolean
  /** Session ID — resets the baseline when it changes. */
  sessionId?: string
  /** Max toasts visible at once (default 3). */
  maxVisible?: number
  /** Whether the upstream data source is still loading (undefined = loading).
   *  Baseline is deferred until the first real payload arrives so we don't
   *  flash existing history on app open. */
  isLoading?: boolean
}

interface UseToastMessagesReturn {
  toasts: ToastMessage[]
  dismissToast: (id: string) => void
  clearAll: () => void
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns true if the message qualifies for toast display. */
function isToastWorthy(msg: ChatMessage): boolean {
  if (msg.role !== 'agent') return false
  if (msg.kind && msg.kind !== 'text') return false
  if (!msg.content.trim()) return false
  return true
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Manages a queue of lightweight toast messages derived from the chat
 * transcript. Only agent text messages are surfaced — route cards, weather
 * cards, reasoning, and rider messages are filtered out.
 *
 * Uses ID-based tracking so streaming messages that start empty are
 * picked up once content arrives (the array length doesn't change for
 * in-place content updates).
 */
export function useToastMessages(opts: UseToastMessagesOptions): UseToastMessagesReturn {
  const {
    transcriptMessages,
    chatMode,
    sessionId,
    maxVisible = 3,
    isLoading = false,
  } = opts

  const [toasts, setToasts] = useState<ToastMessage[]>([])

  // IDs of messages present when the baseline was established — these
  // are "old" messages that should never become toasts.
  const baselineIdsRef = useRef<Set<string> | null>(null)
  // IDs we've already promoted to toasts (or explicitly dismissed).
  const toastedIdsRef = useRef<Set<string>>(new Set())

  // Reset baseline when session changes
  useEffect(() => {
    baselineIdsRef.current = null
    toastedIdsRef.current = new Set()
    setToasts([])
  }, [sessionId])

  // Clear all toasts when entering chat mode
  useEffect(() => {
    if (chatMode) setToasts([])
  }, [chatMode])

  // Scan for new toast-worthy messages on every transcript update.
  // This covers both new messages (length increase) AND streaming
  // messages that start empty and later gain content.
  useEffect(() => {
    if (isLoading) return

    // Establish baseline on first load — snapshot current IDs
    if (baselineIdsRef.current === null) {
      baselineIdsRef.current = new Set(transcriptMessages.map((m) => m.id))
      return
    }

    if (chatMode) return

    const newToasts: ToastMessage[] = []

    for (const msg of transcriptMessages) {
      // Skip baseline messages and already-toasted messages
      if (baselineIdsRef.current.has(msg.id)) continue
      if (toastedIdsRef.current.has(msg.id)) continue
      if (!isToastWorthy(msg)) continue

      toastedIdsRef.current.add(msg.id)
      newToasts.push({
        id: msg.id,
        content: msg.content,
        status: msg.status,
      })
    }

    if (newToasts.length > 0) {
      setToasts((prev) => [...prev, ...newToasts].slice(-maxVisible))
    }
  }, [transcriptMessages, chatMode, maxVisible, isLoading])

  // Update content & status of existing toasts when messages stream in
  useEffect(() => {
    setToasts((current) => {
      if (current.length === 0) return current
      let changed = false
      const updated = current.map((toast) => {
        const source = transcriptMessages.find((m) => m.id === toast.id)
        if (!source) return toast
        if (source.content !== toast.content || source.status !== toast.status) {
          changed = true
          return { ...toast, content: source.content, status: source.status }
        }
        return toast
      })
      return changed ? updated : current
    })
  }, [transcriptMessages])

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setToasts([])
  }, [])

  return { toasts, dismissToast, clearAll }
}
