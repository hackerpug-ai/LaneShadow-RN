/**
 * Weather Gauge
 *
 * Motorcycle-inspired instrument cluster displaying real-time weather metrics.
 * Compact, always-on numeric display — wind, rain, temperature at a glance.
 *
 * Design inspired by sport bike instrument panels:
 * - Single column of metrics (like a gear indicator or MPG display)
 * - High contrast for readability in motion
 * - Minimal footprint (40-50px wide)
 */

import { StyleSheet, Text, View } from 'react-native'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'

export type WeatherData = {
  wind: {
    speed: number // mph
  } | null
  rain: {
    intensity: number // mm/hr
  } | null
  temperature: {
    value: number // fahrenheit
  } | null
}

export type WeatherGaugeProps = {
  data: WeatherData
  testID?: string
}

export const WeatherGauge = ({ data, testID = 'weather-gauge' }: WeatherGaugeProps) => {
  const { semantic } = useSemanticTheme()

  // Format functions
  const formatWind = (speed: number) => Math.round(speed)
  const formatRain = (intensity: number) => (intensity < 1 ? intensity.toFixed(2) : intensity.toFixed(1))
  const formatTemp = (temp: number) => Math.round(temp)

  const hasWind = data.wind !== null
  const hasRain = data.rain !== null
  const hasTemp = data.temperature !== null
  const hasAnyData = hasWind || hasRain || hasTemp

  if (!hasAnyData) {
    return null
  }

  const textColor = semantic.color.onSurface.default
  const mutedColor = semantic.color.onSurface.muted
  const accentColor = semantic.color.primary.default

  return (
    <View style={styles.container} testID={testID}>
      <View style={[styles.gauge, { backgroundColor: semantic.color.surfaceVariant.default }]}>
        {/* Wind */}
        {hasWind && (
          <View style={styles.metric}>
            <View style={[styles.valueCircle, { borderColor: mutedColor }]}>
              <Text style={[styles.value, { color: textColor }]}>
                {formatWind(data.wind!.speed)}
              </Text>
            </View>
            <Text style={[styles.unit, { color: mutedColor }]}>MPH</Text>
          </View>
        )}

        {/* Rain */}
        {hasRain && (
          <View style={[styles.metric, hasWind && styles.metricWithBorder]}>
            <View
              style={[
                styles.valueCircle,
                { borderColor: data.rain!.intensity > 2 ? accentColor : mutedColor },
              ]}
            >
              <Text style={[styles.value, { color: textColor }]}>
                {formatRain(data.rain!.intensity)}
              </Text>
            </View>
            <Text style={[styles.unit, { color: mutedColor }]}>MM/HR</Text>
          </View>
        )}

        {/* Temperature */}
        {hasTemp && (
          <View style={[styles.metric, (hasWind || hasRain) && styles.metricWithBorder]}>
            <View style={[styles.valueCircle, { borderColor: mutedColor }]}>
              <Text style={[styles.value, { color: textColor }]}>
                {formatTemp(data.temperature!.value)}
              </Text>
            </View>
            <Text style={[styles.unit, { color: mutedColor }]}>°F</Text>
          </View>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  gauge: {
    borderRadius: 12,
    padding: 8,
    gap: 8,
    minWidth: 56,
  },
  metric: {
    alignItems: 'center',
  },
  metricWithBorder: {
    paddingTop: 8,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    borderStyle: 'dotted',
  },
  valueCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 20,
  },
  unit: {
    fontSize: 9,
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
})
