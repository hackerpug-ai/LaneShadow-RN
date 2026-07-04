import type { StyleProp, ViewStyle } from 'react-native'
import { StyleSheet, Text, View } from 'react-native'
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg'
import { getTheme } from '../../styles/theme'

export type MapLoadingTheme = 'light' | 'dark'

type MapLoadingPalette = {
  background: string
  water: string
  contour: string
  contourSoft: string
  road: string
  roadSoft: string
  route: string
  routeHalo: string
  markerRing: string
  markerCore: string
  markerTick: string
  label: string
  statusBg: string
  statusBorder: string
  dot: string
}

const MAP_LOADING_THEME_INK: Record<
  MapLoadingTheme,
  Pick<
    MapLoadingPalette,
    | 'water'
    | 'contour'
    | 'contourSoft'
    | 'road'
    | 'roadSoft'
    | 'routeHalo'
    | 'markerRing'
    | 'markerTick'
  >
> = {
  light: {
    water: '#C9CED3',
    contour: 'rgba(104, 112, 93, 0.24)',
    contourSoft: 'rgba(104, 112, 93, 0.13)',
    road: 'rgba(113, 103, 94, 0.26)',
    roadSoft: 'rgba(113, 103, 94, 0.16)',
    routeHalo: 'rgba(184, 115, 51, 0.16)',
    markerRing: 'rgba(184, 115, 51, 0.22)',
    markerTick: 'rgba(77, 68, 57, 0.48)',
  },
  dark: {
    water: '#1A2026',
    contour: 'rgba(245, 240, 235, 0.17)',
    contourSoft: 'rgba(245, 240, 235, 0.09)',
    road: 'rgba(245, 240, 235, 0.18)',
    roadSoft: 'rgba(245, 240, 235, 0.1)',
    routeHalo: 'rgba(197, 133, 69, 0.2)',
    markerRing: 'rgba(197, 133, 69, 0.28)',
    markerTick: 'rgba(245, 240, 235, 0.52)',
  },
}

const STATUS_DOTS = [0, 1, 2] as const

export type MapLoadingStateProps = {
  theme?: MapLoadingTheme
  style?: StyleProp<ViewStyle>
  testID?: string
}

export const getMapLoadingPalette = (theme: MapLoadingTheme): MapLoadingPalette => {
  const semantic = getTheme(theme === 'dark').semantic
  const ink = MAP_LOADING_THEME_INK[theme]

  return {
    ...ink,
    background: semantic.color.background.default,
    route: semantic.color.primary.default,
    markerCore: semantic.color.surface.default,
    label: semantic.color.onSurface.muted ?? semantic.color.onSurface.default,
    statusBg: semantic.color.surface.glass ?? semantic.color.surface.default,
    statusBorder: semantic.color.border.glass ?? semantic.color.border.default,
    dot: semantic.color.primary.hover ?? semantic.color.primary.default,
  }
}

export const MapLoadingState = ({
  theme = 'light',
  style,
  testID = 'map-loading-state',
}: MapLoadingStateProps) => {
  const palette = getMapLoadingPalette(theme)

  return (
    <View
      accessibilityLabel="Loading map"
      accessibilityRole="progressbar"
      testID={testID}
      style={[styles.container, { backgroundColor: palette.background }, style]}
    >
      <Svg
        pointerEvents="none"
        width="100%"
        height="100%"
        viewBox="0 0 390 844"
        preserveAspectRatio="xMidYMid slice"
        testID={`${testID}-sheet`}
      >
        <Rect x="0" y="0" width="390" height="844" fill={palette.background} />
        <Path
          d="M0 0 H390 V146 C322 132 276 96 214 78 C145 58 75 66 0 104 Z"
          fill={palette.water}
        />
        <Path
          d="M-58 158 C34 80 136 82 226 150 S410 242 492 152"
          stroke={palette.contourSoft}
          strokeWidth={2}
          fill="none"
        />
        <Path
          d="M-80 222 C24 132 142 138 248 226 S472 346 574 228"
          stroke={palette.contour}
          strokeWidth={2}
          fill="none"
        />
        <Path
          d="M-96 302 C18 214 154 214 274 310 S520 458 642 314"
          stroke={palette.contourSoft}
          strokeWidth={2}
          fill="none"
        />
        <Path
          d="M-120 404 C10 304 166 306 302 420 S576 596 712 420"
          stroke={palette.contour}
          strokeWidth={2}
          fill="none"
        />
        <Path
          d="M-144 532 C0 410 174 420 326 550 S632 738 784 548"
          stroke={palette.contourSoft}
          strokeWidth={2}
          fill="none"
        />

        <Path
          d="M-22 580 C64 538 132 488 198 420 S306 294 414 228"
          stroke={palette.road}
          strokeWidth={4}
          fill="none"
        />
        <Path
          d="M34 802 C102 660 178 514 250 372 S330 150 404 6"
          stroke={palette.roadSoft}
          strokeWidth={3}
          fill="none"
        />
        <Path
          d="M-18 356 C82 332 190 306 396 240"
          stroke={palette.roadSoft}
          strokeWidth={3}
          fill="none"
        />
        <Path
          d="M-32 690 C76 626 180 586 418 520"
          stroke={palette.roadSoft}
          strokeWidth={2}
          fill="none"
        />
        <Path d="M78 0 L78 844" stroke={palette.roadSoft} strokeWidth={1.25} fill="none" />
        <Path d="M154 0 L154 844" stroke={palette.roadSoft} strokeWidth={1.25} fill="none" />
        <Path d="M232 0 L232 844" stroke={palette.roadSoft} strokeWidth={1.25} fill="none" />
        <Path d="M310 0 L310 844" stroke={palette.roadSoft} strokeWidth={1.25} fill="none" />

        <Path
          d="M38 626 C88 570 118 520 176 486 S262 428 286 364 S326 274 370 236"
          stroke={palette.routeHalo}
          strokeWidth={15}
          strokeLinecap="round"
          fill="none"
        />
        <Path
          testID={`${testID}-route`}
          d="M38 626 C88 570 118 520 176 486 S262 428 286 364 S326 274 370 236"
          stroke={palette.route}
          strokeWidth={4}
          strokeDasharray="2 13"
          strokeLinecap="round"
          fill="none"
        />
      </Svg>

      <View pointerEvents="none" testID={`${testID}-beacon`} style={styles.beacon}>
        <View style={[styles.beaconHalo, { borderColor: palette.markerRing }]} />
        <View
          style={[
            styles.beaconOuter,
            { borderColor: palette.route, backgroundColor: palette.markerRing },
          ]}
        >
          <View style={[styles.beaconInner, { backgroundColor: palette.markerCore }]}>
            <View style={[styles.beaconCore, { backgroundColor: palette.route }]} />
          </View>
        </View>
        <LineTicks color={palette.markerTick} />
      </View>

      <View
        pointerEvents="none"
        testID={`${testID}-status`}
        style={[
          styles.status,
          { backgroundColor: palette.statusBg, borderColor: palette.statusBorder },
        ]}
      >
        <Text style={[styles.statusText, { color: palette.label }]}>Drawing the map</Text>
        <View
          style={styles.dots}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {STATUS_DOTS.map((dot) => (
            <View
              key={dot}
              style={[styles.dot, { backgroundColor: palette.dot, opacity: 1 - dot * 0.22 }]}
            />
          ))}
        </View>
      </View>
    </View>
  )
}

const LineTicks = ({ color }: { color: string }) => (
  <Svg pointerEvents="none" width={96} height={96} viewBox="0 0 96 96" style={styles.ticks}>
    <Circle
      cx="48"
      cy="48"
      r="34"
      stroke={color}
      strokeWidth="1.5"
      fill="none"
      strokeDasharray="1 9"
    />
    <Line x1="48" y1="7" x2="48" y2="18" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <Line x1="48" y1="78" x2="48" y2="89" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <Line x1="7" y1="48" x2="18" y2="48" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <Line x1="78" y1="48" x2="89" y2="48" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </Svg>
)

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
  },
  beacon: {
    alignItems: 'center',
    height: 96,
    justifyContent: 'center',
    left: '50%',
    marginLeft: -48,
    marginTop: -48,
    position: 'absolute',
    top: '47%',
    width: 96,
  },
  beaconHalo: {
    borderRadius: 44,
    borderWidth: 1,
    height: 88,
    position: 'absolute',
    width: 88,
  },
  beaconOuter: {
    alignItems: 'center',
    borderRadius: 28,
    borderWidth: 2,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  beaconInner: {
    alignItems: 'center',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  beaconCore: {
    borderRadius: 7,
    height: 14,
    width: 14,
  },
  ticks: {
    position: 'absolute',
  },
  status: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: 24,
    paddingHorizontal: 14,
    paddingVertical: 8,
    position: 'absolute',
    top: '54%',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  dots: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    borderRadius: 3,
    height: 6,
    width: 6,
  },
})
