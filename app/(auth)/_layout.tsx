import { Authenticated, Unauthenticated } from 'convex/react'
import { Redirect, Stack } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { Platform } from 'react-native'
if (Platform.OS !== 'web') {
  WebBrowser.maybeCompleteAuthSession()
}
export const AuthLayout = () => {
  return (
    <>
      <Unauthenticated>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'none',
          }}
        >
          <Stack.Screen name="sign-in" />
          <Stack.Screen name="oauth-callback" />
          <Stack.Screen name="tasks" />
        </Stack>
      </Unauthenticated>
      <Authenticated>
        <Redirect href={"/(app)" as any} />
      </Authenticated>
    </>
  )
}

export default AuthLayout
