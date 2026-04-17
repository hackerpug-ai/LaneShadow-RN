/**
 * Icon Token Stories
 * Showcases MaterialCommunityIcons used in Lane Shadow
 */
import { MaterialCommunityIcons } from '@expo/vector-icons'
import type { Meta, StoryObj } from '@storybook/react-native'
import React from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name']

/**
 * Icon preview component
 */
const IconPreview = ({
  name,
  size = 24,
  color = 'rgba(255,255,255,0.92)',
}: {
  name: IconName
  size?: number
  color?: string
}) => (
  <View style={styles.iconItem}>
    <MaterialCommunityIcons name={name} size={size} color={color} />
    <Text style={styles.iconName} numberOfLines={1}>
      {name}
    </Text>
  </View>
)

/**
 * Icon group component
 */
const IconGroup = ({
  title,
  icons,
  color,
}: {
  title: string
  icons: IconName[]
  color?: string
}) => (
  <View style={styles.group}>
    <Text style={styles.groupTitle}>{title}</Text>
    <View style={styles.iconGrid}>
      {icons.map((icon) => (
        <IconPreview key={icon} name={icon} color={color} />
      ))}
    </View>
  </View>
)

/**
 * Main icons display component
 */
const IconsDisplay = () => (
  <ScrollView style={styles.container} contentContainerStyle={styles.content}>
    <Text style={styles.title}>Lane Shadow Icons</Text>
    <Text style={styles.subtitle}>MaterialCommunityIcons via @expo/vector-icons</Text>

    <IconGroup
      title="Navigation"
      icons={[
        'home',
        'map',
        'compass',
        'navigation',
        'map-marker',
        'crosshairs-gps',
        'arrow-left',
        'arrow-right',
        'chevron-up',
        'chevron-down',
        'menu',
        'close',
      ]}
    />

    <IconGroup
      title="Weather"
      icons={[
        'weather-sunny',
        'weather-cloudy',
        'weather-rainy',
        'weather-lightning',
        'weather-snowy',
        'weather-windy',
        'thermometer',
        'water-percent',
      ]}
    />

    <IconGroup
      title="Motorcycle / Travel"
      icons={[
        'motorbike',
        'road-variant',
        'gas-station',
        'food',
        'coffee',
        'bed',
        'camera',
        'image',
      ]}
    />

    <IconGroup
      title="Actions"
      icons={[
        'plus',
        'minus',
        'check',
        'pencil',
        'delete',
        'share',
        'heart',
        'heart-outline',
        'star',
        'star-outline',
        'bookmark',
        'bookmark-outline',
      ]}
    />

    <IconGroup
      title="Status"
      icons={[
        'alert-circle',
        'check-circle',
        'information',
        'help-circle',
        'clock-outline',
        'calendar',
        'bell',
        'bell-outline',
      ]}
    />

    <IconGroup
      title="Brand Accent (Copper)"
      icons={['fire', 'lightning-bolt', 'flash', 'trophy']}
      color="#B87333"
    />
  </ScrollView>
)

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.92)',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.55)',
    marginBottom: 16,
  },
  group: {
    gap: 16,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#B87333',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(184,115,51,0.3)',
    paddingBottom: 8,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  iconItem: {
    width: 72,
    alignItems: 'center',
    gap: 4,
  },
  iconName: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
  },
})

const meta: Meta<typeof IconsDisplay> = {
  title: 'Tokens/Icons',
  component: IconsDisplay,
}

export default meta
type Story = StoryObj<typeof IconsDisplay>

export const Default: Story = {}
