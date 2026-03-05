/**
 * Overlay Toggle Component
 * Toggle control for switching between wind, rain, and temperature overlays on map
 *
 * Acceptance Criteria:
 * - AC1: User taps 'Rain' toggle → Rain becomes selected and polyline colors switch to rain-based
 * - AC2: Route has wind data but no rain data → Rain toggle is disabled with visual indication
 * - AC3: Only one overlay active at a time (single-select mode)
 * - AC4: No route selected → Overlay toggle is hidden
 *
 * Following coding standards: composition over inheritance, named exports
 */

import { StyleSheet, View } from 'react-native'
import { IconSymbol } from '../ui/icon-symbol'
import { ToggleGroup, useToggleGroup } from '../ui/toggle-group'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'

/**
 * Overlay type for map visualizations
 */
export type OverlayType = 'wind' | 'rain' | 'temperature'

/**
 * Data availability for each overlay type
 */
export type OverlayAvailability = {
  wind: boolean
  rain: boolean
  temperature: boolean
}

/**
 * Overlay toggle component props
 */
export type OverlayToggleProps = {
  /**
   * Currently selected overlay
   */
  value: OverlayType | ''

  /**
   * Callback when overlay selection changes
   */
  onValueChange: (value: OverlayType | '') => void

  /**
   * Data availability for each overlay type
   * Used to disable toggles when data is unavailable
   */
  availability: OverlayAvailability

  /**
   * Test ID for E2E testing
   */
  testID?: string
}

/**
 * Icon names for each overlay type (react-native-paper)
 */
const OVERLAY_ICONS: Record<OverlayType, string> = {
  wind: 'weather-windy',
  rain: 'water-outline',
  temperature: 'thermometer',
}

/**
 * Accessibility labels for each overlay type
 */
const OVERLAY_LABELS: Record<OverlayType, string> = {
  wind: 'Wind overlay',
  rain: 'Rain overlay',
  temperature: 'Temperature overlay',
}

/**
 * Overlay toggle component
 *
 * Displays pill-style toggle buttons for switching between weather overlays.
 * Uses ToggleGroup with single-selection mode.
 * Disabled toggles show visual indication when data is unavailable.
 */
export const OverlayToggle = ({
  value,
  onValueChange,
  availability,
  testID = 'overlay-toggle',
}: OverlayToggleProps): React.ReactNode => {
  const { semantic } = useSemanticTheme()

  /**
   * Handle value change, preventing selection of unavailable overlays
   */
  const handleValueChange = (newValue: string) => {
    if (newValue === '') {
      onValueChange('')
      return
    }

    const overlayType = newValue as OverlayType
    if (availability[overlayType]) {
      onValueChange(overlayType)
    }
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: semantic.color.surface.default,
          borderRadius: semantic.radius.xl,
          paddingHorizontal: semantic.space.xs,
          paddingVertical: semantic.space.xs,
          ...semantic.elevation[2],
        },
      ]}
      testID={testID}
    >
      <ToggleGroup
        type="single"
        value={value}
        onValueChange={handleValueChange}
        variant="default"
        size="default"
      >
        <OverlayToggleItem
          value="wind"
          available={availability.wind}
          icon={OVERLAY_ICONS.wind}
          label={OVERLAY_LABELS.wind}
          semantic={semantic}
        />
        <OverlayToggleItem
          value="rain"
          available={availability.rain}
          icon={OVERLAY_ICONS.rain}
          label={OVERLAY_LABELS.rain}
          semantic={semantic}
        />
        <OverlayToggleItem
          value="temperature"
          available={availability.temperature}
          icon={OVERLAY_ICONS.temperature}
          label={OVERLAY_LABELS.temperature}
          semantic={semantic}
        />
      </ToggleGroup>
    </View>
  )
}

/**
 * Individual overlay toggle item
 * Handles disabled state with visual indication
 */
type OverlayToggleItemProps = {
  value: OverlayType
  available: boolean
  icon: string
  label: string
  semantic: ReturnType<typeof useSemanticTheme>['semantic']
}

const OverlayToggleItem = ({
  value,
  available,
  icon,
  label,
  semantic,
}: OverlayToggleItemProps): React.ReactNode => {
  const context = useToggleGroup()
  if (!context) {
    throw new Error('OverlayToggleItem must be used within a ToggleGroup')
  }

  const { value: groupValue, onValueChange, disabled } = context

  const isSelected = groupValue === value
  const isDisabled = disabled || !available

  const handlePress = () => {
    if (isDisabled) return
    onValueChange(value)
  }

  // Get background color based on state
  const getBackgroundColor = (): string => {
    if (isDisabled) {
      return 'transparent'
    }
    if (isSelected) {
      return semantic.color.accent.default
    }
    return 'transparent'
  }

  // Get icon color based on state
  const getIconColor = (): string => {
    if (isDisabled) {
      return semantic.color.onSurface.disabled || semantic.color.onSurface.muted
    }
    if (isSelected) {
      return semantic.color.onSurface.default
    }
    return semantic.color.onSurface.muted || semantic.color.onSurface.default
  }

  return (
    <View
      style={[
        styles.item,
        {
          width: semantic.space['3xl'],
          height: semantic.space['3xl'],
          borderRadius: semantic.radius.lg,
          backgroundColor: getBackgroundColor(),
          opacity: isDisabled ? 0.5 : 1,
        },
      ]}
      onTouchEnd={handlePress}
      testID={`overlay-item-${value}`}
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, selected: isSelected }}
    >
      <IconSymbol
        name={icon as any}
        size={semantic.space.lg}
        color={getIconColor()}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
})
