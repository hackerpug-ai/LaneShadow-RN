import { StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import type { RouteStop } from '../../types/routes'
import { BottomSheetWrapper } from '../sheets/bottom-sheet-wrapper'
import { Button } from '../ui/button'

export type ScenicBias = 'default' | 'high'

export type PlanRideSheetProps = {
  isVisible: boolean
  onClose: () => void

  startStop: RouteStop | null
  endStop: RouteStop | null

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

  return (
    <BottomSheetWrapper isVisible={isVisible} onClose={onClose} preset="half">
      <View style={[styles.container, { gap: semantic.space.sm }]}>
        <Text variant="titleMedium" style={{ color: semantic.color.onSurface.default }}>
          Plan Ride
        </Text>

        <Text variant="bodyMedium" style={{ color: semantic.color.onSurface.default }}>
          Start:{' '}
          {startStop ? `${startStop.lat.toFixed(4)}, ${startStop.lng.toFixed(4)}` : 'Tap map'}
        </Text>

        <Text variant="bodyMedium" style={{ color: semantic.color.onSurface.default }}>
          End: {endStop ? `${endStop.lat.toFixed(4)}, ${endStop.lng.toFixed(4)}` : 'Tap map'}
        </Text>

        <View style={[styles.row, { gap: semantic.space.sm }]}>
          <Button
            size="sm"
            variant={scenicBias === 'default' ? 'secondary' : 'outline'}
            onPress={() => onSetScenicBias('default')}
            testID="pref-scenic-default"
          >
            Scenic: default
          </Button>
          <Button
            size="sm"
            variant={scenicBias === 'high' ? 'secondary' : 'outline'}
            onPress={() => onSetScenicBias('high')}
            testID="pref-scenic-high"
          >
            Scenic: high
          </Button>
        </View>

        <View style={[styles.row, { gap: semantic.space.sm }]}>
          <Button
            size="sm"
            variant={avoidHighways ? 'secondary' : 'outline'}
            onPress={onToggleAvoidHighways}
            testID="pref-avoid-highways"
          >
            Avoid highways
          </Button>
          <Button
            size="sm"
            variant={avoidTolls ? 'secondary' : 'outline'}
            onPress={onToggleAvoidTolls}
            testID="pref-avoid-tolls"
          >
            Avoid tolls
          </Button>
        </View>

        {planningError ? (
          <Text variant="bodyMedium" style={{ color: semantic.color.danger.default }}>
            {planningError}
          </Text>
        ) : null}

        <Button
          variant="default"
          disabled={!startStop || !endStop || isPlanning}
          onPress={onPlanRide}
          testID="plan-ride-submit"
        >
          {isPlanning ? 'Planning...' : 'Plan ride'}
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
  container: {},
  row: {
    flexDirection: 'row',
  },
})
