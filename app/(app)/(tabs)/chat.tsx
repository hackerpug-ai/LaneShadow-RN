/**
 * Chat History Screen
 *
 * Full-screen chat history for a planning session.
 * Accepts an optional `sessionId` route param (for task #218 deep-linking).
 * Falls back to the most-recent session when no param is provided.
 *
 * Following components/CLAUDE.md: non-map screens use SubpageLayout.
 * Following react_rules.mdc: default export for Expo Router page files.
 */

import { useQuery } from 'convex/react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { SubpageLayout } from '../../../components/layouts/subpage-layout'
import { FullChatHistoryView } from '../../../components/ui/full-chat-history-view'
import type { ChatMessage } from '../../../components/ui/full-chat-history-view'
import { useSemanticTheme } from '../../../hooks/use-semantic-theme'

export default function ChatScreen() {
  const router = useRouter()
  const { semantic } = useSemanticTheme()
  const { sessionId: sessionIdParam } = useLocalSearchParams<{ sessionId?: string }>()

  // Fetch all sessions to find the target session
  const sessions = useQuery(api.db.planningSessions.listSessions)

  // Resolve which session to display
  const resolvedSessionId: Id<'planning_sessions'> | null = (() => {
    if (sessionIdParam) {
      return sessionIdParam as Id<'planning_sessions'>
    }
    if (sessions && sessions.length > 0) {
      return sessions[0]._id
    }
    return null
  })()

  // Fetch messages for the resolved session (skip when no session)
  const rawMessages = useQuery(
    api.db.sessionMessages.list,
    resolvedSessionId ? { sessionId: resolvedSessionId } : 'skip'
  )

  // Map session_messages (role: 'rider' | 'system') to ChatMessage (role: 'rider' | 'agent')
  const messages: ChatMessage[] =
    rawMessages?.map((msg) => ({
      id: msg._id,
      role: msg.role === 'system' ? 'agent' : 'rider',
      content: msg.content,
      timestamp: new Date(msg.createdAt),
    })) ?? []

  const handleCollapse = () => {
    router.push('/(app)/(tabs)')
  }

  // Loading state while queries are in flight
  const isLoading = sessions === undefined

  // Empty state — no sessions exist at all
  const hasNoSessions = sessions !== undefined && sessions.length === 0

  return (
    <SubpageLayout title="Chat History" testID="chat-screen">
      {isLoading ? (
        <View style={styles.centeredState}>
          <Text
            variant="bodyMedium"
            style={{ color: semantic.color.onSurface.muted }}
          >
            Loading…
          </Text>
        </View>
      ) : hasNoSessions ? (
        <View style={styles.centeredState}>
          <Text
            variant="bodyMedium"
            style={[styles.emptyText, { color: semantic.color.onSurface.muted }]}
            testID="chat-screen-empty-state"
          >
            No chat sessions yet. Start a ride from the home screen.
          </Text>
        </View>
      ) : (
        <FullChatHistoryView
          visible
          messages={messages}
          onCollapse={handleCollapse}
        />
      )}
    </SubpageLayout>
  )
}

const styles = StyleSheet.create({
  centeredState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    textAlign: 'center',
    lineHeight: 24,
  },
})
