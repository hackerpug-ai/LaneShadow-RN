/**
 * Progress Component Story
 * Demonstrates progress bar with semantic theme styling
 */
import type { Meta, StoryObj } from '@storybook/react-native'
import React from 'react'
import { useState } from 'react'
import { View, Text, Pressable } from 'react-native'
import { Progress } from '../../components/ui/progress'

const meta: Meta<typeof Progress> = {
  title: 'Components/Progress',
  component: Progress,
  parameters: {
    docs: {
      description: {
        component: 'Progress bar with semantic theme styling. Supports determinate and indeterminate states.',
      },
    },
    layout: 'centered',
  },
  argTypes: {
    value: {
      control: 'number',
      description: 'Progress value (0-100)',
    },
    max: {
      control: 'number',
      description: 'Maximum value',
    },
    indeterminate: {
      control: 'boolean',
      description: 'Indeterminate/loading state',
    },
  },
  args: {
    value: 50,
    max: 100,
    indeterminate: false,
  },
}

export default meta
type Story = StoryObj<typeof Progress>

export const Zero: Story = {
  render: () => <View style={{ width: 300 }}><Progress value={0} /></View>
}

export const Quarter: Story = {
  render: () => <View style={{ width: 300 }}><Progress value={25} /></View>
}

export const Half: Story = {
  render: () => <View style={{ width: 300 }}><Progress value={50} /></View>
}

export const ThreeQuarters: Story = {
  render: () => <View style={{ width: 300 }}><Progress value={75} /></View>
}

export const Full: Story = {
  render: () => <View style={{ width: 300 }}><Progress value={100} /></View>
}

export const Indeterminate: Story = {
  render: () => <View style={{ width: 300 }}><Progress value={0} indeterminate /></View>
}

const WithLabelDemo = () => {
  const [value, setValue] = useState(65)
  return (
    <View style={{ width: 300, gap: 8 }}>
      <Text>Downloading route... {value}%</Text>
      <Progress value={value} />
      <Pressable onPress={() => setValue(Math.min(100, value + 10))}><Text style={{ textDecorationLine: 'underline' }}>Advance</Text></Pressable>
    </View>
  )
}

export const WithLabel: Story = {
  render: () => <WithLabelDemo />,
}

export const CustomMax: Story = {
  render: () => (
    <View style={{ width: 300 }}>
      <Progress value={7} max={10} />
    </View>
  ),
}

export const InCard: Story = {
  render: () => (
    <View style={{ width: 300, padding: 16, backgroundColor: '#f5f5f5', borderRadius: 8, gap: 12 }}>
      <Text style={{ fontWeight: '600' }}>Loading map data...</Text>
      <Progress value={45} />
    </View>
  ),
}
