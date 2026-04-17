/**
 * Avatar Component Story
 * Demonstrates user avatar with image and initials fallback
 */
import type { Meta, StoryObj } from '@storybook/react-native'
import React from 'react'
import { View } from 'react-native'
import { Avatar, AvatarBadge } from '../../components/ui/avatar'

const meta: Meta<typeof Avatar> = {
  title: 'Components/Avatar',
  component: Avatar,
  parameters: {
    docs: {
      description: {
        component: 'User avatar with semantic theme styling. Supports image, initials fallback, and status indicators.',
      },
    },
    layout: 'centered',
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['default', 'lg', 'xl'],
      description: 'Avatar size variant',
    },
    source: {
      control: 'object',
      description: 'Image source for avatar',
    },
    initials: {
      control: 'text',
      description: 'Fallback initials when no image',
    },
    alt: {
      control: 'text',
      description: 'Accessibility label for image',
    },
    showBorder: {
      control: 'boolean',
      description: 'Show border around avatar',
    },
    showRing: {
      control: 'boolean',
      description: 'Show primary ring around avatar',
    },
  },
  args: {
    size: 'default',
    initials: 'JD',
    alt: 'User avatar',
    showBorder: false,
    showRing: false,
  },
}

export default meta
type Story = StoryObj<typeof Avatar>

export const Default: Story = {
  args: {
    initials: 'JD',
  },
}

export const WithImage: Story = {
  args: {
    source: { uri: 'https://i.pravatar.cc/150?img=12' },
    alt: 'Jane Doe',
  },
}

export const Large: Story = {
  args: {
    initials: 'AB',
    size: 'lg',
  },
}

export const ExtraLarge: Story = {
  args: {
    initials: 'XY',
    size: 'xl',
  },
}

export const WithBorder: Story = {
  args: {
    initials: 'MK',
    showBorder: true,
  },
}

export const WithRing: Story = {
  args: {
    initials: 'RS',
    showRing: true,
  },
}

export const WithStatusBadge: Story = {
  args: {
    initials: 'JD',
    badge: <AvatarBadge variant="success" />,
  },
}

export const WithWarningBadge: Story = {
  args: {
    initials: 'JD',
    badge: <AvatarBadge variant="warning" />,
  },
}

export const SizeComparison: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
      <Avatar initials="D" size="default" />
      <Avatar initials="LG" size="lg" />
      <Avatar initials="XL" size="xl" />
    </View>
  ),
}

export const WithBadges: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 24 }}>
      <Avatar initials="JD" badge={<AvatarBadge variant="success" />} />
      <Avatar initials="AB" badge={<AvatarBadge variant="warning" />} />
      <Avatar initials="XY" badge={<AvatarBadge variant="danger" />} />
    </View>
  ),
}

export const ImageWithBadges: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 24 }}>
      <Avatar
        source={{ uri: 'https://i.pravatar.cc/150?img=32' }}
        alt="User"
        badge={<AvatarBadge variant="success" />}
      />
      <Avatar
        source={{ uri: 'https://i.pravatar.cc/150?img=47' }}
        alt="User"
        badge={<AvatarBadge variant="default" />}
      />
    </View>
  ),
}
