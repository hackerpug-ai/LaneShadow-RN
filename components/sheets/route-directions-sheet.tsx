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

import React, { useMemo } from 'react'
import { StyleSheet, View, ScrollView, Platform, Linking } from 'react-native'
import { Text } from 'react-native-paper'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { IconSymbol } from '../ui/icon-symbol'
import { Button } from '../ui/button'
import { BottomSheetWrapper } from './bottom-sheet-wrapper'
import type { RouteLeg } from '../../models/saved-routes'

export type RouteDirectionsSheetProps = {
  isVisible: boolean
  onClose: () => void
  routeLabel: string
  legs: RouteLeg[]
  destinationLabel?: string
  testID?: string
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
 * Route directions sheet with leg-by-leg breakdown
 */
export const RouteDirectionsSheet = ({
  isVisible,
  onClose,
  routeLabel,
  legs,
  destinationLabel,
  testID = 'route-directions-sheet',
}: RouteDirectionsSheetProps) => {
  const { semantic } = useSemanticTheme()

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
    Linking.openURL(mapUrl).catch((err) => {
      console.error('Failed to open maps:', err)
    })
  }

  return (
    <BottomSheetWrapper
      isVisible={isVisible}
      onClose={onClose}
      preset="full"
      testID={testID}
      wrapChildren={false}
      showHandle={true}
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
              borderBottomColor: semantic.color.border.default + '33',
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
        <ScrollView
          style={styles.legsContainer}
          contentContainerStyle={[
            styles.legsContent,
            { paddingHorizontal: semantic.space.lg },
          ]}
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
                    <Text
                      variant="bodySmall"
                      style={{ color: semantic.color.onSurface.muted }}
                    >
                      {formatDistance(leg.distanceMeters)} • {formatDuration(leg.durationSeconds)}
                    </Text>
                  </View>

                  {/* Steps */}
                  {leg.steps.map((step, stepIndex) => (
                    <View
                      key={`${leg.legIndex}-${step.stepIndex}`}
                      style={[
                        styles.stepCard,
                        {
                          backgroundColor: semantic.color.surface.default + 'E6',
                          borderColor: semantic.color.border.default + '4D',
                          marginBottom: stepIndex === leg.steps.length - 1 ? semantic.space.md : semantic.space.xs,
                        },
                      ]}
                    >
                      <View style={styles.stepContent}>
                        {/* Step number */}
                        <View
                          style={[
                            styles.stepNumber,
                            { backgroundColor: semantic.color.primary.default + '1A' },
                          ]}
                        >
                          <Text
                            style={[styles.stepNumberText, { color: semantic.color.primary.default }]}
                          >
                            {stepIndex + 1}
                          </Text>
                        </View>

                        {/* Step instruction */}
                        <View style={styles.stepInfo}>
                          <Text
                            variant="bodyMedium"
                            style={[styles.instruction, { color: semantic.color.onSurface.default }]}
                          >
                            {step.instruction}
                          </Text>
                          <View style={styles.stepMeta}>
                            <IconSymbol
                              name="map-marker-distance"
                              size={12}
                              color={semantic.color.onSurface.muted}
                            />
                            <Text
                              variant="bodySmall"
                              style={{ color: semantic.color.onSurface.subtle }}
                            >
                              {formatDistance(step.distanceMeters)}
                            </Text>
                            <Text
                              variant="bodySmall"
                              style={[styles.stepSeparator, { color: semantic.color.onSurface.muted }]}
                            >
                                •
                              </Text>
                            <IconSymbol
                              name="clock-outline"
                              size={12}
                              color={semantic.color.onSurface.muted}
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
            return (
              <View
                key={leg.legIndex}
                style={[
                  styles.legCard,
                  {
                    backgroundColor: semantic.color.surface.default + 'E6',
                    borderColor: semantic.color.border.default + '4D',
                    marginBottom: legIndex === legs.length - 1 ? semantic.space.xl : semantic.space.sm,
                  },
                ]}
              >
                {/* Leg header with number and stats */}
                <View style={styles.legHeader}>
                  <View
                    style={[
                      styles.legNumber,
                      { backgroundColor: semantic.color.primary.default + '1A' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.legNumberText,
                        { color: semantic.color.primary.default },
                      ]}
                    >
                      {legIndex + 1}
                    </Text>
                  </View>

                  <View style={styles.legStats}>
                    <View style={styles.statPair}>
                      <IconSymbol
                        name="map-marker-distance"
                        size={14}
                        color={semantic.color.onSurface.subtle}
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
                        color={semantic.color.onSurface.subtle}
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
                    color={semantic.color.onSurface.muted}
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

                {/* Distance/duration inline for this leg */}
                <View style={styles.legDetails}>
                  <Text
                    variant="bodySmall"
                    style={{ color: semantic.color.onSurface.subtle }}
                  >
                    {formatDistance(leg.distanceMeters)} • {formatDuration(leg.durationSeconds)}
                  </Text>
                </View>
              </View>
            )
          })}

          {/* Summary footer in scroll area */}
          <View
            style={[
              styles.summaryCard,
              {
                backgroundColor: semantic.color.primary.default + '0D',
                borderColor: semantic.color.primary.default + '33',
              },
            ]}
          >
            <IconSymbol
              name="information-outline"
              size={16}
              color={semantic.color.onSurface.subtle}
            />
            <Text
              variant="bodySmall"
              style={[styles.summaryText, { color: semantic.color.onSurface.subtle }]}
            >
              Total distance: {formatDistance(
                legs.reduce((sum, leg) => sum + leg.distanceMeters, 0)
              )} • Total time: {formatDuration(legs.reduce((sum, leg) => sum + leg.durationSeconds, 0))}
            </Text>
          </View>
        </ScrollView>

        {/* Fixed footer with actions */}
        <View
          style={[
            styles.footer,
            {
              paddingHorizontal: semantic.space.lg,
              paddingTop: semantic.space.md,
              paddingBottom: semantic.space.lg,
              borderTopColor: semantic.color.border.default + '33',
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
                <IconSymbol
                  name="navigation"
                  size={20}
                  color={semantic.color.onPrimary.default}
                />
              }
            >
              Navigate
            </Button>
          </View>
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
  legsContainer: {
    flex: 1,
  },
  legsContent: {
    paddingTop: 12, // semantic.space.md
    paddingBottom: 12, // semantic.space.md
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
