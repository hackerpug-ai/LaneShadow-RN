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
  compact?: boolean;
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
  compact = false,
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

  const Container = onPress ? Pressable : View;
  const renderContent = (pressed: boolean): React.ReactNode => (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isSelected
            ? semantic.color.primary.default + '15'
            : semantic.color.surfaceVariant.default,
          borderColor: isSelected
            ? semantic.color.primary.default
            : semantic.color.border.default,
          opacity: pressed && !isSelected ? 0.8 : 1,
        },
        compact && styles.compactCard,
        style,
      ]}
    >
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
              size={compact ? 12 : 14}
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
                compact && styles.compactText,
              ]}
            >
              {weatherBadge.text}
            </Text>
          </View>
        )}
      </View>

      {/* Route info */}
      <Text
        style={[
          styles.routeLabel,
          { color: semantic.color.onSurface.default },
          compact && styles.compactLabel,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>

      {!compact && (
        <Text
          style={[styles.routeDescription, { color: semantic.color.onSurface.subtle }]}
          numberOfLines={2}
        >
          {description}
        </Text>
      )}

      {/* Stats */}
      <View style={styles.stats}>
        <Text
          style={[
            styles.stat,
            { color: semantic.color.onSurface.muted },
            compact && styles.compactText,
          ]}
        >
          {distance} • {duration} • Scenic: {scenicScore}/10
        </Text>
      </View>
    </View>
  );

  const content = renderContent(false);

  return onPress ? (
    <Pressable
      onPress={onPress}
      accessibilityLabel={`Route: ${label}`}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: isSelected
            ? semantic.color.primary.default + '15'
            : semantic.color.surfaceVariant.default,
          borderColor: isSelected
            ? semantic.color.primary.default
            : semantic.color.border.default,
          opacity: pressed && !isSelected ? 0.8 : 1,
        },
        compact && styles.compactCard,
        style,
      ]}
    >
      {content}
    </Pressable>
  ) : (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isSelected
            ? semantic.color.primary.default + '15'
            : semantic.color.surfaceVariant.default,
          borderColor: isSelected
            ? semantic.color.primary.default
            : semantic.color.border.default,
        },
        compact && styles.compactCard,
        style,
      ]}
    >
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    gap: 10,
  },
  compactCard: {
    padding: 10,
    gap: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
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
  routeLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  compactLabel: {
    fontSize: 14,
  },
  routeDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  stats: {
    marginTop: 2,
  },
  stat: {
    fontSize: 13,
    fontWeight: '500',
  },
  compactText: {
    fontSize: 11,
  },
});
