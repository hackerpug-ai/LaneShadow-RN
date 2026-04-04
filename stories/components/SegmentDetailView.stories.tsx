/**
 * SegmentDetailView Component Story
 * Demonstrates expandable segment-by-segment weather breakdown
 */
import type { Meta, StoryObj } from '@storybook/react-native'
import React from 'react'
import { View } from 'react-native'
import { SegmentDetailView, SegmentDetailViewProps } from '../../components/planning/segment-detail-view'
import type { RouteLeg, RouteOverlays } from '../../models/saved-routes'

const meta: Meta<typeof SegmentDetailView> = {
  title: 'Components/SegmentDetailView',
  component: SegmentDetailView,
  parameters: {
    docs: {
      description: {
        component: 'Expandable detail view showing segment-by-segment weather breakdown for route legs. Tap to expand and see weather conditions for each leg.',
      },
    },
    layout: 'centered',
  },
  argTypes: {
    legs: {
      description: 'Route legs to display as segments',
    },
    overlays: {
      description: 'Weather overlay data for each leg',
    },
    testID: {
      control: 'text',
      description: 'Test ID for testing',
    },
  },
}

export default meta
type Story = StoryObj<typeof SegmentDetailView>

// Helper to create mock legs
const createLegs = (count: number): RouteLeg[] =>
  Array.from({ length: count }, (_, i) => ({
    legIndex: i,
    start: { lat: 37.7749 + i * 0.01, lng: -122.4194 + i * 0.01 },
    end: { lat: 37.7749 + (i + 1) * 0.01, lng: -122.4194 + (i + 1) * 0.01 },
    distanceMeters: 5000 + i * 1000,
    durationSeconds: 300 + i * 60,
    geometry: {
      format: 'polyline' as const,
      encoding: 'utf8',
      precision: 5,
      value: `encoded${i}`,
    },
  }))

// Helper to create mock overlays
const createOverlays = (
  legs: RouteLeg[],
  conditions: Array<{ rain?: string; wind?: string; temperature?: string }>
): RouteOverlays => ({
  rain: {
    generatedAt: Date.now(),
    modelVersion: 'test-v1',
    legend: [
      { level: 'none', label: 'No Rain' },
      { level: 'light', label: 'Light Rain' },
      { level: 'moderate', label: 'Moderate Rain' },
    ],
    byLeg: legs.map((leg, i) => ({
      legIndex: leg.legIndex,
      segments: [
        {
          startMeters: 0,
          endMeters: leg.distanceMeters,
          level: conditions[i]?.rain ?? 'none',
          probability: conditions[i]?.rain !== 'none' ? 80 : undefined,
        },
      ],
    })),
  },
  wind: {
    generatedAt: Date.now(),
    modelVersion: 'test-v1',
    legend: [
      { level: 'low', label: 'Low Wind' },
      { level: 'moderate', label: 'Moderate Wind' },
      { level: 'high', label: 'High Wind' },
    ],
    byLeg: legs.map((leg, i) => ({
      legIndex: leg.legIndex,
      segments: [
        {
          startMeters: 0,
          endMeters: leg.distanceMeters,
          level: conditions[i]?.wind ?? 'low',
        },
      ],
    })),
  },
  temperature: {
    generatedAt: Date.now(),
    modelVersion: 'test-v1',
    legend: [
      { level: 'cold', label: 'Cold' },
      { level: 'mild', label: 'Mild' },
      { level: 'warm', label: 'Warm' },
    ],
    byLeg: legs.map((leg, i) => ({
      legIndex: leg.legIndex,
      segments: [
        {
          startMeters: 0,
          endMeters: leg.distanceMeters,
          level: conditions[i]?.temperature ?? 'mild',
          temperatureCelsius: 20,
        },
      ],
    })),
  },
})

export const SingleSegment: Story = {
  args: {
    legs: createLegs(1),
    overlays: createOverlays(createLegs(1), [{ rain: 'moderate', wind: 'low', temperature: 'warm' }]),
  },
  parameters: {
    docs: {
      description: {
        story: 'Single leg route - shows segment always expanded without collapse controls.',
      },
    },
  },
}

export const MultiSegment: Story = {
  args: {
    legs: createLegs(5),
    overlays: createOverlays(createLegs(5), [
      { rain: 'none', wind: 'low', temperature: 'mild' },
      { rain: 'light', wind: 'low', temperature: 'mild' },
      { rain: 'moderate', wind: 'moderate', temperature: 'warm' },
      { rain: 'heavy', wind: 'high', temperature: 'hot' },
      { rain: 'none', wind: 'low', temperature: 'mild' },
    ]),
  },
  parameters: {
    docs: {
      description: {
        story: '5 leg route with varying weather - collapsed by default, tap to expand.',
      },
    },
  },
}

export const HeavyRainLeg: Story = {
  args: {
    legs: createLegs(3),
    overlays: createOverlays(createLegs(3), [
      { rain: 'none', wind: 'low', temperature: 'mild' },
      { rain: 'heavy', wind: 'moderate', temperature: 'warm' },
      { rain: 'none', wind: 'low', temperature: 'mild' },
    ]),
  },
  parameters: {
    docs: {
      description: {
        story: 'Leg 2 has heavy rain - shows warning highlight and rain badge when expanded.',
      },
    },
  },
}

export const AllConcerning: Story = {
  args: {
    legs: createLegs(4),
    overlays: createOverlays(createLegs(4), [
      { rain: 'moderate', wind: 'high', temperature: 'hot' },
      { rain: 'heavy', wind: 'high', temperature: 'cold' },
      { rain: 'heavy', wind: 'moderate', temperature: 'warm' },
      { rain: 'light', wind: 'low', temperature: 'hot' },
    ]),
  },
  parameters: {
    docs: {
      description: {
        story: 'Multiple legs with concerning weather - all show warning highlights.',
      },
    },
  },
}
