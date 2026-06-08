const { getDefaultConfig } = require('expo/metro-config')
const { withStorybook } = require('@storybook/react-native/metro/withStorybook')
const pathModule = require('path')

const path = __dirname
const config = getDefaultConfig(path)

const projectRoot = pathModule.resolve(__dirname, '..')
config.watchFolders = [projectRoot]
config.resolver = {
  ...config.resolver,
  nodeModulesPaths: [
    pathModule.join(projectRoot, 'node_modules'),
    pathModule.join(__dirname, 'node_modules'),
  ],
  blockList: [/\.claude\/worktrees\/.*/, /\.spec\/.*/, /\.git\/worktrees\/.*/],
  unstable_conditionNames: ['react-native', 'browser', 'require', 'default'],
}

const rnmapboxPath = pathModule.dirname(
  require.resolve('@rnmapbox/maps/package.json', { paths: [path] })
)
const rnmapboxNativeIndex = pathModule.join(rnmapboxPath, 'lib/module/index.native.js')

const originalResolveRequest = config.resolver?.resolveRequest
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.endsWith('.css')) {
    return { type: 'empty' }
  }
  if (platform !== 'web' && moduleName === '@rnmapbox/maps') {
    return {
      type: 'sourceFile',
      filePath: rnmapboxNativeIndex,
    }
  }
  if (moduleName.startsWith('expo/virtual/')) {
    return originalResolveRequest
      ? originalResolveRequest(context, moduleName, platform)
      : context.resolveRequest(context, moduleName, platform)
  }
  if (
    moduleName.endsWith('.test.ts') ||
    moduleName.endsWith('.test.tsx') ||
    moduleName.endsWith('.spec.ts') ||
    moduleName.endsWith('.spec.tsx') ||
    moduleName.includes('__tests__') ||
    moduleName.endsWith('.mock.ts') ||
    moduleName.endsWith('.mock.tsx')
  ) {
    return { type: 'empty' }
  }
  return originalResolveRequest
    ? originalResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform)
}

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
