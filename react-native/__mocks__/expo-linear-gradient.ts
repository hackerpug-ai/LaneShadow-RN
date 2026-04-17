/**
 * Mock for expo-linear-gradient
 */
import React from 'react'

type LinearGradientProps = {
  colors: string[]
  locations?: number[]
  start?: { x: number; y: number }
  end?: { x: number; y: number }
  style?: unknown
  children?: React.ReactNode
  testID?: string
}

export const LinearGradient = ({ children, style, testID }: LinearGradientProps) =>
  React.createElement('View', { style, testID }, children)

export default LinearGradient
