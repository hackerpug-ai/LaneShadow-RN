import { Redirect } from 'expo-router'

const Index = () => {
  // Redirect to (app) — if unauthenticated, (app)/_layout.tsx will redirect to auth
  // This ensures authenticated users land on the app, not the login screen
  return <Redirect href={"/(app)/(tabs)" as any} />
}

export default Index
