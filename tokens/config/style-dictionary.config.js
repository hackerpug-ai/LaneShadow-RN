const path = require('node:path')

const ROOT = path.resolve(__dirname, '..')

module.exports = {
  source: [path.join(ROOT, 'semantic/*.tokens.json')],
  // We bypass SD's transform/preprocessor pipeline; our custom formatters
  // walk dictionary.tokens directly. SD is used purely for orchestration:
  // source file globbing, per-platform invocation, and output writes.
  platforms: {
    typescript: {
      buildPath: path.join(ROOT, 'platforms/typescript/src/generated/'),
      files: [{ destination: 'tokens.ts', format: 'laneshadow/typescript' }],
    },
    swift: {
      buildPath: path.join(ROOT, 'platforms/swift/Sources/LaneShadowTheme/Generated/'),
      files: [{ destination: 'Tokens.swift', format: 'laneshadow/swift' }],
    },
    kotlin: {
      buildPath: path.join(
        ROOT,
        'platforms/kotlin/src/main/kotlin/com/laneshadow/theme/generated/',
      ),
      files: [{ destination: 'Tokens.kt', format: 'laneshadow/kotlin' }],
    },
  },
}
