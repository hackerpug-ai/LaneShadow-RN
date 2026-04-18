/**
 * Style Dictionary configuration for LaneShadow semantic tokens.
 *
 * Source of truth: `tokens/**` (DTCG-shaped JSON).
 * Outputs:
 * - `react-native/styles/generated/tokens.ts`
 * - `tokens/generated/swift/LaneShadowTokens.swift`
 * - `tokens/generated/kotlin/LaneShadowTokens.kt`
 */

module.exports = {
  source: ['tokens/**/*.json'],
  platforms: {
    'react-native': {
      buildPath: 'react-native/styles/generated/',
      files: [
        {
          destination: 'tokens.ts',
          format: 'laneshadow/typescript-tokens',
        },
      ],
    },
    swift: {
      buildPath: 'tokens/generated/swift/',
      files: [
        {
          destination: 'LaneShadowTokens.swift',
          format: 'laneshadow/swift-tokens',
        },
      ],
    },
    kotlin: {
      buildPath: 'tokens/generated/kotlin/',
      files: [
        {
          destination: 'LaneShadowTokens.kt',
          format: 'laneshadow/kotlin-tokens',
        },
      ],
    },
  },
}
