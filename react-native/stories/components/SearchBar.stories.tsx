/**
 * SearchBar Component Story
 * Demonstrates search input bar
 */
import type { Meta, StoryObj } from '@storybook/react-native'
import React from 'react'
import { View } from 'react-native'
import { SearchBar } from '../../components/ui/search-bar'

const meta: Meta<typeof SearchBar> = {
  title: 'Components/SearchBar',
  component: SearchBar,
  parameters: {
    docs: {
      description: {
        component: 'Simple search input bar with icon. Used for searching routes and locations.',
      },
    },
    layout: 'padded',
  },
  argTypes: {
    placeholder: {
      control: 'text',
      description: 'Placeholder text displayed when empty',
    },
    value: {
      control: 'text',
      description: 'Current input value',
    },
    onPress: {
      action: 'pressed',
      description: 'Called when bar is pressed',
    },
  },
  args: {
    placeholder: 'Search routes...',
  },
}

export default meta
type Story = StoryObj<typeof SearchBar>

export const Default: Story = {}

export const WithValue: Story = {
  args: {
    placeholder: 'Search routes...',
    value: 'Coastal',
  },
}

export const LocationSearch: Story = {
  args: {
    placeholder: 'Search locations...',
  },
}

export const InContext: Story = {
  render: (args) => (
    <View style={{ width: '100%', gap: 16 }}>
      <SearchBar {...args} placeholder="Search routes..." />
      <SearchBar {...args} placeholder="Search locations..." />
    </View>
  ),
}
