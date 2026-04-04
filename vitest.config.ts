import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

/**
 * Vite plugin that stubs React-Native / Expo packages at the Vite resolver
 * layer. Paired with the Module._resolveFilename override in vitest.env.js:
 *
 * - Vitest.env.js handles `require()` calls made by Node's native CJS loader
 *   (e.g. from inside @testing-library/react-native's compiled CJS).
 * - This plugin handles ESM-style imports that go through Vite's transform
 *   pipeline (e.g. `import MaterialCommunityIcons from '@expo/vector-icons/…'`
 *   in project source files that the tests load).
 *
 * Both layers are needed because vite + Node hit different resolution paths.
 */
const reactNativeStubPlugin = () => ({
  name: 'vitest-react-native-stub',
  enforce: 'pre' as const,
  resolveId(source: string) {
    if (source === 'react-native') {
      return resolve(__dirname, '__mocks__/react-native.ts')
    }
    if (source === 'react-native-paper') {
      return resolve(__dirname, '__mocks__/react-native-paper.ts')
    }
    // @expo/vector-icons ships .js files with inline JSX that vite/rollup
    // cannot parse. Redirect every subpath to our stub.
    if (source === '@expo/vector-icons' || source.startsWith('@expo/vector-icons/')) {
      return resolve(__dirname, '__mocks__/expo-vector-icons.ts')
    }
    return null
  },
})

export default defineConfig({
  plugins: [reactNativeStubPlugin()],
  test: {
    // Set NODE_ENV to 'test' to disable LangSmith tracing during tests
    environment: 'jsdom',
    setupFiles: ['./vitest.env.js'],
    include: ['**/*.test.ts', '**/*.test.tsx'],
    exclude: [
      'node_modules/',
      'e2e/',
      '.expo/',
      'android/',
      'ios/',
      'convex/_generated/',
      'dist/',
      'build/',
      '.claude/worktrees/**',
    ],
    coverage: {
      provider: 'v8',
      include: ['convex/**/*.ts'],
      exclude: ['convex/_generated/**', 'convex/**/*.test.ts', 'convex/**/*.spec.ts'],
    },
    globals: true,
    // Configure jsdom environment for React hooks tests
    environmentOptions: {
      jsdom: {
        // Configure jsdom environment
      },
    },
    // Forks pool keeps tests isolated in separate processes. The `react-native`
    // redirection happens at Node's module loader level via vitest.env.js (see
    // Module._resolveFilename override), which works regardless of pool choice.
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
  resolve: {
    alias: [
      { find: '@', replacement: resolve(__dirname, './') },
      { find: /^convex\/values$/, replacement: resolve(__dirname, '__mocks__/convex/values.ts') },
      { find: /^convex\/server$/, replacement: resolve(__dirname, '__mocks__/convex/server.ts') },
      { find: /^.*\/_generated\/api$/, replacement: resolve(__dirname, '__mocks__/convex/api.ts') },
      { find: /^.*\/_generated\/server$/, replacement: resolve(__dirname, '__mocks__/convex/server.ts') },
      { find: /^.*\/_generated\/dataModel$/, replacement: resolve(__dirname, '__mocks__/convex/dataModel.ts') },
      { find: /^convex-helpers\/server\/zod$/, replacement: resolve(__dirname, '__mocks__/convex-helpers/server/zod.ts') },
      { find: /^convex-test$/, replacement: resolve(__dirname, '__mocks__/convex-test.ts') },
      // Stub react-native so tests can import RN components without running the native runtime.
      // Must match `react-native` exactly (not `react-native-*` like react-native-paper).
      { find: /^react-native$/, replacement: resolve(__dirname, '__mocks__/react-native.ts') },
      { find: /^react-native-paper$/, replacement: resolve(__dirname, '__mocks__/react-native-paper.ts') },
    ],
  },
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'react',
  },
})
