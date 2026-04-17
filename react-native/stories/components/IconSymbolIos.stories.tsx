/**
 * IconSymbol.ios Component Story
 * Demonstrates MaterialCommunityIcons for iOS (for consistency)
 */
import type { Meta, StoryObj } from '@storybook/react-native'
import React from 'react'
import { View, Text } from 'react-native'
import { IconSymbol } from '../../components/ui/icon-symbol.ios'

const meta: Meta<typeof IconSymbol> = {
  title: 'Components/IconSymbol.ios',
  component: IconSymbol,
  parameters: {
    docs: {
      description: {
        component: 'Icon component using MaterialCommunityIcons on iOS for consistency with Android and web. Ensures all icon names work across all platforms.',
      },
    },
    layout: 'centered',
  },
  argTypes: {
    name: {
      control: 'text',
      description: 'MaterialCommunityIcons icon name (keyof glyphMap)',
    },
    size: {
      control: { type: 'number', min: 12, max: 96, step: 4 },
      description: 'Icon size in pixels',
    },
    color: {
      control: 'color',
      description: 'Icon color (hex or color name)',
    },
  },
  args: {
    name: 'home',
    size: 24,
    color: '#000000',
  },
}

export default meta
type Story = StoryObj<typeof IconSymbol>

export const Default: Story = {
  args: {
    name: 'home',
    size: 24,
    color: '#000000',
  },
}

export const Small: Story = {
  args: {
    name: 'heart',
    size: 16,
    color: '#B91C1C',
  },
}

export const Medium: Story = {
  args: {
    name: 'star',
    size: 32,
    color: '#F59E0B',
  },
}

export const Large: Story = {
  args: {
    name: 'map-marker',
    size: 48,
    color: '#059669',
  },
}

export const NavigationIcons: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
      <IconSymbol name="arrow-left" size={24} color="#000" />
      <IconSymbol name="arrow-right" size={24} color="#000" />
      <IconSymbol name="arrow-up" size={24} color="#000" />
      <IconSymbol name="arrow-down" size={24} color="#000" />
    </View>
  ),
}

export const MapIcons: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
      <IconSymbol name="map-marker" size={32} color="#059669" />
      <IconSymbol name="map-marker-radius" size={32} color="#059669" />
      <IconSymbol name="map-marker-path" size={32} color="#059669" />
      <IconSymbol name="router" size={32} color="#059669" />
    </View>
  ),
}

export const ActionIcons: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
      <IconSymbol name="plus-circle" size={28} color="#059669" />
      <IconSymbol name="check-circle" size={28} color="#059669" />
      <IconSymbol name="close-circle" size={28} color="#DC2626" />
      <IconSymbol name="cog" size={28} color="#6B7280" />
    </View>
  ),
}

export const WeatherIcons: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
      <IconSymbol name="weather-sunny" size={32} color="#F59E0B" />
      <IconSymbol name="weather-cloudy" size={32} color="#6B7280" />
      <IconSymbol name="weather-rainy" size={32} color="#3B82F6" />
      <IconSymbol name="weather-windy" size={32} color="#6B7280" />
    </View>
  ),
}

export const TerrainIcons: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
      <IconSymbol name="terrain" size={28} color="#059669" />
      <IconSymbol name="image-filter-hdr" size={28} color="#059669" />
      <IconSymbol name="waves" size={28} color="#0EA5E9" />
      <IconSymbol name="nature" size={28} color="#059669" />
    </View>
  ),
}

export const SizeVariants: Story = {
  render: () => (
    <View style={{ alignItems: 'center', gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <IconSymbol name="heart" size={16} color="#DC2626" />
        <Text>16px</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <IconSymbol name="heart" size={24} color="#DC2626" />
        <Text>24px</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <IconSymbol name="heart" size={32} color="#DC2626" />
        <Text>32px</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <IconSymbol name="heart" size={48} color="#DC2626" />
        <Text>48px</Text>
      </View>
    </View>
  ),
}

export const CommonIcons: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, width: 300 }}>
      <IconSymbol name="home" size={24} color="#374151" />
      <IconSymbol name="magnify" size={24} color="#374151" />
      <IconSymbol name="plus" size={24} color="#374151" />
      <IconSymbol name="minus" size={24} color="#374151" />
      <IconSymbol name="check" size={24} color="#374151" />
      <IconSymbol name="close" size={24} color="#374151" />
      <IconSymbol name="chevron-right" size={24} color="#374151" />
      <IconSymbol name="chevron-left" size={24} color="#374151" />
      <IconSymbol name="chevron-down" size={24} color="#374151" />
      <IconSymbol name="chevron-up" size={24} color="#374151" />
      <IconSymbol name="dots-horizontal" size={24} color="#374151" />
      <IconSymbol name="dots-vertical" size={24} color="#374151" />
    </View>
  ),
}
