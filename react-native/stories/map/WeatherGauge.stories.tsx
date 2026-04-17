import type { Meta, StoryObj } from '@storybook/react-native'
import { View } from 'react-native'
import { WeatherGauge } from '../../components/map/weather-gauge'

const meta: Meta<typeof WeatherGauge> = {
  title: 'Map/WeatherGauge',
  component: WeatherGauge,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Motorcycle-inspired instrument gauge displaying real-time weather metrics. Compact numeric display — wind speed, rain intensity, temperature at a glance.\n\n**Design:**\n- Single column of metrics (like sport bike gear indicator)\n- High contrast for readability\n- Minimal footprint (~56px wide)\n- Always-on — no toggles needed\n\n**Data shown:**\n- Wind: Speed in MPH with directional arrow\n- Rain: Intensity in mm/hr (glows copper when heavy)\n- Temperature: Value in °F',
      },
    },
  },
  argTypes: {
    data: {
      control: 'object',
      description: 'Weather data to display',
    },
  },
  decorators: [
    (Story) => (
      <View style={{ width: '100%', height: '100%', backgroundColor: '#1B1715', alignItems: 'center', justifyContent: 'center' }}>
        <Story />
      </View>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof WeatherGauge>

// All metrics available
export const AllMetrics: Story = {
  args: {
    data: {
      wind: { speed: 12 },
      rain: { intensity: 0.5 },
      temperature: { value: 68 },
    },
  },
}

// Wind only
export const WindOnly: Story = {
  args: {
    data: {
      wind: { speed: 18 },
      rain: null,
      temperature: null,
    },
  },
}

// Heavy rain (accented)
export const HeavyRain: Story = {
  args: {
    data: {
      wind: null,
      rain: { intensity: 4.2 },
      temperature: null,
    },
  },
}

// Temperature only
export const TemperatureOnly: Story = {
  args: {
    data: {
      wind: null,
      rain: null,
      temperature: { value: 72 },
    },
  },
}

// Wind + temp (no rain)
export const WindAndTemp: Story = {
  args: {
    data: {
      wind: { speed: 8 },
      rain: null,
      temperature: { value: 65 },
    },
  },
}

// Light rain (decimal precision)
export const LightRain: Story = {
  args: {
    data: {
      wind: null,
      rain: { intensity: 0.15 },
      temperature: null,
    },
  },
}

// No data (gauge hidden)
export const NoData: Story = {
  args: {
    data: {
      wind: null,
      rain: null,
      temperature: null,
    },
  },
}
