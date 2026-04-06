/**
 * MapToastStack
 *
 * Lightweight toast-style message notifications that float above the
 * ChatInput on the map screen. Each toast is a thin translucent pill
 * showing only agent text content — no avatars, timestamps, or route
 * cards. New toasts push existing ones upward. Each toast auto-fades
 * after a timeout.
 *
 * Design: semi-translucent surface pill, body.sm text, hairline border,
 * elevation 2 shadow. Max 2 lines per toast. Tap any toast to enter
 * full chat mode. Streaming toasts show inline typing dots.
 */

import React, { useEffect, useRef } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { TypingIndicator } from '../chat/typing-indicator'
import type { ToastMessage } from '../../hooks/use-toast-messages'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const AUTO_FADE_MS = 5000
const MAX_TOAST_WIDTH_RATIO = 0.85

// ---------------------------------------------------------------------------
// Individual Toast
// ---------------------------------------------------------------------------

interface MapToastProps {
  toast: ToastMessage
  onDismiss: (id: string) => void
  onTap: () => void
  autoFadeMs?: number
}

const MapToast = ({ toast, onDismiss, onTap, autoFadeMs = AUTO_FADE_MS }: MapToastProps) => {
  const { semantic } = useSemanticTheme()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isStreaming = toast.status === 'streaming' || toast.status === 'running'

  // Per-toast auto-fade timer. Deferred while streaming.
  useEffect(() => {
    if (isStreaming) return

    timerRef.current = setTimeout(() => {
      onDismiss(toast.id)
    }, autoFadeMs)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [isStreaming, autoFadeMs, onDismiss, toast.id])

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(300)}
      style={[
        styles.toast,
        {
          backgroundColor: semantic.color.surface.default,
          borderColor: semantic.color.border.default,
          borderRadius: semantic.radius.xl,
          paddingVertical: semantic.space.sm,
          paddingHorizontal: semantic.space.lg,
          maxWidth: `${MAX_TOAST_WIDTH_RATIO * 100}%` as unknown as number,
          minWidth: 200,
          ...semantic.elevation[2],
        },
      ]}
    >
      <Pressable onPress={onTap} style={styles.toastPressable}>
        <View style={styles.toastContent}>
          <Text
            numberOfLines={2}
            style={[
              styles.toastText,
              {
                color: semantic.color.onSurface.default,
                ...semantic.type.body.sm,
              },
            ]}
          >
            {toast.content}
          </Text>
          {isStreaming && (
            <View style={[styles.typingSlot, { marginLeft: semantic.space.xs }]}>
              <TypingIndicator size="sm" />
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  )
}

// ---------------------------------------------------------------------------
// Toast Stack
// ---------------------------------------------------------------------------

interface MapToastStackProps {
  messages: ToastMessage[]
  onDismiss: (id: string) => void
  onTapToChat: () => void
  /** Distance from screen bottom to clear the ChatInput. */
  bottomOffset: number
  autoFadeMs?: number
  testID?: string
}

export const MapToastStack = ({
  messages,
  onDismiss,
  onTapToChat,
  bottomOffset,
  autoFadeMs,
  testID,
}: MapToastStackProps) => {
  const { semantic } = useSemanticTheme()

  if (messages.length === 0) return null

  return (
    <View
      pointerEvents="box-none"
      testID={testID}
      style={[
        styles.container,
        {
          bottom: bottomOffset,
          paddingHorizontal: semantic.space.lg,
          gap: semantic.space.sm,
        },
      ]}
    >
      {messages.map((toast) => (
        <MapToast
          key={toast.id}
          toast={toast}
          onDismiss={onDismiss}
          onTap={onTapToChat}
          autoFadeMs={autoFadeMs}
        />
      ))}
    </View>
  )
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 25,
    alignItems: 'center',
  },
  toast: {
    borderWidth: StyleSheet.hairlineWidth,
    opacity: 0.92,
    alignSelf: 'center',
  },
  toastPressable: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    flexShrink: 1,
  },
  toastText: {
    flexShrink: 1,
  },
  typingSlot: {
    paddingBottom: 2,
  },
})
