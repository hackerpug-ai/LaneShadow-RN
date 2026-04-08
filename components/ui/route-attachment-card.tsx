import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  Pressable,
} from 'react-native';
import { IconSymbol } from './icon-symbol';
import { useSemanticTheme } from '../../hooks/use-semantic-theme';

export interface RouteAttachmentCardProps {
  id: string;
  label: string;
  description: string;
  distance: string;
  duration: string;
  scenicScore: number;
  weatherBadge?: {
    type: 'clear' | 'rain' | 'wind' | 'cloudy';
    text: string;
  };
  isBest?: boolean;
  isSelected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  /** Visual variant: 'compact' for map overlay (one-line), 'full' for chat transcript (detailed) */
  variant?: 'compact' | 'full';
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
  const { semantic } = useSemanticTheme();

  const getWeatherIcon = (type: RouteAttachmentCardProps['weatherBadge']['type']) => {
    switch (type) {
      case 'clear':
        return 'weather-sunny';
      case 'rain':
        return 'weather-rainy';
      case 'wind':
        return 'weather-windy';
      case 'cloudy':
        return 'weather-cloudy';
      default:
        return 'weather-partly-cloudy';
    }
  };

  // Compact variant (for map overlay) - single line, minimal
  if (variant === 'compact') {
    const renderContent = (pressed: boolean): React.ReactNode => (
      <View
        style={[
          styles.card,
          styles.compactCard,
          {
            backgroundColor: isSelected
              ? semantic.color.primary.default + '15'
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
              <View style={[styles.bestBadge, styles.bestBadgeCompact, { backgroundColor: semantic.color.primary.default + '20' }]}>
                <Text style={[styles.bestBadgeText, styles.compactText, { color: semantic.color.primary.default }]}>⭐</Text>
              </View>
            )}
            {weatherBadge && (
              <View
                style={[
                  styles.weatherBadge,
                  styles.weatherBadgeCompact,
                  {
                    backgroundColor:
                      weatherBadge.type === 'rain'
                        ? semantic.color.danger.default + '20'
                        : weatherBadge.type === 'wind'
                          ? semantic.color.warning.default + '20'
                          : semantic.color.surfaceVariant.pressed,
                  },
                ]}
              >
                <IconSymbol
                  name={getWeatherIcon(weatherBadge.type)}
                  size={10}
                  color={
                    weatherBadge.type === 'rain'
                      ? semantic.color.danger.default
                      : weatherBadge.type === 'wind'
                        ? semantic.color.warning.default
                        : semantic.color.onSurface.muted
                  }
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
    );

    return onPress ? (
      <Pressable onPress={onPress} accessibilityLabel={`Route: ${label}`} accessibilityRole="button">
        {({ pressed }) => renderContent(pressed)}
      </Pressable>
    ) : (
      renderContent(false)
    );
  }

  // Full variant (for chat transcript) - detailed, multi-line
  const renderContent = (pressed: boolean): React.ReactNode => (
    <View
      style={[
        styles.card,
        styles.fullCard,
        {
          backgroundColor: isSelected
            ? semantic.color.primary.default + '15'
            : semantic.color.surfaceVariant.default,
          borderColor: isSelected
            ? semantic.color.primary.default
            : semantic.color.border.default,
          opacity: pressed && !isSelected ? 0.8 : 1,
        },
        style,
      ]}
    >
      {/* Header with badges and title */}
      <View style={styles.fullHeader}>
        <Text
          style={[styles.fullLabel, { color: semantic.color.onSurface.default }]}
          numberOfLines={1}
        >
          {label}
        </Text>

        {/* Badge row */}
        <View style={styles.badgeRow}>
          {isBest && (
            <View style={[styles.bestBadge, { backgroundColor: semantic.color.primary.default + '20' }]}>
              <Text style={[styles.bestBadgeText, { color: semantic.color.primary.default }]}>⭐ Best</Text>
            </View>
          )}
          {weatherBadge && (
            <View
              style={[
                styles.weatherBadge,
                {
                  backgroundColor:
                    weatherBadge.type === 'rain'
                      ? semantic.color.danger.default + '20'
                      : weatherBadge.type === 'wind'
                        ? semantic.color.warning.default + '20'
                        : semantic.color.surfaceVariant.pressed,
                },
              ]}
            >
              <IconSymbol
                name={getWeatherIcon(weatherBadge.type)}
                size={14}
                color={
                  weatherBadge.type === 'rain'
                    ? semantic.color.danger.default
                    : weatherBadge.type === 'wind'
                      ? semantic.color.warning.default
                      : semantic.color.onSurface.muted
                }
              />
              <Text
                style={[
                  styles.weatherBadgeText,
                  {
                    color:
                      weatherBadge.type === 'rain'
                        ? semantic.color.danger.default
                        : weatherBadge.type === 'wind'
                          ? semantic.color.warning.default
                          : semantic.color.onSurface.muted,
                  },
                ]}
              >
                {weatherBadge.text}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Description */}
      {description && (
        <Text style={[styles.routeDescription, { color: semantic.color.onSurface.subtle }]} numberOfLines={2}>
          {description}
        </Text>
      )}

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <IconSymbol name="map-marker-distance" size={14} color={semantic.color.onSurface.muted} />
          <Text style={[styles.statText, { color: semantic.color.onSurface.subtle }]}>
            {distance}
          </Text>
        </View>
        <View style={styles.statItem}>
          <IconSymbol name="clock-outline" size={14} color={semantic.color.onSurface.muted} />
          <Text style={[styles.statText, { color: semantic.color.onSurface.subtle }]}>
            {duration}
          </Text>
        </View>
        <View style={styles.statItem}>
          <IconSymbol name="leaf" size={14} color={semantic.color.primary.default} />
          <Text style={[styles.statText, { color: semantic.color.onSurface.subtle }]}>
            Scenic: {scenicScore}/10
          </Text>
        </View>
      </View>
    </View>
  );

  return onPress ? (
    <Pressable onPress={onPress} accessibilityLabel={`Route: ${label}`} accessibilityRole="button">
      {({ pressed }) => renderContent(pressed)}
    </Pressable>
  ) : (
    renderContent(false)
  );
};

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

  // Full variant (chat transcript)
  fullCard: {
    padding: 14,
    gap: 12,
  },
  fullHeader: {
    gap: 8,
  },
  fullLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  routeDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 13,
    fontWeight: '500',
  },

  // Shared badge styles
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  bestBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bestBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  weatherBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  weatherBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
