/**
 * DragHandle Component
 *
 * Bottom sheet drag handle indicator
 * Follows Material Design 3 bottom sheet patterns
 */

import { StyleSheet, View } from 'react-native'
import { useTheme } from 'react-native-paper'
import type { ExtendedTheme } from '../../styles/types'

export type DragHandleProps = {
  /** Width of the drag handle */
  width?: number
  /** Height of the drag handle */
  height?: number
  /** Border radius of the drag handle */
  borderRadius?: number
}

/**
 * DragHandle component for bottom sheets
 * Visual affordance for draggable bottom sheets
 */
export const DragHandle = ({ width = 36, height = 4, borderRadius = 2 }: DragHandleProps) => {
  const theme = useTheme<ExtendedTheme>()
  const { semantic } = theme

  return (
    <View
      style={[
        styles.dragHandle,
        {
          width,
          height,
          borderRadius,
          backgroundColor: semantic.color.onSurface.subtle,
        },
      ]}
    />
  )
}

const styles = StyleSheet.create({
  dragHandle: {
    alignSelf: 'center',
    marginVertical: 8,
  },
})
