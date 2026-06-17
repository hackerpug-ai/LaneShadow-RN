import { describe, expect, it } from 'vitest'
import { View, Text } from 'react-native'

describe('Simple RN test', () => {
  it('works with RN', () => {
    const TestView = () => <View><Text>Hello</Text></View>
    expect(true).toBe(true)
  })
})