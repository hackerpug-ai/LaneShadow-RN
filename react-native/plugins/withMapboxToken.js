const { withDangerousMod } = require('expo/config-plugins');
const path = require('path');
const fs = require('fs');

function loadEnv() {
  const envPath = path.join(__dirname, '..', '..', '.env.local');
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

function setPlistKey(text, key, value) {
  const escaped = value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const entry = `\t<key>${key}</key>\n\t<string>${escaped}</string>`;
  if (new RegExp(`<key>${key}</key>`).test(text)) {
    return text.replace(
      new RegExp(`<key>${key}</key>\\s*<string>[^<]*</string>`),
      `<key>${key}</key>\n\t<string>${escaped}</string>`
    );
  }
  return text.replace('</dict>', `${entry}\n</dict>`);
}

const withMapboxToken = (config) => {
  loadEnv();
  const token = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
  if (!token) return config;

  return withDangerousMod(config, [
    'ios',
    (config) => {
      const plistPath = path.join(
        config.modRequest.platformProjectRoot,
        'LaneShadow',
        'Info.plist'
      );
      if (fs.existsSync(plistPath)) {
        let content = fs.readFileSync(plistPath, 'utf8');
        content = setPlistKey(content, 'MGLMapboxAccessToken', token);
        fs.writeFileSync(plistPath, content, 'utf8');
      }
      return config;
    },
  ]);
};

module.exports = withMapboxToken;
