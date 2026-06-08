/**
 * Vitest environment setup - runs before tests
 * Sets NODE_ENV=test to disable LangSmith tracing during tests
 */

import fs from 'node:fs'
// Globally stub react-native before any test imports it (directly or transitively
// via @testing-library/react-native). React Native 0.81 ships Flow-annotated
// source files (`import typeof * as ...`) that Node's parser cannot handle, so
// we intercept Node's module resolver to redirect every `require('react-native')`
// — including nested requires inside @testing-library/react-native's CJS — to
// our stub at __mocks__/react-native.ts.
//
// vi.mock() and vitest's server.deps.inline don't help here because those only
// apply to files that Vite transforms; the testing-library package is loaded by
// Node's native CJS loader which bypasses Vite entirely.
import Module from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import { vi } from 'vitest'

process.env.NODE_ENV = 'test'

// Set __DEV__ for React Native/Expo packages
global.__DEV__ = false

// Set up ExpoGlobal for expo-modules-core
globalThis.ExpoGlobal = {
  EventEmitter: class EventEmitter {
    constructor() {
      this.listeners = {}
    }

    addEventListener(event, listener) {
      if (!this.listeners[event]) {
        this.listeners[event] = []
      }
      this.listeners[event].push(listener)
      return {
        remove: () => {
          this.listeners[event] = this.listeners[event].filter((l) => l !== listener)
        },
      }
    }

    removeEventListener(event, listener) {
      if (!this.listeners[event]) return
      this.listeners[event] = this.listeners[event].filter((l) => l !== listener)
    }

    emit(event, data) {
      if (!this.listeners[event]) return
      this.listeners[event].forEach((listener) => listener(data))
    }

    removeAllListeners(event) {
      if (event) {
        this.listeners[event] = []
      } else {
        this.listeners = {}
      }
    }
  },
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const EXPO_ICONS_STUB = path.resolve(__dirname, '__mocks__/expo-vector-icons.ts')
const DATETIMEPICKER_STUB = path.resolve(__dirname, '__mocks__/datetimepicker.ts')
const LINEAR_GRADIENT_STUB = path.resolve(__dirname, '__mocks__/expo-linear-gradient.ts')
const GESTURE_HANDLER_STUB = path.resolve(__dirname, '__mocks__/react-native-gesture-handler.ts')
const BOTTOM_SHEET_STUB = path.resolve(__dirname, '__mocks__/gorhom-bottom-sheet.ts')
const EXPO_MODULES_CORE_STUB = path.resolve(__dirname, '__mocks__/expo-modules-core.ts')
const NOTIFIER_STUB = path.resolve(__dirname, '__mocks__/react-native-notifier.ts')
const SAFE_AREA_STUB = path.resolve(__dirname, '__mocks__/react-native-safe-area-context.ts')
const STUB_MAP = {
  'react-native': path.resolve(__dirname, '__mocks__/react-native.ts'),
  'react-native-paper': path.resolve(__dirname, '__mocks__/react-native-paper.ts'),
  '@expo/vector-icons': EXPO_ICONS_STUB,
  '@expo/vector-icons/MaterialCommunityIcons': EXPO_ICONS_STUB,
  '@expo/vector-icons/MaterialIcons': EXPO_ICONS_STUB,
  '@expo/vector-icons/Ionicons': EXPO_ICONS_STUB,
  '@expo/vector-icons/Feather': EXPO_ICONS_STUB,
  '@expo/vector-icons/FontAwesome': EXPO_ICONS_STUB,
  '@expo/vector-icons/FontAwesome5': EXPO_ICONS_STUB,
  '@expo/vector-icons/FontAwesome6': EXPO_ICONS_STUB,
  '@expo/vector-icons/AntDesign': EXPO_ICONS_STUB,
  '@expo/vector-icons/Entypo': EXPO_ICONS_STUB,
  '@expo/vector-icons/EvilIcons': EXPO_ICONS_STUB,
  '@expo/vector-icons/Fontisto': EXPO_ICONS_STUB,
  '@expo/vector-icons/Foundation': EXPO_ICONS_STUB,
  '@expo/vector-icons/Octicons': EXPO_ICONS_STUB,
  '@expo/vector-icons/SimpleLineIcons': EXPO_ICONS_STUB,
  '@expo/vector-icons/Zocial': EXPO_ICONS_STUB,
  '@react-native-community/datetimepicker': DATETIMEPICKER_STUB,
  'expo-linear-gradient': LINEAR_GRADIENT_STUB,
  'react-native-gesture-handler': GESTURE_HANDLER_STUB,
  '@gorhom/bottom-sheet': BOTTOM_SHEET_STUB,
  'expo-modules-core': EXPO_MODULES_CORE_STUB,
  'react-native-notifier': NOTIFIER_STUB,
  'react-native-safe-area-context': SAFE_AREA_STUB,
  'react-native-svg': path.resolve(__dirname, '__mocks__/react-native-svg.ts'),
}
const originalResolveFilename = Module._resolveFilename
Module._resolveFilename = function (request, parent, ...rest) {
  if (STUB_MAP[request]) {
    return STUB_MAP[request]
  }
  try {
    return originalResolveFilename.call(this, request, parent, ...rest)
  } catch (err) {
    // Fallback: try .ts / .tsx / index.ts / index.tsx for relative requires.
    // Node's native CJS resolver only knows .js/.json/.node; test files that
    // do `require('./saved-routes')` against a TSX sibling need this hook.
    if (
      err.code === 'MODULE_NOT_FOUND' &&
      (request.startsWith('./') || request.startsWith('../')) &&
      parent?.filename
    ) {
      const baseDir = path.dirname(parent.filename)
      const candidates = [
        path.resolve(baseDir, `${request}.ts`),
        path.resolve(baseDir, `${request}.tsx`),
        path.resolve(baseDir, request, 'index.ts'),
        path.resolve(baseDir, request, 'index.tsx'),
      ]
      for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
          return candidate
        }
      }
    }
    throw err
  }
}

// Configure @testing-library/react-native to include elements marked as
// accessibilityElementsHidden / importantForAccessibility="no-hide-descendants"
// in queries. Many of our components use these a11y props on decorative
// wrappers (icons, backgrounds) that tests still need to address by testID.
// Must run inline (not in beforeAll) so module-level `render()` calls pick it up.
const { configure } = await import('@testing-library/react-native')
configure({ defaultHidden: true })

const loadFirstEnvFile = () => {
  const rootDir = path.resolve(__dirname)
  const candidates = ['.env.test.local', '.env.test', '.env.local', '.env'].map((p) =>
    path.join(rootDir, p),
  )

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      dotenv.config({ path: candidate, override: false })
      return
    }
  }
}

loadFirstEnvFile()

// Set required environment variables for tests if not already set
if (!process.env.EXPO_PUBLIC_CONVEX_URL) {
  process.env.EXPO_PUBLIC_CONVEX_URL = 'https://test.convex.url'
}
if (!process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY) {
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_test_key'
}
if (!process.env.CONVEX_URL) {
  process.env.CONVEX_URL = 'https://test.convex.url'
}
if (!process.env.CLERK_SECRET_KEY) {
  process.env.CLERK_SECRET_KEY = 'sk_test_test_secret'
}
if (!process.env.CLERK_WEBHOOK_SECRET) {
  process.env.CLERK_WEBHOOK_SECRET = 'test-webhook-secret'
}
if (!process.env.CLERK_JWT_ISSUER_DOMAIN) {
  process.env.CLERK_JWT_ISSUER_DOMAIN = 'test.issuer.domain'
}
if (!process.env.GOOGLE_MAPS_API_KEY) {
  process.env.GOOGLE_MAPS_API_KEY = 'test-google-key'
}

// Global test utilities
global.console = {
  ...console,
  error: vi.fn(), // Suppress error logs in tests
  warn: vi.fn(),
}

// Provide jest compatibility layer for existing tests
global.jest = {
  fn: vi.fn,
  mock: vi.fn,
  spyOn: vi.spyOn,
  clearAllMocks: vi.clearAllMocks,
  resetAllMocks: vi.resetAllMocks,
  restoreAllMocks: vi.restoreAllMocks,
  useFakeTimers: vi.useFakeTimers,
  useRealTimers: vi.useRealTimers,
  advanceTimersByTime: vi.advanceTimersByTime,
  runAllTimers: vi.runAllTimers,
  runOnlyPendingTimers: vi.runOnlyPendingTimers,
  resetModules: () => {},
}
