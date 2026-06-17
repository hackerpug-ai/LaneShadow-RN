import type { Meta, StoryObj } from '@storybook/react'
import { View, StyleSheet } from 'react-native'
import { RouteOptionsSheet } from '../../components/sheets/route-options-sheet'
import type { PlannedRouteOptionsView, PlannedRouteOptionView } from '../../shared/types/routes'

// Mock planned route options data
const mockRouteOptions: PlannedRouteOptionsView = {
  planId: 'plan-123',
  options: [
    {
      routeOptionId: 'route-1',
      label: 'Scenic Mountain Pass',
      rationale: 'Most direct route through mountain terrain with scenic overlooks',
      stats: {
        distanceMeters: 145000,
        durationSeconds: 9900,
        legsCount: 3,
      },
      map: {
        bounds: {
          north: 37.8,
          south: 37.6,
          east: -122.3,
          west: -122.5,
        },
        overviewGeometry: {
          format: 'polyline' as const,
          encoding: 'utf8',
          precision: 5,
          value: 'encoded_polyline_here',
        },
        legs: [],
      },
      overlaysPreview: {
        windSummary: 'moderate',
        rainSummary: 'none',
        temperatureSummary: 'mild',
        maxTemperatureF: 65,
        conditionsStatus: 'ok',
      },
    },
    {
      routeOptionId: 'route-2',
      label: 'Coastal Highway',
      rationale: 'Longer route with ocean views and lower traffic',
      stats: {
        distanceMeters: 178000,
        durationSeconds: 11700,
        legsCount: 4,
      },
      map: {
        bounds: {
          north: 37.8,
          south: 37.5,
          east: -122.2,
          west: -122.6,
        },
        overviewGeometry: {
          format: 'polyline' as const,
          encoding: 'utf8',
          precision: 5,
          value: 'encoded_polyline_here',
        },
        legs: [],
      },
      overlaysPreview: {
        windSummary: 'high',
        rainSummary: 'none',
        temperatureSummary: 'mild',
        maxTemperatureF: 70,
        conditionsStatus: 'ok',
      },
    },
    {
      routeOptionId: 'route-3',
      label: 'Direct Interstate',
      rationale: 'Fastest route using major highways',
      stats: {
        distanceMeters: 158000,
        durationSeconds: 8400,
        legsCount: 2,
      },
      map: {
        bounds: {
          north: 37.75,
          south: 37.55,
          east: -122.25,
          west: -122.45,
        },
        overviewGeometry: {
          format: 'polyline' as const,
          encoding: 'utf8',
          precision: 5,
          value: 'encoded_polyline_here',
        },
        legs: [],
      },
      overlaysPreview: {
        windSummary: 'high',
        rainSummary: 'none',
        temperatureSummary: 'warm',
        maxTemperatureF: 75,
        conditionsStatus: 'ok',
      },
    },
  ],
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

const meta: Meta<typeof RouteOptionsSheet> = {
  title: 'Sheets/RouteOptionsSheet',
  component: RouteOptionsSheet,
  parameters: {
    docs: {
      description: {
        component: 'Full-height bottom sheet displaying planned route options with selectable cards. Shows route stats, weather overlays, and action buttons for viewing details or navigating back.',
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
    planningResult: {
      control: 'object',
      description: 'Planned route options to display',
    },
    selectedRouteId: {
      control: 'text',
      description: 'Currently selected route option ID',
    },
    isLoading: {
      control: 'boolean',
      description: 'Show loading state for route cards',
    },
    onSave: {
      action: 'save',
      description: 'Callback when save button is pressed',
    },
    isSaving: {
      control: 'boolean',
      description: 'Show saving state',
    },
  },
  args: {
    isVisible: true,
    planningResult: mockRouteOptions,
    selectedRouteId: 'route-1',
    isLoading: false,
    onRouteSelect: () => {},
    onViewDetails: () => {},
    onBack: () => {},
    onClose: () => {},
    onSave: undefined,
    isSaving: false,
  },
}

export default meta
type Story = StoryObj<typeof RouteOptionsSheet>

export const Default: Story = {}

export const SecondRouteSelected: Story = {
  args: {
    selectedRouteId: 'route-2',
  },
}

export const ThirdRouteSelected: Story = {
  args: {
    selectedRouteId: 'route-3',
  },
}

export const Loading: Story = {
  args: {
    isLoading: true,
  },
}

export const SingleOption: Story = {
  args: {
    planningResult: {
      planId: 'plan-456',
      options: [mockRouteOptions.options[0]],
    },
    selectedRouteId: 'route-1',
  },
}

export const WithSaveButton: Story = {
  args: {
    onSave: () => {},
  },
}

export const SavingState: Story = {
  args: {
    onSave: () => {},
    isSaving: true,
  },
}

export const WithSaveButtonSecondRoute: Story = {
  args: {
    selectedRouteId: 'route-2',
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
    top: '10%',
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
