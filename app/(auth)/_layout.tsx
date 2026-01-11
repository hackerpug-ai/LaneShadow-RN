import { Authenticated, Unauthenticated } from 'convex/react'
import { Redirect, Stack } from 'expo-router'
import React from 'react'

export const AuthLayout = () => {
  return (
    <>
      <Authenticated>
        <Redirect href="/(app)" />
      </Authenticated>
      <Unauthenticated>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'none',
          }}
        >
          <Stack.Screen name="session-restoring" />
          <Stack.Screen name="sign-in" />
          <Stack.Screen name="sign-up" />
        </Stack>
      </Unauthenticated>
    </>
  )
}

export default AuthLayout
