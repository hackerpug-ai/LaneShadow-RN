import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { BottomActionSheet } from '../ui/bottom-action-sheet'
import { SheetHandle } from './sheet-handle'

type SnapPreset = 'content' | 'half' | 'full'

const SNAP_PRESETS: Record<SnapPreset, Array<string | number>> = {
  content: ['40%'],
  half: ['60%'],
  full: ['90%'],
}

export type BottomSheetWrapperProps = {
  isVisible: boolean
  onClose: () => void
  children: ReactNode
  testID?: string
  preset?: SnapPreset
  snapPoints?: Array<string | number>
  wrapChildren?: boolean
  showHandle?: boolean
}

/**
 * Mid-level wrapper around the Gorhom BottomActionSheet that standardizes
 * snap points, spacing, and optional drag handle. Use this for most sheets.
 */
export const BottomSheetWrapper = ({
  isVisible,
  onClose,
  children,
  testID,
  preset = 'full',
  snapPoints,
  wrapChildren = true,
  showHandle = true,
}: BottomSheetWrapperProps) => {
  const { semantic } = useSemanticTheme()

  const resolvedSnapPoints = useMemo(
    () => snapPoints || SNAP_PRESETS[preset],
    [preset, snapPoints]
  )

  return (
    <BottomActionSheet
      visible={isVisible}
      onDismiss={onClose}
      testID={testID}
      snapPoints={resolvedSnapPoints}
      wrapChildren={wrapChildren}
    >
      <View
        style={[
          styles.content,
          {
            paddingHorizontal: semantic.space.lg,
            paddingTop: semantic.space.md,
            paddingBottom: semantic.space.lg,
            gap: semantic.space.md,
          },
        ]}
      >
        {showHandle ? <SheetHandle /> : null}
        {children}
      </View>
    </BottomActionSheet>
  )
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
})
