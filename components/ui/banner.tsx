/**
 * Banner Component
 * Wraps React Native Paper Banner with semantic theme styling
 *
 * Following theme_rules.mdc: StyleSheet.create() + semantic tokens
 */

import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { StyleSheet } from 'react-native'
import { Banner as PaperBanner } from 'react-native-paper'

export type BannerProps = {
  visible: boolean
  message: string
  icon?: string
  actions?: Array<{ label: string; onPress: () => void }>
  testID?: string
}

export const Banner = ({ visible, message, icon, actions, testID }: BannerProps) => {
  const { semantic } = useSemanticTheme()

  if (!visible) return null

  return (
    <PaperBanner
      visible={visible}
      icon={icon}
      actions={actions}
      testID={testID}
      style={[
        styles.banner,
        {
          backgroundColor: semantic.color.warning.default + '33', // 20% opacity
        },
      ]}
      contentStyle={[
        styles.content,
        {
          paddingHorizontal: semantic.space.md,
        },
      ]}
    >
      {message}
    </PaperBanner>
  )
}

const styles = StyleSheet.create({
  banner: {
    // Static styles only
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
})
