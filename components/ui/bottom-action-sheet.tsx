/**
 * Bottom Action Sheet Component
 *
 * Low-level primitive for bottom sheets with consistent positioning and styling
 * Provides Modal + Portal + safe area handling
 * Following theme_rules.mdc
 */

import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import type { ReactNode } from 'react'
import { StyleSheet } from 'react-native'
import { Modal, Portal } from 'react-native-paper'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export type BottomActionSheetProps = {
  visible: boolean
  onDismiss: () => void
  children: ReactNode
  testID?: string
}

export const BottomActionSheet = ({
  visible,
  onDismiss,
  children,
  testID,
}: BottomActionSheetProps) => {
  const { semantic } = useSemanticTheme()
  const insets = useSafeAreaInsets()

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[
          styles.container,
          {
            backgroundColor: semantic.color.surface.default,
            borderTopLeftRadius: semantic.radius.xl,
            borderTopRightRadius: semantic.radius.xl,
            padding: semantic.space.lg,
            paddingBottom: insets.bottom + Number(semantic.space.lg),
          },
        ]}
        testID={testID}
      >
        {children}
      </Modal>
    </Portal>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
})
