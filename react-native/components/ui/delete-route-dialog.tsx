import { Button, Dialog, Portal, Text } from 'react-native-paper'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'

type DeleteRouteDialogProps = {
  visible: boolean
  routeName: string
  onConfirm: () => void
  onDismiss: () => void
  testID?: string
}

export const DeleteRouteDialog = ({
  visible,
  routeName,
  onConfirm,
  onDismiss,
  testID = 'delete-route-dialog',
}: DeleteRouteDialogProps) => {
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
          Delete Route
        </Dialog.Title>
        <Dialog.Content>
          <Text style={{ color: semantic.color.onSurface.default }}>
            {`Are you sure you want to delete "${routeName}"? You can undo this within 5 seconds.`}
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
