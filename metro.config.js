const { getDefaultConfig } = require('expo/metro-config')
const { withStorybook } = require('@storybook/react-native/metro/withStorybook')

const projectRoot = __dirname
const config = getDefaultConfig(projectRoot)
const isClaudeWorktree = projectRoot.includes('/.claude/worktrees/')

// Exclude directories that Watchman/Metro should never scan
config.watchFolders = config.watchFolders || []
config.resolver = {
  ...config.resolver,
  blockList: [
    ...(!isClaudeWorktree ? [/\.claude\/worktrees\/.*/] : []),
    /\.spec\/.*/,
    /\.git\/worktrees\/.*/,
  ],
}

// Exclude test files from Metro bundler
const originalResolveRequest = config.resolver?.resolveRequest
config.resolver = {
  ...config.resolver,
  resolveRequest: (context, moduleName, platform) => {
    // Let Expo handle its own virtual modules (expo/virtual/*)
    if (moduleName.startsWith('expo/virtual/')) {
      return originalResolveRequest
        ? originalResolveRequest(context, moduleName, platform)
        : context.resolveRequest(context, moduleName, platform)
    }
    // Exclude test files from being bundled
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
    // Use default resolution for other modules
    return originalResolveRequest
      ? originalResolveRequest(context, moduleName, platform)
      : context.resolveRequest(context, moduleName, platform)
  },
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
