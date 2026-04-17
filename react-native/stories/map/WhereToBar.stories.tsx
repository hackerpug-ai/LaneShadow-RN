/**
 * WhereToBar Component Story
 * Search bar with place autocomplete for route planning
 */
import type { Meta, StoryObj } from '@storybook/react-native'
import React, { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import { WhereToBar } from '../../components/map/where-to-bar'
import type { RouteStop } from '../../../server/types/routes'

const meta: Meta<typeof WhereToBar> = {
  title: 'Map/WhereToBar',
  component: WhereToBar,
  parameters: {
    docs: {
      description: {
        component: 'Bottom-anchored "Where to?" search bar with Places autocomplete. Shows suggestions above the input with loading skeletons and place results.',
      },
    },
    layout: 'fullscreen',
  },
  argTypes: {
    onPlaceSelected: {
      description: 'Callback when a place is selected',
    },
    onClear: {
      description: 'Callback when search is cleared',
    },
  },
  args: {
    onPlaceSelected: (place: RouteStop) => console.log('Place selected:', place),
    onClear: () => console.log('Search cleared'),
  },
}

export default meta
type Story = StoryObj<typeof WhereToBar>

export const Default: Story = {
  render: (args) => (
    <View style={styles.mapContainer}>
      <View style={styles.placeholderMap}>
        <View style={styles.contentArea}>
          <Text variant="titleMedium" style={styles.hintText}>
            Search for a destination
          </Text>
        </View>
        <View style={styles.barContainer}>
          <WhereToBar {...args} />
        </View>
      </View>
    </View>
  ),
}

export const WithInitialValue: Story = {
  render: (args) => (
    <View style={styles.mapContainer}>
      <View style={styles.placeholderMap}>
        <View style={styles.contentArea}>
          <Text variant="titleMedium" style={styles.hintText}>
            Current search
          </Text>
        </View>
        <View style={styles.barContainer}>
          <WhereToBarWrapper initialValue="Temple Square" {...args} />
        </View>
      </View>
    </View>
  ),
}

const WithSelectionDemo = () => {
  const [selectedPlace, setSelectedPlace] = useState<RouteStop | null>(null)

  const handlePlaceSelected = (place: RouteStop) => {
    setSelectedPlace(place)
  }

  return (
    <View style={styles.mapContainer}>
      <View style={styles.placeholderMap}>
        <View style={styles.contentArea}>
          {selectedPlace ? (
            <View style={styles.selectedCard}>
              <Text variant="titleMedium" style={styles.selectedTitle}>
                Selected Destination
              </Text>
              <Text variant="bodyLarge" style={styles.selectedLabel}>
                {selectedPlace.label}
              </Text>
              {selectedPlace.lat && selectedPlace.lng && (
                <Text variant="bodySmall" style={styles.selectedCoords}>
                  {selectedPlace.lat.toFixed(4)}, {selectedPlace.lng.toFixed(4)}
                </Text>
              )}
            </View>
          ) : (
            <Text variant="titleMedium" style={styles.hintText}>
              Search for a destination
            </Text>
          )}
        </View>
        <View style={styles.barContainer}>
          <WhereToBar onPlaceSelected={handlePlaceSelected} />
        </View>
      </View>
    </View>
  )
}

export const WithSelection: Story = {
  render: () => <WithSelectionDemo />,
}

export const OnMapBackground: Story = {
  render: (args) => (
    <View style={styles.mapContainer}>
      <View style={styles.mapPlaceholder}>
        <View style={styles.mapGrid}>
          {Array.from({ length: 15 }).map((_, i) => (
            <View key={i} style={styles.gridLine} />
          ))}
        </View>
        <View style={styles.barContainer}>
          <WhereToBar {...args} />
        </View>
      </View>
    </View>
  ),
}

export const WithHeader: Story = {
  render: (args) => (
    <View style={styles.mapContainer}>
      <View style={styles.mapPlaceholder}>
        <View style={styles.fakeHeader}>
          <View style={styles.headerContent}>
            <View style={styles.headerText} />
            <View style={styles.headerTextShort} />
          </View>
        </View>
        <View style={styles.mapGrid}>
          {Array.from({ length: 15 }).map((_, i) => (
            <View key={i} style={styles.gridLine} />
          ))}
        </View>
        <View style={styles.barContainer}>
          <WhereToBar {...args} />
        </View>
      </View>
    </View>
  ),
}

const InteractiveDemo = () => {
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [lastSelection, setLastSelection] = useState<string>('')

  const handlePlaceSelected = (place: RouteStop) => {
    setLastSelection(place.label)
    setSearchHistory((prev) => [place.label, ...prev].slice(0, 5))
  }

  return (
    <View style={styles.mapContainer}>
      <View style={styles.mapPlaceholder}>
        <View style={styles.infoPanel}>
          <Text variant="titleSmall" style={styles.panelTitle}>
            Search Activity
          </Text>
          {lastSelection ? (
            <View style={styles.panelItem}>
              <Text variant="bodySmall" style={styles.panelLabel}>
                Last selection:
              </Text>
              <Text variant="bodyMedium" style={styles.panelValue}>
                {lastSelection}
              </Text>
            </View>
          ) : (
            <Text variant="bodySmall" style={styles.panelEmpty}>
              No destination selected yet
            </Text>
          )}
          {searchHistory.length > 0 && (
            <View style={styles.historySection}>
              <Text variant="labelSmall" style={styles.historyTitle}>
                Recent searches:
              </Text>
              {searchHistory.map((item, index) => (
                <Text key={index} variant="bodySmall" style={styles.historyItem}>
                  {index + 1}. {item}
                </Text>
              ))}
            </View>
          )}
        </View>
        <View style={styles.barContainer}>
          <WhereToBar onPlaceSelected={handlePlaceSelected} />
        </View>
      </View>
    </View>
  )
}

export const Interactive: Story = {
  render: () => <InteractiveDemo />,
}

// Helper component to demonstrate with initial value
function WhereToBarWrapper({ initialValue, ...props }: { initialValue?: string; onPlaceSelected: (place: RouteStop) => void; onClear?: () => void }) {
  const [value, setValue] = useState(initialValue || '')

  // This is a simplified wrapper for demo purposes
  // In real usage, WhereToBar manages its own state
  return (
    <View style={styles.wrapperContainer}>
      <Text style={styles.simulatedText}>{value || 'Where to?'}</Text>
      <Text style={styles.simulatedHint}>Simulated input (component manages own state)</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  mapContainer: {
    flex: 1,
    backgroundColor: '#E5E7EB',
  },
  placeholderMap: {
    flex: 1,
    backgroundColor: '#D1D5DB',
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#9CA3AF',
  },
  contentArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  hintText: {
    color: '#6B7280',
    textAlign: 'center',
  },
  barContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  mapGrid: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    flexWrap: 'wrap',
    opacity: 0.2,
  },
  gridLine: {
    width: '20%',
    height: 2,
    backgroundColor: '#4B5563',
    marginVertical: 20,
  },
  fakeHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  headerContent: {
    gap: 8,
  },
  headerText: {
    height: 24,
    width: '60%',
    backgroundColor: '#D1D5DB',
    borderRadius: 4,
  },
  headerTextShort: {
    height: 16,
    width: '40%',
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  selectedCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    gap: 8,
  },
  selectedTitle: {
    color: '#6B7280',
  },
  selectedLabel: {
    color: '#111827',
  },
  selectedCoords: {
    color: '#9CA3AF',
  },
  infoPanel: {
    position: 'absolute',
    top: 100,
    left: 16,
    right: 16,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    gap: 12,
  },
  panelTitle: {
    color: '#374151',
    fontWeight: '600',
  },
  panelItem: {
    gap: 4,
  },
  panelLabel: {
    color: '#6B7280',
  },
  panelValue: {
    color: '#111827',
  },
  panelEmpty: {
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  historySection: {
    gap: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  historyTitle: {
    color: '#6B7280',
  },
  historyItem: {
    color: '#4B5563',
  },
  wrapperContainer: {
    backgroundColor: 'white',
    borderRadius: 28,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 4,
  },
  simulatedText: {
    fontSize: 16,
    color: '#111827',
  },
  simulatedHint: {
    fontSize: 12,
    color: '#9CA3AF',
  },
})
