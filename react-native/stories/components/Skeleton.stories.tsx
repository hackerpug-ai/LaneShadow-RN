/**
 * Skeleton Component Story
 * Demonstrates loading placeholder with pulse animation
 */
import type { Meta, StoryObj } from '@storybook/react-native'
import React from 'react'
import { View } from 'react-native'
import { Skeleton, SkeletonAvatar, SkeletonText } from '../../components/ui/skeleton'

const meta: Meta<typeof Skeleton> = {
  title: 'Components/Skeleton',
  component: Skeleton,
  parameters: {
    docs: {
      description: {
        component: 'Loading placeholder with pulse animation. Includes base Skeleton plus pre-configured Avatar and Text variants.',
      },
    },
    layout: 'centered',
  },
  argTypes: {
    width: {
      control: 'text',
      description: 'Skeleton width (number or percentage)',
    },
    height: {
      control: 'number',
      description: 'Skeleton height in pixels',
    },
    shape: {
      control: 'select',
      options: ['rectangle', 'circle', 'rounded'],
      description: 'Skeleton shape',
    },
  },
  args: {
    width: '100%',
    height: 16,
    shape: 'rounded',
  },
}

export default meta
type Story = StoryObj<typeof Skeleton>

export const Default: Story = {
  render: () => <Skeleton width={200} height={16} />
}

export const Circle: Story = {
  render: () => <Skeleton width={40} height={40} shape="circle" />
}

export const Rectangle: Story = {
  render: () => <Skeleton width={200} height={100} shape="rectangle" />
}

export const MultipleLines: Story = {
  render: () => (
    <View style={{ width: 300 }}>
      <SkeletonText lines={3} />
    </View>
  ),
}

export const AvatarSizes: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
      <SkeletonAvatar size="default" />
      <SkeletonAvatar size="lg" />
      <SkeletonAvatar size="xl" />
    </View>
  ),
}

export const CardSkeleton: Story = {
  render: () => (
    <View style={{ width: 300, padding: 16, backgroundColor: '#f5f5f5', borderRadius: 8, gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <SkeletonAvatar size="default" />
        <View style={{ flex: 1, gap: 8 }}>
          <Skeleton width="60%" height={16} />
          <Skeleton width="40%" height={14} />
        </View>
      </View>
      <SkeletonText lines={2} />
    </View>
  ),
}

export const ListSkeleton: Story = {
  render: () => (
    <View style={{ width: 350, gap: 16 }}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
          <SkeletonAvatar size="default" />
          <View style={{ flex: 1, gap: 8 }}>
            <Skeleton width="70%" height={16} />
            <Skeleton width="50%" height={14} />
          </View>
        </View>
      ))}
    </View>
  ),
}

export const MixedShapes: Story = {
  render: () => (
    <View style={{ width: 300, gap: 16 }}>
      <Skeleton width="100%" height={100} shape="rectangle" />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Skeleton width={60} height={60} shape="circle" />
        <View style={{ flex: 1, gap: 8 }}>
          <Skeleton width="80%" height={16} />
          <Skeleton width="60%" height={16} />
          <Skeleton width="40%" height={16} />
        </View>
      </View>
      <SkeletonText lines={3} />
    </View>
  ),
}
