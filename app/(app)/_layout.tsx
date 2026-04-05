import { useAuth } from '@clerk/clerk-expo'
import { Authenticated, Unauthenticated } from 'convex/react'
import { Redirect, Stack } from 'expo-router'
import { SelectedRouteProvider } from '../../contexts/selected-route'

export const AppLayout = () => {
  const { sessionId } = useAuth()
  console.log('app sessionId', sessionId)

  return (
    <SelectedRouteProvider>
      <Unauthenticated>
        <Redirect href="/(auth)/sign-in" />
      </Unauthenticated>
      <Authenticated>
        <Stack
          initialRouteName="(tabs)"
          screenOptions={{
            headerShown: false,
            animation: 'none',
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: 'none' }} />
        </Stack>
      </Authenticated>
    </SelectedRouteProvider>
  )
}

export default AppLayout
