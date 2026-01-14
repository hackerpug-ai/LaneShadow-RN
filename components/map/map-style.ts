import type { ExtendedTheme } from '../../styles/types'

type MapStyle = Array<Record<string, unknown>>

const pickColor = (value: string | undefined, fallback: string, dark: boolean) =>
  value ?? fallback ?? (dark ? '#EBEBEB' : '#1E1E1E')

const pickSemanticHex = (semantic: ExtendedTheme['semantic'], key: string): string | undefined => {
  const record = semantic.color as unknown as Record<string, unknown>
  const value = record[key]
  if (!value || typeof value !== 'object') return undefined
  const defaultValue = (value as { default?: unknown }).default
  return typeof defaultValue === 'string' ? defaultValue : undefined
}

export const buildMapStyleFromTheme = (theme: ExtendedTheme): MapStyle => {
  const { semantic, dark } = theme

  const locationPoiBg = pickSemanticHex(semantic, 'locationPoiBg')
  const locationPoiMuted = pickSemanticHex(semantic, 'locationPoiMuted')

  const palette = dark
    ? {
        land: '#141210',
        poiSurface: pickColor(locationPoiBg, '#1B1816', dark),
        poiText: pickColor(locationPoiMuted, '#A3A3A3', dark),
        roadBase: '#26221F',
        localRoad: '#1A1715',
        arterial: '#3A3430',
        border: '#3A3531',
        text: '#EDEDED',
        textMuted: '#A3A3A3',
        water: '#1A2026',
      }
    : {
        land: '#EFEAE3',
        poiSurface: pickColor(locationPoiBg, '#F3EFE8', dark),
        poiText: pickColor(locationPoiMuted, '#6E6A64', dark),
        roadBase: '#DCD4CB',
        localRoad: '#E7E1DA',
        arterial: '#BEB5AB',
        border: '#C6BDB3',
        text: '#1C1B1A',
        textMuted: '#6E6A64',
        water: '#C9CED3',
      }

  const primary = pickColor(semantic.color.primary.default, '#B87333', dark)

  return [
    // Global labels
    {
      elementType: 'labels.text.fill',
      stylers: [{ color: palette.text }],
    },
    {
      elementType: 'labels.text.stroke',
      stylers: [{ color: palette.land }],
    },
    // Base land
    {
      elementType: 'geometry',
      stylers: [{ color: palette.land }],
    },
    // Administrative strokes
    {
      featureType: 'administrative',
      elementType: 'geometry.stroke',
      stylers: [{ color: palette.border }],
    },
    // POIs - only style labels, let geometry use defaults
    {
      featureType: 'poi',
      elementType: 'labels.text.fill',
      stylers: [{ color: palette.poiText }],
    },
    // Roads - local
    {
      featureType: 'road.local',
      elementType: 'geometry',
      stylers: [{ color: palette.localRoad }],
    },
    {
      featureType: 'road.local',
      elementType: 'labels.text.fill',
      stylers: [{ color: palette.textMuted }],
    },
    {
      featureType: 'road.local',
      elementType: 'labels.text.stroke',
      stylers: [{ color: palette.land }],
    },
    // Roads - default
    {
      featureType: 'road',
      elementType: 'geometry',
      stylers: [{ color: palette.roadBase }],
    },
    {
      featureType: 'road',
      elementType: 'labels.text.fill',
      stylers: [{ color: palette.textMuted }],
    },
    {
      featureType: 'road',
      elementType: 'labels.text.stroke',
      stylers: [{ color: palette.land }],
    },
    // Roads - arterial
    {
      featureType: 'road.arterial',
      elementType: 'geometry',
      stylers: [{ color: palette.arterial }],
    },
    {
      featureType: 'road.arterial',
      elementType: 'labels.text.fill',
      stylers: [{ color: palette.textMuted }],
    },
    {
      featureType: 'road.arterial',
      elementType: 'labels.text.stroke',
      stylers: [{ color: palette.land }],
    },
    // Roads - highway
    {
      featureType: 'road.highway',
      elementType: 'geometry',
      stylers: [{ color: palette.roadBase }],
    },
    {
      featureType: 'road.highway',
      elementType: 'geometry.stroke',
      stylers: [{ color: primary }],
    },
    {
      featureType: 'road.highway',
      elementType: 'labels.text.fill',
      stylers: [{ color: palette.textMuted }],
    },
    {
      featureType: 'road.highway',
      elementType: 'labels.text.stroke',
      stylers: [{ color: palette.land }],
    },
    // Transit
    {
      featureType: 'transit',
      elementType: 'geometry',
      stylers: [{ color: palette.poiSurface }],
    },
    // Water
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: palette.water }],
    },
    {
      featureType: 'water',
      elementType: 'labels.text.fill',
      stylers: [{ color: palette.textMuted }],
    },
  ]
}
