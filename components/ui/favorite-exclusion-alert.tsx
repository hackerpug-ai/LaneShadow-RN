/**
 * FavoriteExclusionAlert Component
 *
 * Displays an info message when favorite roads are excluded from route planning
 * due to distance constraints (> 50km from route).
 *
 * Features:
 * - Lists names of excluded favorites (up to 3, then "and N more")
 * - Auto-dismisses after 10 seconds
 * - Dismissible via tap
 * - Session-aware (doesn't show same exclusion twice)
 * - Full accessibility support
 *
 * Following theme_rules.mdc: StyleSheet.create() + semantic tokens
 */

import { useEffect, useRef, useState } from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import { Text, useTheme } from 'react-native-paper'
import { IconSymbol } from './icon-symbol'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'

export type ExcludedFavorite = {
  id: string
  name?: string
  reason: string
}

export type FavoriteExclusionAlertProps = {
  /** Array of excluded favorites with names and reasons */
  excludedFavorites?: ExcludedFavorite[]
  /** Whether include favorites toggle is ON */
  includeFavorites?: boolean
  /** Callback when alert is dismissed */
  onDismiss: () => void
  /** Optional session key for tracking shown exclusions */
  sessionKey?: string
}

const AUTO_DISMISS_MS = 10000 // 10 seconds
const MAX_VISIBLE_NAMES = 3

/**
 * Format excluded favorites list for display
 * Shows first 3 names, then "and N more" if applicable
 */
const formatExcludedList = (favorites: ExcludedFavorite[]): string => {
  const namedFavorites = favorites.filter((f) => f.name)
  const names = namedFavorites.map((f) => f.name!)

  if (names.length === 0) {
    return 'some favorites'
  }

  if (names.length <= MAX_VISIBLE_NAMES) {
    return names.join(', ')
  }

  const visible = names.slice(0, MAX_VISIBLE_NAMES)
  const remaining = names.length - MAX_VISIBLE_NAMES
  return `${visible.join(', ')} and ${remaining} more`
}

/**
 * Generate accessibility label with full message content
 */
const getAccessibilityLabel = (favorites: ExcludedFavorite[]): string => {
  const namedFavorites = favorites.filter((f) => f.name)
  const names = namedFavorites.map((f) => f.name!)

  const baseMessage = 'Some favorites couldn\'t be included'
  const reasonMessage = 'These favorites are too far from your route'

  if (names.length === 0) {
    return `${baseMessage}. ${reasonMessage}.`
  }

  if (names.length <= MAX_VISIBLE_NAMES) {
    return `${baseMessage}. ${reasonMessage}: ${names.join(', ')}.`
  }

  const visible = names.slice(0, MAX_VISIBLE_NAMES)
  const remaining = names.length - MAX_VISIBLE_NAMES
  return `${baseMessage}. ${reasonMessage}: ${visible.join(', ')} and ${remaining} more.`
}

/**
 * FavoriteExclusionAlert component
 */
export const FavoriteExclusionAlert = ({
  excludedFavorites = [],
  includeFavorites = true,
  onDismiss,
  sessionKey,
}: FavoriteExclusionAlertProps) => {
  const { semantic } = useSemanticTheme()
  const theme = useTheme()
  const [isVisible, setIsVisible] = useState(false)

  // Track session keys we've already shown
  const shownSessionsRef = useRef<Set<string>>(new Set())

  // Setup auto-dismiss timer
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // Don't show if toggle is off or no exclusions
    if (!includeFavorites || excludedFavorites.length === 0) {
      setIsVisible(false)
      return
    }

    // Check session awareness
    if (sessionKey && shownSessionsRef.current.has(sessionKey)) {
      setIsVisible(false)
      return
    }

    // Show the alert
    setIsVisible(true)

    // Track this session
    if (sessionKey) {
      shownSessionsRef.current.add(sessionKey)
    }

    // Setup auto-dismiss
    timerRef.current = setTimeout(() => {
      setIsVisible(false)
      onDismiss()
    }, AUTO_DISMISS_MS)

    // Cleanup timer on unmount
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [excludedFavorites, includeFavorites, sessionKey])

  const handleDismiss = () => {
    // Clear the auto-dismiss timer if it's running
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setIsVisible(false)
    onDismiss()
  }

  // Don't render if not visible
  if (!isVisible) {
    return null
  }

  const excludedList = formatExcludedList(excludedFavorites)
  const accessibilityLabel = getAccessibilityLabel(excludedFavorites)

  return (
    <TouchableOpacity
      testID="favorite-exclusion-alert"
      onPress={handleDismiss}
      activeOpacity={1}
      accessible={true}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="alert"
      style={[
        styles.container,
        {
          backgroundColor: semantic.color.warningContainer.default,
          borderColor: semantic.color.warning.default,
          marginHorizontal: semantic.space.md,
          marginTop: semantic.space.sm,
          marginBottom: semantic.space.md,
          padding: semantic.space.md,
          borderRadius: semantic.radius.md,
          borderWidth: 1,
        },
      ]}
    >
      <View style={styles.contentRow}>
        <View style={styles.iconContainer}>
          <IconSymbol
            name="information"
            size={20}
            color={semantic.color.onWarningContainer.default}
          />
        </View>

        <View style={[styles.textContainer, { gap: semantic.space.xs }]}>
          <Text
            variant="titleSmall"
            style={{
              color: semantic.color.onWarningContainer.default,
              fontWeight: '600',
            }}
          >
            Some favorites couldn&apos;t be included
          </Text>

          <Text
            variant="bodyMedium"
            style={{ color: semantic.color.onWarningContainer.default }}
          >
            These favorites are too far from your route: {excludedList}
          </Text>
        </View>

        <TouchableOpacity
          testID="favorite-exclusion-alert-dismiss"
          onPress={handleDismiss}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.dismissButton}
          accessibilityLabel="Dismiss"
          accessibilityRole="button"
        >
          <IconSymbol
            name="close"
            size={20}
            color={semantic.color.onWarningContainer.default}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    // Static styles handled in component with semantic tokens
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  dismissButton: {
    marginLeft: 8,
    marginTop: 2,
  },
})
