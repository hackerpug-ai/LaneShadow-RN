/**
 * RouteOptionCard Component
 *
 * Card displaying a route option with name, badges, stats, weather summary
 * Supports selected and compact variants
 * Follows the design system card patterns
 */

import { StyleSheet, View } from 'react-native'
import { Text, useTheme } from 'react-native-paper'
import type { ExtendedTheme } from '../../styles/types'
import { IconSymbol, type IconName } from './icon-symbol'
import { RouteBadge } from './route-badge'
import { StatRow } from './stat-row'
import { WeatherPill } from './weather-pill'

export type RouteOptionCardVariant = 'selected' | 'compact'

export type RouteOptionCardProps = {
  /** Route name */
  name: string
  /** Card variant */
  variant?: RouteOptionCardVariant
  /** Optional badges */
  badges?: Array<{ icon?: IconName; label: string; variant?: 'primary' | 'neutral' }>
  /** Optional stats */
  stats?: Array<{ icon: IconName; value: string }>
  /** Optional weather summary */
  weatherSummary?: string
  /** Optional weather icon */
  weatherIcon?: IconName
  /** Compact row display (for variant="compact") */
  compactStats?: string
}

/**
 * RouteOptionCard component for displaying route options
 * Shows route details with badges, stats, and weather information
 */
export const RouteOptionCard = ({
  name,
  variant = 'selected',
  badges = [],
  stats = [],
  weatherSummary,
  weatherIcon = 'air' as IconName,
  compactStats,
}: RouteOptionCardProps) => {
  const theme = useTheme<ExtendedTheme>()
  const { semantic } = theme

  const isSelected = variant === 'selected'
  const isCompact = variant === 'compact'

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: semantic.color.card.default,
          borderColor: isSelected
            ? semantic.color.primary.default
            : 'rgba(255, 255, 255, 0.05)',
          borderWidth: isSelected ? 2 : 1,
          padding: isCompact ? 12 : 16,
          opacity: isCompact ? 0.8 : 1,
        },
      ]}
    >
      {isCompact ? (
        <View style={styles.compactRow}>
          <Text
            style={[
              styles.compactName,
              { color: semantic.color.onSurface.default },
            ]}
          >
            {name}
          </Text>
          <Text
            style={[
              styles.compactStats,
              { color: semantic.color.onSurface.subtle },
            ]}
          >
            {compactStats}
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.cardHeader}>
            <View>
              <Text
                style={[
                  styles.routeName,
                  { color: semantic.color.onSurface.default },
                ]}
              >
                {name}
              </Text>
              {badges.length > 0 && (
                <View style={styles.badges}>
                  {badges.map((badge, index) => (
                    <RouteBadge
                      key={index}
                      icon={badge.icon}
                      variant={badge.variant}
                    >
                      {badge.label}
                    </RouteBadge>
                  ))}
                </View>
              )}
            </View>
          </View>

          {stats.length > 0 && (
            <View style={styles.statsRow}>
              {stats.map((stat, index) => (
                <StatRow key={index} icon={stat.icon} value={stat.value} />
              ))}
            </View>
          )}

          {weatherSummary && (
            <WeatherPill icon={weatherIcon} description={weatherSummary} />
          )}
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  routeName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  compactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  compactName: {
    fontSize: 16,
    fontWeight: '500',
  },
  compactStats: {
    fontSize: 14,
  },
})
