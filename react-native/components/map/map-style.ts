import type { ExtendedTheme } from '../../styles/types'

type MapStyle = Record<string, unknown>[]

/**
 * Google Maps custom styles only accept hex colors (#RRGGBB). Theme tokens
 * may use rgba() strings (especially in dark mode). This helper converts
 * any color string to a 6-digit hex value, compositing rgba against a
 * background color (default: the map's land/base color) when alpha < 1.
 */
const toHex = (color: string, bgHex: string = '#000000'): string => {
  // Already hex
  if (/^#[0-9a-fA-F]{6}$/.test(color)) return color
  if (/^#[0-9a-fA-F]{3}$/.test(color)) {
    const [, r, g, b] = color.match(/^#(.)(.)(.)$/)!
    return `#${r}${r}${g}${g}${b}${b}`
  }

  // rgba(r, g, b, a) or rgb(r, g, b)
  const rgbaMatch = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/)
  if (rgbaMatch) {
    const r = parseInt(rgbaMatch[1], 10)
    const g = parseInt(rgbaMatch[2], 10)
    const b = parseInt(rgbaMatch[3], 10)
    const a = rgbaMatch[4] !== undefined ? parseFloat(rgbaMatch[4]) : 1

    if (a >= 1) {
      return '#' + [r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')
    }

    // Composite against background
    const bgR = parseInt(bgHex.slice(1, 3), 16)
    const bgG = parseInt(bgHex.slice(3, 5), 16)
    const bgB = parseInt(bgHex.slice(5, 7), 16)
    const cR = Math.round(r * a + bgR * (1 - a))
    const cG = Math.round(g * a + bgG * (1 - a))
    const cB = Math.round(b * a + bgB * (1 - a))
    return '#' + [cR, cG, cB].map((c) => c.toString(16).padStart(2, '0')).join('')
  }

  // Fallback: return as-is (shouldn't happen with our theme tokens)
  return color
}

const pickColor = (value: string | undefined, fallback: string, dark: boolean) =>
  value ?? fallback ?? (dark ? '#EBEBEB' : '#1E1E1E')

const pickSemanticHex = (semantic: ExtendedTheme['semantic'], key: string): string | undefined => {
  const record = semantic.color as unknown as Record<string, unknown>
  const value = record[key]
  if (!value || typeof value !== 'object') return undefined
  const defaultValue = (value as { default?: unknown }).default
  return typeof defaultValue === 'string' ? defaultValue : undefined
}

const pickSemanticColor = (
  semantic: ExtendedTheme['semantic'],
  colorKey: string,
  stateKey: string = 'default',
): string | undefined => {
  const record = semantic.color as unknown as Record<string, unknown>
  const colorGroup = record[colorKey]
  if (!colorGroup || typeof colorGroup !== 'object') return undefined
  const stateValue = (colorGroup as Record<string, unknown>)[stateKey]
  return typeof stateValue === 'string' ? stateValue : undefined
}

export const buildMapStyleFromTheme = (theme: ExtendedTheme): MapStyle => {
  const { semantic, dark } = theme

  // Extract colors from semantic theme with fallbacks
  const locationPoiBg = pickSemanticHex(semantic, 'locationPoiBg')
  const locationPoiMuted = pickSemanticHex(semantic, 'locationPoiMuted')
  const primaryColor = pickSemanticColor(semantic, 'primary')
  const surfaceColor = pickSemanticColor(semantic, 'surface')
  const onSurfaceDefault = pickSemanticColor(semantic, 'onSurface', 'default')
  const onSurfaceMuted = pickSemanticColor(semantic, 'onSurface', 'muted')
  const borderColor = pickSemanticColor(semantic, 'border')

  // Resolve land color first — used as compositing background for rgba → hex.
  const landRaw = dark
    ? (semantic.color.background.default ?? '#141210')
    : (semantic.color.background.default ?? '#EFEAE3')
  const landHex = toHex(landRaw)

  const palette = dark
    ? {
        land: landHex,
        poiSurface: toHex(pickColor(locationPoiBg, '#1B1816', dark), landHex),
        poiText: toHex(pickColor(locationPoiMuted, onSurfaceMuted ?? '#A3A3A3', dark), landHex),
        roadBase: toHex(semantic.color.surfaceVariant.default ?? '#26221F', landHex),
        localRoad: toHex(semantic.color.background.default ?? '#1A1715', landHex),
        arterial: toHex(semantic.color.border.default ?? '#3A3430', landHex),
        border: toHex(borderColor ?? '#3A3531', landHex),
        text: toHex(onSurfaceDefault ?? '#EDEDED', landHex),
        textMuted: toHex(onSurfaceMuted ?? '#A3A3A3', landHex),
        water: '#1A2026',
      }
    : {
        land: landHex,
        poiSurface: toHex(pickColor(locationPoiBg, surfaceColor ?? '#F3EFE8', dark), landHex),
        poiText: toHex(pickColor(locationPoiMuted, onSurfaceMuted ?? '#6E6A64', dark), landHex),
        roadBase: toHex(semantic.color.surfaceVariant.default ?? '#DCD4CB', landHex),
        localRoad: toHex(semantic.color.surface.default ?? '#E7E1DA', landHex),
        arterial: toHex(borderColor ?? '#BEB5AB', landHex),
        border: toHex(borderColor ?? '#C6BDB3', landHex),
        text: toHex(onSurfaceDefault ?? '#1C1B1A', landHex),
        textMuted: toHex(onSurfaceMuted ?? '#6E6A64', landHex),
        water: '#C9CED3',
      }

  const primary = primaryColor ?? '#B87333'

  // In dark mode, text strokes need a wider halo to create contrast against
  // dark geometry. A thin stroke in light mode is fine since light backgrounds
  // already provide contrast.
  const labelStroke = dark ? '#2A2623' : palette.land
  const labelStrokeWeight = dark ? 3 : 1

  return [
    // Global labels — baseline for all text on the map.
    {
      elementType: 'labels.text.fill',
      stylers: [{ color: palette.text }],
    },
    {
      elementType: 'labels.text.stroke',
      stylers: [{ color: labelStroke }, { weight: labelStrokeWeight }],
    },
    // Base land
    {
      elementType: 'geometry',
      stylers: [{ color: palette.land }],
    },
    // -----------------------------------------------------------------------
    // Administrative labels — cities, neighborhoods, counties
    // -----------------------------------------------------------------------
    {
      featureType: 'administrative',
      elementType: 'geometry.stroke',
      stylers: [{ color: palette.border }],
    },
    // City / town names — full brightness
    {
      featureType: 'administrative.locality',
      elementType: 'labels.text.fill',
      stylers: [{ color: palette.text }],
    },
    {
      featureType: 'administrative.locality',
      elementType: 'labels.text.stroke',
      stylers: [{ color: labelStroke }, { weight: labelStrokeWeight + 1 }],
    },
    // Neighborhood names (e.g. NORTH BEACH, CHINATOWN, NOB HILL)
    {
      featureType: 'administrative.neighborhood',
      elementType: 'labels.text.fill',
      stylers: [{ color: palette.textMuted }],
    },
    {
      featureType: 'administrative.neighborhood',
      elementType: 'labels.text.stroke',
      stylers: [{ color: labelStroke }, { weight: labelStrokeWeight }],
    },
    // -----------------------------------------------------------------------
    // POIs — museums, parks, landmarks
    // -----------------------------------------------------------------------
    {
      featureType: 'poi',
      elementType: 'labels.text.fill',
      stylers: [{ color: palette.poiText }],
    },
    {
      featureType: 'poi',
      elementType: 'labels.text.stroke',
      stylers: [{ color: labelStroke }, { weight: labelStrokeWeight }],
    },
    // -----------------------------------------------------------------------
    // Roads
    // -----------------------------------------------------------------------
    // Roads - default (base for all road types)
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
      stylers: [{ color: labelStroke }, { weight: labelStrokeWeight }],
    },
    // Roads - local
    {
      featureType: 'road.local',
      elementType: 'geometry',
      stylers: [{ color: palette.localRoad }],
    },
    // Roads - arterial
    {
      featureType: 'road.arterial',
      elementType: 'geometry',
      stylers: [{ color: palette.arterial }],
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
    // -----------------------------------------------------------------------
    // Transit
    // -----------------------------------------------------------------------
    {
      featureType: 'transit',
      elementType: 'geometry',
      stylers: [{ color: palette.poiSurface }],
    },
    // -----------------------------------------------------------------------
    // Water
    // -----------------------------------------------------------------------
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
    {
      featureType: 'water',
      elementType: 'labels.text.stroke',
      stylers: [{ color: labelStroke }, { weight: labelStrokeWeight }],
    },
  ]
}
