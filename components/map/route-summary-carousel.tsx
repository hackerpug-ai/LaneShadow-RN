/**
 * RouteSummaryCarousel
 *
 * Single-card carousel that pages through distinct route options.
 * Replaces the per-variant stack in the plan view.
 *
 * Design: DESIGN-S01-005 (route-carousel-card-spec.md)
 * - One route-summary card at a time, centered above the chat input
 * - Flanked by left/right carousel arrows (‹ › navigation)
 * - Arrows hidden when only one distinct route exists
 * - Arrows disabled at the ends of the list
 * - Tapping the card opens RouteDetailsSheet
 * - Paging updates selectedRouteId via onRouteChange callback
 *
 * Styling: All colors/spacing via useSemanticTheme() — no hardcoded hex.
 * Glass scrim background applied to the card wrapper (surface.glass token).
 *
 * Touch targets: 44pt min (semantic.control.minTouchTarget) on arrows.
 * testIDs: route-carousel-container, route-carousel-card,
 *          route-carousel-arrow-prev, route-carousel-arrow-next
 */

import type React from 'react'
import { useCallback, useState } from 'react'
import { type AccessibilityState, Pressable, StyleSheet, View } from 'react-native'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import type { PlannedRouteOptionView } from '../../shared/types/routes'
import { RouteAttachmentCard } from '../chat/route-attachment-card'
import { IconSymbol } from '../ui/icon-symbol'

export interface RouteSummaryCarouselProps {
  /**
   * De-duplicated list of distinct route options to page through.
   * The caller is responsible for deduplication.
   * When empty or undefined, the carousel renders nothing.
   */
  distinctRoutes: PlannedRouteOptionView[]

  /**
   * The currently selected route ID used to highlight the active card.
   * Passed through to RouteAttachmentCard isSelected prop.
   */
  selectedRouteId: string | null

  /**
   * Called when the rider taps the card body to open RouteDetailsSheet.
   * Does NOT send a chat message.
   */
  onCardPress: (routeId: string) => void

  /**
   * Callback when the selected route changes via arrow paging.
   * Parent should update its own selectedRouteId accordingly.
   */
  onRouteChange?: (routeId: string) => void

  /**
   * Whether any active route exists in the session.
   * When false, the carousel renders nothing (whole widget is hidden).
   */
  hasActiveRoute: boolean

  /**
   * Bottom offset to clear the chat input bar.
   * Pass insets.bottom + chatInputHeight (≈80pt).
   */
  bottomOffset: number
}

export const RouteSummaryCarousel: React.FC<RouteSummaryCarouselProps> = ({
  distinctRoutes,
  selectedRouteId,
  onCardPress,
  onRouteChange,
  hasActiveRoute,
  bottomOffset,
}) => {
  const { semantic } = useSemanticTheme()

  // Local paging state: index into distinctRoutes array
  const [currentIndex, setCurrentIndex] = useState(0)

  // All hooks MUST be called before any early returns
  const isFirstRoute = currentIndex === 0
  const isLastRoute = distinctRoutes.length > 0 ? currentIndex === distinctRoutes.length - 1 : false
  const showArrows = distinctRoutes.length > 1

  // Navigate to previous route
  const handlePrev = useCallback(() => {
    if (isFirstRoute) return // No-op at the start
    const newIndex = currentIndex - 1
    setCurrentIndex(newIndex)
    const newRoute = distinctRoutes[newIndex]
    if (newRoute && onRouteChange) {
      onRouteChange(newRoute.routeOptionId)
    }
  }, [currentIndex, distinctRoutes, isFirstRoute, onRouteChange])

  // Navigate to next route
  const handleNext = useCallback(() => {
    if (isLastRoute) return // No-op at the end
    const newIndex = currentIndex + 1
    setCurrentIndex(newIndex)
    const newRoute = distinctRoutes[newIndex]
    if (newRoute && onRouteChange) {
      onRouteChange(newRoute.routeOptionId)
    }
  }, [currentIndex, distinctRoutes, isLastRoute, onRouteChange])

  // Hide if no active route or no options
  if (!hasActiveRoute || !distinctRoutes || distinctRoutes.length === 0) {
    return null
  }

  const currentRoute = distinctRoutes[currentIndex]
  if (!currentRoute) {
    return null
  }

  // Determine accessibility state for arrows
  const prevAccessibilityState: AccessibilityState = {
    disabled: isFirstRoute,
  }

  const nextAccessibilityState: AccessibilityState = {
    disabled: isLastRoute,
  }

  return (
    <View
      testID="route-carousel-container"
      style={[
        styles.container,
        {
          bottom: bottomOffset,
        },
      ]}
      accessibilityLabel={`Route ${currentIndex + 1} of ${distinctRoutes.length}`}
    >
      <View
        style={[
          styles.contentRow,
          {
            paddingHorizontal: semantic.space.lg,
            gap: semantic.space.xs,
          },
        ]}
      >
        {/* Left arrow (‹) */}
        {showArrows && (
          <Pressable
            testID="route-carousel-arrow-prev"
            onPress={handlePrev}
            disabled={isFirstRoute}
            accessibilityRole="button"
            accessibilityLabel="Previous route"
            accessibilityHint="Pages to the previous route option"
            accessibilityState={prevAccessibilityState}
            style={({ pressed }) => ({
              width: 44,
              height: 44,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed && !isFirstRoute ? 0.8 : 1,
            })}
          >
            <IconSymbol
              name="chevron-left"
              size={24}
              color={
                isFirstRoute ? semantic.color.onSurface.muted : semantic.color.onSurface.default
              }
            />
          </Pressable>
        )}

        {/* Route summary card — glass scrim wrapper + RouteAttachmentCard */}
        <View
          style={[
            styles.cardWrapper,
            {
              backgroundColor: semantic.color.surface.default,
              borderColor: semantic.color.border.default,
              borderWidth: StyleSheet.hairlineWidth,
              borderRadius: semantic.radius.md,
              ...semantic.elevation[2],
            },
          ]}
        >
          <RouteAttachmentCard
            route={currentRoute}
            isSelected={currentRoute.routeOptionId === selectedRouteId}
            onSelect={onCardPress}
            testID="route-carousel-card"
            variant="compact"
            includeFavorites={false}
          />
        </View>

        {/* Right arrow (›) */}
        {showArrows && (
          <Pressable
            testID="route-carousel-arrow-next"
            onPress={handleNext}
            disabled={isLastRoute}
            accessibilityRole="button"
            accessibilityLabel="Next route"
            accessibilityHint="Pages to the next route option"
            accessibilityState={nextAccessibilityState}
            style={({ pressed }) => ({
              width: 44,
              height: 44,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed && !isLastRoute ? 0.8 : 1,
            })}
          >
            <IconSymbol
              name="chevron-right"
              size={24}
              color={
                isLastRoute ? semantic.color.onSurface.muted : semantic.color.onSurface.default
              }
            />
          </Pressable>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 15, // Same tier as the old routeCards layer
    pointerEvents: 'box-none',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardWrapper: {
    flex: 1,
  },
})
