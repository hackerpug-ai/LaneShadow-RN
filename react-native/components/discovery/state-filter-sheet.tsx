/**
 * StateFilterSheet Component
 *
 * Bottom sheet for filtering discovery routes by US state (UC-DISC-03).
 * Displays a searchable FlatList of states with route counts, supports
 * multi-select, and fires callback for parent to center map on selection.
 *
 * DESIGN TASK: This component receives state data and callbacks as props.
 * No real data hooks — CUR-012 will wire the database connection.
 *
 * Following styles/RULES.md:
 * - useSemanticTheme() for all styling
 * - BottomSheetWrapper for consistent sheet behavior
 * - BottomSheetInput for search input (Gorhom keyboard handling)
 * - States with zero routes are filtered out
 * - Search filters by state name (case-insensitive)
 *
 * AC-001: Searchable state list with route counts
 * AC-002: Select centers map via callback
 * AC-003: Multi-select with toggle behavior
 * AC-004: Clear resets to proximity mode
 */

import { useMemo, useState } from 'react'
import { FlatList, StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { BottomSheetWrapper } from '../sheets/bottom-sheet-wrapper'
import { BottomSheetInput } from '../ui/bottom-sheet-input'
import { Button } from '../ui/button'
import { IconSymbol } from '../ui/icon-symbol'
import { StateListItem } from './state-list-item'

export type StateData = {
  code: string
  name: string
  routeCount: number
}

export type StateFilterSheetProps = {
  /** Whether the sheet is visible */
  visible: boolean
  /** All available states with route counts */
  states: StateData[]
  /** Currently selected state codes */
  selected: string[]
  /** Callback when selection changes */
  onSelectionChange: (states: string[]) => void
  /** Callback when sheet is dismissed */
  onDismiss: () => void
  /** Test ID for testing */
  testID?: string
}

/**
 * Mock US states data for design testing
 * In production, this will come from CUR-012 database query
 */
export const MOCK_US_STATES: StateData[] = [
  { code: 'AL', name: 'Alabama', routeCount: 12 },
  { code: 'AK', name: 'Alaska', routeCount: 0 },
  { code: 'AZ', name: 'Arizona', routeCount: 45 },
  { code: 'AR', name: 'Arkansas', routeCount: 8 },
  { code: 'CA', name: 'California', routeCount: 156 },
  { code: 'CO', name: 'Colorado', routeCount: 89 },
  { code: 'CT', name: 'Connecticut', routeCount: 5 },
  { code: 'DE', name: 'Delaware', routeCount: 2 },
  { code: 'FL', name: 'Florida', routeCount: 67 },
  { code: 'GA', name: 'Georgia', routeCount: 34 },
  { code: 'HI', name: 'Hawaii', routeCount: 0 },
  { code: 'ID', name: 'Idaho', routeCount: 23 },
  { code: 'IL', name: 'Illinois', routeCount: 28 },
  { code: 'IN', name: 'Indiana', routeCount: 15 },
  { code: 'IA', name: 'Iowa', routeCount: 9 },
  { code: 'KS', name: 'Kansas', routeCount: 11 },
  { code: 'KY', name: 'Kentucky', routeCount: 19 },
  { code: 'LA', name: 'Louisiana', routeCount: 14 },
  { code: 'ME', name: 'Maine', routeCount: 7 },
  { code: 'MD', name: 'Maryland', routeCount: 16 },
  { code: 'MA', name: 'Massachusetts', routeCount: 8 },
  { code: 'MI', name: 'Michigan', routeCount: 31 },
  { code: 'MN', name: 'Minnesota', routeCount: 22 },
  { code: 'MS', name: 'Mississippi', routeCount: 6 },
  { code: 'MO', name: 'Missouri', routeCount: 25 },
  { code: 'MT', name: 'Montana', routeCount: 38 },
  { code: 'NE', name: 'Nebraska', routeCount: 10 },
  { code: 'NV', name: 'Nevada', routeCount: 52 },
  { code: 'NH', name: 'New Hampshire', routeCount: 9 },
  { code: 'NJ', name: 'New Jersey', routeCount: 12 },
  { code: 'NM', name: 'New Mexico', routeCount: 41 },
  { code: 'NY', name: 'New York', routeCount: 35 },
  { code: 'NC', name: 'North Carolina', routeCount: 44 },
  { code: 'ND', name: 'North Dakota', routeCount: 4 },
  { code: 'OH', name: 'Ohio', routeCount: 26 },
  { code: 'OK', name: 'Oklahoma', routeCount: 18 },
  { code: 'OR', name: 'Oregon', routeCount: 58 },
  { code: 'PA', name: 'Pennsylvania', routeCount: 29 },
  { code: 'RI', name: 'Rhode Island', routeCount: 3 },
  { code: 'SC', name: 'South Carolina', routeCount: 13 },
  { code: 'SD', name: 'South Dakota', routeCount: 15 },
  { code: 'TN', name: 'Tennessee', routeCount: 21 },
  { code: 'TX', name: 'Texas', routeCount: 78 },
  { code: 'UT', name: 'Utah', routeCount: 63 },
  { code: 'VT', name: 'Vermont', routeCount: 6 },
  { code: 'VA', name: 'Virginia', routeCount: 33 },
  { code: 'WA', name: 'Washington', routeCount: 54 },
  { code: 'WV', name: 'West Virginia', routeCount: 11 },
  { code: 'WI', name: 'Wisconsin', routeCount: 17 },
  { code: 'WY', name: 'Wyoming', routeCount: 27 },
]

/**
 * StateFilterSheet component
 *
 * AC-001: Searchable FlatList of states with route counts, filters out zero-route states
 * AC-002: onSelectionChange callback fires for map centering
 * AC-003: Multi-select with toggle, header shows total routes
 * AC-004: Clear button resets selection and returns to proximity mode
 */
export const StateFilterSheet = ({
  visible,
  states,
  selected,
  onSelectionChange,
  onDismiss,
  testID = 'state-filter-sheet',
}: StateFilterSheetProps) => {
  const { semantic } = useSemanticTheme()
  const [searchQuery, setSearchQuery] = useState('')

  // Filter states: hide zero-route states, filter by search query
  const filteredStates = useMemo(() => {
    return states.filter(
      (state) =>
        state.routeCount > 0 && state.name.toLowerCase().includes(searchQuery.toLowerCase()),
    )
  }, [states, searchQuery])

  // Calculate total routes across selected states
  const totalSelectedRoutes = useMemo(() => {
    return states.filter((s) => selected.includes(s.code)).reduce((sum, s) => sum + s.routeCount, 0)
  }, [states, selected])

  // Handle state toggle (multi-select)
  const handleStatePress = (stateCode: string) => {
    const nextSelected = selected.includes(stateCode)
      ? selected.filter((s) => s !== stateCode)
      : [...selected, stateCode]
    onSelectionChange(nextSelected)
  }

  // Handle clear button
  const handleClear = () => {
    onSelectionChange([])
    onDismiss()
  }

  return (
    <BottomSheetWrapper
      isVisible={visible}
      onClose={onDismiss}
      preset="full"
      hasTextInput={true}
      testID={testID}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: semantic.color.border.default }]}>
          <Text variant="titleLarge" style={{ color: semantic.color.onSurface.default }}>
            Filter by State
          </Text>
          <Text variant="bodyMedium" style={{ color: semantic.color.onSurface.muted }}>
            {selected.length > 0
              ? `${selected.length} state${selected.length > 1 ? 's' : ''} selected · ${totalSelectedRoutes} routes`
              : 'Select states to filter routes'}
          </Text>
        </View>

        {/* Search Input */}
        <BottomSheetInput
          placeholder="Search states..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon="magnify"
          testID={`${testID}-search-input`}
        />

        {/* State List */}
        <FlatList
          data={filteredStates}
          keyExtractor={(item) => item.code}
          renderItem={({ item }) => (
            <StateListItem
              state={item}
              isSelected={selected.includes(item.code)}
              onPress={() => handleStatePress(item.code)}
              testID={`${testID}-state-${item.code}`}
            />
          )}
          style={styles.list}
          showsVerticalScrollIndicator={true}
          ListEmptyComponent={
            <View style={[styles.emptyContainer, { gap: semantic.space.md }]}>
              <IconSymbol
                name="map-search"
                size={48}
                color={semantic.color.onSurface.subtle ?? 'transparent'}
                testID={`${testID}-empty-icon`}
              />
              <Text
                variant="bodyMedium"
                style={{ color: semantic.color.onSurface.muted, textAlign: 'center' }}
              >
                {searchQuery
                  ? `No states match "${searchQuery}"`
                  : 'No states with routes available'}
              </Text>
            </View>
          }
        />

        {/* Clear Button */}
        {selected.length > 0 && (
          <View style={styles.footer}>
            <Button
              variant="outline"
              size="default"
              onPress={handleClear}
              testID={`${testID}-clear-button`}
              style={styles.clearButton}
            >
              Clear Selection
            </Button>
          </View>
        )}
      </View>
    </BottomSheetWrapper>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 16,
  },
  header: {
    gap: 4,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  list: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  footer: {
    paddingTop: 16,
    borderTopWidth: 0,
  },
  clearButton: {
    width: '100%',
  },
})
