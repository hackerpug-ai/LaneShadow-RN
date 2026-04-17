/**
 * Separator Component
 * Visual divider with semantic theme styling
 *
 * Specs from README 7.10:
 * - Horizontal: h-[1px] w-full
 * - Vertical: h-full w-[1px]
 * - Color: bg-border
 * - External margins applied by parent
 *
 * Following coding standards: composition over inheritance, named exports
 */

import type { ViewStyle } from 'react-native'
import { StyleSheet, View } from 'react-native'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'

/**
 * Separator orientation
 */
export type SeparatorOrientation = 'horizontal' | 'vertical'

/**
 * Separator component props
 */
export type SeparatorProps = {
  orientation?: SeparatorOrientation
  style?: ViewStyle
}

/**
 * Separator component using semantic theme
 * Visual divider for content sections
 */
export const Separator = ({
  orientation = 'horizontal',
  style,
}: SeparatorProps): React.ReactNode => {
  const { semantic } = useSemanticTheme()

  return (
    <View
      style={[
        styles.separator,
        {
          backgroundColor: semantic.color.border.default,
        },
        orientation === 'horizontal'
          ? {
              height: 1,
              width: '100%',
            }
          : {
              width: 1,
              height: '100%',
            },
        style,
      ]}
    />
  )
}

const styles = StyleSheet.create({
  separator: {
    // Base styles only, dimensions and colors come from props
  },
})
