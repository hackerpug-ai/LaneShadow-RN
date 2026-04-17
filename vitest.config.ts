import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

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
    // @react-native-community/datetimepicker contains syntax errors that
    // vitest/esbuild cannot parse. Redirect to our stub.
    if (source === '@react-native-community/datetimepicker') {
      return resolve(__dirname, '__mocks__/datetimepicker.ts')
    }
    // expo-linear-gradient contains JSX that cannot be parsed
    if (source === 'expo-linear-gradient') {
      return resolve(__dirname, '__mocks__/expo-linear-gradient.ts')
    }
    // react-native-gesture-handler has TypeScript files that cannot be parsed
    if (source === 'react-native-gesture-handler') {
      return resolve(__dirname, '__mocks__/react-native-gesture-handler.ts')
    }
    // @gorhom/bottom-sheet has dependency issues
    if (source === '@gorhom/bottom-sheet') {
      return resolve(__dirname, '__mocks__/gorhom-bottom-sheet.ts')
    }
    // expo-modules-core requires ExpoGlobal
    if (source === 'expo-modules-core') {
      return resolve(__dirname, '__mocks__/expo-modules-core.ts')
    }
    // @convex-dev/geospatial is a Convex component that needs to be resolved
    if (source === '@convex-dev/geospatial' || source.startsWith('@convex-dev/geospatial/')) {
      return resolve(__dirname, 'node_modules/@convex-dev/geospatial/dist/client/index.js')
    }
    // expo-crypto requires native modules
    if (source === 'expo-crypto') {
      return resolve(__dirname, '__mocks__/expo-crypto.ts')
    }
    // expo-file-system requires native modules
    if (source === 'expo-file-system') {
      return resolve(__dirname, '__mocks__/expo-file-system.ts')
    }
    // expo-network requires native modules
    if (source === 'expo-network') {
      return resolve(__dirname, '__mocks__/expo-network.ts')
    }
    // expo has TypeScript files that cannot be parsed
    if (source === 'expo') {
      return resolve(__dirname, '__mocks__/expo.ts')
    }
    // react-native-maps contains JSX that cannot be parsed
    if (source === 'react-native-maps') {
      return resolve(__dirname, '__mocks__/react-native-maps.ts')
    }
    // expo-haptics requires native modules
    if (source === 'expo-haptics') {
      return resolve(__dirname, '__mocks__/expo-haptics.ts')
    }
    // react-native-notifier contains syntax that cannot be parsed
    if (source === 'react-native-notifier') {
      return resolve(__dirname, '__mocks__/react-native-notifier.ts')
    }
    // react-native-safe-area-context requires native modules
    if (source === 'react-native-safe-area-context') {
      return resolve(__dirname, '__mocks__/react-native-safe-area-context.ts')
    }
    // react-native-markdown-display contains JSX that cannot be parsed
    if (source === 'react-native-markdown-display') {
      return resolve(__dirname, '__mocks__/react-native-markdown-display.ts')
    }
    // react-native-svg contains native modules
    if (source === 'react-native-svg') {
      return resolve(__dirname, '__mocks__/react-native-svg.ts')
    }
    // @rnmapbox/maps requires native modules
    if (source === '@rnmapbox/maps') {
      return resolve(__dirname, '__mocks__/rnmapbox-maps.ts')
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
      {
        find: /^.*\/_generated\/server$/,
        replacement: resolve(__dirname, '__mocks__/convex/server.ts'),
      },
      {
        find: /^.*\/_generated\/dataModel$/,
        replacement: resolve(__dirname, '__mocks__/convex/dataModel.ts'),
      },
      {
        find: /^convex-helpers\/server\/zod$/,
        replacement: resolve(__dirname, '__mocks__/convex-helpers/server/zod.ts'),
      },
      { find: /^convex-test$/, replacement: resolve(__dirname, '__mocks__/convex-test.ts') },
      {
        find: /^@react-native-community\/datetimepicker$/,
        replacement: resolve(__dirname, '__mocks__/datetimepicker.ts'),
      },
      // Stub react-native so tests can import RN components without running the native runtime.
      // Must match `react-native` exactly (not `react-native-*` like react-native-paper).
      { find: /^react-native$/, replacement: resolve(__dirname, '__mocks__/react-native.ts') },
      {
        find: /^react-native-paper$/,
        replacement: resolve(__dirname, '__mocks__/react-native-paper.ts'),
      },
      { find: /^expo$/, replacement: resolve(__dirname, '__mocks__/expo.ts') },
      {
        find: /^expo-modules-core$/,
        replacement: resolve(__dirname, '__mocks__/expo-modules-core.ts'),
      },
      {
        find: /^react-native-maps$/,
        replacement: resolve(__dirname, '__mocks__/react-native-maps.ts'),
      },
      { find: /^expo-haptics$/, replacement: resolve(__dirname, '__mocks__/expo-haptics.ts') },
      { find: /^expo-crypto$/, replacement: resolve(__dirname, '__mocks__/expo-crypto.ts') },
      {
        find: /^expo-file-system$/,
        replacement: resolve(__dirname, '__mocks__/expo-file-system.ts'),
      },
      { find: /^expo-network$/, replacement: resolve(__dirname, '__mocks__/expo-network.ts') },
      { find: /^@rnmapbox\/maps$/, replacement: resolve(__dirname, '__mocks__/rnmapbox-maps.ts') },
      {
        find: /^react-native-svg$/,
        replacement: resolve(__dirname, '__mocks__/react-native-svg.ts'),
      },
    ],
  },
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'react',
  },
})
