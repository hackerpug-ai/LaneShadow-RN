/**
 * SubpageLayout
 *
 * Reusable layout for non-map screens (settings, profile, etc.)
 * Provides safe-area handling, a back button, title, and scrollable content.
 *
 * Design: two-tier header — a compact nav row with a glass back button,
 * then a large left-aligned title below it. Content area is a flex container.
 * Matches the copper-industrial visual language of the map overlay.
 */

import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { type ColorValue, Pressable, StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { type IconName, IconSymbol } from '../ui/icon-symbol'

export type SubpageLayoutProps = {
  title: string
  /** Where the back button navigates. Defaults to '/(app)/(tabs)' */
  backTo?: string
  /**
   * Optional right-side action(s). When more than one is provided the actions
   * render in a horizontal row on the right side of the nav row. Singular
   * `rightAction` is kept for backward compatibility (renders the same as
   * `rightActions: [rightAction]`).
   */
  rightAction?: {
    icon: IconName
    onPress: () => void
    testID?: string
    accessibilityLabel?: string
  }
  rightActions?: Array<{
    icon: IconName
    onPress: () => void
    testID?: string
    accessibilityLabel?: string
  }>
  /**
   * Header size:
   *  - 'standard' (default): two-tier header (compact nav row + large left-aligned
   *    title with copper accent rule). For settings, profile, etc.
   *  - 'compact': single-row finite header (44pt nav + titleLarge inline). For
   *    detail views (route detail, etc.) — same total height as the standard nav
   *    row, no gradient, no rule.
   */
  size?: 'standard' | 'compact'
  children: React.ReactNode
  testID?: string
}

export const SubpageLayout = ({
  title,
  backTo = '/(app)/(tabs)',
  rightAction,
  rightActions,
  size = 'standard',
  children,
  testID,
}: SubpageLayoutProps) => {
  const router = useRouter()
  const { semantic } = useSemanticTheme()
  const insets = useSafeAreaInsets()

  const withAlpha = (color: string, alpha: number) => {
    const alphaHex = Math.round(alpha * 255)
      .toString(16)
      .padStart(2, '0')
    return `${color}${alphaHex}`
  }

  // Gradient starts at full surface color (covering the notch zone)
  // and fades into the background — no seam between status bar and header
  // COMPACT mode: skip the gradient entirely — the header is a solid, finite
  // bar (no overlay extending into the status bar zone).
  const gradientColors: [ColorValue, ColorValue] = [
    semantic.color.surface.default,
    withAlpha(semantic.color.surface.default, 0),
  ]

  const headerHeight = size === 'compact' ? 44 : 52

  const renderRightActions = () => {
    const actions =
      rightActions ?? (rightAction ? [rightAction] : [])
    if (actions.length === 0) {
      return <View style={styles.placeholder} />
    }
    return (
      <View style={[styles.rightActions, { gap: semantic.space.xs }]}>
        {actions.map((a) => (
          <Pressable
            key={a.testID ?? a.icon}
            onPress={a.onPress}
            testID={a.testID}
            accessibilityLabel={a.accessibilityLabel}
            style={({ pressed }) => [
              styles.backButton,
              {
                backgroundColor: pressed
                  ? (semantic.color.surfaceVariant.pressed ??
                    semantic.color.surfaceVariant.default)
                  : semantic.color.surfaceVariant.default,
                borderRadius: semantic.radius.full,
                borderWidth: 1,
                borderColor: semantic.color.border.default,
              },
            ]}
          >
            <IconSymbol name={a.icon} size={20} color={semantic.color.onSurface.default} />
          </Pressable>
        ))}
      </View>
    )
  }

  const renderHeader = () => {
    if (size === 'compact') {
      return (
        <View
          style={[
            styles.headerSolid,
            {
              backgroundColor: semantic.color.surface.default,
              paddingTop: insets.top,
            },
          ]}
        >
          {renderNavRow()}
        </View>
      )
    }

    return (
      <LinearGradient
        colors={gradientColors}
        style={[styles.headerGradient, { paddingTop: insets.top }]}
      >
        {renderNavRow()}
        {renderTitleRow()}
      </LinearGradient>
    )
  }

  const renderNavRow = () => (
    <View
      style={[
        styles.navRow,
        {
          paddingHorizontal: semantic.space.lg,
          height: headerHeight,
        },
      ]}
    >
      <Pressable
        onPress={() => router.push(backTo as any)}
        testID={testID ? `${testID}-back` : 'subpage-back'}
        style={({ pressed }) => [
          styles.backButton,
          {
            backgroundColor: pressed
              ? (semantic.color.surfaceVariant.pressed ?? semantic.color.surfaceVariant.default)
              : semantic.color.surfaceVariant.default,
            borderRadius: semantic.radius.full,
            borderWidth: 1,
            borderColor: semantic.color.border.default,
          },
        ]}
      >
        <IconSymbol name="arrow-left" size={20} color={semantic.color.onSurface.default} />
      </Pressable>

      {size === 'compact' ? (
        <Text
          variant="titleLarge"
          numberOfLines={1}
          style={{
            color: semantic.color.onSurface.default,
            fontWeight: '600',
            flex: 1,
            marginLeft: semantic.space.sm,
          }}
          testID={testID ? `${testID}-title` : 'subpage-title'}
        >
          {title}
        </Text>
      ) : null}

      {renderRightActions()}
    </View>
  )

  const renderTitleRow = () => (
    <View
      style={[
        styles.titleRow,
        {
          paddingHorizontal: semantic.space.lg,
          paddingBottom: semantic.space.lg,
        },
      ]}
    >
      <Text
        variant="headlineMedium"
        style={{
          color: semantic.color.onSurface.default,
          fontWeight: '700',
        }}
        testID={testID ? `${testID}-title` : 'subpage-title'}
      >
        {title}
      </Text>

      {/* Copper accent rule — a thin line that echoes the brand */}
      <View
        style={[
          styles.accentRule,
          {
            backgroundColor: semantic.color.primary.default,
            marginTop: semantic.space.sm,
          },
        ]}
      />
    </View>
  )

  return (
    <View
      style={[styles.safe, { backgroundColor: semantic.color.background.default }]}
      testID={testID}
    >
      {/* Header zone — gradient extends up through the notch area (standard)
          or a solid finite bar (compact). */}
      {renderHeader()}

      {/* Content */}
      <View style={[styles.content, { paddingBottom: insets.bottom }]}>{children}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  headerGradient: {},
  headerSolid: {},
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    width: 36,
    height: 36,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleRow: {},
  accentRule: {
    width: 32,
    height: 3,
    borderRadius: 1.5,
  },
  content: {
    flex: 1,
  },
})
