import type { Meta, StoryObj } from '@storybook/react'
import { RouteComparisonView } from '../../components/screens/route-comparison-view'
import type { PlannedRouteOptionView } from '../../types/routes'

// Mock route data
const mockRoutes: PlannedRouteOptionView[] = [
  {
    routeOptionId: 'route-1',
    label: 'Scenic A',
    rationale:
      'This route takes you through the most scenic backroads with minimal highway time. Perfect for a leisurely Sunday ride with great photo opportunities.',
    stats: {
      distanceMeters: 45000,
      durationSeconds: 3600,
      legsCount: 4,
    },
    map: {
      bounds: { north: 37.8, south: 37.7, east: -122.3, west: -122.5 },
      overviewGeometry: 'encoded_polyline_string',
      legs: [],
    },
    overlaysPreview: {
      windSummary: 'low',
      rainSummary: 'none',
      conditionsStatus: 'ok',
    },
  },
  {
    routeOptionId: 'route-2',
    label: 'Fast B',
    rationale:
      'The most efficient route with highway segments. Best when you need to get to your destination quickly while still avoiding heavy traffic.',
    stats: {
      distanceMeters: 38000,
      durationSeconds: 2700,
      legsCount: 3,
    },
    map: {
      bounds: { north: 37.8, south: 37.7, east: -122.3, west: -122.5 },
      overviewGeometry: 'encoded_polyline_string',
      legs: [],
    },
    overlaysPreview: {
      windSummary: 'moderate',
      rainSummary: 'light',
      conditionsStatus: 'ok',
    },
  },
  {
    routeOptionId: 'route-3',
    label: 'Coastal C',
    rationale:
      'A beautiful coastal route with ocean views. Warning: crosswinds may be strong in exposed areas.',
    stats: {
      distanceMeters: 52000,
      durationSeconds: 4200,
      legsCount: 5,
    },
    map: {
      bounds: { north: 37.8, south: 37.7, east: -122.3, west: -122.5 },
      overviewGeometry: 'encoded_polyline_string',
      legs: [],
    },
    overlaysPreview: {
      windSummary: 'high',
      rainSummary: 'moderate',
      conditionsStatus: 'ok',
    },
  },
]

const meta: Meta<typeof RouteComparisonView> = {
  title: 'Screens/RouteComparisonView',
  component: RouteComparisonView,
  parameters: {
    docs: {
      description: {
        component:
          'Screen for comparing and selecting route options. Displays route cards with selection state, details button, and save action.',
      },
    },
    viewport: {
      defaultViewport: 'mobile1',
    },
    layout: 'fullscreen',
  },
  argTypes: {
    routes: {
      control: { type: 'object' },
      description: 'Array of route options to display',
    },
    selectedRouteId: {
      control: { type: 'text' },
      description: 'ID of the currently selected route',
    },
    onRouteSelect: {
      action: 'onRouteSelect',
      description: 'Callback fired when a route is selected',
    },
    onViewDetails: {
      action: 'onViewDetails',
      description: 'Callback fired when user wants to view route details',
    },
    onSave: {
      action: 'onSave',
      description: 'Callback fired when user wants to save a route',
    },
    isLoading: {
      control: { type: 'boolean' },
      description: 'Shows loading state',
    },
    testID: {
      control: { type: 'text' },
      description: 'Test ID for testing purposes',
    },
  },
  args: {
    routes: mockRoutes,
    selectedRouteId: 'route-1',
    isLoading: false,
    testID: 'route-comparison-view',
  },
}

export default meta
type Story = StoryObj<typeof RouteComparisonView>

export const Default: Story = {
  args: {
    selectedRouteId: 'route-1',
  },
}

export const NoSelection: Story = {
  args: {
    selectedRouteId: null,
  },
}

export const SingleRoute: Story = {
  args: {
    routes: [mockRoutes[0]],
    selectedRouteId: 'route-1',
  },
}

export const Loading: Story = {
  args: {
    isLoading: true,
    routes: [],
  },
}

export const Empty: Story = {
  args: {
    routes: [],
    selectedRouteId: null,
  },
}

export const SecondSelected: Story = {
  args: {
    selectedRouteId: 'route-2',
  },
}
