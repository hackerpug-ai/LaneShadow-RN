/**
 * WiFi Required Sheet
 * Bottom sheet alert shown when user tries to download without WiFi
 *
 * Features:
 * - Copper accent styling
 * - Clear explanation of WiFi requirement
 * - Dismiss action
 */

import type React from 'react'
import { StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { BottomSheetWrapper } from '../sheets/bottom-sheet-wrapper'
import { Button } from '../ui/button'

export interface WiFiRequiredSheetProps {
  isVisible: boolean
  onClose: () => void
  testID?: string
}

export const WiFiRequiredSheet: React.FC<WiFiRequiredSheetProps> = ({
  isVisible,
  onClose,
  testID = 'wifi-required-sheet',
}) => {
  const { semantic } = useSemanticTheme()

  return (
    <BottomSheetWrapper isVisible={isVisible} onClose={onClose} testID={testID} preset="content">
      <View style={[styles.content, { gap: semantic.space.lg }]}>
        {/* Icon */}
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: semantic.color.warning.default,
              borderRadius: semantic.radius.full,
            },
          ]}
        >
          <Text
            variant="headlineLarge"
            style={[
              styles.icon,
              {
                color: semantic.color.onPrimary.default,
              },
            ]}
          >
            WiFi
          </Text>
        </View>

        {/* Title */}
        <Text
          variant="titleLarge"
          style={[
            semantic.type.title.lg,
            { color: semantic.color.onSurface.default, textAlign: 'center' },
          ]}
        >
          WiFi Required
        </Text>

        {/* Message */}
        <Text
          variant="bodyMedium"
          style={[
            semantic.type.body.md,
            { color: semantic.color.onSurface.muted, textAlign: 'center' },
          ]}
        >
          Connect to WiFi to download your Shadow. Cellular downloads are not supported.
        </Text>

        {/* Dismiss Button */}
        <Button
          variant="default"
          size="lg"
          onPress={onClose}
          testID={`${testID}-dismiss-button`}
          style={{ width: '100%' }}
        >
          Got it
        </Button>
      </View>
    </BottomSheetWrapper>
  )
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    padding: 24,
  },
  iconContainer: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 24,
    fontWeight: '700',
  },
})
