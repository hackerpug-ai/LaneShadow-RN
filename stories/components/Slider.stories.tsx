/**
 * Slider Component Story
 * Demonstrates range slider control with semantic theme styling
 */
import type { Meta, StoryObj } from '@storybook/react-native'
import React from 'react'
import { useState } from 'react'
import { View, Text } from 'react-native'
import { Slider } from '../../components/ui/slider'

const meta: Meta<typeof Slider> = {
  title: 'Components/Slider',
  component: Slider,
  parameters: {
    docs: {
      description: {
        component: 'Range slider control with draggable thumb and semantic theme styling.',
      },
    },
    layout: 'centered',
  },
  argTypes: {
    value: {
      control: 'number',
      description: 'Current value',
    },
    min: {
      control: 'number',
      description: 'Minimum value',
    },
    max: {
      control: 'number',
      description: 'Maximum value',
    },
    step: {
      control: 'number',
      description: 'Step increment',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
    },
  },
  args: {
    value: 50,
    min: 0,
    max: 100,
    step: 1,
    disabled: false,
  },
}

export default meta
type Story = StoryObj<typeof Slider>

const DefaultDemo = () => {
  const [value, setValue] = useState(50)
  return (
    <View style={{ width: 300 }}>
      <Slider value={value} onValueChange={setValue} />
    </View>
  )
}

export const Default: Story = {
  render: () => <DefaultDemo />,
}

const LowValueDemo = () => {
  const [value, setValue] = useState(25)
  return (
    <View style={{ width: 300 }}>
      <Slider value={value} onValueChange={setValue} />
    </View>
  )
}

export const LowValue: Story = {
  render: () => <LowValueDemo />,
}

const HighValueDemo = () => {
  const [value, setValue] = useState(75)
  return (
    <View style={{ width: 300 }}>
      <Slider value={value} onValueChange={setValue} />
    </View>
  )
}

export const HighValue: Story = {
  render: () => <HighValueDemo />,
}

const WithStepDemo = () => {
  const [value, setValue] = useState(5)
  return (
    <View style={{ width: 300 }}>
      <Slider value={value} onValueChange={setValue} min={0} max={10} step={1} />
    </View>
  )
}

export const WithStep: Story = {
  render: () => <WithStepDemo />,
}

const DisabledDemo = () => {
  const [value, setValue] = useState(50)
  return (
    <View style={{ width: 300 }}>
      <Slider value={value} onValueChange={setValue} disabled />
    </View>
  )
}

export const Disabled: Story = {
  render: () => <DisabledDemo />,
}

const WithLabelDemo = () => {
  const [value, setValue] = useState(65)
  return (
    <View style={{ width: 300, gap: 8 }}>
      <Text>Distance: {value} km</Text>
      <Slider value={value} onValueChange={setValue} min={5} max={200} />
    </View>
  )
}

export const WithLabel: Story = {
  render: () => <WithLabelDemo />,
}

const CustomRangeDemo = () => {
  const [value, setValue] = useState(15)
  return (
    <View style={{ width: 300 }}>
      <Slider value={value} onValueChange={setValue} min={1} max={30} step={1} />
    </View>
  )
}

export const CustomRange: Story = {
  render: () => <CustomRangeDemo />,
}
