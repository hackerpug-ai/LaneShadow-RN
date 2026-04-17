import { View } from 'react-native'
import { Text } from 'react-native-paper'

import { useSemanticTheme } from '../../hooks/use-semantic-theme'

type VoiceAssistantOverlayProps = {
  isOpen?: boolean
  state: { status: 'idle' | 'recording'; transcript?: string }
  isCameraOpen?: boolean
  onOpenCamera?: () => void
  onCloseCamera?: () => void
  onCapturePhoto?: () => void
  onSubmit?: () => void
  onSaveDraft?: () => void
  onDiscard?: () => void
  onDismiss?: () => void
}

/**
 * Minimal placeholder overlay. Replace with real assistant UI when ready.
 */
export const VoiceAssistantOverlay = ({
  isOpen = false,
  state,
  onDismiss,
}: VoiceAssistantOverlayProps) => {
  const { semantic } = useSemanticTheme()
  if (!isOpen) return null

  return (
    <View
      style={{
        padding: semantic.space.md,
        backgroundColor: semantic.color.surfaceVariant.default,
        borderRadius: semantic.radius.md,
      }}
    >
      <Text variant="titleMedium" style={{ color: semantic.color.onSurface.default }}>
        Assistant ({state.status})
      </Text>
      {state.transcript ? (
        <Text variant="bodyMedium" style={{ color: semantic.color.onSurface.default }}>
          {state.transcript}
        </Text>
      ) : (
        <Text variant="bodyMedium" style={{ color: semantic.color.onSurface.muted }}>
          Listening...
        </Text>
      )}
      {onDismiss ? (
        <Text
          variant="labelSmall"
          onPress={onDismiss}
          style={{ color: semantic.color.primary.default }}
        >
          Dismiss
        </Text>
      ) : null}
    </View>
  )
}
