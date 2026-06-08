import type { ConfigContext, ExpoConfig } from 'expo/config'
const withMapboxToken = require('./plugins/withMapboxToken')
const withMapboxPodfileGuard = require('./plugins/withMapboxPodfileGuard')
const withRnmapboxPod = require('./plugins/withRnmapboxPod')

export default ({ config }: ConfigContext): ExpoConfig => {
  const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
  const mapboxToken = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN

  return {
    ...config,
    name: config.name ?? 'LaneShadow',
    slug: config.slug ?? 'laneshadow',
    plugins: [
      ...(config.plugins ?? []),
      'expo-sqlite',
      [
        '@rnmapbox/maps',
        {
          RNMapboxMapsImpl: 'mapbox',
        },
      ],
      withMapboxToken,
      withMapboxPodfileGuard,
      withRnmapboxPod,
    ],
    extra: {
      ...(config.extra ?? {}),
      MAPBOX_ACCESS_TOKEN: mapboxToken,
      EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN: mapboxToken,
    },
    ios: {
      ...config.ios,
      config: {
        ...(config.ios?.config ?? {}),
        googleMapsApiKey,
      },
    },
    android: {
      ...config.android,
      config: {
        ...(config.android?.config ?? {}),
        googleMaps: {
          ...(config.android?.config?.googleMaps ?? {}),
          apiKey: googleMapsApiKey,
        },
      },
    },
  }
}
