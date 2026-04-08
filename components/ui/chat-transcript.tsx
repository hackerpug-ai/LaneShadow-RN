/**
 * ChatTranscript
 *
 * Agentic chat transcript view — renders a conversation as a series of
 * right-aligned rider bubbles and left-aligned agent messages, mirroring
 * the ChatGPT/Claude conversation pattern.
 *
 * Design decisions:
 * - Rider messages: right-aligned speech bubble with primary color background
 *   and onPrimary text. Bottom-right corner is tight (radius.sm) to give the
 *   classic "sent" bubble shape.
 * - Agent messages: left-aligned, no bubble — plain text with a small motorbike
 *   avatar glyph to the left. This mirrors how LLM chat UIs render assistant
 *   replies. Route attachments render inline below agent text.
 * - Timestamps: shown only on the first message of the day OR when >5 min has
 *   elapsed since the previous message. Styled small + subtle.
 * - Auto-scrolls to bottom on mount and whenever messages.length changes.
 * - Fills its parent container naturally (flex: 1) — no absolute positioning.
 *
 * Message ordering (US-314):
 * - Messages arrive already sorted by `createdAt` ascending from the upstream
 *   Convex query (`api.db.sessionMessages.list`). The ReAct loop emits a
 *   `reasoning` row FIRST (thinking_delta streams in before tool calls or
 *   final text), then the paired `agent_turn` / card / text row is inserted.
 *   Because reasoning rows get an EARLIER `createdAt`, they naturally render
 *   ABOVE their paired assistant response when we render in array order.
 *   No bespoke clustering/grouping step is required — the createdAt order is
 *   the turn-cluster order. Hidden rows (`agent_turn`, `tool_result_hidden`)
 *   are filtered out upstream in `app/(app)/(tabs)/chat.tsx` before reaching
 *   this component, so what we receive is strictly visible rows in turn order.
 *
 * Following components/CLAUDE.md: uses useSemanticTheme() exclusively.
 * Following react-rules.md: named export, no unnecessary useCallback/useMemo.
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSemanticTheme } from '../../hooks/use-semantic-theme';
import { RouteAttachmentCard } from './route-attachment-card';
import { TypingIndicator } from '../chat/typing-indicator';
import { MarkdownText } from './markdown-text';
import {
  CARD_REGISTRY,
  type CardAttachment,
  type CardKind,
} from '../chat/card-registry';
import type { Id } from '../../convex/_generated/dataModel';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RouteAttachmentProps {
  id: string;
  label: string;
  description: string;
  distance: string;
  duration: string;
  scenicScore: number;
  weatherBadge?: {
    type: 'clear' | 'rain' | 'wind' | 'cloudy';
    text: string;
  };
  isBest?: boolean;
}

export type ChatMessageKind = 'text' | CardKind;
export type ChatMessageStatus = 'streaming' | 'running' | 'complete' | 'failed';

export interface ChatMessage {
  id: string;
  role: 'rider' | 'agent';
  content: string;
  timestamp: Date;
  routeAttachments?: RouteAttachmentProps[];
  /** Discriminates content type — defaults to 'text' when undefined. */
  kind?: ChatMessageKind;
  /** Per-message lifecycle state. Used to render streaming indicators. */
  status?: ChatMessageStatus;
  /** Raw session_message attachments passed through to card components. */
  attachments?: CardAttachment[];
}

interface ChatTranscriptProps {
  messages: ChatMessage[];
  onRoutePress?: (routeId: string, messageId: string) => void;
  /** Called when the user taps a completed route card to view it on the map. */
  onViewOnMap?: () => void;
  /** Extra top padding inside the scroll content, e.g. to clear a
   *  floating header overlay rendered above the transcript. */
  topInset?: number;
  /** Extra bottom padding inside the scroll content, e.g. to clear a
   *  floating input bar rendered above the transcript. */
  bottomInset?: number;
  /** When true, the transcript's own background is transparent so the
   *  parent can provide its own backdrop (e.g. a semi-transparent scrim
   *  over the map). */
  transparent?: boolean;
}

// ---------------------------------------------------------------------------
// Timestamp helpers
// ---------------------------------------------------------------------------

/** Format a Date as a friendly time string */
function formatMessageTime(date: Date): string {
  const hours = date.getHours();
  const mins = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h = hours % 12 || 12;
  const m = mins.toString().padStart(2, '0');
  return `${h}:${m} ${ampm}`;
}

/** Format a Date as a day label (Today / Yesterday / weekday / date) */
function formatDayLabel(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((today.getTime() - msgDay.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Returns true when a timestamp divider should be shown before this message */
function shouldShowTimestamp(
  current: ChatMessage,
  previous: ChatMessage | undefined,
): boolean {
  if (!previous) return true; // Always show on the first message

  const curr = new Date(current.timestamp);
  const prev = new Date(previous.timestamp);

  // New calendar day
  if (
    curr.getFullYear() !== prev.getFullYear() ||
    curr.getMonth() !== prev.getMonth() ||
    curr.getDate() !== prev.getDate()
  ) {
    return true;
  }

  // Gap > 5 minutes
  const gapMs = curr.getTime() - prev.getTime();
  return gapMs > 5 * 60 * 1000;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Centred timestamp divider shown between message clusters */
interface TimestampDividerProps {
  message: ChatMessage;
  previous: ChatMessage | undefined;
}

const TimestampDivider = ({ message, previous }: TimestampDividerProps) => {
  const { semantic } = useSemanticTheme();

  const curr = new Date(message.timestamp);
  const prev = previous ? new Date(previous.timestamp) : undefined;

  // Determine label: "Day, Time" on day-boundary, just "Time" within same day
  const isNewDay =
    !prev ||
    curr.getFullYear() !== prev.getFullYear() ||
    curr.getMonth() !== prev.getMonth() ||
    curr.getDate() !== prev.getDate();

  const label = isNewDay
    ? `${formatDayLabel(curr)} · ${formatMessageTime(curr)}`
    : formatMessageTime(curr);

  return (
    <View style={styles.timestampDivider}>
      <Text
        style={[
          styles.timestampText,
          {
            color: semantic.color.onSurface.subtle,
            ...semantic.type.label.sm,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

/** Right-aligned rider bubble */
interface RiderBubbleProps {
  message: ChatMessage;
}

const RiderBubble = ({ message }: RiderBubbleProps) => {
  const { semantic } = useSemanticTheme();

  return (
    <View style={styles.riderRow} testID="rider-message-row">
      <View
        style={[
          styles.riderBubble,
          {
            backgroundColor: semantic.color.primary.default,
            borderRadius: semantic.radius.xl,
            borderBottomRightRadius: semantic.radius.sm,
            padding: semantic.space.md,
          },
        ]}
        testID="rider-bubble"
      >
        <Text
          style={[
            styles.bubbleText,
            {
              color: semantic.color.onPrimary.default,
              ...semantic.type.body.lg,
            },
          ]}
        >
          {message.content}
        </Text>
      </View>
    </View>
  );
};

/** Left-aligned agent message with optional motorbike avatar */
interface AgentMessageProps {
  message: ChatMessage;
  onRoutePress?: (routeId: string, messageId: string) => void;
  /** When true, adds a semi-transparent glass container for readability over map */
  transparent?: boolean;
}

const AgentMessage = ({ message, onRoutePress, transparent }: AgentMessageProps) => {
  const { semantic } = useSemanticTheme();

  return (
    <View style={styles.agentRow} testID="agent-message-row">
      {/* Avatar column */}
      <View
        style={[
          styles.agentAvatar,
          {
            backgroundColor: semantic.color.surfaceVariant.default,
            borderRadius: semantic.radius.full,
          },
        ]}
      >
        <MaterialCommunityIcons
          name="motorbike"
          size={16}
          color={semantic.color.primary.default}
          testID="agent-avatar-icon"
        />
      </View>

      {/* Content column — wrap in glass card when overlaid on map */}
      <View
        style={[
          styles.agentContent,
          transparent && {
            backgroundColor: semantic.color.surface.default + 'D9', // ~85% opacity
            borderRadius: semantic.radius.lg,
            paddingHorizontal: semantic.space.md,
            paddingVertical: semantic.space.sm,
          },
        ]}
      >
        <View style={styles.agentTextRow}>
          <MarkdownText testID="agent-message-content">
            {message.content}
          </MarkdownText>
          {message.status === 'streaming' && (
            <View
              style={[styles.typingSlot, { marginLeft: semantic.space.xs }]}
              testID="agent-message-typing-indicator-slot"
            >
              <TypingIndicator size="sm" />
            </View>
          )}
        </View>

        {/* Route attachments inline below agent text */}
        {message.routeAttachments && message.routeAttachments.length > 0 && (
          <View
            style={[styles.attachments, { marginTop: semantic.space.sm }]}
            testID="route-attachments-container"
          >
            {message.routeAttachments.map((route) => (
              <RouteAttachmentCard
                key={route.id}
                {...route}
                onPress={onRoutePress ? () => onRoutePress(route.id, message.id) : undefined}
                variant="full"
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

// ---------------------------------------------------------------------------
// Card row (left-aligned, no bubble — mirrors AgentMessage layout)
// ---------------------------------------------------------------------------

interface CardRowProps {
  message: ChatMessage;
  onViewOnMap?: () => void;
}

const CardRow = ({ message, onViewOnMap }: CardRowProps) => {
  const kind = message.kind as CardKind | undefined;
  console.info('[ChatTranscript] CardRow called:', {
    kind,
    messageId: message.id,
    isText: kind === ('text' as CardKind),
    hasKind: !!kind,
  });

  if (!kind || kind === ('text' as CardKind)) {
    console.info('[ChatTranscript] CardRow returning null (text or no kind)');
    return null;
  }

  const CardComponent = CARD_REGISTRY[kind];
  // Defensive: if kind isn't in the registry, render nothing.
  if (!CardComponent) {
    console.warn('[ChatTranscript] Unknown card kind:', kind);
    return null;
  }

  // Debug logging to see what's being rendered
  console.info('[ChatTranscript] Rendering card:', {
    kind,
    messageId: message.id,
    hasAttachments: !!message.attachments,
    attachmentsCount: message.attachments?.length ?? 0,
    attachments: message.attachments,
  });

  // Shape attachments to match the CardProps contract.
  const attachments: CardAttachment[] = message.attachments ?? [];

  // Cards are always assistant-side, left-aligned. We reuse the agentRow
  // layout for visual consistency but skip the avatar since each card has
  // its own visual identity.
  return (
    <View style={styles.agentRow} testID={`card-row-${kind}`}>
      <View style={styles.agentContent}>
        <CardComponent
          message={{
            _id: message.id as Id<'session_messages'>,
            createdAt: message.timestamp.getTime(),
            content: message.content,
            status: message.status,
          }}
          attachments={attachments}
          onViewOnMap={onViewOnMap}
        />
      </View>
    </View>
  );
};

// ---------------------------------------------------------------------------
// Assistant message router — branches on message.kind
// ---------------------------------------------------------------------------

function renderAssistantMessage(
  message: ChatMessage,
  onRoutePress: ((routeId: string, messageId: string) => void) | undefined,
  onViewOnMap: (() => void) | undefined,
  transparent?: boolean,
): React.ReactElement {
  const kind: ChatMessageKind = message.kind ?? 'text';

  if (kind === 'text') {
    return <AgentMessage message={message} onRoutePress={onRoutePress} transparent={transparent} />;
  }

  return <CardRow message={message} onViewOnMap={onViewOnMap} />;
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

const EmptyState = () => {
  const { semantic } = useSemanticTheme();

  return (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons
        name="chat-outline"
        size={40}
        color={semantic.color.onSurface.subtle}
      />
      <Text
        style={[
          styles.emptyText,
          {
            color: semantic.color.onSurface.subtle,
            ...semantic.type.body.md,
            marginTop: semantic.space.md,
          },
        ]}
        testID="chat-transcript-empty"
      >
        Start a conversation from the home screen
      </Text>
    </View>
  );
};

// ---------------------------------------------------------------------------
// ChatTranscript
// ---------------------------------------------------------------------------

export const ChatTranscript = ({
  messages,
  onRoutePress,
  onViewOnMap,
  topInset = 0,
  bottomInset = 0,
  transparent = false,
}: ChatTranscriptProps) => {
  const { semantic } = useSemanticTheme();
  const scrollRef = useRef<ScrollView>(null);

  // Auto-scroll to bottom on mount and when messages list grows
  useEffect(() => {
    if (messages.length > 0) {
      // Use a short timeout to ensure layout is complete before scrolling
      const timer = setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [messages.length]);

  if (messages.length === 0) {
    return <EmptyState />;
  }

  return (
    <ScrollView
      ref={scrollRef}
      style={[
        styles.scroll,
        transparent ? null : { backgroundColor: semantic.color.background.default },
      ]}
      contentContainerStyle={[
        styles.scrollContent,
        {
          padding: semantic.space.lg,
          paddingTop: semantic.space.lg + topInset,
          paddingBottom: semantic.space.lg + bottomInset,
          gap: semantic.space.lg,
        },
      ]}
      showsVerticalScrollIndicator={false}
      testID="chat-transcript-scroll"
    >
      {messages.map((message, index) => {
        const previous = index > 0 ? messages[index - 1] : undefined;
        const showTimestamp = shouldShowTimestamp(message, previous);

        return (
          <React.Fragment key={message.id}>
            {showTimestamp && (
              <TimestampDivider message={message} previous={previous} />
            )}
            {message.role === 'rider' ? (
              <RiderBubble message={message} />
            ) : (
              renderAssistantMessage(message, onRoutePress, onViewOnMap, transparent)
            )}
          </React.Fragment>
        );
      })}
    </ScrollView>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  // Timestamp divider
  timestampDivider: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  timestampText: {
    textAlign: 'center',
  },
  // Rider bubble (right-aligned)
  riderRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  riderBubble: {
    maxWidth: '80%',
  },
  bubbleText: {
    flexShrink: 1,
  },
  // Agent message (left-aligned, no bubble)
  agentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    maxWidth: '90%',
  },
  agentAvatar: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  agentContent: {
    flex: 1,
  },
  agentTextRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
  },
  agentText: {
    flexShrink: 1,
  },
  typingSlot: {
    paddingBottom: 6,
  },
  attachments: {
    gap: 10,
  },
  // Empty state
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    textAlign: 'center',
    lineHeight: 22,
  },
});
