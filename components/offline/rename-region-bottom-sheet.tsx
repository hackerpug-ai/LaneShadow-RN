/**
 * RenameRegionBottomSheet
 *
 * Bottom sheet for renaming an offline map region.
 * Uses react-hook-form with zod validation:
 * - Name cannot be empty
 * - Save disabled if name is unchanged from current name
 * - Uses BottomSheetInput for proper Gorhom keyboard handling
 */

import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import { z } from 'zod'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { BottomSheetWrapper } from '../sheets/bottom-sheet-wrapper'
import { BottomSheetInput } from '../ui/bottom-sheet-input'
import { Button } from '../ui/button'

const MAX_NAME_LENGTH = 50

const renameSchema = z.object({
  name: z
    .string()
    .min(1, 'Name cannot be empty.')
    .max(MAX_NAME_LENGTH, `Name must be ${MAX_NAME_LENGTH} characters or fewer.`),
})

type RenameFormValues = z.infer<typeof renameSchema>

export type RenameRegionBottomSheetProps = {
  visible: boolean
  currentName: string
  onConfirm: (newName: string) => void
  onCancel: () => void
  testID?: string
}

export const RenameRegionBottomSheet = ({
  visible,
  currentName,
  onConfirm,
  onCancel,
  testID = 'rename-region-sheet',
}: RenameRegionBottomSheetProps) => {
  const { semantic } = useSemanticTheme()

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<RenameFormValues>({
    resolver: zodResolver(renameSchema),
    defaultValues: { name: '' },
  })

  // Reset form when sheet opens, prefill with current name
  useEffect(() => {
    if (visible) {
      reset({ name: currentName })
    }
  }, [visible, currentName, reset])

  const onSubmit = (data: RenameFormValues) => {
    const trimmed = data.name.trim()
    if (trimmed && trimmed !== currentName) {
      onConfirm(trimmed)
    }
  }

  // Watch the name field to reactively check if unchanged
  const watchedName = watch('name')
  const trimmedValue = (watchedName ?? '').trim()
  const isUnchanged = trimmedValue === currentName || trimmedValue.length === 0

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
        Rename Region
      </Text>

      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, onBlur, value } }) => (
          <View style={[styles.inputRow, { gap: semantic.space.sm }]}>
            <View style={{ flex: 1 }}>
              <BottomSheetInput
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Region name"
                maxLength={MAX_NAME_LENGTH}
                testID={`${testID}-input`}
                error={!!errors.name}
                returnKeyType="done"
                onSubmitEditing={handleSubmit(onSubmit)}
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
              {value.length}/{MAX_NAME_LENGTH}
            </Text>
          </View>
        )}
      />

      {errors.name && (
        <Text
          variant="bodySmall"
          style={{ color: semantic.color.danger.default }}
        >
          {errors.name.message}
        </Text>
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
          onPress={handleSubmit(onSubmit)}
          disabled={isUnchanged || !!errors.name}
          testID={`${testID}-save`}
          style={{ flex: 1 }}
        >
          Save
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
  buttons: {
    flexDirection: 'row',
  },
})
