/**
 * DeleteConfirmationDialog for offline regions.
 *
 * Alert dialog confirming deletion of a downloaded offline map region.
 * Follows the DeleteRouteDialog pattern with semantic theme tokens.
 */

import { Button, Dialog, Portal, Text } from 'react-native-paper'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'

export type DeleteConfirmationDialogProps = {
  visible: boolean
  regionName: string
  regionSize: string
  onConfirm: () => void
  onDismiss: () => void
  testID?: string
}

export const DeleteConfirmationDialog = ({
  visible,
  regionName,
  regionSize,
  onConfirm,
  onDismiss,
  testID = 'delete-region-dialog',
}: DeleteConfirmationDialogProps) => {
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
          Delete Offline Map
        </Dialog.Title>
        <Dialog.Content>
          <Text style={{ color: semantic.color.onSurface.default }}>
            {`Delete "${regionName}" (${regionSize})? This map will no longer be available offline.`}
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
