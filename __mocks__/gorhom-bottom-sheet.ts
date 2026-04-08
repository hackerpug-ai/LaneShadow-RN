/**
 * Mock for @gorhom/bottom-sheet
 */
import React from 'react'

const createComponent = (name: string) => {
  const Component = ({ children, style, testID, ...props }: Record<string, unknown>) =>
    React.createElement(name, { style, testID, ...props }, children as React.ReactNode)
  Component.displayName = name
  return Component
}

export const BottomSheetModal = React.forwardRef((props: any, ref: any) => {
  const [presented, setPresented] = React.useState(false)
  React.useImperativeHandle(ref, () => ({
    present: () => setPresented(true),
    dismiss: () => setPresented(false),
  }))
  if (!presented) return null
  return React.createElement('View', { testID: props.testID || 'bottom-sheet' }, props.children)
})
BottomSheetModal.displayName = 'BottomSheetModal'

export const BottomSheetScrollView = createComponent('BottomSheetScrollView')
export const BottomSheetView = createComponent('BottomSheetView')
export const BottomSheetBackdrop = () => null
export const BottomSheetHandle = createComponent('BottomSheetHandle')

export default {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetView,
  BottomSheetBackdrop,
  BottomSheetHandle,
}
