const { withPodfile } = require('expo/config-plugins');

const withRnmapboxPod = (config) => {
  return withPodfile(config, (config) => {
    const contents = config.modResults.contents;

    if (!contents.includes("pod 'rnmapbox-maps'")) {
      config.modResults.contents = contents.replace(
        /config = use_native_modules!\(config_command\)/,
        `config = use_native_modules!(config_command)\n\n  # @rnmapbox/maps - manual pod link\n  pod 'rnmapbox-maps', :path => '../../node_modules/@rnmapbox/maps'`
      );
    }

    return config;
  });
};

module.exports = withRnmapboxPod;
