/**
 * Checkbox Component Story
 * Demonstrates checkbox control with semantic theme styling
 */
import type { Meta, StoryObj } from '@storybook/react-native'
import React from 'react'
import { useState } from 'react'
import { View, Text } from 'react-native'
import { Checkbox } from '../../components/ui/checkbox'

const meta: Meta<typeof Checkbox> = {
  title: 'Components/Checkbox',
  component: Checkbox,
  parameters: {
    docs: {
      description: {
        component: 'Checkbox control with semantic theme styling. Supports checked, unchecked, indeterminate, and disabled states.',
      },
    },
    layout: 'centered',
  },
  argTypes: {
    checked: {
      control: 'boolean',
      description: 'Checked state',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
    },
    indeterminate: {
      control: 'boolean',
      description: 'Indeterminate state',
    },
  },
  args: {
    checked: false,
    disabled: false,
    indeterminate: false,
  },
}

export default meta
type Story = StoryObj<typeof Checkbox>

export const Unchecked: Story = {
  args: {
    checked: false,
  },
}

export const Checked: Story = {
  args: {
    checked: true,
  },
}

export const Indeterminate: Story = {
  args: {
    checked: false,
    indeterminate: true,
  },
}

export const Disabled: Story = {
  args: {
    checked: false,
    disabled: true,
  },
}

export const DisabledChecked: Story = {
  args: {
    checked: true,
    disabled: true,
  },
}

const InteractiveDemo = () => {
  const [checked, setChecked] = useState(false)
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Checkbox checked={checked} onCheckedChange={setChecked} />
      <Text>Accept terms and conditions</Text>
    </View>
  )
}

export const Interactive: Story = {
  render: () => <InteractiveDemo />,
}

const MultipleDemo = () => {
  const [options, setOptions] = useState({ scenic: true, paved: false, loop: true })
  return (
    <View style={{ gap: 12 }}>
      {[
        { key: 'scenic', label: 'Scenic Route' },
        { key: 'paved', label: 'Paved Roads Only' },
        { key: 'loop', label: 'Loop Route' },
      ].map((option) => (
        <View key={option.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Checkbox
            checked={options[option.key as keyof typeof options]}
            onCheckedChange={(checked) => setOptions({ ...options, [option.key]: checked })}
          />
          <Text>{option.label}</Text>
        </View>
      ))}
    </View>
  )
}

export const Multiple: Story = {
  render: () => <MultipleDemo />,
}
