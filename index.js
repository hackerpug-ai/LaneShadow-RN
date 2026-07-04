/**
 * Custom entry point for LaneShadow
 * Switches between Storybook and the main app based on environment variable
 */
import { registerRootComponent } from 'expo'

const STORYBOOK_ENABLED = process.env.EXPO_PUBLIC_STORYBOOK_ENABLED === 'true'

if (STORYBOOK_ENABLED) {
  // Load Storybook
  const StorybookUI = require('./.rnstorybook').default
  registerRootComponent(StorybookUI)
} else {
  // Expo Router scans every `.ts/.tsx` file under `app/` via require.context and
  // warns at startup about any that lack a default React component export.
  // Sprint 1 extracted test files and helper modules (hooks, utils, component
  // fragments) into `app/` alongside their route files; without an ignore list
  // the bundler emits a "missing the required default export" warning per file.
  //
  // expo-router's getRoutes() merges `options.ignore` (a RegExp[]) into its
  // internal ignoreList. The patterns can't be carried through app.config.ts ->
  // JSON manifest (JSON.stringify turns RegExp into {}), so we inject them here
  // at runtime, before expo-router/entry is required. Constants.expoConfig is a
  // getter over a stable singleton manifest object, so this mutation persists
  // and is observed by useStore -> getRoutes when expo-router mounts.
  const Constants = require('expo-constants').default
  const routerConfig = Constants.expoConfig?.extra?.router
  if (routerConfig) {
    routerConfig.ignore = [
      /\.test\.[tj]sx?$/,
      /\.spec\.[tj]sx?$/,
      /__tests__/,
      /\.components\.[tj]sx?$/,
      /saved-route\.utils\//,
      /use-[^/]+\.ts$/,
      /compute-[^/]+\.ts$/,
    ]
  }

  // Load the Expo Router app
  require('expo-router/entry')
}
