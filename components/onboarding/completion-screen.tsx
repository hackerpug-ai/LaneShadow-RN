/**
 * Completion Screen
 * Shown when model download completes successfully
 *
 * Features:
 * - "Your Shadow is Ready" confirmation
 * - "Start Riding" button to enter main app
 * - Permanently dismisses setup wizard
 */

import type React from 'react'
import { StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { LaneShadowLogo } from '../auth/lane-shadow-logo'
import { Button } from '../ui/button'

export interface CompletionScreenProps {
  onStartRiding: () => void
  testID?: string
}

export const CompletionScreen: React.FC<CompletionScreenProps> = ({
  onStartRiding,
  testID = 'completion-screen',
}) => {
  const { semantic } = useSemanticTheme()

  return (
    <View
      style={[styles.container, { backgroundColor: semantic.color.background.default }]}
      testID={testID}
    >
      {/* Success Logo */}
      <View
        style={[
          styles.logoContainer,
          {
            backgroundColor: semantic.color.success.default,
            borderRadius: semantic.radius.xl,
            ...semantic.elevation[3],
          },
        ]}
      >
        <LaneShadowLogo size={64} />
      </View>

      {/* Success Text */}
      <View style={[styles.textContainer, { gap: semantic.space.md }]}>
        <Text
          variant="headlineLarge"
          style={[
            semantic.type.display.md,
            { color: semantic.color.onSurface.default, textAlign: 'center' },
          ]}
        >
          Your Shadow is Ready
        </Text>

        <Text
          variant="bodyLarge"
          style={[
            semantic.type.body.md,
            { color: semantic.color.onSurface.muted, textAlign: 'center' },
          ]}
        >
          Your AI ride planner is now installed and ready to help you discover amazing routes.
        </Text>
      </View>

      {/* Start Riding Button */}
      <View style={[styles.buttonContainer]}>
        <Button
          variant="default"
          size="2xl"
          onPress={onStartRiding}
          testID={`${testID}-start-button`}
          style={{ width: '100%' }}
        >
          Start Riding
        </Button>
      </View>

      {/* Info Text */}
      <View style={[styles.infoContainer, { gap: semantic.space.sm }]}>
        <Text
          variant="bodySmall"
          style={[
            semantic.type.body.sm,
            { color: semantic.color.onSurface.subtle, textAlign: 'center' },
          ]}
        >
          Tap &quot;Start Riding&quot; to begin your journey
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 48,
  },
  textContainer: {
    marginBottom: 48,
    paddingHorizontal: 16,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 400,
    marginBottom: 24,
  },
  infoContainer: {
    paddingHorizontal: 16,
  },
})
