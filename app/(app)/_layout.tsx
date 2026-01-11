import { Authenticated, Unauthenticated } from 'convex/react'
import { Redirect, Stack } from 'expo-router'
import React from 'react'

export const AppLayout = () => {
  return (
    <>
      <Unauthenticated>
        <Redirect href="/(auth)" />
      </Unauthenticated>
      <Authenticated>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        />
      </Authenticated>
    </>
  )
}

export default AppLayout
/**
 * App Layout
 * Layout for authenticated routes
 */

import { Stack } from 'expo-router'
import React from 'react'

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  )
}
