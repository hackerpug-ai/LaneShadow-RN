import type { Meta, StoryObj } from '@storybook/react'
import { View } from 'react-native'
import { RouteOptionsScreen } from '../../components/screens/route-options-screen'
import type { RouteOptionData } from '../../components/screens/route-options-screen'

const mockRoutes: RouteOptionData[] = [
  {
    id: '1',
    name: 'Scenic Mountain Pass',
    variant: 'selected',
    badges: [
      { icon: 'image', label: 'Most Scenic', variant: 'primary' },
      { icon: 'wind-power', label: 'Low Wind', variant: 'neutral' },
    ],
    stats: [
      { icon: 'clock-outline', value: '2h 45m' },
      { icon: 'road-variant', value: '145 mi' },
      { icon: 'weather-windy', value: '12 mph' },
    ],
    weatherSummary: 'Clear skies, 72°F',
    weatherIcon: 'weather-sunny',
  },
  {
    id: '2',
    name: 'Coastal Highway Route',
    variant: 'compact',
    badges: [
      { icon: 'water', label: 'Ocean Views', variant: 'primary' },
      { icon: 'weather-partly-cloudy', label: 'Partly Cloudy', variant: 'neutral' },
    ],
    stats: [
      { icon: 'clock-outline', value: '3h 15m' },
      { icon: 'road-variant', value: '178 mi' },
      { icon: 'weather-windy', value: '18 mph' },
    ],
    weatherSummary: 'Partly cloudy, 68°F',
    weatherIcon: 'weather-partly-cloudy',
    compactStats: '3h 15m · 178 mi · 18 mph wind',
  },
  {
    id: '3',
    name: 'Direct Interstate Route',
    variant: 'compact',
    badges: [
      { icon: 'highway', label: 'Fastest', variant: 'neutral' },
    ],
    stats: [
      { icon: 'clock-outline', value: '2h 20m' },
      { icon: 'road-variant', value: '158 mi' },
      { icon: 'weather-windy', value: '22 mph' },
    ],
    weatherSummary: 'Light rain expected',
    weatherIcon: 'weather-rainy',
    compactStats: '2h 20m · 158 mi · 22 mph wind',
  },
  {
    id: '4',
    name: 'Historic Backroads',
    variant: 'compact',
    badges: [
      { icon: 'castle', label: 'Historic Sites', variant: 'primary' },
      { icon: 'leaf', label: 'Shady', variant: 'neutral' },
    ],
    stats: [
      { icon: 'clock-outline', value: '3h 45m' },
      { icon: 'road-variant', value: '195 mi' },
      { icon: 'weather-windy', value: '8 mph' },
    ],
    weatherSummary: 'Overcast, 65°F',
    weatherIcon: 'weather-cloudy',
    compactStats: '3h 45m · 195 mi · 8 mph wind',
  },
]

const meta: Meta<typeof RouteOptionsScreen> = {
  title: 'Screens/RouteOptionsScreen',
  component: RouteOptionsScreen,
  parameters: {
    docs: {
      description: {
        component: 'Screen displaying route options with weather safety overlays. Shows a list of route options with stats, badges, and weather information for motorcycle trip planning.',
      },
    },
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <View style={{ flex: 1 }}>
        <Story />
      </View>
    ),
  ],
  argTypes: {
    routes: {
      control: 'object',
      description: 'Route options to display',
    },
    selectedRouteId: {
      control: 'text',
      description: 'Currently selected route ID',
    },
    loading: {
      control: 'boolean',
      description: 'Loading state',
    },
    error: {
      control: 'text',
      description: 'Error message',
    },
  },
  args: {
    routes: mockRoutes,
    selectedRouteId: '1',
    loading: false,
    error: null,
  },
}

export default meta
type Story = StoryObj<typeof RouteOptionsScreen>

export const Default: Story = {}

export const Empty: Story = {
  args: {
    routes: [],
  },
}

export const Loading: Story = {
  args: {
    loading: true,
  },
}

export const Error: Story = {
  args: {
    error: 'Unable to load routes. Please check your connection and try again.',
  },
}

export const SingleRoute: Story = {
  args: {
    routes: [mockRoutes[0]],
    selectedRouteId: '1',
  },
}

export const WeatherWarning: Story = {
  args: {
    routes: [
      {
        id: '1',
        name: 'Storm Warning Route',
        variant: 'selected',
        badges: [
          { icon: 'alert-circle', label: 'Weather Alert', variant: 'primary' },
        ],
        stats: [
          { icon: 'clock-outline', value: '2h 30m' },
          { icon: 'road-variant', value: '140 mi' },
          { icon: 'weather-windy', value: '35 mph' },
        ],
        weatherSummary: 'Severe storms expected',
        weatherIcon: 'weather-lightning-rainy',
      },
    ],
  },
}
