const { getDefaultConfig } = require('expo/metro-config')
const path = __dirname
const config = getDefaultConfig(path)

config.server = {
  ...config.server,
  symbolicator: {
    customizeFrame: (frame) => {
      const f = frame.file || ''
      if (/InternalBytecode\.js$/.test(f)) return { collapse: true }
      if (f.startsWith('../convex/') || /\/Projects\/convex\//.test(f)) return { collapse: true }
      return {}
    },
  },
}

module.exports = config
