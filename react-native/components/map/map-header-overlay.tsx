/**
 * MapHeaderOverlay Component
 * Transparent glass-morphic header overlay for map screens
 *
 * Following theme_rules.mdc: StyleSheet.create() + semantic tokens
 * Following react_rules.mdc: Named exports, functional components
 */

import type { ReactNode } from 'react'
import { type ColorValue, type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native'
import { Text } from 'react-native-paper'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { Button } from '../ui/button'
import { type IconName, IconSymbol } from '../ui/icon-symbol'

type Action = {
  icon: IconName
  onPress: () => void
  testID?: string
  accessibilityLabel?: string
  /** Optional custom icon renderer — overrides the `icon` glyph when provided. */
  renderIcon?: () => ReactNode
}

export type MapHeaderOverlayProps = {
  title: string // Center title (optional)
  leftAction?: Action // Left content (button or custom)
  rightAction?: Action // Right content (button or custom)
  showBackground?: boolean // Toggle background visibility
  style?: StyleProp<ViewStyle> // Parent-controlled positioning/padding
  testID?: string
}

export const MapHeaderOverlay = ({
  title,
  leftAction,
  rightAction,
  showBackground = true,
  style,
  testID,
}: MapHeaderOverlayProps) => {
  const { semantic } = useSemanticTheme()
  const insets = useSafeAreaInsets()

  const withAlpha = (color: string, alpha: number) => {
    const alphaHex = Math.round(alpha * 255)
      .toString(16)
      .padStart(2, '0')
    return `${color}${alphaHex}`
  }

  const gradientColors: [ColorValue, ColorValue, ColorValue] = showBackground
    ? [
        withAlpha(semantic.color.surface.default, 0.95),
        withAlpha(semantic.color.surface.default, 0.5),
        'transparent',
      ]
    : ['transparent', 'transparent', 'transparent']

  const iconButtonSize = semantic.space['3xl']

  // Render left action
  const renderLeftAction = () => {
    if (leftAction) {
      return (
        <Button
          icon={
            leftAction.renderIcon ? (
              leftAction.renderIcon()
            ) : (
              <IconSymbol
                name={leftAction.icon as any}
                size={24}
                color={semantic.color.onSurface.default}
              />
            )
          }
          size="icon"
          variant="glass"
          onPress={leftAction.onPress}
          accessibilityLabel={leftAction.accessibilityLabel}
          testID={leftAction.testID ? `${leftAction.testID}-left-button` : 'map-header-left-button'}
        />
      )
    }

    return <View style={[styles.placeholder, { width: iconButtonSize, height: iconButtonSize }]} />
  }

  // Render right action
  const renderRightAction = () => {
    if (rightAction) {
      return (
        <Button
          icon={
            rightAction.renderIcon ? (
              rightAction.renderIcon()
            ) : (
              <IconSymbol
                name={rightAction.icon as any}
                size={24}
                color={semantic.color.onSurface.default}
              />
            )
          }
          size="icon"
          variant="glass"
          onPress={rightAction.onPress}
          accessibilityLabel={rightAction.accessibilityLabel}
          testID={
            rightAction.testID ? `${rightAction.testID}-right-button` : 'map-header-right-button'
          }
        ></Button>
      )
    }

    return <View style={[styles.placeholder, { width: iconButtonSize, height: iconButtonSize }]} />
  }

  const GradientContainer = (props: any) => <View style={[props.style, { backgroundColor: semantic.color.surface.default }]}>{props.children}</View>

  return (
    <GradientContainer
      style={[
        styles.gradient,
        {
          paddingTop: insets.top,
          paddingBottom: semantic.space.xl,
        },
        style,
      ]}
      testID={testID || 'map-header-overlay'}
    >
      <View
        style={[
          styles.content,
          {
            paddingHorizontal: semantic.space.lg,
            paddingBottom: semantic.space['2xl'],
          },
        ]}
      >
        {/* Left Content */}
        <View style={[styles.leftSection, { minWidth: iconButtonSize }]}>{renderLeftAction()}</View>

        {/* Center Title */}
        <Text
          variant="headlineMedium"
          style={{ color: semantic.color.onSurface.default, fontWeight: 'bold' }}
          testID={testID ? `${testID}-title` : 'map-header-title'}
        >
          {title}
        </Text>

        {/* Right Content */}
        <View style={[styles.rightSection, { minWidth: iconButtonSize }]}>
          {renderRightAction()}
        </View>
      </View>
    </GradientContainer>
  )
}

const styles = StyleSheet.create({
  gradient: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftSection: {
    justifyContent: 'center',
  },
  rightSection: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  placeholder: {},
})

MapHeaderOverlay.displayName = 'MapHeaderOverlay'
