/**
 * Setup Required Screen
 *
 * Shown when the model file is corrupted or needs to be restored.
 * Part of the gatekeeper system (CLR-003) that prevents app usage
 * until the local AI model is validated.
 *
 * AC-003: Corrupted Model Recovery Flow
 * - Displays copper-accented "Setup Required" screen
 * - Explains "Your Shadow needs to be restored. Please download again."
 * - Provides "Restore Your Shadow" button
 * - Deletes corrupted model file before re-downloading
 */

import React from 'react'
import { StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { Button } from '../ui/button'

export interface SetupRequiredScreenProps {
  onRestorePress: () => void
  testID?: string
}

/**
 * Setup Required Screen Component
 *
 * Shows when model file is corrupted or needs to be restored.
 * Follows copper-accented dark theme per requirements.
 */
export const SetupRequiredScreen: React.FC<SetupRequiredScreenProps> = ({
  onRestorePress,
  testID = 'setup-required-screen',
}) => {
  const { semantic } = useSemanticTheme()

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: semantic.color.background.default },
      ]}
      testID={testID}
    >
      <View style={styles.content}>
        {/* Warning Icon */}
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: semantic.color.warning.default + '20' },
          ]}
        >
          <Text style={[styles.icon, { color: semantic.color.warning.default }]}>
            ⚠️
          </Text>
        </View>

        {/* Title */}
        <Text
          style={[
            styles.title,
            { color: semantic.color.onSurface.default },
          ]}
          variant="headlineMedium"
        >
          Setup Required
        </Text>

        {/* Description */}
        <Text
          style={[
            styles.description,
            { color: semantic.color.onSurface.muted },
          ]}
          variant="bodyLarge"
        >
          Your Shadow needs to be restored. Please download again.
        </Text>

        {/* Restore Button */}
        <View style={styles.buttonContainer}>
          <Button
            onPress={onRestorePress}
            testID={`${testID}-restore-button`}
            style={styles.button}
          >
            Restore Your Shadow
          </Button>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  icon: {
    fontSize: 40,
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '700',
  },
  description: {
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
  },
  button: {
    width: '100%',
  },
})
