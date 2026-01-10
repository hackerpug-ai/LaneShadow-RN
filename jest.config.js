/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: ['**/convex-tests/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/e2e/',
    '/.expo/',
    '/android/',
    '/ios/',
    '/convex/_generated/',
  ],
  transformIgnorePatterns: [
    '/node_modules/(?!(convex-test|@convex|convex-helpers)/)',
    '/convex/_generated/',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^convex/values$': '<rootDir>/__mocks__/convex/values.ts',
    '^convex/server$': '<rootDir>/__mocks__/convex/server.ts',
    '^.*/_generated/api$': '<rootDir>/__mocks__/convex/api.ts',
    '^.*/_generated/server$': '<rootDir>/__mocks__/convex/server.ts',
    '^.*/_generated/dataModel$': '<rootDir>/__mocks__/convex/dataModel.ts',
    '^\\./_generated/server$': '<rootDir>/__mocks__/convex/server.ts',
    '^\\.\\./\\.\\./_generated/server$': '<rootDir>/__mocks__/convex/server.ts',
    '^\\.\\./\\.\\./\\.\\./_generated/server$': '<rootDir>/__mocks__/convex/server.ts',
    '^\\./_generated/api$': '<rootDir>/__mocks__/convex/api.ts',
    '^\\.\\./convex/_generated/api$': '<rootDir>/__mocks__/convex/api.ts',
    '^\\.\\./\\.\\./_generated/api$': '<rootDir>/__mocks__/convex/api.ts',
    '^\\.\\./\\.\\./\\.\\./_generated/api$': '<rootDir>/__mocks__/convex/api.ts',
    '^\\./_generated/dataModel$': '<rootDir>/__mocks__/convex/dataModel.ts',
    '^\\.\\./\\.\\./_generated/dataModel$': '<rootDir>/__mocks__/convex/dataModel.ts',
    '^\\.\\./\\.\\./\\.\\./_generated/dataModel$': '<rootDir>/__mocks__/convex/dataModel.ts',
    '^convex-helpers/server/zod$': '<rootDir>/__mocks__/convex-helpers/server/zod.ts',
    '^convex-test$': '<rootDir>/__mocks__/convex-test.ts',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react',
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
        },
      },
    ],
    '^.+\\.jsx?$': [
      'ts-jest',
      {
        tsconfig: {
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          allowJs: true,
        },
      },
    ],
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  collectCoverageFrom: [
    'convex/**/*.ts',
    '!convex/_generated/**',
    '!convex/**/*.test.ts',
    '!convex/**/*.spec.ts',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
}
