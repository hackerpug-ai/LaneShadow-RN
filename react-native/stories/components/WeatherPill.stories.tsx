/**
 * WeatherPill Component Story
 * Demonstrates weather condition pills
 */
import type { Meta, StoryObj } from '@storybook/react-native'
import React from 'react'
import { View } from 'react-native'
import { WeatherPill } from '../../components/ui/weather-pill'

const meta: Meta<typeof WeatherPill> = {
  title: 'Components/WeatherPill',
  component: WeatherPill,
  parameters: {
    docs: {
      description: {
        component: 'Weather condition pill with icon and description. Used for wind, rain, and temperature indicators.',
      },
    },
    layout: 'centered',
  },
  argTypes: {
    icon: {
      control: 'text',
      description: 'MaterialCommunityIcons icon name',
    },
    description: {
      control: 'text',
      description: 'Weather description text',
    },
    iconSize: {
      control: { type: 'number' },
      description: 'Icon size in pixels',
    },
    backgroundColor: {
      control: 'color',
      description: 'Background color override',
    },
    textColor: {
      control: 'color',
      description: 'Text color override',
    },
  },
  args: {
    icon: 'weather-windy',
    description: 'Light crosswinds on Hwy 1',
    iconSize: 16,
  },
}

export default meta
type Story = StoryObj<typeof WeatherPill>

export const Default: Story = {}

export const Wind: Story = {
  args: {
    icon: 'weather-windy',
    description: 'Light crosswinds on Hwy 1',
  },
}

export const Rain: Story = {
  args: {
    icon: 'water',
    description: 'Light rain expected',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    textColor: '#60a5fa',
  },
}

export const Temperature: Story = {
  args: {
    icon: 'thermometer',
    description: 'Cooler in the mountains',
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    textColor: '#fb923c',
  },
}

export const Short: Story = {
  args: {
    icon: 'weather-windy',
    description: 'Moderate',
  },
}

export const Multiple: Story = {
  render: () => (
    <View style={{ gap: 8, alignItems: 'flex-start' }}>
      <WeatherPill icon="weather-windy" description="Light crosswinds on Hwy 1" />
      <WeatherPill
        icon="water"
        description="Light rain expected"
        backgroundColor="rgba(59, 130, 246, 0.15)"
        textColor="#60a5fa"
      />
      <WeatherPill
        icon="thermometer"
        description="Cooler in the mountains"
        backgroundColor="rgba(249, 115, 22, 0.15)"
        textColor="#fb923c"
      />
    </View>
  ),
}
