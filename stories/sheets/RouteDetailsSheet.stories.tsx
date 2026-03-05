/**
 * RouteDetailsSheet Component story
 * Demonstrates detailed route information with save functionality
 */

import type { Meta, StoryObj } from '@storybook/react'
import { View, StyleSheet } from 'react-native'
import { RouteDetailsSheet } from '../../components/sheets/route-details-sheet'
import type { PlannedRouteOptionView } from '../../types/routes'

// Mock route data
const mockRoute: PlannedRouteOptionView = {
  routeOptionId: 'route-1',
  label: 'Coastal Highway Route',
  rationale:
    'This route takes you along the scenic coast roads, offering beautiful panoramic views of the ocean. The elevation changes provide an exciting ride with great weather conditions. Perfect for spring when the wildflowers are blooming!',
  stats: {
    distanceMeters: 47050,
    durationSeconds: 5400,
    legsCount: 3,
  },
  map: {
    bounds: {
      north: 37.7749,
      south: 37.4237,
      east: -122.4194,
      west: -118.2437,
    },
    overviewGeometry: {
      type: 'LineString',
      coordinates: [],
    },
    legs: [],
  },
  overlaysPreview: {
    conditionsStatus: 'ok',
    windSummary: 'low',
    rainSummary: 'none',
    temperatureSummary: 'mild',
    maxTemperatureF: 65,
  },
}

const mockRouteWithHighWind: PlannedRouteOptionView = {
  routeOptionId: 'route-2',
  label: 'Mountain Pass Route',
  rationale:
    'This challenging route takes you through mountain passes with stunning views. Be prepared for elevation changes and cooler temperatures. The twisty roads are perfect for experienced riders seeking adventure.',
  stats: {
    distanceMeters: 85000,
    durationSeconds: 9000,
    legsCount: 5,
  },
  map: {
    bounds: {
      north: 38.0,
      south: 37.0,
      east: -121.0,
      west: -122.0,
    },
    overviewGeometry: {
      type: 'LineString',
      coordinates: [],
    },
    legs: [],
  },
  overlaysPreview: {
    conditionsStatus: 'ok',
    windSummary: 'high',
    rainSummary: 'none',
    temperatureSummary: 'cold',
    maxTemperatureF: 42,
  },
}

const mockRouteWithModerateWind: PlannedRouteOptionView = {
  routeOptionId: 'route-3',
  label: 'Valley Route',
  rationale:
    'A pleasant ride through the valley with moderate terrain. Good option for a relaxed afternoon ride with stops at local attractions along the way.',
  stats: {
    distanceMeters: 32000,
    durationSeconds: 3600,
    legsCount: 2,
  },
  map: {
    bounds: {
      north: 37.5,
      south: 37.2,
      east: -121.8,
      west: -122.2,
    },
    overviewGeometry: {
      type: 'LineString',
      coordinates: [],
    },
    legs: [],
  },
  overlaysPreview: {
    conditionsStatus: 'ok',
    windSummary: 'moderate',
    rainSummary: 'none',
    temperatureSummary: 'warm',
    maxTemperatureF: 75,
  },
}

const mockRouteWithUnavailableConditions: PlannedRouteOptionView = {
  routeOptionId: 'route-4',
  label: 'Desert Highway',
  rationale:
    'A long stretch through the desert landscape. Best traveled early morning or late afternoon to avoid peak heat. Make sure to carry extra water!',
  stats: {
    distanceMeters: 120000,
    durationSeconds: 10800,
    legsCount: 4,
  },
  map: {
    bounds: {
      north: 35.0,
      south: 33.0,
      east: -115.0,
      west: -118.0,
    },
    overviewGeometry: {
      type: 'LineString',
      coordinates: [],
    },
    legs: [],
  },
  overlaysPreview: {
    conditionsStatus: 'unavailable',
    windSummary: 'low',
    rainSummary: 'unavailable',
    temperatureSummary: 'unavailable',
  },
}

// Sheet wrapper decorator to simulate bottom sheet presentation
const SheetDecorator = (Story: React.ComponentType) => {
  return (
    <View style={styles.sheetContainer}>
      <View style={styles.backdrop} />
      <View style={styles.sheetWrapper}>
        <View style={styles.sheetHandle} />
        <Story />
      </View>
    </View>
  )
}

const meta: Meta<typeof RouteDetailsSheet> = {
  title: 'Sheets/RouteDetailsSheet',
  component: RouteDetailsSheet,
  parameters: {
    docs: {
      description: {
        component:
          'Bottom sheet displaying detailed route information including rationale, statistics, and weather conditions. Supports save functionality with loading state.',
      },
    },
    layout: 'fullscreen',
  },
  decorators: [SheetDecorator],
  argTypes: {
    isVisible: {
      control: 'boolean',
      description: 'Controls sheet visibility',
    },
    route: {
      control: 'object',
      description: 'Route data object from PlannedRouteOptionView type',
    },
    onSave: {
      action: 'save',
      description: 'Callback when save button is pressed',
    },
    isSaving: {
      control: 'boolean',
      description: 'Show saving state',
    },
    testID: {
      control: 'text',
      description: 'Test ID for testing',
    },
  },
  args: {
    isVisible: true,
    route: mockRoute,
    isSaving: false,
    onClose: () => {},
    testID: 'route-details-sheet',
  },
}

export default meta
type Story = StoryObj<typeof RouteDetailsSheet>

export const Default: Story = {}

export const WithSaveButton: Story = {
  args: {
    route: mockRoute,
    onSave: () => {},
  },
}

export const SavingState: Story = {
  args: {
    route: mockRoute,
    onSave: () => {},
    isSaving: true,
  },
}

export const HighWindRoute: Story = {
  args: {
    route: mockRouteWithHighWind,
    onSave: () => {},
  },
}

export const ModerateWindRoute: Story = {
  args: {
    route: mockRouteWithModerateWind,
    onSave: () => {},
  },
}

export const UnavailableConditions: Story = {
  args: {
    route: mockRouteWithUnavailableConditions,
    onSave: () => {},
  },
}

export const WithoutSaveButton: Story = {
  args: {
    route: mockRoute,
    onSave: undefined,
  },
}

export const LongRoute: Story = {
  args: {
    route: mockRouteWithUnavailableConditions,
    onSave: () => {},
  },
}

const styles = StyleSheet.create({
  sheetContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheetWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: '40%',
    backgroundColor: '#1A1C1F',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
})
