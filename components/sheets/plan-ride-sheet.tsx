import { useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import type { RouteStop } from '../../types/routes'
import { LocationInput } from '../location-input'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { DepartureTimeSelector } from '../ui/departure-time-selector'
import { IconSymbol } from '../ui/icon-symbol'
import { ScenicBiasSegmented, type ScenicBias } from '../ui/scenic-bias-segmented'
import { Switch } from '../ui/switch'
import { BottomSheetWrapper } from './bottom-sheet-wrapper'
import { RouteTimeline } from './route-timeline'

export type PlanRideSheetProps = {
  isVisible: boolean
  onClose: () => void

  startStop: RouteStop | null
  endStop: RouteStop | null
  onSetStartStop?: (stop: RouteStop) => void
  onSetEndStop?: (stop: RouteStop) => void

  scenicBias: ScenicBias
  onSetScenicBias: (next: ScenicBias) => void

  avoidHighways: boolean
  onToggleAvoidHighways: () => void

  avoidTolls: boolean
  onToggleAvoidTolls: () => void

  departureTime: Date
  onSetDepartureTime: (date: Date) => void

  isPlanning: boolean

  onPlanRide: () => void
  onClearSelection: () => void
}

export const PlanRideSheet = ({
  isVisible,
  onClose,
  startStop,
  endStop,
  onSetStartStop,
  onSetEndStop,
  scenicBias,
  onSetScenicBias,
  avoidHighways,
  onToggleAvoidHighways,
  avoidTolls,
  onToggleAvoidTolls,
  departureTime,
  onSetDepartureTime,
  isPlanning,
  onPlanRide,
  onClearSelection,
}: PlanRideSheetProps) => {
  const { semantic } = useSemanticTheme()
  const [focusedInput, setFocusedInput] = useState<'current' | 'destination' | null>(null)

  // These inputs are controlled. Keep local text so typing doesn't "snap back" to
  // the last selected stop label.
  const [currentLocationText, setCurrentLocationText] = useState('')
  const [destinationText, setDestinationText] = useState('')

  useEffect(() => {
    setCurrentLocationText(startStop?.label ?? '')
  }, [startStop?.label])

  useEffect(() => {
    setDestinationText(endStop?.label ?? '')
  }, [endStop?.label])

  const handleCurrentLocationChange = (value: string) => {
    setCurrentLocationText(value)
  }

  const handleDestinationChange = (value: string) => {
    setDestinationText(value)
  }

  const handleCurrentLocationSelected = (place: RouteStop) => {
    // Update start stop with the selected place
    setCurrentLocationText(place.label ?? '')
    onSetStartStop?.(place)
  }

  const handleDestinationSelected = (place: RouteStop) => {
    // Update end stop with the selected place
    setDestinationText(place.label ?? '')
    onSetEndStop?.(place)
  }

  const handleSwap = () => {
    // Swap start and end stops
    if (startStop && endStop) {
      setCurrentLocationText(endStop.label ?? '')
      setDestinationText(startStop.label ?? '')
      onSetStartStop?.(endStop)
      onSetEndStop?.(startStop)
    }
    // Clear focus on swap
    setFocusedInput(null)
  }

  return (
    <BottomSheetWrapper isVisible={isVisible} onClose={onClose} preset="half">
      <View style={[styles.container, { gap: semantic.space.lg }]}>
        {/* Header with motorcycle badge */}
        <View style={[styles.header]}>
          <Text variant="titleLarge" style={{ color: semantic.color.onSurface.default }}>
            Plan Ride
          </Text>
          <Badge
            variant="default"
            testID="motorcycle-badge"
            opacity={0.2} // 20% opacity
            textStyle={{
              color: semantic.color.primary.default,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              fontWeight: '600',
            }}
          >
            Motorcycle
          </Badge>
        </View>

        {/* Input fields with timeline and swap */}
        <View style={[styles.inputsContainer, { gap: semantic.space.md }]}>
          <View style={styles.inputRow}>
            {/* Timeline visualization */}
            <RouteTimeline startPoint={startStop} endPoint={endStop} />
            {/* Input fields column */}
            <View style={[styles.inputColumn, { gap: semantic.space.sm }]}>
              {/* Current Location Input */}
              <LocationInput
                label="Current Location"
                value={currentLocationText}
                onChangeText={handleCurrentLocationChange}
                placeholder="Current Location"
                iconName="near-me"
                testID="current-location-input"
                inputType="current"
                focusedInput={focusedInput}
                setFocusedInput={setFocusedInput}
                onPlaceSelected={handleCurrentLocationSelected}
              />

              {/* Destination Input */}
              <LocationInput
                label="Where to?"
                value={destinationText}
                onChangeText={handleDestinationChange}
                placeholder="Where to?"
                iconName="magnify"
                testID="destination-input"
                inputType="destination"
                focusedInput={focusedInput}
                setFocusedInput={setFocusedInput}
                onPlaceSelected={handleDestinationSelected}
              />
            </View>

            {/* Swap Button */}
            <View style={styles.swapButtonContainer}>
              <Button
                size="icon"
                icon={<IconSymbol name="swap-vertical" size={20} color={semantic.color.onSurface.muted} />}
                variant="ghost"
                onPress={handleSwap}
                testID="swap-locations-button"
                style={styles.swapButton}
              />
            </View>
          </View>
        </View>

        <ScenicBiasSegmented
          value={scenicBias}
          onValueChange={onSetScenicBias}
          style={{ marginLeft: semantic.space.xs }}
        />

        {/* Departure Time Selector */}
        <DepartureTimeSelector
          value={departureTime}
          onChange={onSetDepartureTime}
          minimumDate={new Date()}
          testID="departure-time-selector"
        />

        {/* Toggles - Switch Components */}
        <View
          style={[
            styles.toggleSection,
            {
              backgroundColor: semantic.color.input.default,
              borderColor: `${semantic.color.onSurface.default}0D`, // 5% opacity
              borderWidth: 1,
            },
          ]}
        >
          <View
            style={[
              styles.toggleRow,
              {
                justifyContent: 'space-between',
                borderBottomWidth: 1,
                borderBottomColor: `${semantic.color.onSurface.default}0D`,
              },
            ]}
          >
            <View style={styles.toggleLabel}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: semantic.color.surfaceVariant.default },
                ]}
              >
                <IconSymbol name="car" size={20} color={semantic.color.onSurface.muted} />
              </View>
              <Text
                variant="bodySmall"
                style={{ color: semantic.color.onSurface.default, fontWeight: '500' }}
              >
                Avoid highways
              </Text>
            </View>
            <Switch
              value={avoidHighways}
              onValueChange={onToggleAvoidHighways}
              testID="pref-avoid-highways"
            />
          </View>

          <View style={[styles.toggleRow, { justifyContent: 'space-between' }]}>
            <View style={styles.toggleLabel}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: semantic.color.surfaceVariant.default },
                ]}
              >
                <IconSymbol name="cash" size={20} color={semantic.color.onSurface.muted} />
              </View>
              <Text
                variant="bodySmall"
                style={{ color: semantic.color.onSurface.default, fontWeight: '500' }}
              >
                Avoid tolls
              </Text>
            </View>
            <Switch
              value={avoidTolls}
              onValueChange={onToggleAvoidTolls}
              testID="pref-avoid-tolls"
            />
          </View>
        </View>

        {/* Action Buttons */}
        <Button
          variant="default"
          size="lg"
          disabled={!startStop || !endStop || isPlanning}
          onPress={onPlanRide}
          icon={<IconSymbol name="motorbike" size={20} color={semantic.color.onPrimary.default} />}
          style={{ marginTop: semantic.space.xs }}
          testID="plan-ride-submit"
        >
          {isPlanning ? 'Planning...' : 'Plan Ride'}
        </Button>

        <Button
          variant="outline"
          onPress={onClearSelection}
          testID="plan-ride-clear"
          style={{ marginTop: semantic.space.sm }}
        >
          Clear selection
        </Button>
      </View>
    </BottomSheetWrapper>
  )
}

PlanRideSheet.displayName = 'PlanRideSheet'

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'column',
  },
  inputsContainer: {
    display: 'flex',
    flexDirection: 'column',
  },
  inputRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  inputColumn: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  swapButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  swapButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  header: {
    flexDirection: 'row',

    paddingTop: 24,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleSection: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  toggleLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
