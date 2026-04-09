/**
 * Welcome Screen
 * First screen of the setup wizard - welcomes users to LaneShadow
 *
 * Features:
 * - Copper-accented branding
 * - "Download Your Shadow" CTA button
 * - No skip/bypass options (per AC-001)
 */

import React from 'react'
import { StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { Button } from '../ui/button'
import { LaneShadowLogo } from '../auth/lane-shadow-logo'

export interface WelcomeScreenProps {
  onDownloadPress: () => void
  testID?: string
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onDownloadPress,
  testID = 'welcome-screen',
}) => {
  const { semantic } = useSemanticTheme()

  return (
    <View
      style={[styles.container, { backgroundColor: semantic.color.background.default }]}
      testID={testID}
    >
      {/* Brand Logo */}
      <View
        style={[
          styles.logoContainer,
          {
            backgroundColor: semantic.color.primary.default,
            borderRadius: semantic.radius.xl,
            ...semantic.elevation[3],
          },
        ]}
      >
        <LaneShadowLogo size={64} />
      </View>

      {/* Welcome Text */}
      <View style={[styles.textContainer, { gap: semantic.space.md }]}>
        <Text
          variant="headlineLarge"
          style={[
            semantic.type.display.md,
            { color: semantic.color.onSurface.default, textAlign: 'center' },
          ]}
        >
          Welcome to LaneShadow
        </Text>

        <Text
          variant="bodyLarge"
          style={[
            semantic.type.body.md,
            { color: semantic.color.onSurface.muted, textAlign: 'center' },
          ]}
        >
          Your AI-native motorcycle ride planner. Download your Shadow to get started.
        </Text>
      </View>

      {/* Download CTA Button */}
      <View style={[styles.buttonContainer]}>
        <Button
          variant="default"
          size="2xl"
          onPress={onDownloadPress}
          testID={`${testID}-download-button`}
          style={{ width: '100%' }}
        >
          Download Your Shadow
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
          WiFi connection required (~800MB download)
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
