/**
 * Save Favorite Sheet Component
 *
 * Allows users to name and save a selected road segment as a favorite.
 * Following theme_rules.mdc - no hardcoded values, uses semantic theme.
 *
 * Acceptance Criteria:
 * - AC1: Shows "Save as Favorite" title with name input
 * - AC2: Mutation called, sheet closes on success
 * - AC3: Validation error shown for empty name
 * - AC4: Error message displayed on save failure, sheet stays open
 */

import { StyleSheet, View, ScrollView } from 'react-native'
import { Text } from 'react-native-paper'
import { useEffect, useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { BottomActionSheet } from './bottom-action-sheet'
import { BottomSheetInput } from './bottom-sheet-input'
import { Button } from './button'

export type Bounds = {
  northeast: { lat: number; lng: number }
  southwest: { lat: number; lng: number }
}

export type SegmentData = {
  geometry: string
  bounds: Bounds
  legIndex?: number
}

export type SaveFavoriteSheetProps = {
  visible: boolean
  onClose: () => void
  segment: SegmentData | null
  onSuccess?: () => void
  onCancel?: () => void
}

/**
 * Save Favorite Sheet component
 *
 * Displays a bottom sheet with name input and save button.
 * Validates name (1-100 characters) and calls mutation on save.
 */
export const SaveFavoriteSheet: React.FC<SaveFavoriteSheetProps> = ({
  visible,
  onClose,
  segment,
  onSuccess,
  onCancel,
}) => {
  const { semantic } = useSemanticTheme()
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const insertFavorite = useMutation(api.db.favoriteRoads.insert)

  // Reset form when sheet opens
  useEffect(() => {
    if (visible) {
      setName('')
      setError(null)
    }
  }, [visible])

  const handleSave = async () => {
    // Validate name
    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('Please enter a name')
      return
    }

    if (trimmedName.length > 100) {
      setError('Name must be 100 characters or less')
      return
    }

    if (!segment) {
      setError('No segment selected')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      await insertFavorite({
        input: {
          name: trimmedName,
          geometry: segment.geometry,
          bounds: {
            north: segment.bounds.northeast.lat,
            south: segment.bounds.southwest.lat,
            east: segment.bounds.northeast.lng,
            west: segment.bounds.southwest.lng,
          },
        },
      })
      onSuccess?.()
      onClose()
    } catch {
      setError('Failed to save favorite. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleNameChange = (text: string) => {
    setName(text)
    // Clear validation/error when user starts typing
    if (error) {
      setError(null)
    }
  }

  return (
    <BottomActionSheet
      visible={visible}
      onDismiss={onClose}
      testID="save-favorite-sheet"
      snapPoints={['60%', '90%']}
      hasTextInput={true}
    >
      <View style={styles.container}>
          <View style={styles.content}>
            {/* Title */}
            <Text
              variant="headlineSmall"
              style={[
                styles.title,
                { color: semantic.color.onSurface.default },
              ]}
            >
              Save as Favorite
            </Text>

            {/* Caption */}
            <Text
              variant="bodyMedium"
              style={[
                styles.caption,
                { color: semantic.color.onSurface.subtle },
              ]}
            >
              Give this road segment a name to save it to your favorites
            </Text>

            {/* Name Input */}
            <BottomSheetInput
              testID="save-favorite-name-input"
              value={name}
              onChangeText={handleNameChange}
              placeholder="e.g., Hwy 9 - Skyline Blvd"
              maxLength={100}
              autoFocus
              error={!!error}
            />

            {/* Character Count */}
            <Text
              variant="bodySmall"
              style={{ color: semantic.color.onSurface.subtle }}
            >
              {name.length}/100 characters
            </Text>

            {/* Error Message */}
            {error && (
              <Text
                variant="bodySmall"
                style={[
                  styles.errorText,
                  { color: semantic.color.danger.default },
                ]}
              >
                {error}
              </Text>
            )}

            {/* Save Button */}
            <View style={styles.buttonContainer}>
              <Button
                testID="save-favorite-save-button"
                onPress={handleSave}
                disabled={isSaving || !name.trim()}
                loading={isSaving}
                size="lg"
                style={styles.saveButton}
              >
                Save Favorite
              </Button>

              {/* Cancel Button */}
              <Button
                testID="save-favorite-cancel-button"
                onPress={() => {
                  onCancel?.()
                  onClose()
                }}
                variant="outline"
                disabled={isSaving}
                style={styles.cancelButton}
              >
                Cancel
              </Button>
            </View>
          </View>
      </View>
    </BottomActionSheet>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 32,
  },
  title: {
    marginBottom: 4,
  },
  caption: {
    marginBottom: 8,
  },
  errorText: {
    marginTop: -8,
    marginBottom: 8,
  },
  buttonContainer: {
    marginTop: 8,
    gap: 12,
  },
  saveButton: {
    width: '100%',
  },
  cancelButton: {
    width: '100%',
  },
})
