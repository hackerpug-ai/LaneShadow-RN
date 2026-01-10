/**
 * Notifier Helper Functions
 *
 * Reusable notification functions with automatic theme styling
 * No need to pass semantic theme - handled by custom components
 */

import { PermissionNotification } from '../components/ui/permission-notification'
import { Notifier } from 'react-native-notifier'

export const showCameraPermissionNotification = (
  onRequestPermission?: () => void | Promise<void>,
  canAskAgain = true
) => {
  console.log('Showing camera permission notification with callback:', !!onRequestPermission)

  const title = 'Camera Permission Required'
  const description = canAskAgain
    ? 'Tap to grant camera access for capturing photos and videos.'
    : 'Camera access was denied. Tap to open Settings and enable camera permission.'
  const actionLabel = canAskAgain ? 'Grant Permission' : 'Open Settings'

  Notifier.showNotification({
    title,
    description,
    duration: 0, // Don't auto-dismiss when there's an action
    Component: PermissionNotification,
    componentProps: {
      actionLabel,
      preventDismissOnTap: false,
    },
    queueMode: 'reset',
    swipeEnabled: true,
    // WORKAROUND: Due to iOS issue #107, use top-level onPress instead of nested button
    onPress: async () => {
      console.log(
        'Notification tapped -',
        canAskAgain ? 'requesting permission' : 'opening Settings'
      )
      if (onRequestPermission) {
        await onRequestPermission()
      }
      Notifier.hideNotification()
    },
  })
}

export const showSuccessNotification = (message: string) => {
  Notifier.showNotification({
    title: 'Success',
    description: message,
    duration: 3000,
    showAnimationDuration: 500,
    Component: PermissionNotification,
  })
}

export const showErrorNotification = (message: string) => {
  Notifier.showNotification({
    title: 'Error',
    description: message,
    duration: 4000,
    showAnimationDuration: 500,
    Component: PermissionNotification,
  })
}
