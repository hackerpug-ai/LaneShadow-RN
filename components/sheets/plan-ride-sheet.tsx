import { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import type { RouteStop } from '../../types/routes'
import { LocationInput } from '../location-input'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { IconSymbol } from '../ui/icon-symbol'
import { Switch } from '../ui/switch'
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group'
import { BottomSheetWrapper } from './bottom-sheet-wrapper'
import { RouteTimeline } from './route-timeline'

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
    // Update start stop with the selected place
    onSetStartStop?.(place)
  }

  const handleDestinationSelected = (place: RouteStop) => {
    // Update end stop with the selected place
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
      <View style={[styles.container, { gap: semantic.space.lg }]}>
        {/* Header with motorcycle badge */}
        <View style={[styles.header, { justifyContent: 'space-between', alignItems: 'center' }]}>
          <Text variant="titleLarge" style={{ color: semantic.color.onSurface.default }}>
            Plan Ride
          </Text>
          <Badge 
            variant="default" 
            testID="motorcycle-badge"
            opacity={0.2} // 20% opacity
            textStyle={{ color: semantic.color.primary.default }}
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
                value={startStop?.label || ''}
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
                value={endStop?.label || ''}
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
                icon="swap-vertical"
                variant="ghost"
                onPress={handleSwap}
                testID="swap-locations-button"
                style={styles.swapButton}
              />
            </View>
          </View>
        </View>

        {/* Scenic Bias Control - Toggle Group */}
        <View style={[styles.section, { gap: semantic.space.xs, marginLeft: semantic.space.xs }]}>
          <Text variant="labelSmall" style={{ color: `${semantic.color.onSurface.muted}CC` }}>
            Scenic Bias
          </Text>
          <View style={[
            styles.toggleGroupContainer,
            {
              backgroundColor: semantic.color.input.default,
              borderRadius: semantic.radius.xl,
            }
          ]}>
            <ToggleGroup
              value={scenicBias}
              onValueChange={(value) => onSetScenicBias(value as ScenicBias)}
              type="single"
            >
              <ToggleGroupItem value="default" accessibilityLabel="Default route">
                <View style={styles.toggleItem}>
                  <IconSymbol name="arrow-right" size={18} color={scenicBias === 'default' ? semantic.color.onSurface.default : semantic.color.onSurface.muted} />
                  <Text 
                    variant="labelSmall" 
                    style={{ 
                      color: scenicBias === 'default' ? semantic.color.onSurface.default : semantic.color.onSurface.muted,
                      fontWeight: '500'
                    }}
                  >
                    Default
                  </Text>
                </View>
              </ToggleGroupItem>
              <ToggleGroupItem value="high" accessibilityLabel="Scenic route">
                <View style={styles.toggleItem}>
                  <IconSymbol name="image" size={18} color={scenicBias === 'high' ? semantic.color.onPrimary.default : semantic.color.onSurface.muted} />
                  <Text 
                    variant="labelSmall" 
                    style={{ 
                      color: scenicBias === 'high' ? semantic.color.onPrimary.default : semantic.color.onSurface.muted,
                      fontWeight: '500'
                    }}
                  >
                    High Scenic
                  </Text>
                </View>
              </ToggleGroupItem>
            </ToggleGroup>
          </View>
        </View>

        {/* Toggles - Switch Components */}
        <View style={[
          styles.toggleSection,
          {
            backgroundColor: semantic.color.input.default,
            borderColor: `${semantic.color.onSurface.default}0D`, // 5% opacity
            borderWidth: 1,
          }
        ]}>
          <View style={[styles.toggleRow, { justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: `${semantic.color.onSurface.default}0D` }]}>
            <View style={styles.toggleLabel}>
              <View style={[styles.iconContainer, { backgroundColor: semantic.color.surfaceVariant.default }]}>
                <IconSymbol name="car" size={20} color={semantic.color.onSurface.muted} />
              </View>
              <Text variant="bodySmall" style={{ color: semantic.color.onSurface.default, fontWeight: '500' }}>
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
              <View style={[styles.iconContainer, { backgroundColor: semantic.color.surfaceVariant.default }]}>
                <IconSymbol name="cash" size={20} color={semantic.color.onSurface.muted} />
              </View>
              <Text variant="bodySmall" style={{ color: semantic.color.onSurface.default, fontWeight: '500' }}>
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
          style={[
            { marginTop: semantic.space.xs },
            scenicBias === 'high' && styles.highScenicButton
          ]}
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
    alignItems: 'flex-start',
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 24,
  },
  section: {
    paddingVertical: 4,
  },
  toggleGroupContainer: {
    padding: 4,
  },
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
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
  highScenicButton: {
    backgroundColor: '#6750A4', // Primary color for high scenic option
    shadowColor: '#00000020',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
})