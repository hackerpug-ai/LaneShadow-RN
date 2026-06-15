/**
 * Route Options Sheet Component
 * Main sheet container for displaying route options after planning completes
 *
 * Follows project standards:
 * - Uses semantic theme tokens
 * - Uses existing UI components
 * - Integrates with map for route selection
 */

import { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { Text } from 'react-native-paper'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import type { PlannedRouteOptionsView, PlannedRouteOptionView } from '../../server/types/routes'
import { RouteOptionCard } from '../planning/route-option-card'
import { Button } from '../ui/button'
import { FavoriteExclusionAlert } from '../ui/favorite-exclusion-alert'
import { IconSymbol } from '../ui/icon-symbol'
import { BottomSheetWrapper } from './bottom-sheet-wrapper'

export type RouteOptionsSheetProps = {
  isVisible: boolean
  onClose: () => void
  planningResult: PlannedRouteOptionsView | null
  selectedRouteId: string | null
  isLoading?: boolean
  onRouteSelect: (routeOptionId: string) => void
  onViewDetails: (routeOption: PlannedRouteOptionView) => void
  onBack: () => void
  onSave?: () => void
  isSaving?: boolean
  testID?: string
  includeFavorites?: boolean
  /** Session key for tracking exclusion messages */
  sessionKey?: string
}

/**
 * Route options sheet component that displays available route options
 */
export const RouteOptionsSheet = ({
  isVisible,
  onClose,
  planningResult,
  selectedRouteId,
  isLoading = false,
  onRouteSelect,
  onViewDetails,
  onBack,
  onSave,
  isSaving = false,
  testID,
  includeFavorites = false,
  sessionKey,
}: RouteOptionsSheetProps) => {
  const { semantic } = useSemanticTheme()
  const [exclusionAlertDismissed, setExclusionAlertDismissed] = useState(false)

  const handleRouteSelect = (routeOptionId: string) => {
    onRouteSelect(routeOptionId)
  }

  const handleExclusionAlertDismiss = () => {
    setExclusionAlertDismissed(true)
  }

  const handleViewDetails = () => {
    if (planningResult && selectedRouteId) {
      const selectedRoute = planningResult.options.find(
        (option) => option.routeOptionId === selectedRouteId,
      )
      if (selectedRoute) {
        onViewDetails(selectedRoute)
      }
    }
  }

  const handleBack = () => {
    onBack()
  }

  // Get selected route for details button
  const getSelectedRoute = (): PlannedRouteOptionView | null => {
    if (!planningResult || !selectedRouteId) {
      return null
    }
    return planningResult.options.find((option) => option.routeOptionId === selectedRouteId) || null
  }

  const selectedRoute = getSelectedRoute()
  const isDetailsButtonEnabled = selectedRoute !== null

  return (
    <BottomSheetWrapper isVisible={isVisible} onClose={onClose} preset="full" testID={testID}>
      <View style={styles.header}>
        <Text variant="titleLarge" style={{ color: semantic.color.onSurface.default }}>
          Route Options
        </Text>
      </View>

      {/* Favorite exclusion alert */}
      {!exclusionAlertDismissed &&
        planningResult?.excludedFavorites &&
        planningResult.excludedFavorites.length > 0 && (
          <FavoriteExclusionAlert
            excludedFavorites={planningResult.excludedFavorites}
            includeFavorites={includeFavorites}
            onDismiss={handleExclusionAlertDismiss}
            sessionKey={sessionKey}
          />
        )}

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        testID={`${testID}-scroll-view`}
      >
        {planningResult?.options.map((routeOption, index) => (
          <RouteOptionCard
            key={routeOption.routeOptionId}
            routeOption={routeOption}
            isSelected={routeOption.routeOptionId === selectedRouteId}
            isLoading={isLoading}
            onSelect={handleRouteSelect}
            testID={`${testID}-route-${index}`}
            includeFavorites={includeFavorites}
          />
        ))}
      </ScrollView>

      <View style={styles.actions}>
        <Button
          variant="outline"
          size="default"
          onPress={handleBack}
          testID={`${testID}-back-button`}
        >
          Back
        </Button>

        {onSave && (
          <Button
            variant="default"
            size="default"
            onPress={onSave}
            disabled={!isDetailsButtonEnabled || isSaving}
            testID={`${testID}-save-button`}
            icon={
              <IconSymbol name="content-save" size={18} color={semantic.color.onPrimary.default} />
            }
          >
            {isSaving ? 'Saving...' : 'Save Route'}
          </Button>
        )}

        <Button
          variant="default"
          size="default"
          onPress={handleViewDetails}
          disabled={!isDetailsButtonEnabled}
          testID={`${testID}-view-details-button`}
        >
          View Details
        </Button>
      </View>
    </BottomSheetWrapper>
  )
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    paddingBottom: 8,
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    gap: 12,
  },
})
