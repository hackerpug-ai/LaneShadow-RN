/**
 * RouteThumbnail Component Story
 * Demonstrates route preview thumbnails
 */
import type { Meta, StoryObj } from '@storybook/react-native'
import React from 'react'
import { View } from 'react-native'
import { RouteThumbnail } from '../../components/ui/route-thumbnail'

const meta: Meta<typeof RouteThumbnail> = {
  title: 'Components/RouteThumbnail',
  component: RouteThumbnail,
  parameters: {
    docs: {
      description: {
        component: 'Small route preview thumbnail with route line visualization. Used in saved routes list.',
      },
    },
    layout: 'centered',
  },
  argTypes: {
    width: {
      control: { type: 'number' },
      description: 'Width of the thumbnail in pixels',
    },
    height: {
      control: { type: 'number' },
      description: 'Height of the thumbnail in pixels',
    },
    rotation: {
      control: { type: 'number' },
      description: 'Rotation of the route line in degrees',
    },
    routeTop: {
      control: { type: 'number' },
      description: 'Top position offset of route line',
    },
    routeLeft: {
      control: { type: 'number' },
      description: 'Left position offset of route line',
    },
    routeWidth: {
      control: { type: 'number' },
      description: 'Route line width',
    },
    routeHeight: {
      control: { type: 'number' },
      description: 'Route line height',
    },
  },
  args: {
    width: 96,
    height: 96,
    rotation: -10,
    routeTop: 20,
    routeLeft: 15,
    routeWidth: 60,
    routeHeight: 50,
  },
}

export default meta
type Story = StoryObj<typeof RouteThumbnail>

export const Default: Story = {}

export const Large: Story = {
  args: {
    width: 120,
    height: 120,
    routeWidth: 80,
    routeHeight: 70,
  },
}

export const Small: Story = {
  args: {
    width: 64,
    height: 64,
    routeWidth: 40,
    routeHeight: 30,
  },
}

export const DifferentRotations: Story = {
  render: () => (
    <View
      style={{
        flexDirection: 'row',
        gap: 12,
        justifyContent: 'center',
        flexWrap: 'wrap',
      }}
    >
      <RouteThumbnail rotation={-30} />
      <RouteThumbnail rotation={-15} />
      <RouteThumbnail rotation={0} />
      <RouteThumbnail rotation={15} />
      <RouteThumbnail rotation={30} />
    </View>
  ),
}
