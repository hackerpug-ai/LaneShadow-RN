import type React from 'react'
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { IconSymbol } from './icon-symbol'
import { SessionCard } from './session-card'

const SCREEN_WIDTH = Dimensions.get('window').width
const SIDEBAR_WIDTH = SCREEN_WIDTH * 0.8

export interface ChatSession {
  id: string
  title: string
  date: Date
  routeCount: number
  status: 'active' | 'completed' | 'saved'
  previewMessage: string
}

interface SessionSidebarProps {
  visible: boolean
  sessions: ChatSession[]
  onClose: () => void
  onSessionPress: (sessionId: string) => void
  onNewSession: () => void
  activeSessionId?: string
}

export const SessionSidebar: React.FC<SessionSidebarProps> = ({
  visible,
  sessions,
  onClose,
  onSessionPress,
  onNewSession,
  activeSessionId,
}) => {
  const { semantic } = useSemanticTheme()

  if (!visible) return null

  const groupedSessions = {
    today: sessions.filter((s) => new Date(s.date).toDateString() === new Date().toDateString()),
    yesterday: sessions.filter(
      (s) => new Date(s.date).toDateString() === new Date(Date.now() - 86400000).toDateString(),
    ),
    older: sessions.filter(
      (s) =>
        new Date(s.date).toDateString() !== new Date().toDateString() &&
        new Date(s.date).toDateString() !== new Date(Date.now() - 86400000).toDateString(),
    ),
  }

  const _formatDate = (date: Date) => {
    const now = new Date()
    const sessionDate = new Date(date)
    const diffMs = now.getTime() - sessionDate.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return sessionDate.toLocaleDateString()
  }

  const renderSessionCard = (session: ChatSession) => (
    <SessionCard
      key={session.id}
      {...session}
      isActive={session.id === activeSessionId}
      onPress={() => onSessionPress(session.id)}
      compact={false}
    />
  )

  const renderGroup = (title: string, sessions: ChatSession[]) => {
    if (sessions.length === 0) return null
    return (
      <View key={title} style={styles.group}>
        <Text style={[styles.groupTitle, { color: semantic.color.onSurface.subtle }]}>{title}</Text>
        <View style={styles.groupSessions}>{sessions.map(renderSessionCard)}</View>
      </View>
    )
  }

  return (
    <View style={styles.overlay}>
      <View style={[styles.sidebar, { backgroundColor: semantic.color.background.default }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: semantic.color.border.default }]}>
          <Text style={[styles.headerTitle, { color: semantic.color.onSurface.default }]}>
            Sessions
          </Text>
          <Pressable
            style={styles.newSessionButton}
            onPress={onNewSession}
            accessibilityLabel="New session"
            accessibilityRole="button"
          >
            {({ pressed }) => (
              <View
                style={[
                  styles.pressableButton,
                  {
                    backgroundColor: pressed
                      ? `${semantic.color.primary.pressed}20`
                      : 'transparent',
                  },
                ]}
              >
                <IconSymbol
                  name="plus-circle-outline"
                  size={26}
                  color={semantic.color.primary.default}
                />
                <Text style={[styles.newSessionText, { color: semantic.color.primary.default }]}>
                  New
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Sessions list */}
        <ScrollView style={styles.sessionsList} contentContainerStyle={styles.sessionsListContent}>
          {renderGroup('Today', groupedSessions.today)}
          {renderGroup('Yesterday', groupedSessions.yesterday)}
          {renderGroup('Older', groupedSessions.older)}

          {sessions.length === 0 && (
            <View style={styles.emptyState}>
              <IconSymbol
                name="message-outline"
                size={48}
                color={semantic.color.onSurface.subtle ?? 'transparent'}
              />
              <Text style={[styles.emptyStateText, { color: semantic.color.onSurface.subtle }]}>
                No sessions yet. Start a new conversation!
              </Text>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Backdrop */}
      <Pressable style={styles.backdrop} onPress={onClose}>
        {({ pressed }) => (
          <View
            style={[
              styles.backdropInner,
              { backgroundColor: pressed ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.5)' },
            ]}
          />
        )}
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    zIndex: 1000,
  },
  sidebar: {
    width: SIDEBAR_WIDTH,
    height: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
  },
  newSessionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pressableButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  newSessionText: {
    fontSize: 16,
    fontWeight: '700',
  },
  sessionsList: {
    flex: 1,
  },
  sessionsListContent: {
    padding: 16,
  },
  group: {
    marginBottom: 24,
  },
  groupTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 12,
    letterSpacing: 0.8,
  },
  groupSessions: {
    gap: 12,
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 12,
  },
  emptyStateText: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
  },
  backdrop: {
    flex: 1,
  },
  backdropInner: {
    flex: 1,
  },
})
