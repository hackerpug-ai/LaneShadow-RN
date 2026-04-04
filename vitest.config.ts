import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

export default defineConfig({
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
    // Use jsdom for hooks tests
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
      '^convex/values$': resolve(__dirname, '__mocks__/convex/values.ts'),
      '^convex/server$': resolve(__dirname, '__mocks__/convex/server.ts'),
      '^.*/_generated/api$': resolve(__dirname, '__mocks__/convex/api.ts'),
      '^.*/_generated/server$': resolve(__dirname, '__mocks__/convex/server.ts'),
      '^.*/_generated/dataModel$': resolve(__dirname, '__mocks__/convex/dataModel.ts'),
      '^convex-helpers/server/zod$': resolve(__dirname, '__mocks__/convex-helpers/server/zod.ts'),
      '^convex-test$': resolve(__dirname, '__mocks__/convex-test.ts'),
    },
  },
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'react',
  },
})
