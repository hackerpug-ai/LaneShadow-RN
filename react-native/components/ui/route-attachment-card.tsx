/**
 * RouteAttachmentCard
 *
 * Compact route card for chat transcript display.
 *
 * Design principles:
 * - Horizontal layout maximizes space efficiency
 * - Single row prevents overlap issues with chat content
 * - Iconography reduces redundancy
 * - Progressive disclosure: summary by default, details on press
 *
 * Following components/CLAUDE.md: uses useSemanticTheme() exclusively.
 */

import type React from 'react'
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { IconSymbol } from './icon-symbol'

export interface RouteAttachmentCardProps {
  id: string
  label: string
  description: string
  distance: string
  duration: string
  scenicScore: number
  weatherBadge?: {
    type: 'clear' | 'rain' | 'wind' | 'cloudy'
    text: string
  }
  isBest?: boolean
  isSelected?: boolean
  onPress?: () => void
  style?: ViewStyle
  /** Visual variant: 'compact' for map overlay (one-line), 'full' for chat transcript (detailed) */
  variant?: 'compact' | 'full'
}

export const RouteAttachmentCard: React.FC<RouteAttachmentCardProps> = ({
  id,
  label,
  description,
  distance,
  duration,
  scenicScore,
  weatherBadge,
  isBest = false,
  isSelected = false,
  onPress,
  style,
  variant = 'compact',
}) => {
  const { semantic } = useSemanticTheme()

  const getWeatherIcon = (type: NonNullable<RouteAttachmentCardProps['weatherBadge']>['type']) => {
    switch (type) {
      case 'clear':
        return 'weather-sunny'
      case 'rain':
        return 'weather-rainy'
      case 'wind':
        return 'weather-windy'
      case 'cloudy':
        return 'weather-cloudy'
      default:
        return 'weather-partly-cloudy'
    }
  }

  const getWeatherColor = (
    type: NonNullable<RouteAttachmentCardProps['weatherBadge']>['type'],
  ): string => {
    switch (type) {
      case 'rain':
        return semantic.color.danger.default ?? 'transparent'
      case 'wind':
        return semantic.color.warning.default ?? 'transparent'
      default:
        return semantic.color.onSurface.muted ?? 'transparent'
    }
  }

  // Compact variant (for map overlay) - single line, minimal
  if (variant === 'compact') {
    const renderContent = (pressed: boolean): React.ReactNode => (
      <View
        style={[
          styles.card,
          styles.compactCard,
          {
            backgroundColor: isSelected
              ? `${semantic.color.primary.default}15`
              : semantic.color.surfaceVariant.default,
            borderColor: isSelected
              ? semantic.color.primary.default
              : semantic.color.border.default,
            opacity: pressed && !isSelected ? 0.8 : 1,
          },
          style,
        ]}
      >
        <View style={styles.compactContent}>
          {/* Badge row - compact */}
          <View style={styles.compactBadges}>
            {isBest && (
              <View
                style={[
                  styles.bestBadge,
                  styles.bestBadgeCompact,
                  { backgroundColor: `${semantic.color.primary.default}20` },
                ]}
              >
                <Text
                  style={[
                    styles.bestBadgeText,
                    styles.compactText,
                    { color: semantic.color.primary.default },
                  ]}
                >
                  ⭐
                </Text>
              </View>
            )}
            {weatherBadge && (
              <View
                style={[
                  styles.weatherBadge,
                  styles.weatherBadgeCompact,
                  {
                    backgroundColor: `${getWeatherColor(weatherBadge.type)}20`,
                  },
                ]}
              >
                <IconSymbol
                  name={getWeatherIcon(weatherBadge.type)}
                  size={10}
                  color={getWeatherColor(weatherBadge.type)}
                />
              </View>
            )}
          </View>

          {/* Route label - single line */}
          <Text
            style={[styles.compactLabel, { color: semantic.color.onSurface.default }]}
            numberOfLines={1}
          >
            {label}
          </Text>

          {/* Stats - compact */}
          <Text style={[styles.compactText, { color: semantic.color.onSurface.muted }]}>
            {distance} • {duration}
          </Text>
        </View>
      </View>
    )

    return onPress ? (
      <Pressable
        onPress={onPress}
        accessibilityLabel={`Route: ${label}`}
        accessibilityRole="button"
      >
        {({ pressed }) => renderContent(pressed)}
      </Pressable>
    ) : (
      renderContent(false)
    )
  }

  // Full variant (for chat transcript) - horizontal single-row layout
  const renderContent = (pressed: boolean): React.ReactNode => (
    <Pressable
      onPress={onPress}
      style={({ pressed: isPressed }) => [
        styles.card,
        styles.fullCard,
        {
          backgroundColor: isSelected
            ? `${semantic.color.primary.default}15`
            : semantic.color.surfaceVariant.default,
          borderColor: isSelected ? semantic.color.primary.default : semantic.color.border.default,
          opacity: isPressed && !isSelected ? 0.8 : 1,
        },
        style,
      ]}
    >
      {/* Single horizontal row - no overlap with chat */}
      <View style={styles.fullContent}>
        {/* Left: Best badge + Label */}
        <View style={styles.titleSection}>
          {isBest && (
            <View
              style={[styles.bestBadge, { backgroundColor: `${semantic.color.primary.default}20` }]}
            >
              <Text style={[styles.bestBadgeText, { color: semantic.color.primary.default }]}>
                ⭐
              </Text>
            </View>
          )}
          <Text
            style={[styles.fullLabel, { color: semantic.color.onSurface.default }]}
            numberOfLines={1}
          >
            {label}
          </Text>
        </View>

        {/* Center: Stats as icons with values */}
        <View style={styles.statsSection}>
          {/* Distance */}
          <View style={styles.statItem}>
            <IconSymbol
              name="map-marker-distance"
              size={12}
              color={semantic.color.onSurface.muted ?? 'transparent'}
            />
            <Text style={[styles.statValue, { color: semantic.color.onSurface.subtle }]}>
              {distance}
            </Text>
          </View>

          {/* Duration */}
          <View style={styles.statItem}>
            <IconSymbol
              name="clock-outline"
              size={12}
              color={semantic.color.onSurface.muted ?? 'transparent'}
            />
            <Text style={[styles.statValue, { color: semantic.color.onSurface.subtle }]}>
              {duration}
            </Text>
          </View>

          {/* Weather */}
          {weatherBadge && (
            <View style={[styles.statItem, styles.weatherStat]}>
              <IconSymbol
                name={getWeatherIcon(weatherBadge.type)}
                size={12}
                color={getWeatherColor(weatherBadge.type)}
              />
            </View>
          )}
        </View>

        {/* Right: Scenic score */}
        <View style={styles.scenicSection}>
          <IconSymbol name="leaf" size={12} color={semantic.color.primary.default} />
          <Text style={[styles.scenicValue, { color: semantic.color.primary.default }]}>
            {scenicScore}
          </Text>
        </View>
      </View>
    </Pressable>
  )

  return renderContent(false)
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
  },

  // Compact variant (map overlay)
  compactCard: {
    padding: 10,
    minWidth: 200,
  },
  compactContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compactBadges: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  bestBadgeCompact: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  weatherBadgeCompact: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  compactLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  compactText: {
    fontSize: 11,
  },

  // Full variant (chat transcript) - horizontal single-row
  fullCard: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    width: '100%',
  },
  fullContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  fullLabel: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  statsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 0,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statValue: {
    fontSize: 12,
    fontWeight: '500',
  },
  weatherStat: {
    // Weather badge gets special styling
  },
  scenicSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flexShrink: 0,
  },
  scenicValue: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Shared badge styles
  bestBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  bestBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  weatherBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
})
