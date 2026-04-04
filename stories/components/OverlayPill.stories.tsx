/**
 * OverlayPill Component Story
 * Demonstrates weather overlay toggle pills
 */
import type { Meta, StoryObj } from '@storybook/react-native'
import React from 'react'
import { View } from 'react-native'
import { OverlayPill } from '../../components/ui/overlay-pill'

const meta: Meta<typeof OverlayPill> = {
  title: 'Components/OverlayPill',
  component: OverlayPill,
  parameters: {
    docs: {
      description: {
        component: 'Toggle pill for weather overlays (wind, rain, temperature) with active/inactive states.',
      },
    },
    layout: 'centered',
  },
  argTypes: {
    icon: {
      control: 'text',
      description: 'MaterialCommunityIcons icon name',
    },
    label: {
      control: 'text',
      description: 'Label text displayed next to icon',
    },
    active: {
      control: 'boolean',
      description: 'Active state of the pill',
    },
    iconSize: {
      control: { type: 'number' },
      description: 'Icon size in pixels',
    },
    onPress: {
      action: 'pressed',
      description: 'Called when pill is pressed',
    },
  },
  args: {
    icon: 'weather-windy',
    label: 'Wind',
    active: false,
    iconSize: 16,
  },
}

export default meta
type Story = StoryObj<typeof OverlayPill>

export const Default: Story = {
  args: {
    icon: 'weather-windy',
    label: 'Wind',
    active: false,
  },
}

export const Active: Story = {
  args: {
    icon: 'weather-windy',
    label: 'Wind',
    active: true,
  },
}

export const Rain: Story = {
  args: {
    icon: 'water',
    label: 'Rain',
    active: false,
  },
}

export const Temperature: Story = {
  args: {
    icon: 'thermometer',
    label: 'Temp',
    active: false,
  },
}

export const AllOverlays: Story = {
  render: () => (
    <View
      style={{
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap',
        justifyContent: 'center',
      }}
    >
      <OverlayPill icon="weather-windy" label="Wind" active />
      <OverlayPill icon="water" label="Rain" />
      <OverlayPill icon="thermometer" label="Temp" />
    </View>
  ),
}
