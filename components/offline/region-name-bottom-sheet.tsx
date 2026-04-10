/**
 * RegionNameBottomSheet for naming offline map downloads.
 *
 * Bottom sheet with text input for region name, size estimate display,
 * WiFi requirement warning, and confirm/cancel buttons.
 * Uses BottomSheetInput for proper Gorhom keyboard handling.
 */

import { useState, useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { BottomSheetWrapper } from '../sheets/bottom-sheet-wrapper'
import { BottomSheetInput } from '../ui/bottom-sheet-input'
import { Button } from '../ui/button'

const MAX_NAME_LENGTH = 50

export type RegionNameBottomSheetProps = {
  visible: boolean
  sizeEstimate: number
  isWiFi: boolean
  onConfirm: (name: string) => void
  onCancel: () => void
  testID?: string
}

export const RegionNameBottomSheet = ({
  visible,
  sizeEstimate,
  isWiFi,
  onConfirm,
  onCancel,
  testID = 'region-name-sheet',
}: RegionNameBottomSheetProps) => {
  const { semantic } = useSemanticTheme()
  const [name, setName] = useState('')

  // Reset name when sheet opens
  useEffect(() => {
    if (visible) setName('')
  }, [visible])

  const formatMB = (bytes: number) => {
    const mb = bytes / (1024 * 1024)
    return mb < 1 ? '< 1 MB' : `${mb.toFixed(0)} MB`
  }

  const isValidName = name.trim().length > 0 && name.trim().length <= MAX_NAME_LENGTH
  const canDownload = isValidName && isWiFi

  const handleConfirm = () => {
    if (canDownload) {
      onConfirm(name.trim())
    }
  }

  return (
    <BottomSheetWrapper
      isVisible={visible}
      onClose={onCancel}
      testID={testID}
      preset="content"
      hasTextInput
    >
      <Text
        variant="titleMedium"
        style={{ color: semantic.color.onSurface.default }}
      >
        Name Your Region
      </Text>

      <Text
        variant="bodyMedium"
        style={{ color: semantic.color.onSurface.muted }}
      >
        Download size: {formatMB(sizeEstimate)}
      </Text>

      <View style={[styles.inputRow, { gap: semantic.space.sm }]}>
        <View style={{ flex: 1 }}>
          <BottomSheetInput
            value={name}
            onChangeText={setName}
            placeholder="e.g., Rocky Mountains"
            maxLength={MAX_NAME_LENGTH}
            testID={`${testID}-input`}
            returnKeyType="done"
            onSubmitEditing={handleConfirm}
          />
        </View>
        <Text
          variant="labelSmall"
          style={{
            color: semantic.color.onSurface.subtle,
            alignSelf: 'flex-end',
            paddingBottom: 8,
          }}
        >
          {name.length}/{MAX_NAME_LENGTH}
        </Text>
      </View>

      {!isWiFi && (
        <View
          style={[
            styles.warning,
            {
              backgroundColor: `${semantic.color.warning.default}1A`,
              borderRadius: semantic.radius.md,
              padding: semantic.space.md,
            },
          ]}
        >
          <Text
            variant="bodySmall"
            style={{ color: semantic.color.warning.default }}
          >
            WiFi required for downloads. Connect to WiFi to continue.
          </Text>
        </View>
      )}

      <View style={[styles.buttons, { gap: semantic.space.md }]}>
        <Button
          variant="ghost"
          size="default"
          onPress={onCancel}
          testID={`${testID}-cancel`}
          style={{ flex: 1 }}
        >
          Cancel
        </Button>
        <Button
          variant="default"
          size="default"
          onPress={handleConfirm}
          disabled={!canDownload}
          testID={`${testID}-confirm`}
          style={{ flex: 1 }}
        >
          Confirm Download
        </Button>
      </View>
    </BottomSheetWrapper>
  )
}

const styles = StyleSheet.create({
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  warning: {
    borderLeftWidth: 3,
    borderLeftColor: undefined, // set dynamically
  },
  buttons: {
    flexDirection: 'row',
  },
})
