import type React from 'react'
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { IconSymbol } from './icon-symbol'

export interface SessionCardProps {
  id: string
  title: string
  date: Date
  routeCount: number
  status: 'active' | 'completed' | 'saved'
  previewMessage: string
  isActive?: boolean
  onPress?: () => void
  onLongPress?: () => void
  style?: ViewStyle
  compact?: boolean
}

export const SessionCard: React.FC<SessionCardProps> = ({
  id,
  title,
  date,
  routeCount,
  status,
  previewMessage,
  isActive = false,
  onPress,
  onLongPress,
  style,
  compact = false,
}) => {
  const { semantic } = useSemanticTheme()

  const formatDate = (date: Date) => {
    const now = new Date()
    const sessionDate = new Date(date)
    const diffMs = now.getTime() - sessionDate.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return sessionDate.toLocaleDateString()
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'active':
        return 'radiobox-marked'
      case 'completed':
        return 'check-circle'
      case 'saved':
        return 'bookmark'
      default:
        return 'circle-outline'
    }
  }

  const Container = onPress || onLongPress ? Pressable : View
  const renderContent = (pressed: boolean): React.ReactNode => (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isActive
            ? semantic.color.primary.default + '15'
            : semantic.color.surfaceVariant.default,
          borderColor: isActive ? semantic.color.primary.default : semantic.color.border.default,
          opacity: pressed && !isActive ? 0.8 : 1,
          ...(!isActive && pressed ? semantic.elevation[3] : semantic.elevation[1]),
        },
        compact && styles.compactCard,
        style,
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text
            style={[styles.title, { color: semantic.color.onSurface.default }]}
            numberOfLines={1}
          >
            {title}
          </Text>
          <IconSymbol
            name={getStatusIcon()}
            size={18}
            color={
              status === 'active'
                ? (semantic.color.primary.default ?? 'transparent')
                : status === 'completed'
                  ? (semantic.color.success.default ?? 'transparent')
                  : (semantic.color.onSurface.subtle ?? 'transparent')
            }
          />
        </View>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                status === 'active'
                  ? semantic.color.primary.default + '25'
                  : status === 'completed'
                    ? semantic.color.success.default + '25'
                    : semantic.color.surfaceVariant.pressed,
            },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              {
                color:
                  status === 'active'
                    ? semantic.color.primary.default
                    : status === 'completed'
                      ? semantic.color.success.default
                      : semantic.color.onSurface.subtle,
              },
            ]}
          >
            {status}
          </Text>
        </View>
      </View>

      {/* Meta info */}
      {!compact && (
        <View style={styles.meta}>
          <Text style={[styles.metaText, { color: semantic.color.onSurface.subtle }]}>
            {routeCount} route{routeCount !== 1 ? 's' : ''} • {formatDate(date)}
          </Text>
        </View>
      )}

      {/* Preview */}
      <Text
        style={[styles.preview, { color: semantic.color.onSurface.muted }]}
        numberOfLines={compact ? 1 : 2}
      >
        {previewMessage}
      </Text>
    </View>
  )

  const content = renderContent(false)

  return onPress || onLongPress ? (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={500}
      accessibilityLabel={`Session: ${title}`}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: isActive
            ? semantic.color.primary.default + '15'
            : semantic.color.surfaceVariant.default,
          borderColor: isActive ? semantic.color.primary.default : semantic.color.border.default,
          opacity: pressed && !isActive ? 0.8 : 1,
          ...(!isActive && pressed ? semantic.elevation[3] : semantic.elevation[1]),
        },
        compact && styles.compactCard,
        style,
      ]}
    >
      {content}
    </Pressable>
  ) : (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isActive
            ? semantic.color.primary.default + '15'
            : semantic.color.surfaceVariant.default,
          borderColor: isActive ? semantic.color.primary.default : semantic.color.border.default,
        },
        compact && styles.compactCard,
        style,
      ]}
    >
      {content}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    gap: 10,
  },
  compactCard: {
    padding: 10,
    gap: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  meta: {
    marginBottom: 2,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '500',
  },
  preview: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
})
