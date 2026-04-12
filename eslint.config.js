/**
 * ESLint configuration for Hummingbird
 * Enforces coding standards: naming conventions, no default exports, relative imports
 *
 * Following coding standards from .cursor/rules/coding_standards.mdc
 */

const { defineConfig, globalIgnores } = require('eslint/config')
const expoConfig = require('eslint-config-expo/flat')
const reactNative = require('eslint-plugin-react-native')

module.exports = defineConfig([
  globalIgnores([
    'dist/*',
    'node_modules/*',
    '.expo/*',
    'convex/_generated/*',
    '.claude/worktrees/**',
    'scripts/curation/venv/**',
    'scripts/curation/.venv/**',
    'scripts/curation/pipeline/nlp/pilot/venv/**',
    'venv/**',
    '**/venv/**',
    '**/.venv/**',
    '**/__pycache__/**',
    '**/*.py',
    '**/*.pyc',
    '.tmp/**',
    '*.tmp',
  ]),
  {
    settings: {
      'import/resolver': {
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
      },
    },
  },
  ...expoConfig,
  {
    plugins: {
      'react-native': reactNative,
    },
    rules: {
      // ============================================
      // NAMING CONVENTIONS
      // ============================================
      // TODO: Re-enable @typescript-eslint rules once plugin is properly configured
      // '@typescript-eslint/naming-convention': [
      //   'error',
      //   {
      //     selector: 'variable',
      //     modifiers: ['const', 'global'],
      //     format: ['UPPER_CASE', 'camelCase', 'PascalCase'],
      //   },
      //   {
      //     selector: 'variable',
      //     modifiers: ['const'],
      //     types: ['function'],
      //     format: ['camelCase', 'PascalCase'],
      //   },
      //   {
      //     selector: 'typeLike',
      //     format: ['PascalCase'],
      //   },
      // ],

      // ============================================
      // TYPESCRIPT
      // ============================================
      // TODO: Re-enable @typescript-eslint rules once plugin is properly configured
      // '@typescript-eslint/explicit-function-return-type': [
      //   'warn',
      //   {
      //     allowExpressions: true,
      //     allowTypedFunctionExpressions: true,
      //     allowHigherOrderFunctions: true,
      //   },
      // ],

      // No unused variables or imports
      // '@typescript-eslint/no-unused-vars': [
      //   'error',
      //   {
      //     argsIgnorePattern: '^_',
      //     varsIgnorePattern: '^_',
      //   },
      // ],

      // ============================================
      // IMPORTS & EXPORTS
      // ============================================
      // Prohibit default exports (per coding standards)
      'import/no-default-export': 'off', // Need to disable for Expo Router files
      'import/prefer-default-export': 'off',

      // No unused imports
      'no-unused-vars': 'off', // Using @typescript-eslint/no-unused-vars instead

      // ============================================
      // REACT & HOOKS
      // ============================================
      // Enforce hook rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // No unnecessary useCallback/useMemo (per react_rules)
      // This is a manual review item, not automatically enforced

      // ============================================
      // CODE QUALITY
      // ============================================
      // Prefer const over let
      'prefer-const': 'error',

      // No console.log in production (allow console.warn and console.error)
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],

      // Require === instead of ==
      eqeqeq: ['error', 'always'],

      // No var declarations
      'no-var': 'error',

      // ============================================
      // REACT NATIVE SPECIFIC
      // ============================================
      'react-native/no-inline-styles': 'warn',
      'react-native/no-unused-styles': 'warn', // Downgraded to warn - some styles consumed by libraries
      'react-native/no-color-literals': 'warn',
    },
  },
  // Convex functions: allow @convex-dev packages
  {
    files: ['convex/**/*.{ts,tsx}'],
    rules: {
      'import/no-unresolved': ['error', { ignore: ['@convex-dev/*'] }],
    },
  },
  // Detox e2e tests: Jest + Detox globals
  {
    files: ['e2e/**/*.{js,ts}'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        beforeAll: 'readonly',
        beforeEach: 'readonly',
        afterAll: 'readonly',
        afterEach: 'readonly',
        expect: 'readonly',
        device: 'readonly',
        element: 'readonly',
        by: 'readonly',
        waitFor: 'readonly',
      },
    },
  },
  // Test files: inline test components don't need display names, children prop is common in wrappers
  {
    files: ['**/__tests__/**/*.{ts,tsx}', '**/*.test.{ts,tsx}'],
    rules: {
      'react/display-name': 'off',
      'react/no-children-prop': 'off',
    },
  },
])
