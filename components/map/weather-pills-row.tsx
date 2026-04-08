/**
 * WeatherPillsRow Component
 *
 * Minimal weather indicator widget for the top-right map overlay.
 * Displays 3 compact pills showing current weather conditions.
 *
 * Following design system rules:
 * - Uses semantic theme tokens for all visual properties
 * - Glassmorphic background with blur effect
 * - Pill shape with semantic radius
 * - Proper accessibility labels
 */

import { StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import type { IconName } from '../ui/icon-symbol'
import { IconSymbol } from '../ui/icon-symbol'
import {
  getWorstWindLevel,
  getWorstTemperatureLevel,
  getWorstRainLevel,
  getMaxTemperatureFahrenheit,
  getMaxWindSpeedMph,
  type RouteOverlays,
  type WindSummary,
  type TemperatureSummary,
  type RainSummary,
} from '../../models/saved-routes'

export type WeatherPillsRowProps = {
  /** Route overlays containing wind, rain, and temperature data */
  overlays?: RouteOverlays
  /** Test ID for testing */
  testID?: string
}

/**
 * Helper to add opacity to hex color
 */
const addOpacity = (hexColor: string, opacity: number): string => {
  const hex = hexColor.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

/**
 * Get icon for rain level
 */
const getRainIcon = (level: RainSummary): IconName => {
  switch (level) {
    case 'none':
      return 'check-circle-outline'
    case 'light':
      return 'water-outline'
    case 'moderate':
      return 'water'
    case 'heavy':
      return 'weather-pouring'
    default:
      return 'help-circle-outline'
  }
}

/**
 * Get accessibility label for rain level
 */
const getRainLabel = (level: RainSummary): string => {
  switch (level) {
    case 'none':
      return 'No rain'
    case 'light':
      return 'Light rain'
    case 'moderate':
      return 'Moderate rain'
    case 'heavy':
      return 'Heavy rain'
    default:
      return 'Rain conditions unavailable'
  }
}

/**
 * Get color tint based on severity (10% opacity)
 */
const getSeverityTint = (
  level: string,
  semantic: ReturnType<typeof useSemanticTheme>['semantic']
): string => {
  // Determine severity-based tint
  if (level === 'high' || level === 'heavy') {
    return addOpacity(semantic.color.danger.default, 0.1)
  }
  if (level === 'moderate' || level === 'warm' || level === 'hot') {
    return addOpacity(semantic.color.warning.default, 0.1)
  }
  if (level === 'cold') {
    return addOpacity(semantic.color.info.default, 0.1)
  }
  if (level === 'none' || level === 'low' || level === 'mild') {
    return addOpacity(semantic.color.success.default, 0.1)
  }
  return 'transparent'
}

/**
 * WeatherPillsRow component
 *
 * Displays three compact weather pills: wind, temperature, and conditions (rain).
 * Uses glassmorphic styling for map overlay placement.
 */
export const WeatherPillsRow = ({ overlays, testID = 'weather-pills-row' }: WeatherPillsRowProps) => {
  const { semantic } = useSemanticTheme()

  // Handle missing overlays
  if (!overlays) {
    return null
  }

  // Extract weather data
  const windLevel = getWorstWindLevel(overlays.wind)
  const windSpeed = getMaxWindSpeedMph(overlays.wind)
  const temperatureLevel = getWorstTemperatureLevel(overlays.temperature)
  const temperatureValue = getMaxTemperatureFahrenheit(overlays.temperature)
  const rainLevel = getWorstRainLevel(overlays.rain)

  // Glassmorphic background
  const backgroundColor = addOpacity(semantic.color.surface.default, 0.85)
  const borderColor = addOpacity(semantic.color.border.default, 0.3)

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor,
          borderColor,
          borderRadius: semantic.radius.full,
          gap: semantic.space.xs,
        },
      ]}
      testID={testID}
    >
      {/* Wind Pill */}
      {windSpeed !== undefined && (
        <View
          style={[
            styles.pill,
            {
              backgroundColor: getSeverityTint(windLevel, semantic),
            },
          ]}
          testID={`${testID}-wind`}
        >
          <IconSymbol
            name="weather-windy"
            size={14}
            color={semantic.color.onSurface.default}
          />
          <Text
            style={[
              styles.pillText,
              {
                color: semantic.color.onSurface.default,
                ...semantic.type.label.sm,
              },
            ]}
          >
            {windSpeed}
          </Text>
        </View>
      )}

      {/* Temperature Pill */}
      {temperatureValue !== undefined && (
        <View
          style={[
            styles.pill,
            {
              backgroundColor: getSeverityTint(temperatureLevel, semantic),
            },
          ]}
          testID={`${testID}-temperature`}
        >
          <Text
            style={[
              styles.pillText,
              {
                color: semantic.color.onSurface.default,
                ...semantic.type.label.sm,
              },
            ]}
          >
            {temperatureValue}°
          </Text>
        </View>
      )}

      {/* Conditions Pill (rain) */}
      <View
        style={[
          styles.pill,
          {
            backgroundColor: getSeverityTint(rainLevel, semantic),
          },
        ]}
        testID={`${testID}-conditions`}
        accessibilityLabel={getRainLabel(rainLevel)}
      >
        <IconSymbol
          name={getRainIcon(rainLevel)}
          size={14}
          color={semantic.color.onSurface.default}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    // Glassmorphic blur effect
    // Note: blur effect is applied via parent container or platform-specific APIs
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999, // Full pill shape
    gap: 4,
  },
  pillText: {
    fontWeight: '500',
  },
})
