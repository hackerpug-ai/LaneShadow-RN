/**
 * FAB Component
 * Wraps React Native Paper FAB with semantic theme styling
 *
 * Following theme_rules.mdc: StyleSheet.create() + semantic tokens
 * Following react_rules.mdc: Named exports, no unnecessary hooks
 */

import { FAB as PaperFAB } from 'react-native-paper'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'

export type FABProps = {
  icon: string
  label?: string
  onPress: () => void
  visible?: boolean
  testID?: string
}

export const FAB = ({ icon, label, onPress, visible = true, testID }: FABProps) => {
  const { semantic } = useSemanticTheme()

  return (
    <PaperFAB
      icon={icon}
      label={label}
      onPress={onPress}
      visible={visible}
      testID={testID}
      style={{
        backgroundColor: semantic.color.primary.default,
        borderRadius: semantic.radius['xl'],
      }}
      color={semantic.color.onSurface.default}
    />
  )
}
