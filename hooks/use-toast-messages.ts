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
}

interface UseToastMessagesReturn {
  toasts: ToastMessage[]
  dismissToast: (id: string) => void
  clearAll: () => void
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Manages a queue of lightweight toast messages derived from the chat
 * transcript. Only agent text messages are surfaced — route cards, weather
 * cards, reasoning, and rider messages are filtered out.
 *
 * Each toast carries its own auto-fade timer. Streaming messages defer
 * their timer until the stream completes.
 */
export function useToastMessages(opts: UseToastMessagesOptions): UseToastMessagesReturn {
  const {
    transcriptMessages,
    chatMode,
    sessionId,
    maxVisible = 3,
  } = opts

  const [toasts, setToasts] = useState<ToastMessage[]>([])

  // Baseline tracking — same pattern as the old transient system so we
  // don't flash existing history on app open / session switch.
  const prevCountRef = useRef(0)
  const baselineSetRef = useRef(false)

  // Reset baseline when session changes
  useEffect(() => {
    baselineSetRef.current = false
    prevCountRef.current = 0
    setToasts([])
  }, [sessionId])

  // Clear all toasts when entering chat mode
  useEffect(() => {
    if (chatMode) setToasts([])
  }, [chatMode])

  // Detect new messages and create toasts
  useEffect(() => {
    if (!baselineSetRef.current) {
      prevCountRef.current = transcriptMessages.length
      baselineSetRef.current = true
      return
    }

    const prev = prevCountRef.current
    prevCountRef.current = transcriptMessages.length

    if (chatMode) return
    if (transcriptMessages.length <= prev) return

    const newMessages = transcriptMessages.slice(prev)
    const qualifying: ToastMessage[] = []

    for (const msg of newMessages) {
      // Only agent messages
      if (msg.role !== 'agent') continue
      // Only plain text (skip route cards, weather cards, reasoning, etc.)
      if (msg.kind && msg.kind !== 'text') continue
      // Skip empty content
      if (!msg.content.trim()) continue

      qualifying.push({
        id: msg.id,
        content: msg.content,
        status: msg.status,
      })
    }

    if (qualifying.length > 0) {
      setToasts((prev) => [...prev, ...qualifying].slice(-maxVisible))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcriptMessages.length, chatMode, maxVisible])

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
