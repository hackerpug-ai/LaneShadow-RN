/**
 * Save Route Sheet Component
 *
 * Allows users to name and save a complete route.
 * Following theme_rules.mdc - no hardcoded values, uses semantic theme.
 *
 * Acceptance Criteria:
 * - AC1: Shows "Save Route" title with name input
 * - AC2: Mutation called, sheet closes on success
 * - AC3: Validation error shown for empty name
 * - AC4: Error message displayed on save failure, sheet stays open
 */

import { StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import { useEffect, useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { BottomActionSheet } from './bottom-action-sheet'
import { BottomSheetInput } from './bottom-sheet-input'
import { Button } from './button'
import type { SavedRoute } from '../../models/saved-routes'

export type SaveRouteSheetProps = {
  visible: boolean
  onClose: () => void
  routeData: {
    suggestedName?: string
    planInput: SavedRoute['planInput']
    routeSnapshot: SavedRoute['routeSnapshot']
    routeIndex: SavedRoute['routeIndex']
    snapshotMeta: SavedRoute['snapshotMeta']
  } | null
  onSuccess?: () => void
  onCancel?: () => void
}

/**
 * Save Route Sheet component
 *
 * Displays a bottom sheet with name input and save button.
 * Validates name (1-100 characters) and calls mutation on save.
 */
export const SaveRouteSheet: React.FC<SaveRouteSheetProps> = ({
  visible,
  onClose,
  routeData,
  onSuccess,
  onCancel,
}) => {
  const { semantic } = useSemanticTheme()
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const saveRoute = useMutation(api.db.savedRoutes.saveRoute)

  // Reset form when sheet opens and pre-fill suggested name
  useEffect(() => {
    if (visible) {
      setName(routeData?.suggestedName ?? '')
      setError(null)
    }
  }, [visible, routeData?.suggestedName])

  const handleSave = async () => {
    // Validate name
    const trimmedName = name.trim()
    console.log('[SaveRouteSheet] handleSave called', { trimmedName, routeData })

    if (!trimmedName) {
      setError('Please enter a name')
      return
    }

    if (trimmedName.length > 100) {
      setError('Name must be 100 characters or less')
      return
    }

    if (!routeData) {
      setError('No route data available')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      console.log('[SaveRouteSheet] Calling saveRoute with:', {
        name: trimmedName,
        planInput: routeData.planInput,
        hasRouteSnapshot: !!routeData.routeSnapshot,
        hasRouteIndex: !!routeData.routeIndex,
        snapshotMeta: routeData.snapshotMeta,
      })
      await saveRoute({
        name: trimmedName,
        planInput: routeData.planInput,
        routeSnapshot: routeData.routeSnapshot,
        routeIndex: routeData.routeIndex,
        snapshotMeta: routeData.snapshotMeta,
      })
      console.log('[SaveRouteSheet] saveRoute succeeded')
      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('[SaveRouteSheet] saveRoute failed:', error)
      setError('Failed to save route. Please try again.')
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
      testID="save-route-sheet"
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
              Save Route
            </Text>

            {/* Caption */}
            <Text
              variant="bodyMedium"
              style={[
                styles.caption,
                { color: semantic.color.onSurface.subtle },
              ]}
            >
              Name your route to save it for later
            </Text>

            {/* Name Input */}
            <BottomSheetInput
              testID="save-route-name-input"
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
                testID="save-route-save-button"
                onPress={handleSave}
                disabled={isSaving || !name.trim()}
                loading={isSaving}
                size="lg"
                style={styles.saveButton}
              >
                Save Route
              </Button>

              {/* Cancel Button */}
              <Button
                testID="save-route-cancel-button"
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

// Export both names for backwards compatibility during transition
export { SaveRouteSheet as SaveFavoriteSheet }

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
