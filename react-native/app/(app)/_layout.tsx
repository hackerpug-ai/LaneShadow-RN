import { Stack } from 'expo-router'
import { SelectedRouteProvider } from '../../contexts/selected-route'

export const AppLayout = () => {
  return (
    <SelectedRouteProvider>
      <Stack
        initialRouteName="(tabs)"
        screenOptions={{
          headerShown: false,
          animation: 'none',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: 'none' }} />
        <Stack.Screen
          name="offline/regions-list"
          options={{ headerShown: false, animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="offline/region-selector"
          options={{ headerShown: false, animation: 'slide_from_right' }}
        />
      </Stack>
    </SelectedRouteProvider>
  )
}

export default AppLayout
