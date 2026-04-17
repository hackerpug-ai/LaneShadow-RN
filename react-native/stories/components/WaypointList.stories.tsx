/**
 * WaypointList Component Story
 * Demonstrates glassmorphic waypoint list with drag-reorder and progressive disclosure
 */
import type { Meta, StoryObj } from '@storybook/react-native'
import React from 'react'
import { View, ScrollView } from 'react-native'
import { WaypointList } from '../../components/waypoints/waypoint-list'
import type { Id } from '../../../server/convex/_generated/dataModel'

// Mock waypoints data for stories
const mockWaypoints = [
  {
    _id: 'wp1' as Id<'waypoints'>,
    routePlanId: 'rp1' as Id<'route_plans'>,
    name: 'Scenic Overlook',
    description: 'Beautiful mountain views with panoramic vistas',
    kind: 'on_route' as const,
    status: 'approved' as const,
    order: 0,
    createdAt: 1000,
  },
  {
    _id: 'wp2' as Id<'waypoints'>,
    routePlanId: 'rp1' as Id<'route_plans'>,
    name: 'Detour to Waterfall',
    description: 'Short detour to natural waterfall',
    kind: 'off_route' as const,
    status: 'ready' as const,
    order: 1,
    createdAt: 2000,
    detourInfo: {
      distanceKm: 5.2,
      durationMinutes: 15,
    },
  },
  {
    _id: 'wp3' as Id<'waypoints'>,
    routePlanId: 'rp1' as Id<'route_plans'>,
    name: 'Lunch Stop',
    description: 'Restaurant with local cuisine',
    kind: 'on_route' as const,
    status: 'pending' as const,
    order: 2,
    createdAt: 3000,
  },
  {
    _id: 'wp4' as Id<'waypoints'>,
    routePlanId: 'rp1' as Id<'route_plans'>,
    name: 'Historic Downtown',
    description: 'Walk through historic district',
    kind: 'on_route' as const,
    status: 'approved' as const,
    order: 3,
    createdAt: 4000,
  },
]

const meta: Meta<typeof WaypointList> = {
  title: 'Components/WaypointList',
  component: WaypointList,
  parameters: {
    docs: {
      description: {
        component: 'Glassmorphic waypoint list with drag-to-reorder functionality, progressive disclosure, and status-based actions.',
      },
    },
    layout: 'padded',
  },
  argTypes: {
    routePlanId: {
      control: 'text',
      description: 'Route plan ID to fetch waypoints for',
    },
    initiallyCollapsed: {
      control: 'boolean',
      description: 'Initially collapsed state',
    },
    onApprove: {
      action: 'onApprove',
      description: 'Approve callback',
    },
    onReject: {
      action: 'onReject',
      description: 'Reject callback',
    },
    onReorder: {
      action: 'onReorder',
      description: 'Reorder callback',
    },
  },
  args: {
    routePlanId: 'rp1' as Id<'route_plans'>,
    initiallyCollapsed: false,
  },
  decorators: [
    (Story) => (
      <View style={{ padding: 16, backgroundColor: '#1B1715', flex: 1 }}>
        <Story />
      </View>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof WaypointList>

// Note: These stories mock the Convex useQuery hook internally
// In a real environment, you'd need to provide proper Convex context

export const Default: Story = {
  args: {
    routePlanId: 'rp1' as Id<'route_plans'>,
  },
}

export const Collapsed: Story = {
  args: {
    routePlanId: 'rp1' as Id<'route_plans'>,
    initiallyCollapsed: true,
  },
}

export const WithActions: Story = {
  args: {
    routePlanId: 'rp1' as Id<'route_plans'>,
    onApprove: (id) => console.log('Approve:', id),
    onReject: (id) => console.log('Reject:', id),
    onReorder: (id, order) => console.log('Reorder:', id, order),
  },
}

export const Empty: Story = {
  args: {
    routePlanId: 'empty' as Id<'route_plans'>,
  },
}

export const Loading: Story = {
  args: {
    routePlanId: 'loading' as Id<'route_plans'>,
  },
}

export const GlassmorphicStyle: Story = {
  args: {
    routePlanId: 'rp1' as Id<'route_plans'>,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the glassmorphic container with semi-transparent background and border. The blur effect should be applied by the parent container.',
      },
    },
  },
}

export const ProgressiveDisclosure: Story = {
  render: (args) => (
    <ScrollView style={{ flex: 1 }}>
      <WaypointList {...args} />
      <View style={{ height: 200 }} />
    </ScrollView>
  ),
  args: {
    routePlanId: 'rp1' as Id<'route_plans'>,
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates the collapsible header with progressive disclosure. Tap the header to expand/collapse.',
      },
    },
  },
}

export const AccessibilityDemo: Story = {
  args: {
    routePlanId: 'rp1' as Id<'route_plans'>,
    onApprove: (id) => console.log('Approve:', id),
    onReject: (id) => console.log('Reject:', id),
  },
  parameters: {
    docs: {
      description: {
        story: 'Component includes proper accessibility labels and hints. The container announces waypoint count and pending approvals. Header has button role with expand/collapse labels.',
      },
    },
  },
}

export const DragAffordance: Story = {
  args: {
    routePlanId: 'rp1' as Id<'route_plans'>,
    onReorder: (id, order) => console.log('Reorder:', id, order),
  },
  parameters: {
    docs: {
      description: {
        story: 'When onReorder callback is provided, a drag handle appears to indicate reordering capability. Drag-to-reorder uses react-native-reanimated for smooth animations.',
      },
    },
  },
}
