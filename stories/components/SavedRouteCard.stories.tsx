/**
 * SavedRouteCard Component Story
 * Demonstrates saved route cards with thumbnails
 */
import type { Meta, StoryObj } from '@storybook/react-native'
import React from 'react'
import { View } from 'react-native'
import { SavedRouteCard } from '../../components/ui/saved-route-card'

const meta: Meta<typeof SavedRouteCard> = {
  title: 'Components/SavedRouteCard',
  component: SavedRouteCard,
  parameters: {
    docs: {
      description: {
        component: 'Saved route card with thumbnail, name, path, and stats. Used in saved routes list.',
      },
    },
    layout: 'padded',
  },
  argTypes: {
    name: {
      control: 'text',
      description: 'Route name',
    },
    path: {
      control: 'text',
      description: 'Route path (origin → destination)',
    },
    duration: {
      control: 'text',
      description: 'Duration stat',
    },
    distance: {
      control: 'text',
      description: 'Distance stat',
    },
    thumbnailRotation: {
      control: { type: 'number' },
      description: 'Rotation of the route thumbnail in degrees',
    },
    onPress: {
      action: 'pressed',
      description: 'Called when card is pressed',
    },
  },
  args: {
    name: 'Scenic Coast Route',
    path: 'San Francisco → Monterey',
    duration: '2h 15m',
    distance: '87 mi',
    thumbnailRotation: -10,
  },
}

export default meta
type Story = StoryObj<typeof SavedRouteCard>

export const Default: Story = {}

export const ShortRoute: Story = {
  args: {
    name: 'Mountain Loop',
    path: 'Palo Alto → Santa Cruz',
    duration: '1h 45m',
    distance: '62 mi',
    thumbnailRotation: 15,
  },
}

export const LongRoute: Story = {
  args: {
    name: 'Wine Country Run',
    path: 'Napa → Sonoma',
    duration: '3h 00m',
    distance: '95 mi',
    thumbnailRotation: -25,
  },
}

export const WithoutStats: Story = {
  args: {
    name: 'Weekend Escape',
    path: 'San Jose → Santa Cruz',
    thumbnailRotation: 0,
  },
}

export const Multiple: Story = {
  render: () => (
    <View style={{ gap: 12 }}>
      <SavedRouteCard
        name="Scenic Coast Route"
        path="San Francisco → Monterey"
        duration="2h 15m"
        distance="87 mi"
      />
      <SavedRouteCard
        name="Mountain Loop"
        path="Palo Alto → Santa Cruz"
        duration="1h 45m"
        distance="62 mi"
        thumbnailRotation={15}
      />
      <SavedRouteCard
        name="Wine Country Run"
        path="Napa → Sonoma"
        duration="3h 00m"
        distance="95 mi"
        thumbnailRotation={-25}
      />
    </View>
  ),
}
