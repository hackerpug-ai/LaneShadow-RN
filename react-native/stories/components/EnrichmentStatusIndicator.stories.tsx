/**
 * EnrichmentStatusIndicator Component Story
 * Demonstrates progressive enrichment status indicator for route options
 */
import type { Meta, StoryObj } from '@storybook/react-native'
import React from 'react'
import { View } from 'react-native'
import { EnrichmentStatusIndicator } from '../../components/planning/enrichment-status-indicator'

const meta: Meta<typeof EnrichmentStatusIndicator> = {
  title: 'Components/EnrichmentStatusIndicator',
  component: EnrichmentStatusIndicator,
  parameters: {
    docs: {
      description: {
        component: 'Progressive enrichment status indicator showing phase transitions: pending → fast → extended → completed',
      },
    },
    layout: 'centered',
  },
  argTypes: {
    status: {
      control: 'select',
      options: ['pending', 'running-fast', 'running-extended', 'completed', 'failed', 'cancelled'],
      description: 'Current enrichment status',
    },
    phase: {
      control: 'select',
      options: ['fast', 'extended'],
      description: 'Current enrichment phase (for running states)',
    },
    variant: {
      control: 'select',
      options: ['inline', 'standalone', 'minimal'],
      description: 'Display variant',
    },
    error: {
      control: 'text',
      description: 'Error message (for failed state)',
    },
    hideLabel: {
      control: 'boolean',
      description: 'Hide label text (minimal variant only)',
    },
  },
  args: {
    status: 'pending',
    phase: 'fast',
    variant: 'inline',
    hideLabel: false,
  },
}

export default meta
type Story = StoryObj<typeof EnrichmentStatusIndicator>

export const Pending: Story = {
  args: {
    status: 'pending',
  },
}

export const RunningFast: Story = {
  args: {
    status: 'running-fast',
    phase: 'fast',
  },
}

export const RunningExtended: Story = {
  args: {
    status: 'running-extended',
    phase: 'extended',
  },
}

export const Completed: Story = {
  args: {
    status: 'completed',
  },
}

export const Failed: Story = {
  args: {
    status: 'failed',
    error: 'Unable to fetch route metadata',
  },
}

export const Cancelled: Story = {
  args: {
    status: 'cancelled',
  },
}

export const InlineVariant: Story = {
  args: {
    status: 'running-fast',
    variant: 'inline',
  },
}

export const StandaloneVariant: Story = {
  args: {
    status: 'running-extended',
    variant: 'standalone',
  },
}

export const MinimalVariant: Story = {
  args: {
    status: 'completed',
    variant: 'minimal',
  },
}

export const MinimalVariantNoLabel: Story = {
  args: {
    status: 'completed',
    variant: 'minimal',
    hideLabel: true,
  },
}

export const AllStatesInline: Story = {
  render: () => (
    <View style={{ gap: 12, width: 250 }}>
      <EnrichmentStatusIndicator status="pending" variant="inline" testID="pending" />
      <EnrichmentStatusIndicator status="running-fast" phase="fast" variant="inline" testID="fast" />
      <EnrichmentStatusIndicator status="running-extended" phase="extended" variant="inline" testID="extended" />
      <EnrichmentStatusIndicator status="completed" variant="inline" testID="completed" />
      <EnrichmentStatusIndicator status="failed" error="Network timeout" variant="inline" testID="failed" />
      <EnrichmentStatusIndicator status="cancelled" variant="inline" testID="cancelled" />
    </View>
  ),
}

export const AllStatesStandalone: Story = {
  render: () => (
    <View style={{ gap: 12, width: 300 }}>
      <EnrichmentStatusIndicator status="pending" variant="standalone" testID="pending" />
      <EnrichmentStatusIndicator status="running-fast" phase="fast" variant="standalone" testID="fast" />
      <EnrichmentStatusIndicator status="running-extended" phase="extended" variant="standalone" testID="extended" />
      <EnrichmentStatusIndicator status="completed" variant="standalone" testID="completed" />
      <EnrichmentStatusIndicator status="failed" error="API rate limit exceeded" variant="standalone" testID="failed" />
      <EnrichmentStatusIndicator status="cancelled" variant="standalone" testID="cancelled" />
    </View>
  ),
}

export const AllStatesMinimal: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      <EnrichmentStatusIndicator status="pending" variant="minimal" testID="pending" />
      <EnrichmentStatusIndicator status="running-fast" phase="fast" variant="minimal" testID="fast" />
      <EnrichmentStatusIndicator status="running-extended" phase="extended" variant="minimal" testID="extended" />
      <EnrichmentStatusIndicator status="completed" variant="minimal" testID="completed" />
      <EnrichmentStatusIndicator status="failed" variant="minimal" testID="failed" />
      <EnrichmentStatusIndicator status="cancelled" variant="minimal" testID="cancelled" />
    </View>
  ),
}

export const ProgressiveFlow: Story = {
  render: () => (
    <View style={{ gap: 16, width: 280 }}>
      <View>
        <EnrichmentStatusIndicator status="pending" variant="standalone" testID="step-1" />
      </View>
      <View>
        <EnrichmentStatusIndicator status="running-fast" phase="fast" variant="standalone" testID="step-2" />
      </View>
      <View>
        <EnrichmentStatusIndicator status="running-extended" phase="extended" variant="standalone" testID="step-3" />
      </View>
      <View>
        <EnrichmentStatusIndicator status="completed" variant="standalone" testID="step-4" />
      </View>
    </View>
  ),
}
