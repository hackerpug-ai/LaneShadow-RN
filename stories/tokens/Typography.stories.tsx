/**
 * Typography Token Stories
 * Showcases the Lane Shadow type scale
 */
import type { Meta, StoryObj } from '@storybook/react-native'
import React from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { Text, useTheme } from 'react-native-paper'
import type { ExtendedTheme } from '../../styles/types'

/**
 * Type sample component
 */
const TypeSample = ({
  label,
  fontSize,
  lineHeight,
  fontWeight,
  sample = 'The quick brown fox jumps over the lazy dog',
}: {
  label: string
  fontSize: number
  lineHeight: number
  fontWeight: string
  sample?: string
}) => (
  <View style={styles.sample}>
    <View style={styles.sampleHeader}>
      <Text style={styles.sampleLabel}>{label}</Text>
      <Text style={styles.sampleMeta}>
        {fontSize}px / {lineHeight}px / {fontWeight}
      </Text>
    </View>
    <Text
      style={[
        styles.sampleText,
        { fontSize, lineHeight, fontWeight: fontWeight as '400' | '500' | '600' | '700' },
      ]}
      numberOfLines={2}
    >
      {sample}
    </Text>
  </View>
)

/**
 * Type scale group component
 */
const TypeGroup = ({
  title,
  scales,
}: {
  title: string
  scales: Array<{
    label: string
    fontSize: number
    lineHeight: number
    fontWeight: string
  }>
}) => (
  <View style={styles.group}>
    <Text style={styles.groupTitle}>{title}</Text>
    {scales.map((scale) => (
      <TypeSample key={scale.label} {...scale} />
    ))}
  </View>
)

/**
 * Main typography display component
 */
const TypographyDisplay = () => {
  const theme = useTheme<ExtendedTheme>()
  const { type } = theme.semantic

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Lane Shadow Typography</Text>
      <Text style={styles.subtitle}>Semantic Type Scale</Text>

      <TypeGroup
        title="Display"
        scales={[
          { label: 'Display Large', ...type.display.lg },
          { label: 'Display Medium', ...type.display.md },
          { label: 'Display Small', ...type.display.sm },
        ]}
      />

      <TypeGroup
        title="Heading"
        scales={[
          { label: 'Heading Large', ...type.heading.lg },
          { label: 'Heading Medium', ...type.heading.md },
          { label: 'Heading Small', ...type.heading.sm },
        ]}
      />

      <TypeGroup
        title="Title"
        scales={[
          { label: 'Title Large', ...type.title.lg },
          { label: 'Title Medium', ...type.title.md },
          { label: 'Title Small', ...type.title.sm },
        ]}
      />

      <TypeGroup
        title="Body"
        scales={[
          { label: 'Body Large', ...type.body.lg },
          { label: 'Body Medium', ...type.body.md },
          { label: 'Body Small', ...type.body.sm },
        ]}
      />

      <TypeGroup
        title="Label"
        scales={[
          { label: 'Label Large', ...type.label.lg },
          { label: 'Label Medium', ...type.label.md },
          { label: 'Label Small', ...type.label.sm },
        ]}
      />
    </ScrollView>
  )
}

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
  sample: {
    gap: 4,
  },
  sampleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sampleLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.72)',
  },
  sampleMeta: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: 'rgba(255,255,255,0.45)',
  },
  sampleText: {
    color: 'rgba(255,255,255,0.92)',
  },
})

const meta: Meta<typeof TypographyDisplay> = {
  title: 'Tokens/Typography',
  component: TypographyDisplay,
}

export default meta
type Story = StoryObj<typeof TypographyDisplay>

export const Default: Story = {}
