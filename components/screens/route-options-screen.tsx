/**
 * RouteOptionsScreen Component
 *
 * Screen displaying route options with weather safety overlays
 * Composes RouteOptionCard, WeatherPill, StatRow, RouteBadge, PrimaryButton, SectionHeader atoms
 * Follows the design system screen patterns
 */

import { StyleSheet, View, ScrollView, Pressable } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from 'react-native-paper'
import type { ExtendedTheme } from '../../styles/types'
import { RouteOptionCard } from '../ui/route-option-card'
import { PrimaryButton } from '../ui/primary-button'
import { SectionHeader } from '../ui/section-header'
import type { IconName } from '../ui/icon-symbol'

export type RouteOptionData = {
  id: string
  name: string
  variant: 'selected' | 'compact'
  badges?: Array<{ icon?: IconName; label: string; variant?: 'primary' | 'neutral' }>
  stats?: Array<{ icon: IconName; value: string }>
  weatherSummary?: string
  weatherIcon?: IconName
  compactStats?: string
}

export type RouteOptionsScreenProps = {
  /** Route options to display */
  routes: RouteOptionData[]
  /** Currently selected route ID */
  selectedRouteId?: string
  /** Route selection handler */
  onSelectRoute?: (routeId: string) => void
  /** Start navigation handler */
  onStartNavigation?: () => void
  /** Back handler */
  onBack?: () => void
  /** Loading state */
  loading?: boolean
  /** Error state */
  error?: string | null
}

/**
 * RouteOptionsScreen component for displaying route options with weather overlays
 * Shows a list of route options with stats, badges, and weather information
 */
export const RouteOptionsScreen = ({
  routes,
  selectedRouteId,
  onSelectRoute,
  onStartNavigation,
  onBack,
  loading = false,
  error = null,
}: RouteOptionsScreenProps) => {
  const theme = useTheme<ExtendedTheme>()
  const { semantic } = theme
  const insets = useSafeAreaInsets()

  const selectedRoute = routes.find((r) => r.id === selectedRouteId) || routes[0]

  const handleSelectRoute = (routeId: string) => {
    if (onSelectRoute) {
      onSelectRoute(routeId)
    }
  }

  const handleStartNavigation = () => {
    if (onStartNavigation && selectedRoute) {
      onStartNavigation()
    }
  }

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          styles.centered,
          { backgroundColor: semantic.color.background.default },
        ]}
      >
        <View style={styles.loadingContainer}>
          <View
            style={[
              styles.spinner,
              {
                borderTopColor: semantic.color.primary.default,
              },
            ]}
          />
        </View>
      </View>
    )
  }

  if (error) {
    return (
      <View
        style={[
          styles.container,
          styles.centered,
          { backgroundColor: semantic.color.background.default },
        ]}
      >
        <View style={styles.errorContainer}>
          <View style={styles.errorContent}>
            <View
              style={[
                styles.errorIcon,
                { backgroundColor: semantic.color.danger.default + '26' }, // Add 15% alpha
              ]}
            >
              <View style={[styles.errorDot, { backgroundColor: semantic.color.danger.default }]} />
            </View>
            <View style={styles.errorTextContainer}>
              <View style={[styles.errorLine, { backgroundColor: semantic.color.onSurface.muted }]} />
              <View style={[styles.errorLine, { backgroundColor: semantic.color.onSurface.muted }, styles.errorLineShort]} />
            </View>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: semantic.color.background.default,
          paddingBottom: insets.bottom + semantic.space.lg,
        },
      ]}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: semantic.space.lg },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <SectionHeader
          title="Route Options"
          subtitle={`${routes.length} routes found`}
        />

        <View style={styles.routesList}>
          {routes.map((route) => (
            <Pressable
              key={route.id}
              onPress={() => handleSelectRoute(route.id)}
              accessibilityRole="button"
              accessibilityLabel={`Select ${route.name}`}
              accessibilityState={{ selected: route.id === selectedRouteId }}
            >
              <RouteOptionCard
                name={route.name}
                variant={
                  route.id === selectedRouteId ? 'selected' : 'compact'
                }
                badges={route.badges}
                stats={route.stats}
                weatherSummary={route.weatherSummary}
                weatherIcon={route.weatherIcon}
                compactStats={route.compactStats}
              />
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <View
        style={[
          styles.bottomBar,
          {
            paddingHorizontal: semantic.space.lg,
            paddingBottom: semantic.space.md,
            borderTopColor: semantic.color.divider.default,
          },
        ]}
      >
        <PrimaryButton
          onPress={handleStartNavigation}
          icon="navigation"
          disabled={!selectedRoute}
        >
          Start Navigation
        </PrimaryButton>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 16,
  },
  routesList: {
    gap: 12,
    marginTop: 16,
  },
  bottomBar: {
    borderTopWidth: 1,
    paddingTop: 12,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  errorIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  errorTextContainer: {
    flex: 1,
  },
  errorLine: {
    height: 12,
    borderRadius: 6,
    marginBottom: 6,
  },
  errorLineShort: {
    width: '60%',
    alignSelf: 'flex-start',
  },
})
