import { useEffect, useState } from 'react'
import { Button, Dialog, Portal, TextInput } from 'react-native-paper'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'

type RenameRouteDialogProps = {
  visible: boolean
  currentName: string
  onRename: (newName: string) => void
  onDismiss: () => void
  testID?: string
}

export const RenameRouteDialog = ({
  visible,
  currentName,
  onRename,
  onDismiss,
  testID = 'rename-route-dialog',
}: RenameRouteDialogProps) => {
  const { semantic } = useSemanticTheme()
  const [name, setName] = useState(currentName)

  useEffect(() => {
    setName(currentName)
  }, [currentName])

  const trimmed = name.trim()
  const canSave = trimmed.length > 0 && trimmed !== currentName

  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={onDismiss}
        testID={testID}
        style={{ backgroundColor: semantic.color.surface.default }}
      >
        <Dialog.Title style={{ color: semantic.color.onSurface.default }}>
          Rename Route
        </Dialog.Title>
        <Dialog.Content>
          <TextInput
            mode="outlined"
            value={name}
            onChangeText={setName}
            maxLength={100}
            autoFocus
            testID={`${testID}-input`}
            textColor={semantic.color.onSurface.default}
            outlineColor={semantic.color.border.default}
            activeOutlineColor={semantic.color.primary.default}
          />
        </Dialog.Content>
        <Dialog.Actions>
          <Button
            onPress={onDismiss}
            testID={`${testID}-cancel`}
            textColor={semantic.color.primary.default}
          >
            Cancel
          </Button>
          <Button
            onPress={() => { if (canSave) onRename(trimmed) }}
            disabled={!canSave}
            testID={`${testID}-save`}
            textColor={canSave ? semantic.color.primary.default : semantic.color.onSurface.disabled}
          >
            Save
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  )
}
