/**
 * MapPlanningIndicator
 *
 * Lightweight pill shown on the map while the agent is planning a route.
 * Replaces the full ChatTranscript overlay for a less jarring map-mode UX.
 *
 * Visual: glass-morphic pill with "Planning route..." text and typing dots.
 * Positioned above ChatInput, centered horizontally.
 */

import React from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import { Text } from 'react-native-paper'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { TypingIndicator } from '../chat/typing-indicator'

type MapPlanningIndicatorProps = {
  visible: boolean
  /** Distance from the screen bottom to clear the ChatInput. */
  bottomOffset?: number
  testID?: string
}

export const MapPlanningIndicator = ({
  visible,
  bottomOffset,
  testID = 'map-planning-indicator',
}: MapPlanningIndicatorProps) => {
  const { semantic } = useSemanticTheme()

  if (!visible) return null

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      testID={testID}
      style={[styles.wrapper, bottomOffset !== undefined && { bottom: bottomOffset }]}
    >
      <View
        style={[
          styles.pill,
          {
            backgroundColor: semantic.color.surface.default,
            borderColor: semantic.color.border.default,
          },
        ]}
      >
        <Text
          variant="bodySmall"
          style={{ color: semantic.color.onSurface.muted }}
        >
          Planning route
        </Text>
        <TypingIndicator size="sm" />
      </View>
    </Animated.View>
  )
}

MapPlanningIndicator.displayName = 'MapPlanningIndicator'

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    // Glass-morphic shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
})
