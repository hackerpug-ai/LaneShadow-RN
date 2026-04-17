/**
 * Separator Component Story
 * Demonstrates visual divider with semantic theme styling
 */
import type { Meta, StoryObj } from '@storybook/react-native'
import React from 'react'
import { View, Text } from 'react-native'
import { Separator } from '../../components/ui/separator'

const meta: Meta<typeof Separator> = {
  title: 'Components/Separator',
  component: Separator,
  parameters: {
    docs: {
      description: {
        component: 'Visual divider for content sections. Supports horizontal and vertical orientations.',
      },
    },
    layout: 'centered',
  },
  argTypes: {
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
      description: 'Separator orientation',
    },
  },
  args: {
    orientation: 'horizontal',
  },
}

export default meta
type Story = StoryObj<typeof Separator>

export const Horizontal: Story = {
  render: () => (
    <View style={{ width: 300, gap: 8 }}>
      <Text>Content above</Text>
      <Separator />
      <Text>Content below</Text>
    </View>
  ),
}

export const Vertical: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', height: 100, alignItems: 'center', gap: 16 }}>
      <Text>Left</Text>
      <Separator orientation="vertical" />
      <Text>Right</Text>
    </View>
  ),
}

export const Multiple: Story = {
  render: () => (
    <View style={{ width: 300, gap: 8 }}>
      <Text>Section 1</Text>
      <Separator />
      <Text>Section 2</Text>
      <Separator />
      <Text>Section 3</Text>
      <Separator />
      <Text>Section 4</Text>
    </View>
  ),
}

export const InList: Story = {
  render: () => (
    <View style={{ width: 300, padding: 16, backgroundColor: '#f5f5f5', borderRadius: 8, gap: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text>Item 1</Text>
        <Text>$10</Text>
      </View>
      <Separator />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text>Item 2</Text>
        <Text>$20</Text>
      </View>
      <Separator />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text>Item 3</Text>
        <Text>$15</Text>
      </View>
    </View>
  ),
}

export const VerticalDivider: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', padding: 16, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
      <View style={{ flex: 1 }}>
        <Text>Left Column</Text>
      </View>
      <Separator orientation="vertical" />
      <View style={{ flex: 1 }}>
        <Text>Right Column</Text>
      </View>
    </View>
  ),
}
