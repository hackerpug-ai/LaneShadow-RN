/**
 * Save Route Confirmation Sheet Component
 * Displays a confirmation dialog for saving a route with name input
 *
 * Follows project standards:
 * - Uses semantic theme tokens
 * - Uses existing UI components (BottomSheetWrapper, Input, Button)
 * - Supports loading state during save operation
 */

import { useState } from 'react'
import { IconSymbol } from '../ui/icon-symbol'
import { StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { Button } from '../ui/button'
import { BottomSheetInput } from '../ui/bottom-sheet-input'
import { BottomSheetWrapper } from './bottom-sheet-wrapper'

export type SaveRouteConfirmationSheetProps = {
  isVisible: boolean
  onClose: () => void
  onConfirm: (routeName: string) => void
  defaultName?: string
  isSaving?: boolean
  testID?: string
}

/**
 * Save route confirmation sheet that allows users to name their saved route
 * Displays a confirmation dialog with name input field
 */
export const SaveRouteConfirmationSheet = ({
  isVisible,
  onClose,
  onConfirm,
  defaultName = '',
  isSaving = false,
  testID,
}: SaveRouteConfirmationSheetProps) => {
  const { semantic } = useSemanticTheme()
  const [routeName, setRouteName] = useState(defaultName)

  const handleConfirm = () => {
    const trimmedName = routeName.trim()
    if (trimmedName) {
      onConfirm(trimmedName)
    }
  }

  const handleClose = () => {
    if (!isSaving) {
      onClose()
    }
  }

  const isValid = routeName.trim().length > 0

  return (
    <BottomSheetWrapper
      isVisible={isVisible}
      onClose={handleClose}
      preset="content"
      testID={testID}
      hasTextInput={true}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <IconSymbol
              name="bookmark-plus"
              size={28}
              color={semantic.color.primary.default}
            />
          </View>
          <Text variant="titleLarge" style={{ color: semantic.color.onSurface.default }}>
            Save Route
          </Text>
        </View>

        {/* Description */}
        <Text
          variant="bodyMedium"
          style={[styles.description, { color: semantic.color.onSurface.subtle }]}
        >
          Give this route a memorable name so you can easily find it later.
        </Text>

        {/* Name Input */}
        <View style={styles.inputSection}>
          <BottomSheetInput
            label="Route Name"
            placeholder="e.g., Coastal Sunday Ride"
            value={routeName}
            onChangeText={setRouteName}
            editable={!isSaving}
            leftIcon="map-marker-path"
            testID={`${testID}-name-input`}
          />
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            variant="ghost"
            size="lg"
            onPress={handleClose}
            disabled={isSaving}
            style={styles.cancelButton}
            testID={`${testID}-cancel-button`}
          >
            Cancel
          </Button>
          <Button
            variant="default"
            size="lg"
            onPress={handleConfirm}
            disabled={!isValid || isSaving}
            loading={isSaving}
            icon={
              <IconSymbol
                name="check"
                size={20}
                color={isValid ? semantic.color.onPrimary.default : semantic.color.onSurface.disabled}
              />
            }
            style={styles.confirmButton}
            testID={`${testID}-confirm-button`}
          >
            {isSaving ? 'Saving...' : 'Save Route'}
          </Button>
        </View>
      </View>
    </BottomSheetWrapper>
  )
}

SaveRouteConfirmationSheet.displayName = 'SaveRouteConfirmationSheet'

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(184, 115, 51, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  description: {
    lineHeight: 22,
  },
  inputSection: {
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
  },
  confirmButton: {
    flex: 1.5,
  },
})
