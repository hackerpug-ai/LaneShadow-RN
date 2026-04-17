import type { Meta, StoryObj } from '@storybook/react'
import { View, StyleSheet } from 'react-native'
import { PlanRideSheet } from '../../components/sheets/plan-ride-sheet'
import type { RouteStop } from '../../../server/types/routes'

// Mock RouteStop data
const mockStartStop: RouteStop = {
  lat: 37.7749,
  lng: -122.4194,
  label: 'San Francisco, CA',
}

const mockEndStop: RouteStop = {
  lat: 34.0522,
  lng: -118.2437,
  label: 'Los Angeles, CA',
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

const meta: Meta<typeof PlanRideSheet> = {
  title: 'Sheets/PlanRideSheet',
  component: PlanRideSheet,
  parameters: {
    docs: {
      description: {
        component: 'Bottom sheet for planning motorcycle rides with route inputs, departure time selection, scenic bias selection, and preference toggles. Integrates with location search and route planning.',
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
    startStop: {
      control: 'object',
      description: 'Starting location for the route',
    },
    endStop: {
      control: 'object',
      description: 'Destination location for the route',
    },
    scenicBias: {
      control: { type: 'select' },
      options: ['default', 'high'],
      description: 'Preference for scenic routes',
    },
    avoidHighways: {
      control: 'boolean',
      description: 'Avoid highways in route calculation',
    },
    avoidTolls: {
      control: 'boolean',
      description: 'Avoid toll roads in route calculation',
    },
    departureTime: {
      control: 'date',
      description: 'Planned departure time',
    },
    isPlanning: {
      control: 'boolean',
      description: 'Show planning state',
    },
  },
  args: {
    isVisible: true,
    startStop: mockStartStop,
    endStop: null,
    scenicBias: 'default',
    avoidHighways: false,
    avoidTolls: false,
    departureTime: new Date(),
    isPlanning: false,
    onSetStartStop: () => {},
    onSetEndStop: () => {},
    onSetScenicBias: () => {},
    onToggleAvoidHighways: () => {},
    onToggleAvoidTolls: () => {},
    onSetDepartureTime: () => {},
    onPlanRide: () => {},
    onClearSelection: () => {},
    onClose: () => {},
  },
}

export default meta
type Story = StoryObj<typeof PlanRideSheet>

export const Default: Story = {}

export const WithBothLocations: Story = {
  args: {
    startStop: mockStartStop,
    endStop: mockEndStop,
  },
}

export const HighScenicBias: Story = {
  args: {
    scenicBias: 'high',
    startStop: mockStartStop,
    endStop: mockEndStop,
  },
}

export const AvoidHighways: Story = {
  args: {
    avoidHighways: true,
    startStop: mockStartStop,
    endStop: mockEndStop,
  },
}

export const AvoidTolls: Story = {
  args: {
    avoidTolls: true,
    startStop: mockStartStop,
    endStop: mockEndStop,
  },
}

export const AllTogglesOn: Story = {
  args: {
    avoidHighways: true,
    avoidTolls: true,
    scenicBias: 'high',
    startStop: mockStartStop,
    endStop: mockEndStop,
  },
}

export const FutureDeparture: Story = {
  args: {
    startStop: mockStartStop,
    endStop: mockEndStop,
    departureTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
  },
}

export const PlanningState: Story = {
  args: {
    isPlanning: true,
    startStop: mockStartStop,
    endStop: mockEndStop,
  },
}

export const Empty: Story = {
  args: {
    startStop: null,
    endStop: null,
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
