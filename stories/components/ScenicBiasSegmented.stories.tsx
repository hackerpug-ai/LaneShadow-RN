/**
 * ScenicBiasSegmented Component Story
 * Demonstrates scenic bias segmented control
 */
import type { Meta, StoryObj } from '@storybook/react-native'
import React, { useState } from 'react'
import { View } from 'react-native'
import { ScenicBiasSegmented, type ScenicBias } from '../../components/ui/scenic-bias-segmented'

const meta: Meta<typeof ScenicBiasSegmented> = {
  title: 'Components/ScenicBiasSegmented',
  component: ScenicBiasSegmented,
  parameters: {
    docs: {
      description: {
        component: 'Segmented control for selecting scenic bias preference. Default or High Scenic.',
      },
    },
    layout: 'centered',
  },
  argTypes: {
    value: {
      control: 'select',
      options: ['default', 'high'],
      description: 'Selected scenic bias value',
    },
    onValueChange: {
      action: 'changed',
      description: 'Called when value changes',
    },
  },
  args: {
    value: 'default',
  },
}

export default meta
type Story = StoryObj<typeof ScenicBiasSegmented>

const DefaultDemo = () => {
  const [value, setValue] = useState<ScenicBias>('default')
  return <ScenicBiasSegmented value={value} onValueChange={setValue} />
}

export const Default: Story = {
  render: () => <DefaultDemo />,
}

const HighScenicDemo = () => {
  const [value, setValue] = useState<ScenicBias>('high')
  return <ScenicBiasSegmented value={value} onValueChange={setValue} />
}

export const HighScenic: Story = {
  render: () => <HighScenicDemo />,
}

const InteractiveDemo = () => {
  const [value, setValue] = useState<ScenicBias>('default')
  return (
    <View style={{ padding: 16, width: 300, gap: 16 }}>
      <ScenicBiasSegmented value={value} onValueChange={setValue} />
    </View>
  )
}

export const Interactive: Story = {
  render: () => <InteractiveDemo />,
}

const InContextDemo = () => {
  const [value, setValue] = useState<ScenicBias>('high')
  return (
    <View style={{ padding: 24, width: 350, gap: 16, backgroundColor: '#f5f5f5' }}>
      <ScenicBiasSegmented value={value} onValueChange={setValue} />
    </View>
  )
}

export const InContext: Story = {
  render: () => <InContextDemo />,
}
