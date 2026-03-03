const { getDefaultConfig } = require('expo/metro-config')
const { withStorybook } = require('@storybook/react-native/metro/withStorybook')

const path = __dirname
const config = getDefaultConfig(path)

config.server = {
  ...config.server,
  symbolicator: {
    customizeFrame: (frame) => {
      const f = frame.file || ''
      if (/InternalBytecode\.js$/.test(f)) return { collapse: true }
      if (f.startsWith('../convex/') || /\/Projects\/convex\//.test(f)) return { collapse: true }
      return {}
    },
  },
}

// Use EXPO_PUBLIC_ prefix for client-side env vars (Expo SDK 50+)
const STORYBOOK_ENABLED = process.env.EXPO_PUBLIC_STORYBOOK_ENABLED === 'true'

module.exports = withStorybook(config, {
  enabled: STORYBOOK_ENABLED,
  configPath: './.rnstorybook',
})
