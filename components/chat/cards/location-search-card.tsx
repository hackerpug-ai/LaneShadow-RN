/**
 * LocationSearchCard
 *
 * Renders location search results (from searchNearby / searchAlongRoute)
 * as a structured card in the chat transcript.
 *
 * States:
 *   running    → "Searching..." with pulsing dot
 *   complete   → 1-5 place result rows with type badges
 *   failed     → red-tinted error message
 */

import { useEffect, useMemo, useRef } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'

import { useSemanticTheme } from '../../../hooks/use-semantic-theme'
import { useSearchResults, type LocationSearchResult } from '../../../contexts/search-results'
import { Badge, type BadgeVariant } from '../../ui/badge'
import type { CardProps } from '../card-registry'

// ---------------------------------------------------------------------------
// Place type mapping
// ---------------------------------------------------------------------------

const PLACE_TYPE_MAP: Record<string, { label: string; variant: BadgeVariant }> = {
  gas_station: { label: 'Gas', variant: 'warning' },
  restaurant: { label: 'Food', variant: 'success' },
  cafe: { label: 'Coffee', variant: 'info' },
  coffee_shop: { label: 'Coffee', variant: 'info' },
  lodging: { label: 'Stay', variant: 'secondary' },
  hotel: { label: 'Stay', variant: 'secondary' },
  tourist_attraction: { label: 'Scenic', variant: 'default' },
  point_of_interest: { label: 'POI', variant: 'default' },
  park: { label: 'Park', variant: 'success' },
  parking: { label: 'Parking', variant: 'secondary' },
  car_repair: { label: 'Repair', variant: 'warning' },
  convenience_store: { label: 'Store', variant: 'secondary' },
}

function getPlaceTypeBadge(types?: string[]): { label: string; variant: BadgeVariant } {
  if (!types?.length) return { label: 'Place', variant: 'outline' }

  for (const t of types) {
    const mapped = PLACE_TYPE_MAP[t]
    if (mapped) return mapped
  }

  // Fallback: capitalize first type, strip underscores
  const fallback = types[0].replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  return { label: fallback, variant: 'outline' }
}

// ---------------------------------------------------------------------------
// Pulsing dot (matches PlanningCard / ReasoningCard pattern)
// ---------------------------------------------------------------------------

const PulsingDot = ({ reduceMotion, color }: { reduceMotion: boolean; color: string }) => {
  const opacity = useSharedValue(reduceMotion ? 0.7 : 0.4)

  useEffect(() => {
    if (reduceMotion) {
      opacity.value = 0.7
      return
    }
    opacity.value = withRepeat(
      withSequence(withTiming(1.0, { duration: 600 }), withTiming(0.4, { duration: 600 })),
      -1,
      false
    )
  }, [reduceMotion, opacity])

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }))

  return (
    <Animated.View
      style={[styles.pulsingDot, { backgroundColor: color }, animatedStyle]}
      testID="location-search-card-pulsing-dot"
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  )
}

// ---------------------------------------------------------------------------
// PlaceResultRow
// ---------------------------------------------------------------------------

type PlaceResultRowProps = {
  result: LocationSearchResult
  index: number
  isSelected: boolean
  onPress: (id: string) => void
}

const PlaceResultRow = ({ result, index, isSelected, onPress }: PlaceResultRowProps) => {
  const { semantic } = useSemanticTheme()
  const badge = getPlaceTypeBadge(result.types)

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onPress(result.id)
  }

  // Format distance
  const distanceLabel = result.distanceMeters
    ? result.distanceMeters >= 1000
      ? `${(result.distanceMeters / 1000).toFixed(1)} km`
      : `${Math.round(result.distanceMeters)} m`
    : null

  return (
    <Pressable
      onPress={handlePress}
      testID={`location-search-result-${index}`}
      accessibilityRole="button"
      accessibilityLabel={`${result.name}, ${result.address}`}
      style={({ pressed }) => [
        styles.resultRow,
        {
          backgroundColor: isSelected
            ? semantic.color.info.default + '1A'
            : pressed
              ? semantic.color.surfaceVariant.default
              : 'transparent',
          borderRadius: semantic.radius.md,
          paddingVertical: semantic.space.sm,
          paddingHorizontal: semantic.space.sm,
        },
      ]}
    >
      {/* Numbered circle */}
      <View
        style={[
          styles.indexCircle,
          {
            backgroundColor: isSelected
              ? semantic.color.info.default
              : semantic.color.info.default + '26',
            width: 28,
            height: 28,
            borderRadius: 14,
          },
        ]}
      >
        <Text
          style={[
            semantic.type.label.sm,
            {
              color: isSelected
                ? semantic.color.onPrimary.default
                : semantic.color.info.default,
              fontWeight: '700',
            },
          ]}
        >
          {index}
        </Text>
      </View>

      {/* Center content */}
      <View style={styles.resultContent}>
        <View style={styles.nameRow}>
          <Text
            style={[
              semantic.type.body.md,
              { color: semantic.color.onSurface.default, fontWeight: '600', flexShrink: 1 },
            ]}
            numberOfLines={1}
          >
            {result.name}
          </Text>
          <Badge variant={badge.variant} opacity={0.8}>
            {badge.label}
          </Badge>
        </View>
        <Text
          style={[
            semantic.type.body.sm,
            { color: semantic.color.muted.default },
          ]}
          numberOfLines={1}
        >
          {result.address}
        </Text>
      </View>

      {/* Right info */}
      <View style={styles.rightInfo}>
        {result.detourMinutes !== null && result.detourMinutes !== undefined && result.detourMinutes > 0 && (
          <Text
            style={[
              semantic.type.label.sm,
              { color: semantic.color.warning.default, fontWeight: '600' },
            ]}
          >
            +{result.detourMinutes} min
          </Text>
        )}
        {distanceLabel && (
          <Text
            style={[
              semantic.type.label.sm,
              { color: semantic.color.muted.default },
            ]}
          >
            {distanceLabel}
          </Text>
        )}
      </View>
    </Pressable>
  )
}

// ---------------------------------------------------------------------------
// LocationSearchCard
// ---------------------------------------------------------------------------

export const LocationSearchCard = ({ message, attachments, onViewOnMap }: CardProps) => {
  const { semantic } = useSemanticTheme()
  const reduceMotion = useReducedMotion()
  const { setResults, selectedResultId, setSelectedResultId } = useSearchResults()
  const hasPopulatedRef = useRef(false)

  // Parse search query from message content (agent text summary)
  const contentText = message.content || ''

  // Extract results from attachment (memoized for stable reference)
  const locationResults: LocationSearchResult[] = useMemo(() => {
    const searchAttachment = attachments?.find((a) => a.type === 'location_search')
    return searchAttachment && 'results' in searchAttachment
      ? (searchAttachment.results as LocationSearchResult[])
      : []
  }, [attachments])

  // Populate map markers on first complete render (once per card instance)
  useEffect(() => {
    if (message.status === 'complete' && locationResults.length > 0 && !hasPopulatedRef.current) {
      hasPopulatedRef.current = true
      setResults(locationResults)
    }
  }, [message.status, locationResults, setResults])

  const handleResultPress = (id: string) => {
    setSelectedResultId(id)
    onViewOnMap?.()
  }

  // ---------------------------------------------------------------------------
  // Running state
  // ---------------------------------------------------------------------------
  if (message.status === 'running' || message.status === 'streaming') {
    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: semantic.color.surfaceVariant.default,
            borderRadius: semantic.radius.md,
            padding: semantic.space.md,
          },
        ]}
        testID="location-search-card-running"
        accessibilityLiveRegion="polite"
        accessibilityLabel="Searching for places"
      >
        <View style={styles.runningRow}>
          <PulsingDot reduceMotion={!!reduceMotion} color={semantic.color.info.default} />
          <Text
            style={[
              semantic.type.body.sm,
              { color: semantic.color.muted.default, marginLeft: semantic.space.sm },
            ]}
          >
            Searching nearby places...
          </Text>
        </View>
      </View>
    )
  }

  // ---------------------------------------------------------------------------
  // Failed state
  // ---------------------------------------------------------------------------
  if (message.status === 'failed') {
    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: semantic.color.danger.default + '1A',
            borderRadius: semantic.radius.md,
            padding: semantic.space.md,
            borderWidth: 1,
            borderColor: semantic.color.danger.default + '4D',
          },
        ]}
        testID="location-search-card-failed"
        accessibilityLiveRegion="polite"
        accessibilityLabel="Search failed"
      >
        <Text style={[semantic.type.body.sm, { color: semantic.color.danger.default }]}>
          {contentText || 'Search failed.'}
        </Text>
      </View>
    )
  }

  // ---------------------------------------------------------------------------
  // Complete state — results list
  // ---------------------------------------------------------------------------
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: semantic.color.surfaceVariant.default,
          borderRadius: semantic.radius.md,
          overflow: 'hidden',
        },
      ]}
      testID="location-search-card-complete"
    >
      {/* Header text (agent's conversational summary) */}
      {contentText.length > 0 && (
        <View style={{ paddingHorizontal: semantic.space.md, paddingTop: semantic.space.md, paddingBottom: semantic.space.xs }}>
          <Text
            style={[
              semantic.type.body.sm,
              { color: semantic.color.onSurface.default },
            ]}
          >
            {contentText}
          </Text>
        </View>
      )}

      {/* Results */}
      <View style={{ paddingHorizontal: semantic.space.xs, paddingBottom: semantic.space.xs }}>
        {locationResults.map((result, i) => (
          <PlaceResultRow
            key={result.id}
            result={result}
            index={i + 1}
            isSelected={result.id === selectedResultId}
            onPress={handleResultPress}
          />
        ))}
      </View>

      {/* Empty state */}
      {locationResults.length === 0 && (
        <View style={{ padding: semantic.space.md }}>
          <Text
            style={[
              semantic.type.body.sm,
              { color: semantic.color.muted.default },
            ]}
          >
            No places found.
          </Text>
        </View>
      )}
    </View>
  )
}

LocationSearchCard.displayName = 'LocationSearchCard'

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  card: {
    minWidth: '90%',
  },
  runningRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  indexCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultContent: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rightInfo: {
    alignItems: 'flex-end',
    gap: 2,
    minWidth: 50,
  },
})
