/**
 * SavedRoutesScreen Component
 *
 * Screen displaying saved motorcycle routes with search functionality
 * Uses SubpageLayout for proper safe area handling and navigation
 * Composes SavedRouteCard, RouteThumbnail, SearchBar, FAB atoms
 * Follows the design system screen patterns
 */

import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { Text, useTheme } from 'react-native-paper'
import type { ExtendedTheme } from '../../styles/types'
import { SubpageLayout } from '../layouts/subpage-layout'
import { SavedRouteCard } from '../ui/saved-route-card'
import { SearchBar } from '../ui/search-bar'

export type SavedRouteData = {
  id: string
  name: string
  path: string
  duration?: string
  distance?: string
  thumbnailRotation?: number
}

export type SavedRoutesScreenProps = {
  /** Saved routes to display */
  routes: SavedRouteData[]
  /** Search query */
  searchQuery?: string
  /** Search change handler */
  onSearchChange?: (query: string) => void
  /** Route press handler */
  onPressRoute?: (routeId: string) => void
  /** Add new route handler */
  onPressAdd?: () => void
  /** Loading state */
  loading?: boolean
  /** Empty state message */
  emptyMessage?: string
  /** Empty state subtext */
  emptySubtext?: string
  /** Test ID for testing */
  testID?: string
}

/**
 * SavedRoutesScreen component for displaying saved motorcycle routes
 * Shows a list of saved routes with search functionality and FAB for adding new routes
 * Uses SubpageLayout for proper navigation and safe area handling
 */
export const SavedRoutesScreen = ({
  routes,
  searchQuery = '',
  onSearchChange,
  onPressRoute,
  onPressAdd,
  loading = false,
  emptyMessage = 'No saved routes',
  emptySubtext = 'Create your first motorcycle adventure',
  testID,
}: SavedRoutesScreenProps) => {
  const theme = useTheme<ExtendedTheme>()
  const { semantic } = theme

  const filteredRoutes = searchQuery
    ? routes.filter(
        (route) =>
          route.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          route.path.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : routes

  const handlePressRoute = (routeId: string) => {
    if (onPressRoute) {
      onPressRoute(routeId)
    }
  }

  return (
    <SubpageLayout
      title="Saved Routes"
      testID={testID || 'saved-routes-screen'}
      rightAction={
        onPressAdd
          ? {
              icon: 'plus',
              onPress: onPressAdd,
              testID: testID ? `${testID}-add` : 'saved-routes-add',
            }
          : undefined
      }
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: semantic.space.lg }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Route count subtitle */}
        <View style={styles.subtitleContainer}>
          <Text variant="bodyMedium" style={{ color: semantic.color.onSurface.subtle }}>
            {routes.length} {routes.length === 1 ? 'route' : 'routes'}
          </Text>
        </View>

        <View style={styles.searchContainer}>
          <SearchBar
            placeholder="Search routes..."
            value={searchQuery}
            onPress={() => {
              /* Search expansion would go here */
            }}
          />
        </View>

        {loading ? (
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
        ) : filteredRoutes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyThumbnail, { borderColor: semantic.color.divider.default }]}>
              <View style={[styles.emptyRoute, { borderColor: semantic.color.divider.default }]} />
            </View>
            <View style={styles.emptyTextContainer}>
              <View
                style={[styles.emptyLine, { backgroundColor: semantic.color.onSurface.muted }]}
              />
              <View
                style={[
                  styles.emptyLine,
                  styles.emptyLineShort,
                  { backgroundColor: semantic.color.onSurface.subtle },
                ]}
              />
            </View>
          </View>
        ) : (
          <View style={styles.routesList}>
            {filteredRoutes.map((route) => (
              <Pressable
                key={route.id}
                onPress={() => handlePressRoute(route.id)}
                accessibilityRole="button"
                accessibilityLabel={`View ${route.name}`}
              >
                <SavedRouteCard
                  name={route.name}
                  path={route.path}
                  duration={route.duration}
                  distance={route.distance}
                  onPress={() => handlePressRoute(route.id)}
                  thumbnailRotation={route.thumbnailRotation}
                />
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </SubpageLayout>
  )
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 16,
  },
  subtitleContainer: {
    marginBottom: 8,
  },
  searchContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  routesList: {
    gap: 12,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    gap: 16,
  },
  emptyThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyRoute: {
    width: 40,
    height: 30,
    borderRadius: 8,
    borderWidth: 2,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    transform: [{ rotate: '-10deg' }],
  },
  emptyTextContainer: {
    alignItems: 'center',
    gap: 8,
  },
  emptyLine: {
    height: 12,
    borderRadius: 6,
    width: 160,
  },
  emptyLineShort: {
    width: 120,
  },
})
