/**
 * Auth Layout
 *
 * Layout for unauthenticated routes
 * Contains sign-in and any other auth-related screens
 */

import { Stack } from 'expo-router'
import React from 'react'

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="sign-in" />
    </Stack>
  )
}
