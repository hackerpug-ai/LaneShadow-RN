import { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import type { RouteStop } from '../../types/routes'
import { BottomSheetWrapper } from './bottom-sheet-wrapper'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Switch } from '../ui/switch'
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group'
import { IconSymbol } from '../ui/icon-symbol'
import { RouteTimeline } from './route-timeline'
import { LocationInput } from '../location-input'

export type ScenicBias = 'default' | 'high'

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

  isPlanning: boolean
  planningError: string | null

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
  isPlanning,
  planningError,
  onPlanRide,
  onClearSelection,
}: PlanRideSheetProps) => {
  const { semantic } = useSemanticTheme()
  const [focusedInput, setFocusedInput] = useState<'current' | 'destination' | null>(null)

  const handleCurrentLocationChange = (_value: string) => {
    // Handle current location text change
    // This would typically update a local state for display text
  }

  const handleDestinationChange = (_value: string) => {
    // Handle destination text change
    // This would typically update a local state for display text
  }

  const handleCurrentLocationSelected = (place: RouteStop) => {
    // Update the start stop with the selected place
    onSetStartStop?.(place)
  }

  const handleDestinationSelected = (place: RouteStop) => {
    // Update the end stop with the selected place
    onSetEndStop?.(place)
  }

  const handleSwap = () => {
    // Swap start and end stops
    if (startStop && endStop) {
      onSetStartStop?.(endStop)
      onSetEndStop?.(startStop)
    }
    // Clear focus on swap
    setFocusedInput(null)
  }

  return (
    <BottomSheetWrapper isVisible={isVisible} onClose={onClose} preset="half">
      <View style={[styles.container, { gap: semantic.space.md }]}>
        {/* Header with motorcycle badge */}
        <View style={[styles.header, { alignItems: 'center', gap: semantic.space.sm }]}>
          <Text variant="titleMedium" style={{ color: semantic.color.onSurface.default }}>
            Plan Ride
          </Text>
          <Badge variant="default" testID="motorcycle-badge">
            Motorcycle
          </Badge>
        </View>

        {/* Input fields with timeline and swap */}
        <View style={[styles.inputsContainer, { gap: semantic.space.sm }]}>
          <View style={styles.row}>
            {/* Timeline visualization */}
            <RouteTimeline startPoint={startStop} endPoint={endStop} />
            {/* Input fields column */}
            <View style={[styles.inputColumn, { gap: semantic.space.sm }]}>
              {/* Current Location Input */}
              <View style={styles.inputWrapper}>
                <LocationInput
                  label="Current Location"
                  value={startStop?.label || ''}
                  onChangeText={handleCurrentLocationChange}
                  placeholder="Enter current location"
                  iconName="map-marker"
                  testID="current-location-input"
                  inputType="current"
                  focusedInput={focusedInput}
                  setFocusedInput={setFocusedInput}
                  onPlaceSelected={handleCurrentLocationSelected}
                />
              </View>

              {/* Destination Input */}
              <View style={styles.inputWrapper}>
                <LocationInput
                  label="Where to?"
                  value={endStop?.label || ''}
                  onChangeText={handleDestinationChange}
                  placeholder="Enter destination"
                  iconName="magnify"
                  testID="destination-input"
                  inputType="destination"
                  focusedInput={focusedInput}
                  setFocusedInput={setFocusedInput}
                  onPlaceSelected={handleDestinationSelected}
                />
              </View>
            </View>
          </View>

          {/* Swap Button */}
          <Button
            size="icon"
            icon="swap-vertical"
            variant="ghost"
            onPress={handleSwap}
            testID="swap-locations-button"
          />
        </View>

        {/* Scenic Bias Control - Toggle Group */}
        <View style={[styles.section, { gap: semantic.space.sm }]}>
          <Text variant="labelSmall" style={{ color: semantic.color.onSurface.muted }}>
            Scenic Bias
          </Text>
          <ToggleGroup
            value={scenicBias}
            onValueChange={(value) => onSetScenicBias(value as ScenicBias)}
            type="single"
            variant="outline"
          >
            <ToggleGroupItem value="default" accessibilityLabel="Default route">
              <IconSymbol name="arrow-right" size={20} color={semantic.color.onSurface.default} />
            </ToggleGroupItem>
            <ToggleGroupItem value="high" accessibilityLabel="Scenic route">
              <IconSymbol name="image" size={20} color={semantic.color.onSurface.default} />
            </ToggleGroupItem>
          </ToggleGroup>
        </View>

        {/* Toggles - Switch Components */}
        <View style={[styles.section, { gap: semantic.space.sm }]}>
          <View style={[styles.toggleRow, { justifyContent: 'space-between' }]}>
            <View style={styles.toggleLabel}>
              <IconSymbol name="road-variant" size={20} color={semantic.color.onSurface.muted} />
              <Text variant="bodyMedium" style={{ color: semantic.color.onSurface.default }}>
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
              <IconSymbol name="cash" size={20} color={semantic.color.onSurface.muted} />
              <Text variant="bodyMedium" style={{ color: semantic.color.onSurface.default }}>
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

        {/* Error Message */}
        {planningError ? (
          <Text variant="bodyMedium" style={{ color: semantic.color.danger.default }}>
            {planningError}
          </Text>
        ) : null}

        {/* Action Buttons */}
        <Button
          variant="default"
          size="lg"
          disabled={!startStop || !endStop || isPlanning}
          onPress={onPlanRide}
          icon={<IconSymbol name="motorbike" size={20} color={semantic.color.onPrimary.default} />}
          style={{ marginTop: semantic.space.md }}
          testID="plan-ride-submit"
        >
          {isPlanning ? 'Planning...' : 'Plan Ride'}
        </Button>

        <Button variant="outline" onPress={onClearSelection} testID="plan-ride-clear">
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
  row: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  inputColumn: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  inputWrapper: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  section: {
    paddingVertical: 4,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  toggleLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
})
