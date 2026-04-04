import { Pressable, StyleSheet, View } from 'react-native'
import { Icon } from 'react-native-paper'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'

export type MapControlsProps = {
  onZoomIn: () => void
  onZoomOut: () => void
  onRecenter?: () => void
  onClear?: () => void
  onOpenChat?: () => void
  position?: {
    top?: number
    right?: number
    bottom?: number
    left?: number
  }
}

export const MapControls = ({
  onZoomIn,
  onZoomOut,
  onRecenter,
  onClear,
  onOpenChat,
  position,
}: MapControlsProps) => {
  const { semantic } = useSemanticTheme()
  const insets = useSafeAreaInsets()

  const offsets = {
    top: position?.top ?? insets.top + semantic.space['2xl'],
    right: position?.right ?? semantic.space.lg,
    bottom: position?.bottom,
    left: position?.left,
  }

  return (
    <View pointerEvents="box-none">
      <View
        style={[
          styles.container,
          {
            backgroundColor: 'transparent',
            gap: semantic.space.xs,
          },
        ]}
        testID="map-controls"
      >
        <View
          style={[
            styles.cluster,
            {
              backgroundColor: semantic.color.surfaceVariant.default,
              borderColor: semantic.color.border.default,
              borderWidth: 1.5,
              borderRadius: semantic.radius['2xl'],
              ...semantic.elevation[3],
            },
          ]}
        >
          <ControlButton
            icon="plus"
            onPress={onZoomIn}
            semantic={semantic}
            testID="control-zoom-in"
            accessibilityLabel="Zoom in"
          />
          <View
            style={[
              styles.divider,
              {
                backgroundColor: semantic.color.border.default,
              },
            ]}
          />

          <ControlButton
            icon="minus"
            onPress={onZoomOut}
            semantic={semantic}
            testID="control-zoom-out"
            accessibilityLabel="Zoom out"
          />
        </View>

        {onRecenter ? (
          <ControlButton
            icon="crosshairs-gps"
            onPress={onRecenter}
            semantic={semantic}
            testID="control-recenter"
            accessibilityLabel="Recenter map"
          />
        ) : null}

        {onClear ? (
          <ControlButton
            icon="layers"
            onPress={onClear}
            semantic={semantic}
            testID="control-clear"
            accessibilityLabel="Reset map state"
          />
        ) : null}

        {onOpenChat ? (
          <ControlButton
            icon="message-text-outline"
            onPress={onOpenChat}
            semantic={semantic}
            testID="control-open-chat"
            accessibilityLabel="Open chat history"
          />
        ) : null}
      </View>
    </View>
  )
}

type ControlButtonProps = {
  icon: string
  onPress: () => void
  semantic: ReturnType<typeof useSemanticTheme>['semantic']
  testID: string
  accessibilityLabel: string
}

const ControlButton = ({
  icon,
  onPress,
  semantic,
  testID,
  accessibilityLabel,
}: ControlButtonProps) => {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [
        styles.controlButton,
        {
          width: semantic.space['3xl'],
          height: semantic.space['3xl'],
          borderRadius: semantic.radius['2xl'],
          backgroundColor: pressed
            ? semantic.color.surfaceVariant.pressed
            : semantic.color.surfaceVariant.default,
          borderColor: semantic.color.border.default,
          borderWidth: 1.5,
          ...semantic.elevation[3],
        },
      ]}
      testID={testID}
      hitSlop={{
        top: semantic.space.xs,
        bottom: semantic.space.xs,
        left: semantic.space.xs,
        right: semantic.space.xs,
      }}
    >
      <Icon source={icon} size={20} color={semantic.color.onSurface.default} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  cluster: {},
  controlButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    width: '100%',
  },
})
