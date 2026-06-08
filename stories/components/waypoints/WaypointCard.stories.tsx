/**
 * WaypointCard Component Story
 * Demonstrates individual waypoint display with status badges, deviation costs, and approval actions
 */

import type { Meta, StoryObj } from '@storybook/react-native'
import React from 'react'
import { View } from 'react-native'
import { WaypointCard } from '../../../components/waypoints/waypoint-card'
import type { Doc } from '../../../server/convex/_generated/dataModel'

// Mock waypoint factory
const createMockWaypoint = (overrides?: Partial<Doc<'waypoints'>>): Doc<'waypoints'> => ({
  _id: 'waypoint123' as any,
  _creationTime: 1234567890,
  routePlanId: 'routePlan123' as any,
  kind: 'on_route',
  status: 'pending',
  name: 'Golden Gate Bridge',
  description: 'Iconic suspension bridge',
  location: { lat: 37.8199, lng: -122.4783 },
  order: 0,
  detourInfo: undefined,
  createdAt: 1234567890,
  updatedAt: 1234567890,
  ...overrides,
})

const meta: Meta<typeof WaypointCard> = {
  title: 'Components/Waypoints/WaypointCard',
  component: WaypointCard,
  parameters: {
    docs: {
      description: {
        component: 'Individual waypoint display card with status badges, deviation costs, and approve/reject actions. Supports on-route and off-route waypoint kinds with visual distinction.',
      },
    },
    layout: 'padded',
  },
  argTypes: {
    waypoint: {
      control: 'object',
      description: 'Waypoint document to display',
    },
    order: {
      control: 'number',
      description: 'Order index for display',
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
    waypoint: createMockWaypoint(),
    order: 0,
    onApprove: () => console.log('Approve'),
    onReject: () => console.log('Reject'),
    onReorder: () => console.log('Reorder'),
  },
}

export default meta
type Story = StoryObj<typeof WaypointCard>

/**
 * Default waypoint card with on-route waypoint
 */
export const Default: Story = {
  args: {
    waypoint: createMockWaypoint({
      name: 'Golden Gate Bridge',
      description: 'Iconic suspension bridge',
      kind: 'on_route',
      status: 'pending',
    }),
    order: 0,
  },
}

/**
 * On-route waypoint with drag handle (reorder enabled)
 */
export const OnRouteWithDragHandle: Story = {
  args: {
    waypoint: createMockWaypoint({
      name: 'Pacific Coast Highway',
      description: 'Scenic coastal route',
      kind: 'on_route',
      status: 'approved',
    }),
    order: 1,
  },
}

/**
 * Off-route waypoint with deviation cost display
 */
export const OffRouteWithDeviation: Story = {
  args: {
    waypoint: createMockWaypoint({
      name: 'Muir Woods National Monument',
      description: 'Ancient redwood forest',
      kind: 'off_route',
      status: 'ready',
      detourInfo: {
        distanceKm: 12.5,
        durationMinutes: 18,
      },
    }),
    order: 2,
  },
}

/**
 * Waypoint awaiting approval (shows approve/reject buttons)
 */
export const AwaitingApproval: Story = {
  args: {
    waypoint: createMockWaypoint({
      name: 'Point Reyes Lighthouse',
      description: 'Historic lighthouse on the coast',
      kind: 'off_route',
      status: 'ready',
      detourInfo: {
        distanceKm: 25.8,
        durationMinutes: 35,
      },
    }),
    order: 3,
  },
}

/**
 * Rejected waypoint with danger border
 */
export const Rejected: Story = {
  args: {
    waypoint: createMockWaypoint({
      name: 'Napa Valley Vineyards',
      description: 'Wine country tour',
      kind: 'off_route',
      status: 'rejected',
    }),
    order: 4,
  },
}

/**
 * Approved waypoint (no action buttons)
 */
export const Approved: Story = {
  args: {
    waypoint: createMockWaypoint({
      name: 'Lake Tahoe',
      description: 'Alpine lake in the Sierra Nevada',
      kind: 'on_route',
      status: 'approved',
    }),
    order: 5,
  },
}

/**
 * Evaluating waypoint status
 */
export const Evaluating: Story = {
  args: {
    waypoint: createMockWaypoint({
      name: 'Yosemite Valley',
      description: 'Glacial valley with granite cliffs',
      kind: 'off_route',
      status: 'evaluating',
    }),
    order: 6,
  },
}

/**
 * Multiple waypoints showing different states
 */
export const MultipleStates: Story = {
  render: (args) => (
    <View style={{ gap: 12 }}>
      <WaypointCard
        {...args}
        waypoint={createMockWaypoint({
          name: 'Golden Gate Bridge',
          kind: 'on_route',
          status: 'approved',
        })}
        order={0}
      />
      <WaypointCard
        {...args}
        waypoint={createMockWaypoint({
          name: 'Muir Woods',
          kind: 'off_route',
          status: 'ready',
          detourInfo: { distanceKm: 12.5, durationMinutes: 18 },
        })}
        order={1}
      />
      <WaypointCard
        {...args}
        waypoint={createMockWaypoint({
          name: 'Point Reyes',
          kind: 'off_route',
          status: 'rejected',
        })}
        order={2}
      />
      <WaypointCard
        {...args}
        waypoint={createMockWaypoint({
          name: 'Napa Valley',
          kind: 'off_route',
          status: 'evaluating',
        })}
        order={3}
      />
    </View>
  ),
}

/**
 * Comparison of on-route vs off-route waypoints
 */
export const OnRouteVsOffRoute: Story = {
  render: (args) => (
    <View style={{ gap: 12 }}>
      <WaypointCard
        {...args}
        waypoint={createMockWaypoint({
          name: 'Highway 1 - On Route',
          description: 'Direct route along the coast',
          kind: 'on_route',
          status: 'approved',
        })}
        order={0}
      />
      <WaypointCard
        {...args}
        waypoint={createMockWaypoint({
          name: 'Scenic Detour - Off Route',
          description: 'Longer coastal route with views',
          kind: 'off_route',
          status: 'ready',
          detourInfo: { distanceKm: 8.3, durationMinutes: 12 },
        })}
        order={1}
      />
    </View>
  ),
}

/**
 * Large deviation cost example
 */
export const LargeDeviation: Story = {
  args: {
    waypoint: createMockWaypoint({
      name: 'Sequoia National Park',
      description: 'Giant sequoia grove',
      kind: 'off_route',
      status: 'ready',
      detourInfo: {
        distanceKm: 125.5,
        durationMinutes: 180,
      },
    }),
    order: 0,
  },
}

/**
 * Small deviation cost example
 */
export const SmallDeviation: Story = {
  args: {
    waypoint: createMockWaypoint({
      name: 'Sausalito Viewpoint',
      description: 'Quick photo stop',
      kind: 'off_route',
      status: 'ready',
      detourInfo: {
        distanceKm: 2.1,
        durationMinutes: 5,
      },
    }),
    order: 0,
  },
}
