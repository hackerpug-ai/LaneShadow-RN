/**
 * Prettier configuration for Hummingbird
 * Enforces consistent code formatting across the project
 *
 * Following coding standards: single quotes, no semicolons, trailing commas
 */

module.exports = {
  // Basic formatting
  semi: false,
  singleQuote: true,
  trailingComma: 'es5',

  // Indentation
  tabWidth: 2,
  useTabs: false,

  // Line width
  printWidth: 100,

  // JSX
  jsxSingleQuote: false,
  jsxBracketSameLine: false,

  // Arrow functions
  arrowParens: 'always',

  // End of line
  endOfLine: 'lf',

  // File-specific overrides
  overrides: [
    {
      files: '*.json',
      options: {
        printWidth: 80,
      },
    },
  ],
}
