import { Button, Dialog, Portal, Text } from 'react-native-paper'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'

type DeleteFavoriteDialogProps = {
  visible: boolean
  favoriteName: string
  onConfirm: () => void
  onDismiss: () => void
  testID?: string
}

export const DeleteFavoriteDialog = ({
  visible,
  favoriteName,
  onConfirm,
  onDismiss,
  testID = 'delete-favorite-dialog',
}: DeleteFavoriteDialogProps) => {
  const { semantic } = useSemanticTheme()

  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={onDismiss}
        testID={testID}
        style={{ backgroundColor: semantic.color.surface.default }}
      >
        <Dialog.Title style={{ color: semantic.color.onSurface.default }}>
          Delete favorite road?
        </Dialog.Title>
        <Dialog.Content>
          <Text style={{ color: semantic.color.onSurface.default }}>
            {`Are you sure you want to delete "${favoriteName}"?`}
          </Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button
            mode="text"
            onPress={onDismiss}
            testID={`${testID}-cancel`}
            textColor={semantic.color.onSurface.default}
          >
            Cancel
          </Button>
          <Button
            mode="text"
            onPress={onConfirm}
            testID={`${testID}-confirm`}
            textColor={semantic.color.danger.default}
          >
            Delete
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  )
}
