/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  setupFiles: ['<rootDir>/jest.env.js'],
  testMatch: ['**/?(*.)+(spec|test).tsx'],
  testPathIgnorePatterns: ['/node_modules/', '/e2e/', '/.expo/', '/android/', '/ios/'],
  // Transform all node_modules that use ESM or Flow syntax
  transformIgnorePatterns: [
    'node_modules/(?!(expo-linear-gradient|expo-modules-core|@expo|@testing-library)/)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^react-native$': '<rootDir>/__mocks__/react-native.ts',
    '^react-native-paper$': '<rootDir>/__mocks__/react-native-paper.ts',
  },
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  globals: {
    __DEV__: true,
  },
}
