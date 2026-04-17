/**
 * Collapsible Component Story
 * Demonstrates collapsible content section
 */
import type { Meta, StoryObj } from '@storybook/react-native'
import React from 'react'
import { View, Text } from 'react-native'
import { Collapsible } from '../../components/ui/collapsible'

const meta: Meta<typeof Collapsible> = {
  title: 'Components/Collapsible',
  component: Collapsible,
  parameters: {
    docs: {
      description: {
        component: 'Collapsible content section with animated chevron icon.',
      },
    },
    layout: 'centered',
  },
  argTypes: {
    title: {
      control: 'text',
      description: 'Collapsible section title',
    },
  },
  args: {
    title: 'Section Title',
  },
}

export default meta
type Story = StoryObj<typeof Collapsible>

export const Default: Story = {
  render: () => (
    <Collapsible title="Expandable Section">
      <Text>This is the collapsible content.</Text>
    </Collapsible>
  ),
}

export const LongContent: Story = {
  render: () => (
    <Collapsible title="Details">
      <View style={{ gap: 8 }}>
        <Text>First detail item</Text>
        <Text>Second detail item</Text>
        <Text>Third detail item</Text>
      </View>
    </Collapsible>
  ),
}

export const Multiple: Story = {
  render: () => (
    <View style={{ width: 300, gap: 8 }}>
      <Collapsible title="Section 1">
        <Text>Content for section 1</Text>
      </Collapsible>
      <Collapsible title="Section 2">
        <Text>Content for section 2</Text>
      </Collapsible>
      <Collapsible title="Section 3">
        <Text>Content for section 3</Text>
      </Collapsible>
    </View>
  ),
}

export const Nested: Story = {
  render: () => (
    <Collapsible title="Outer Section">
      <View style={{ gap: 8 }}>
        <Text>Outer content</Text>
        <View style={{ marginLeft: 16, borderLeftWidth: 2, borderLeftColor: '#ddd', paddingLeft: 8 }}>
          <Collapsible title="Inner Section">
            <Text>Nested content</Text>
          </Collapsible>
        </View>
      </View>
    </Collapsible>
  ),
}

export const RouteDetails: Story = {
  render: () => (
    <View style={{ width: 350, padding: 16, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
      <Collapsible title="Route Information">
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text>Distance</Text>
            <Text>12.5 km</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text>Duration</Text>
            <Text>1h 45m</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text>Elevation</Text>
            <Text>350 m</Text>
          </View>
        </View>
      </Collapsible>
      <Collapsible title="Waypoints">
        <View style={{ gap: 4 }}>
          <Text>1. Start Point</Text>
          <Text>2. Scenic Overlook</Text>
          <Text>3. End Point</Text>
        </View>
      </Collapsible>
    </View>
  ),
}
