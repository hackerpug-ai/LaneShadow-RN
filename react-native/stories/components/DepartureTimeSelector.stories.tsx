/**
 * DepartureTimeSelector Component Story
 * Demonstrates departure time selection with native date picker
 */
import type { Meta, StoryObj } from '@storybook/react-native'
import React, { useState } from 'react'
import { View } from 'react-native'
import { DepartureTimeSelector, DepartureTimeSelectorProps } from '../../components/ui/departure-time-selector'

// Wrapper component to handle state in stories
const DepartureTimeSelectorWrapper = (props: Partial<DepartureTimeSelectorProps>) => {
  const [date, setDate] = useState(props.value || new Date())
  return (
    <DepartureTimeSelector
      value={date}
      onChange={setDate}
      label={props.label}
      minimumDate={props.minimumDate}
      testID={props.testID}
    />
  )
}

const meta: Meta<typeof DepartureTimeSelectorWrapper> = {
  title: 'Components/DepartureTimeSelector',
  component: DepartureTimeSelectorWrapper,
  parameters: {
    docs: {
      description: {
        component: 'Date/time selector for planning ride departure times. Uses native platform date picker with a styled trigger button. Shows friendly labels like "Today, 2:30 PM" or "Tomorrow, 9:00 AM".',
      },
    },
    layout: 'centered',
  },
  argTypes: {
    label: {
      control: 'text',
      description: 'Label text displayed above the selector',
    },
    minimumDate: {
      control: 'date',
      description: 'Minimum selectable date',
    },
    testID: {
      control: 'text',
      description: 'Test ID for testing',
    },
  },
  args: {
    label: 'Departure',
  },
}

export default meta
type Story = StoryObj<typeof DepartureTimeSelectorWrapper>

export const Default: Story = {}

export const CustomLabel: Story = {
  args: {
    label: 'When are you riding?',
  },
}

export const WithMinimumDate: Story = {
  args: {
    minimumDate: new Date(),
  },
}

export const FutureDate: Story = {
  args: {
    value: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
  },
}

export const Tomorrow: Story = {
  args: {
    value: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
  },
}

export const DarkBackground: Story = {
  render: () => (
    <View style={{ backgroundColor: '#0E0F11', padding: 20, borderRadius: 12 }}>
      <DepartureTimeSelectorWrapper />
    </View>
  ),
}
