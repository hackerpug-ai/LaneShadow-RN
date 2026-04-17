/**
 * Route Directions Sheet Component
 * Displays turn-by-turn route directions in a bottom sheet with scrollable content
 * and fixed footer with Close and Navigate actions
 *
 * Features:
 * - Scrollable list of turn-by-step instructions
 * - Each step shows instruction text, distance, and duration
 * - Fixed footer with Close and Navigate buttons
 * - Navigate opens external maps (Google Maps or Apple Maps)
 * - Uses semantic theme tokens
 * - Glassmorphic design matching project aesthetic
 */

import { BottomSheetScrollView } from '@gorhom/bottom-sheet'
import { useMemo } from 'react'
import { Linking, Platform, Pressable, StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { RouteLeg } from '../../../server/models/saved-routes'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { Button } from '../ui/button'
import { IconSymbol } from '../ui/icon-symbol'
import { BottomSheetWrapper } from './bottom-sheet-wrapper'

export type RouteDirectionsSheetProps = {
  isVisible: boolean
  onClose: () => void
  routeLabel: string
  legs: RouteLeg[]
  destinationLabel?: string
  testID?: string
  /** Called when a leg is pressed */
  onLegSelect?: (legIndex: number) => void
  /** Index of the currently selected leg */
  selectedLegIndex?: number
}

/**
 * Format distance for display
 */
const formatDistance = (meters: number): string => {
  const miles = meters * 0.000621371
  if (miles < 1) {
    return `${Math.round(meters * 3.28084)}ft`
  }
  return `${miles.toFixed(1)}mi`
}

/**
 * Format duration for display
 */
const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

/**
 * Generate external map URL for navigation
 * Uses Google Maps on Android, Apple Maps on iOS
 */
const getMapUrl = (destination: { lat: number; lng: number; label?: string }): string => {
  const { lat, lng, label } = destination
  const query = label ? `${label}` : `${lat},${lng}`

  if (Platform.OS === 'ios') {
    // Apple Maps URL scheme
    return `http://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`
  } else {
    // Google Maps URL scheme
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${query}`
  }
}

/**
 * Generate a human-readable summary for a leg from its steps
 * Takes the first 2-3 meaningful steps or steps covering the first 25% of distance
 */
const generateLegSummary = (leg: RouteLeg): string | null => {
  if (!leg.steps || leg.steps.length === 0) {
    return null
  }

  // Filter steps to get meaningful instructions (skip empty ones)
  const meaningfulSteps = leg.steps.filter(
    (step) => step.instruction && step.instruction.trim().length > 0,
  )

  if (meaningfulSteps.length === 0) {
    return null
  }

  // Take first 2-3 steps or steps covering first 25% of leg distance
  const targetDistance = leg.distanceMeters * 0.25
  let accumulatedDistance = 0
  const stepsToInclude: string[] = []

  for (const step of meaningfulSteps) {
    stepsToInclude.push(step.instruction.trim())
    accumulatedDistance += step.distanceMeters

    if (stepsToInclude.length >= 3 || accumulatedDistance >= targetDistance) {
      break
    }
  }

  // Join instructions with proper punctuation
  const summary = stepsToInclude.join(', ')
  // Remove trailing period if present and add ellipsis if we truncated
  const trimmed = summary.endsWith('.') ? summary.slice(0, -1) : summary
  return meaningfulSteps.length > stepsToInclude.length ? `${trimmed}...` : trimmed
}

/**
 * Route directions sheet with leg-by-leg breakdown
 */
export const RouteDirectionsSheet = ({
  isVisible,
  onClose,
  routeLabel,
  legs,
  destinationLabel,
  testID = 'route-directions-sheet',
  onLegSelect,
  selectedLegIndex,
}: RouteDirectionsSheetProps) => {
  const { semantic } = useSemanticTheme()
  const insets = useSafeAreaInsets()

  // Get final destination coordinates for navigation
  const finalDestination = useMemo(() => {
    if (legs.length === 0) return null
    const lastLeg = legs[legs.length - 1]
    return {
      lat: lastLeg.end.lat,
      lng: lastLeg.end.lng,
      label: destinationLabel || lastLeg.end.label,
    }
  }, [legs, destinationLabel])

  const handleNavigate = () => {
    if (!finalDestination) return

    const mapUrl = getMapUrl(finalDestination)
    Linking.openURL(mapUrl).catch((err) => {})
  }

  const handleLegPress = (legIndex: number) => {
    onLegSelect?.(legIndex)
  }

  return (
    <BottomSheetWrapper
      isVisible={isVisible}
      onClose={onClose}
      snapPoints={['50%', '90%']}
      testID={testID}
      wrapChildren={false}
      showHandle={true}
      footer={
        <View
          style={[
            styles.footer,
            {
              paddingHorizontal: semantic.space.lg,
              paddingTop: semantic.space.md,
              paddingBottom: semantic.space.lg + insets.bottom,
              borderTopColor: `${semantic.color.border.default}33`,
              backgroundColor: semantic.color.surface.default,
            },
          ]}
        >
          <View style={styles.footerButtons}>
            <Button
              variant="secondary"
              size="lg"
              onPress={onClose}
              style={styles.footerButton}
              testID={`${testID}-close-button`}
            >
              Close
            </Button>

            <Button
              variant="default"
              size="lg"
              onPress={handleNavigate}
              style={styles.footerButton}
              testID={`${testID}-navigate-button`}
              icon={
                <IconSymbol name="navigation" size={20} color={semantic.color.onPrimary.default} />
              }
            >
              Navigate
            </Button>
          </View>
        </View>
      }
    >
      <View style={styles.container}>
        {/* Fixed header */}
        <View
          style={[
            styles.header,
            {
              paddingHorizontal: semantic.space.lg,
              paddingTop: semantic.space.md,
              paddingBottom: semantic.space.sm,
              borderBottomColor: `${semantic.color.border.default}33`,
            },
          ]}
        >
          <Text
            variant="titleLarge"
            style={[styles.headerTitle, { color: semantic.color.onSurface.default }]}
          >
            Route Overview
          </Text>
          <Text
            variant="bodyMedium"
            style={[styles.headerSubtitle, { color: semantic.color.onSurface.subtle }]}
            numberOfLines={1}
          >
            {routeLabel} • {legs.length} segment{legs.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {/* Scrollable step-by-step directions */}
        <View style={styles.scrollWrapper}>
          <BottomSheetScrollView
            contentContainerStyle={[styles.legsContent, { paddingHorizontal: semantic.space.lg }]}
            showsVerticalScrollIndicator={true}
            testID={`${testID}-steps-scroll`}
          >
            {legs.map((leg, legIndex) => {
              // If leg has steps, show them individually
              if (leg.steps && leg.steps.length > 0) {
                return (
                  <View key={leg.legIndex} style={styles.legSection}>
                    {/* Leg header */}
                    <View style={styles.legSectionHeader}>
                      <Text
                        variant="labelMedium"
                        style={[styles.legSectionLabel, { color: semantic.color.onSurface.subtle }]}
                      >
                        Segment {legIndex + 1}
                      </Text>
                      <Text variant="bodySmall" style={{ color: semantic.color.onSurface.muted }}>
                        {formatDistance(leg.distanceMeters)} • {formatDuration(leg.durationSeconds)}
                      </Text>
                    </View>

                    {/* Steps */}
                    {leg.steps.map((step, stepIndex) => (
                      <View
                        key={`step-${leg.legIndex}-${step.stepIndex}-${step.instruction.slice(0, 20)}`}
                        style={[
                          styles.stepCard,
                          {
                            backgroundColor: `${semantic.color.surface.default}E6`,
                            borderColor: `${semantic.color.border.default}4D`,
                            marginBottom:
                              stepIndex === (leg.steps?.length ?? 0) - 1
                                ? semantic.space.md
                                : semantic.space.xs,
                          },
                        ]}
                      >
                        <View style={styles.stepContent}>
                          {/* Step number */}
                          <View
                            style={[
                              styles.stepNumber,
                              { backgroundColor: `${semantic.color.primary.default}1A` },
                            ]}
                          >
                            <Text
                              style={[
                                styles.stepNumberText,
                                { color: semantic.color.primary.default },
                              ]}
                            >
                              {stepIndex + 1}
                            </Text>
                          </View>

                          {/* Step instruction */}
                          <View style={styles.stepInfo}>
                            <Text
                              variant="bodyMedium"
                              style={[
                                styles.instruction,
                                { color: semantic.color.onSurface.default },
                              ]}
                            >
                              {step.instruction}
                            </Text>
                            <View style={styles.stepMeta}>
                              <IconSymbol
                                name="map-marker-distance"
                                size={12}
                                color={semantic.color.onSurface.muted ?? 'transparent'}
                              />
                              <Text
                                variant="bodySmall"
                                style={{ color: semantic.color.onSurface.subtle }}
                              >
                                {formatDistance(step.distanceMeters)}
                              </Text>
                              <Text
                                variant="bodySmall"
                                style={[
                                  styles.stepSeparator,
                                  { color: semantic.color.onSurface.muted },
                                ]}
                              >
                                •
                              </Text>
                              <IconSymbol
                                name="clock-outline"
                                size={12}
                                color={semantic.color.onSurface.muted ?? 'transparent'}
                              />
                              <Text
                                variant="bodySmall"
                                style={{ color: semantic.color.onSurface.subtle }}
                              >
                                {formatDuration(step.durationSeconds)}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                )
              }

              // Fallback: show leg without steps
              const legSummary = generateLegSummary(leg)
              const isSelected = selectedLegIndex === legIndex

              return (
                <Pressable
                  key={leg.legIndex}
                  onPress={() => handleLegPress(legIndex)}
                  style={({ pressed }) => [
                    styles.legCard,
                    {
                      backgroundColor: isSelected
                        ? `${semantic.color.primary.default}1A`
                        : pressed
                          ? `${semantic.color.surface.default}CC`
                          : `${semantic.color.surface.default}E6`,
                      borderColor: isSelected
                        ? semantic.color.primary.default
                        : `${semantic.color.border.default}4D`,
                      marginBottom:
                        legIndex === legs.length - 1 ? semantic.space.xl : semantic.space.sm,
                    },
                  ]}
                  testID={`${testID}-leg-${legIndex}`}
                >
                  {/* Leg header with number and stats */}
                  <View style={styles.legHeader}>
                    <View
                      style={[
                        styles.legNumber,
                        { backgroundColor: `${semantic.color.primary.default}1A` },
                      ]}
                    >
                      <Text
                        style={[styles.legNumberText, { color: semantic.color.primary.default }]}
                      >
                        {legIndex + 1}
                      </Text>
                    </View>

                    <View style={styles.legStats}>
                      <View style={styles.statPair}>
                        <IconSymbol
                          name="map-marker-distance"
                          size={14}
                          color={semantic.color.onSurface.subtle ?? 'transparent'}
                        />
                        <Text
                          variant="bodySmall"
                          style={[styles.statText, { color: semantic.color.onSurface.subtle }]}
                        >
                          {formatDistance(leg.distanceMeters)}
                        </Text>
                      </View>
                      <View style={styles.statPair}>
                        <IconSymbol
                          name="clock-outline"
                          size={14}
                          color={semantic.color.onSurface.subtle ?? 'transparent'}
                        />
                        <Text
                          variant="bodySmall"
                          style={[styles.statText, { color: semantic.color.onSurface.subtle }]}
                        >
                          {formatDuration(leg.durationSeconds)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* From/To locations */}
                  <View style={styles.legLocations}>
                    <View style={styles.locationGroup}>
                      <IconSymbol
                        name="circle-small"
                        size={12}
                        color={semantic.color.primary.default}
                      />
                      <Text
                        variant="bodyMedium"
                        style={[styles.locationText, { color: semantic.color.onSurface.default }]}
                        numberOfLines={2}
                        ellipsizeMode="tail"
                      >
                        {leg.start.label || `Starting point`}
                      </Text>
                    </View>

                    <IconSymbol
                      name="arrow-down"
                      size={16}
                      color={semantic.color.onSurface.muted ?? 'transparent'}
                    />

                    <View style={styles.locationGroup}>
                      <IconSymbol
                        name="map-marker"
                        size={14}
                        color={semantic.color.primary.default}
                      />
                      <Text
                        variant="bodyMedium"
                        style={[styles.locationText, { color: semantic.color.onSurface.default }]}
                        numberOfLines={2}
                        ellipsizeMode="tail"
                      >
                        {leg.end.label || `Waypoint ${legIndex + 1}`}
                      </Text>
                    </View>
                  </View>

                  {/* Human-readable leg summary */}
                  {legSummary && (
                    <View style={styles.legSummary}>
                      <IconSymbol
                        name="information"
                        size={12}
                        color={semantic.color.onSurface.subtle ?? 'transparent'}
                      />
                      <Text
                        variant="bodySmall"
                        style={[styles.legSummaryText, { color: semantic.color.onSurface.subtle }]}
                        numberOfLines={2}
                        ellipsizeMode="tail"
                      >
                        {legSummary}
                      </Text>
                    </View>
                  )}

                  {/* Distance/duration inline for this leg */}
                  <View style={styles.legDetails}>
                    <Text variant="bodySmall" style={{ color: semantic.color.onSurface.subtle }}>
                      {formatDistance(leg.distanceMeters)} • {formatDuration(leg.durationSeconds)}
                    </Text>
                  </View>
                </Pressable>
              )
            })}

            {/* Summary footer in scroll area */}
            <View
              style={[
                styles.summaryCard,
                {
                  backgroundColor: `${semantic.color.primary.default}0D`,
                  borderColor: `${semantic.color.primary.default}33`,
                },
              ]}
            >
              <IconSymbol
                name="information-outline"
                size={16}
                color={semantic.color.onSurface.subtle ?? 'transparent'}
              />
              <Text
                variant="bodySmall"
                style={[styles.summaryText, { color: semantic.color.onSurface.subtle }]}
              >
                Total distance:{' '}
                {formatDistance(legs.reduce((sum, leg) => sum + leg.distanceMeters, 0))} • Total
                time: {formatDuration(legs.reduce((sum, leg) => sum + leg.durationSeconds, 0))}
              </Text>
            </View>
          </BottomSheetScrollView>
        </View>
      </View>
    </BottomSheetWrapper>
  )
}

RouteDirectionsSheet.displayName = 'RouteDirectionsSheet'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'column',
  },
  header: {
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontWeight: '700',
  },
  headerSubtitle: {
    marginTop: 2,
  },
  scrollWrapper: {
    flex: 1,
  },
  legsContainer: {
    flex: 1,
  },
  legsContent: {
    paddingTop: 12, // semantic.space.md
    paddingBottom: 120, // Extra padding for footer and input field
  },
  // Leg section (for legs with steps)
  legSection: {
    marginBottom: 16,
  },
  legSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  legSectionLabel: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  // Step cards (turn-by-turn)
  stepCard: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
  },
  stepContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '700',
  },
  stepInfo: {
    flex: 1,
    gap: 4,
  },
  instruction: {
    lineHeight: 20,
  },
  stepMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stepSeparator: {
    marginHorizontal: 4,
  },
  legCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12, // semantic.space.md
    gap: 8, // semantic.space.sm
  },
  legHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8, // semantic.space.sm
  },
  legNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legNumberText: {
    fontSize: 14,
    fontWeight: '700',
  },
  legStats: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16, // semantic.space.md
  },
  statPair: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
  },
  legLocations: {
    gap: 4, // semantic.space.xs
    paddingLeft: 4, // semantic.space.xs
  },
  legDetails: {
    paddingLeft: 18, // Align with location text
    paddingTop: 4,
  },
  legSummary: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingLeft: 18, // Align with location text
    paddingTop: 4,
  },
  legSummaryText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  locationGroup: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4, // semantic.space.xs
  },
  locationText: {
    flex: 1,
    lineHeight: 18,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8, // semantic.space.sm
    padding: 8, // semantic.space.sm
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16, // Extra space below summary card
  },
  summaryText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  footer: {
    borderTopWidth: 1,
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 8, // semantic.space.sm
  },
  footerButton: {
    flex: 1,
  },
})
