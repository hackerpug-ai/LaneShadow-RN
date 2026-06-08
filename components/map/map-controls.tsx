import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Icon } from 'react-native-paper'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'

export type MapControlsMode = 'map' | 'chat'

export type MapControlsProps = {
  /**
   * Which view this workbar is backing. `'map'` shows zoom/recenter/clear
   * and a "message" icon that opens chat. `'chat'` collapses the
   * map-specific cluster and swaps the toggle slot for a "map" icon that
   * returns the rider to the map. The toggle itself ALWAYS lives at the
   * bottom of this right-side workbar so it occupies a consistent space
   * between modes.
   */
  mode?: MapControlsMode
  onZoomIn?: () => void
  onZoomOut?: () => void
  onRecenter?: () => void
  onClear?: () => void
  /** Handler for the mode-toggle button (chat-icon in map mode, map-icon in chat mode). */
  onToggleView?: () => void
  /** Handler for save route button (bookmark icon). Only shown when a route is available. */
  onSaveRoute?: () => void
  /** Whether a route is available to save (controls bookmark button visibility). */
  hasRouteToSave?: boolean
  /** Whether we're currently viewing a saved route (controls bookmark button accent styling). */
  isSavedRoute?: boolean
  /** Show labels below icons for better discoverability */
  showLabels?: boolean
  position?: {
    top?: number
    right?: number
    bottom?: number
    left?: number
  }
}

export const MapControls = ({
  mode = 'map',
  onZoomIn,
  onZoomOut,
  onRecenter,
  onClear,
  onToggleView,
  onSaveRoute,
  hasRouteToSave = false,
  isSavedRoute = false,
  showLabels = false,
  position,
}: MapControlsProps) => {
  const { semantic } = useSemanticTheme()
  const insets = useSafeAreaInsets()

  const _offsets = {
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
        {mode === 'map' ? (
          <>
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
                label={showLabels ? 'Zoom' : undefined}
                onPress={onZoomIn ?? (() => {})}
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
                label={showLabels ? 'Zoom' : undefined}
                onPress={onZoomOut ?? (() => {})}
                semantic={semantic}
                testID="control-zoom-out"
                accessibilityLabel="Zoom out"
              />
            </View>

            {onRecenter ? (
              <ControlButton
                icon="crosshairs-gps"
                label={showLabels ? 'Recenter' : undefined}
                onPress={onRecenter}
                semantic={semantic}
                testID="control-recenter"
                accessibilityLabel="Recenter map"
              />
            ) : null}

            {onClear ? (
              <ControlButton
                icon="layers"
                label={showLabels ? 'Layers' : undefined}
                onPress={onClear}
                semantic={semantic}
                testID="control-clear"
                accessibilityLabel="Reset map state"
              />
            ) : null}

            {hasRouteToSave && onSaveRoute ? (
              <ControlButton
                icon="bookmark"
                label={showLabels ? 'Save' : undefined}
                onPress={onSaveRoute}
                semantic={semantic}
                testID="control-save-route"
                accessibilityLabel="Save route"
                accent={isSavedRoute}
              />
            ) : null}
          </>
        ) : null}

        {/* Mode-toggle lives at the bottom of the workbar in BOTH modes so
            the chat/map swap button occupies a consistent right-side slot. */}
        {onToggleView ? (
          mode === 'map' ? (
            <ControlButton
              icon="message-text-outline"
              label={showLabels ? 'Chat' : undefined}
              onPress={onToggleView}
              semantic={semantic}
              testID="control-toggle-view"
              accessibilityLabel="Open chat"
            />
          ) : (
            <ControlButton
              icon="map-outline"
              label={showLabels ? 'Map' : undefined}
              onPress={onToggleView}
              semantic={semantic}
              testID="control-toggle-view"
              accessibilityLabel="Back to map"
            />
          )
        ) : null}
      </View>
    </View>
  )
}

type ControlButtonProps = {
  icon: string
  label?: string
  onPress: () => void
  semantic: ReturnType<typeof useSemanticTheme>['semantic']
  testID: string
  accessibilityLabel: string
  /** Use primary color accent for important actions (e.g., save route) */
  accent?: boolean
}

const ControlButton = ({
  icon,
  label,
  onPress,
  semantic,
  testID,
  accessibilityLabel,
  accent = false,
}: ControlButtonProps) => {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [
        styles.controlButton,
        {
          width: label ? 'auto' : semantic.space['3xl'],
          minWidth: label ? semantic.space['3xl'] : undefined,
          borderRadius: semantic.radius['2xl'],
          backgroundColor: pressed
            ? accent
              ? semantic.color.primary.pressed
              : semantic.color.surfaceVariant.pressed
            : accent
              ? semantic.color.primary.default
              : semantic.color.surfaceVariant.default,
          borderColor: accent ? semantic.color.primary.default : semantic.color.border.default,
          borderWidth: 1.5,
          ...semantic.elevation[3],
          paddingHorizontal: label ? semantic.space.sm : undefined,
          paddingVertical: semantic.space.xs,
          gap: label ? semantic.space.xs : undefined,
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
      <Icon
        source={icon}
        size={20}
        color={accent ? semantic.color.onPrimary.default : semantic.color.onSurface.default}
      />
      {label && (
        <Text
          style={[
            semantic.type.body.sm,
            {
              color: accent ? semantic.color.onPrimary.default : semantic.color.onSurface.default,
            },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  cluster: {},
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    width: '100%',
  },
})
