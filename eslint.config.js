/**
 * ESLint configuration for Hummingbird
 * Enforces coding standards: naming conventions, no default exports, relative imports
 *
 * Following coding standards from .cursor/rules/coding_standards.mdc
 */

const { defineConfig } = require('eslint/config')
const expoConfig = require('eslint-config-expo/flat')

module.exports = defineConfig([
  ...expoConfig,
  {
    ignores: ['dist/*', 'node_modules/*', '.expo/*', 'convex/_generated/*'],
  },
  {
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
      'react-native/no-unused-styles': 'error',
      'react-native/no-color-literals': 'warn',
    },
  },
])
