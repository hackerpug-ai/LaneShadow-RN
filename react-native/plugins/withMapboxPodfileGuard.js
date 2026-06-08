const {
  withDangerousMod,
  withPodfile,
} = require('expo/config-plugins');
const fs = require('fs');

const withMapboxPodfileGuard = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = config.modRequest.platformProjectRoot + '/Podfile';
      let contents = await fs.promises.readFile(podfilePath, 'utf8');
      
      // Guard the $RNMapboxMaps pre_install call
      contents = contents.replace(
        /\$RNMapboxMaps\.pre_install\(installer\)/g,
        '$RNMapboxMaps.pre_install(installer) if $RNMapboxMaps.respond_to?(:pre_install)'
      );
      
      // Guard the $RNMapboxMaps post_install call
      contents = contents.replace(
        /\$RNMapboxMaps\.post_install\(installer\)/g,
        '$RNMapboxMaps.post_install(installer) if $RNMapboxMaps.respond_to?(:post_install)'
      );
      
      await fs.promises.writeFile(podfilePath, contents);
      return config;
    },
  ]);
};

module.exports = withMapboxPodfileGuard;
