/**
 * Card Component Story
 * Demonstrates container component with semantic theme styling
 */
import type { Meta, StoryObj } from '@storybook/react-native'
import React from 'react'
import { View, Text } from 'react-native'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/card'

const meta: Meta<typeof Card> = {
  title: 'Components/Card',
  component: Card,
  parameters: {
    docs: {
      description: {
        component: 'Container component with semantic theme styling. Includes compound components: CardHeader, CardTitle, CardContent, CardDescription.',
      },
    },
    layout: 'centered',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'primary', 'success', 'warning', 'danger'],
      description: 'Card style variant',
    },
    showBorder: {
      control: 'boolean',
      description: 'Show border around card',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
    },
  },
  args: {
    variant: 'default',
    showBorder: true,
    disabled: false,
  },
}

export default meta
type Story = StoryObj<typeof Card>

export const Default: Story = {
  render: () => (
    <Card style={{ width: 300 }}>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription>Card description goes here.</CardDescription>
      </CardContent>
    </Card>
  ),
}

export const Primary: Story = {
  render: () => (
    <Card variant="primary" style={{ width: 300 }}>
      <CardHeader>
        <CardTitle>Primary Card</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription>This is a primary card with accent color.</CardDescription>
      </CardContent>
    </Card>
  ),
}

export const Success: Story = {
  render: () => (
    <Card variant="success" style={{ width: 300 }}>
      <CardHeader>
        <CardTitle>Success</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription>Operation completed successfully!</CardDescription>
      </CardContent>
    </Card>
  ),
}

export const Warning: Story = {
  render: () => (
    <Card variant="warning" style={{ width: 300 }}>
      <CardHeader>
        <CardTitle>Warning</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription>Please review before proceeding.</CardDescription>
      </CardContent>
    </Card>
  ),
}

export const Danger: Story = {
  render: () => (
    <Card variant="danger" style={{ width: 300 }}>
      <CardHeader>
        <CardTitle>Error</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription>An error occurred while processing.</CardDescription>
      </CardContent>
    </Card>
  ),
}

export const WithoutBorder: Story = {
  render: () => (
    <Card showBorder={false} style={{ width: 300 }}>
      <CardContent>
        <Text>Card without border</Text>
      </CardContent>
    </Card>
  ),
}

export const Pressable: Story = {
  render: () => {
    const [pressed, setPressed] = React.useState(false)
    return (
      <Card onPress={() => setPressed(!pressed)} style={{ width: 300 }}>
        <CardContent>
          <Text>{pressed ? 'Pressed!' : 'Click me'}</Text>
        </CardContent>
      </Card>
    )
  },
}

export const AllVariants: Story = {
  render: () => (
    <View style={{ gap: 16 }}>
      {(['default', 'primary', 'success', 'warning', 'danger'] as const).map((variant) => (
        <Card key={variant} variant={variant} style={{ width: 300 }}>
          <CardHeader>
            <CardTitle>{variant.charAt(0).toUpperCase() + variant.slice(1)} Card</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>This is a {variant} card.</CardDescription>
          </CardContent>
        </Card>
      ))}
    </View>
  ),
}

export const ComplexContent: Story = {
  render: () => (
    <Card style={{ width: 300 }}>
      <CardHeader>
        <CardTitle>Mountain Route</CardTitle>
        <CardDescription>12.5 km • Moderate difficulty</CardDescription>
      </CardHeader>
      <CardContent>
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1, height: 8, backgroundColor: '#ddd', borderRadius: 4 }} />
            <View style={{ flex: 1, height: 8, backgroundColor: '#ddd', borderRadius: 4 }} />
          </View>
          <View style={{ height: 60, backgroundColor: '#f0f0f0', borderRadius: 4 }} />
        </View>
      </CardContent>
    </Card>
  ),
}
