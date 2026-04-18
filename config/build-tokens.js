/* eslint-disable no-console */

const StyleDictionary = require('style-dictionary')

const config = require('./style-dictionary.config')

const typescriptTokens = require('./style-dictionary/formats/typescript-tokens')
const swiftTokens = require('./style-dictionary/formats/swift-tokens')
const kotlinTokens = require('./style-dictionary/formats/kotlin-tokens')

StyleDictionary.registerFormat({
  name: 'laneshadow/typescript-tokens',
  formatter: typescriptTokens,
})
StyleDictionary.registerFormat({
  name: 'laneshadow/swift-tokens',
  formatter: swiftTokens,
})
StyleDictionary.registerFormat({
  name: 'laneshadow/kotlin-tokens',
  formatter: kotlinTokens,
})

function main() {
  const sd = StyleDictionary.extend(config)
  sd.buildAllPlatforms()
  process.stdout.write('Token build complete.\n')
}

main()
