import type { ConfigContext, ExpoConfig } from 'expo/config'

/**
 * Expo config wrapper so we can inject the Google Maps API key from env.
 * This keeps secrets out of static JSON and ensures both platforms receive
 * the same key for map providers.
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY

  return {
    ...config,
    name: config.name ?? 'LaneShadow',
    slug: config.slug ?? 'laneshadow',
    plugins: [
      ...(config.plugins ?? []),
      [
        "@rnmapbox/maps",
        {
          RNMapboxMapsImpl: "mapbox",
        },
      ],
    ],
    extra: {
      ...(config.extra ?? {}),
      MAPBOX_ACCESS_TOKEN: process.env.MAPBOX_ACCESS_TOKEN,
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
