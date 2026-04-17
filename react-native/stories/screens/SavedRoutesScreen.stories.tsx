import type { Meta, StoryObj } from '@storybook/react'
import { View } from 'react-native'
import { SavedRoutesScreen } from '../../components/screens/saved-routes-screen'
import type { SavedRouteData } from '../../components/screens/saved-routes-screen'

const mockSavedRoutes: SavedRouteData[] = [
  {
    id: '1',
    name: 'Pacific Coast Highway',
    path: 'San Francisco → Los Angeles',
    duration: '8h 30m',
    distance: '460 mi',
    thumbnailRotation: -15,
  },
  {
    id: '2',
    name: 'Blue Ridge Parkway',
    path: 'Waynesville → Asheville',
    duration: '2h 15m',
    distance: '115 mi',
    thumbnailRotation: -8,
  },
  {
    id: '3',
    name: 'Tail of the Dragon',
    path: 'Deal’s Gap → Tapoco',
    duration: '45m',
    distance: '11 mi',
    thumbnailRotation: -20,
  },
  {
    id: '4',
    name: 'Beartooth Highway',
    path: 'Red Lodge → Cooke City',
    duration: '3h 0m',
    distance: '168 mi',
    thumbnailRotation: -12,
  },
  {
    id: '5',
    name: 'Going-to-the-Sun Road',
    path: 'West Glacier → St. Mary',
    duration: '2h 30m',
    distance: '50 mi',
    thumbnailRotation: -5,
  },
]

const meta: Meta<typeof SavedRoutesScreen> = {
  title: 'Screens/SavedRoutesScreen',
  component: SavedRoutesScreen,
  parameters: {
    docs: {
      description: {
        component: 'Screen displaying saved motorcycle routes with search functionality. Shows a list of saved routes with route thumbnails, stats, and search bar with FAB for adding new routes.',
      },
    },
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <View style={{ flex: 1 }}>
        <Story />
      </View>
    ),
  ],
  argTypes: {
    routes: {
      control: 'object',
      description: 'Saved routes to display',
    },
    searchQuery: {
      control: 'text',
      description: 'Search query text',
    },
    loading: {
      control: 'boolean',
      description: 'Loading state',
    },
    emptyMessage: {
      control: 'text',
      description: 'Empty state message',
    },
    emptySubtext: {
      control: 'text',
      description: 'Empty state subtext',
    },
  },
  args: {
    routes: mockSavedRoutes,
    searchQuery: '',
    loading: false,
    emptyMessage: 'No saved routes',
    emptySubtext: 'Create your first motorcycle adventure',
  },
}

export default meta
type Story = StoryObj<typeof SavedRoutesScreen>

export const Default: Story = {}

export const Empty: Story = {
  args: {
    routes: [],
  },
}

export const Loading: Story = {
  args: {
    loading: true,
  },
}

export const WithSearchResults: Story = {
  args: {
    searchQuery: 'coast',
  },
}

export const SingleRoute: Story = {
  args: {
    routes: [mockSavedRoutes[0]],
  },
}

export const ManyRoutes: Story = {
  args: {
    routes: [...mockSavedRoutes, ...mockSavedRoutes],
  },
}

export const NoStats: Story = {
  args: {
    routes: [
      {
        id: '1',
        name: 'Quick Commute',
        path: 'Home → Work',
        thumbnailRotation: -10,
      },
    ],
  },
}
