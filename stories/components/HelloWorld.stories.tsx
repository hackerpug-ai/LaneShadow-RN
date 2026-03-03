/**
 * HelloWorld Component Story
 * Demonstrates Storybook controls and Lane Shadow theming
 */
import { MaterialCommunityIcons } from '@expo/vector-icons'
import type { Meta, StoryObj } from '@storybook/react-native'
import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { Text, useTheme } from 'react-native-paper'
import type { ExtendedTheme } from '../../styles/types'

type HelloWorldProps = {
  /** Display name for greeting */
  name: string
  /** Show the motorcycle icon */
  showIcon: boolean
  /** Use primary brand color */
  useBrandColor: boolean
  /** Callback when component is pressed */
  onPress?: () => void
}

/**
 * HelloWorld component - demonstrates themed styling
 */
const HelloWorld = ({
  name = 'Rider',
  showIcon = true,
  useBrandColor = false,
  onPress,
}: HelloWorldProps) => {
  const theme = useTheme<ExtendedTheme>()
  const { semantic } = theme

  const textColor = useBrandColor
    ? semantic.color.primary.default
    : semantic.color.onSurface.default

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: pressed
            ? semantic.color.surface.pressed
            : semantic.color.surface.default,
          borderColor: semantic.color.border.default,
        },
      ]}
    >
      {showIcon && (
        <MaterialCommunityIcons
          name="motorbike"
          size={48}
          color={semantic.color.primary.default}
          style={styles.icon}
        />
      )}
      <Text style={[styles.greeting, { color: textColor }]}>Hello, {name}!</Text>
      <Text style={[styles.subtitle, { color: semantic.color.onSurface.subtle }]}>
        Welcome to Lane Shadow
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    marginBottom: 8,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
  },
})

const meta: Meta<typeof HelloWorld> = {
  title: 'Components/HelloWorld',
  component: HelloWorld,
  argTypes: {
    name: {
      control: 'text',
      description: 'Name to display in greeting',
    },
    showIcon: {
      control: 'boolean',
      description: 'Toggle motorcycle icon visibility',
    },
    useBrandColor: {
      control: 'boolean',
      description: 'Use copper brand color for text',
    },
    onPress: {
      action: 'pressed',
      description: 'Called when component is pressed',
    },
  },
}

export default meta
type Story = StoryObj<typeof HelloWorld>

export const Default: Story = {
  args: {
    name: 'Rider',
    showIcon: true,
    useBrandColor: false,
  },
}

export const WithBrandColor: Story = {
  args: {
    name: 'Lane Shadow',
    showIcon: true,
    useBrandColor: true,
  },
}

export const NoIcon: Story = {
  args: {
    name: 'Minimalist',
    showIcon: false,
    useBrandColor: false,
  },
}

export const CustomName: Story = {
  args: {
    name: 'Adventure Seeker',
    showIcon: true,
    useBrandColor: true,
  },
}
