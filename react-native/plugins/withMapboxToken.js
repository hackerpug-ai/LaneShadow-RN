const { withInfoPlist } = require('expo/config-plugins');
const path = require('path');
const fs = require('fs');

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN && fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    for (const line of content.split('\n')) {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const val = match[2].trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

const withMapboxToken = (config) => {
  loadEnv();
  return withInfoPlist(config, (config) => {
    const token = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (token) {
      config.modResults.MGLMapboxAccessToken = token;
    }
    return config;
  });
};

module.exports = withMapboxToken;
