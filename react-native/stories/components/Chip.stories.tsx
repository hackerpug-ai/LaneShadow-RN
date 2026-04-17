/**
 * Chip Component Story
 * Demonstrates chip component with selection states
 */
import type { Meta, StoryObj } from '@storybook/react-native'
import React from 'react'
import { View } from 'react-native'
import { Chip } from '../../components/ui/chip'

const meta: Meta<typeof Chip> = {
  title: 'Components/Chip',
  component: Chip,
  parameters: {
    docs: {
      description: {
        component: 'Custom chip component with semantic theme styling. Supports icons and selection states.',
      },
    },
    layout: 'centered',
  },
  argTypes: {
    label: {
      control: 'text',
      description: 'Chip text content',
    },
    icon: {
      control: 'text',
      description: 'MaterialCommunityIcons icon name',
    },
    selected: {
      control: 'boolean',
      description: 'Selected state styling',
    },
    onPress: {
      action: 'pressed',
      description: 'Called when chip is pressed',
    },
  },
  args: {
    label: 'Chip Label',
    selected: false,
  },
}

export default meta
type Story = StoryObj<typeof Chip>

export const Default: Story = {
  args: {
    label: 'Default',
  },
}

export const Selected: Story = {
  args: {
    label: 'Selected',
    selected: true,
  },
}

export const WithIcon: Story = {
  args: {
    label: 'With Icon',
    icon: 'check',
  },
}

export const SelectedWithIcon: Story = {
  args: {
    label: 'Selected',
    icon: 'check',
    selected: true,
  },
}

export const MultipleChips: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      <Chip label="Mountain" icon="terrain" />
      <Chip label="Coastal" icon="waves" selected />
      <Chip label="Forest" icon="tree" />
      <Chip label="Urban" icon="city" />
    </View>
  ),
}

export const FilterChips: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      <Chip label="Distance" icon="map-marker-distance" />
      <Chip label="Duration" icon="clock-outline" selected />
      <Chip label="Elevation" icon="terrain" />
      <Chip label="Scenic" icon="image" selected />
    </View>
  ),
}

export const RouteTypes: Story = {
  render: () => (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <Chip label="Road" icon="road" />
        <Chip label="Trail" icon="nature" selected />
        <Chip label="Path" icon="router" />
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <Chip label="Flat" icon="minus" />
        <Chip label="Hilly" icon="terrain" selected />
        <Chip label="Mountain" icon="image-filter-hdr" />
      </View>
    </View>
  ),
}
