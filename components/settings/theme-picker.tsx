import { Pressable, StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import { IconSymbol } from '../ui/icon-symbol'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { useSettingsStore } from '../../stores/settings-store'

/**
 * Hardcoded preview colors extracted from theme.ts so the cards
 * always show what the target mode looks like, regardless of
 * the currently active theme.
 */
const PREVIEW = {
  light: {
    bg: '#F5F0EB',
    surface: '#F7F3EF',
    text: '#1E1E1E',
    muted: '#6B7280',
    border: '#D9D0C7',
    accent: '#B87333',
  },
  dark: {
    bg: '#1B1715',
    surface: '#2B2725',
    text: 'rgba(255,255,255,0.92)',
    muted: 'rgba(255,255,255,0.55)',
    border: '#3A3431',
    accent: '#B87333',
  },
} as const

type ThemeMode = 'light' | 'dark' | 'auto'

const OPTIONS: { value: ThemeMode; label: string; icon: 'white-balance-sunny' | 'moon-waning-crescent' | 'theme-light-dark' }[] = [
  { value: 'light', label: 'Light', icon: 'white-balance-sunny' },
  { value: 'dark', label: 'Dark', icon: 'moon-waning-crescent' },
  { value: 'auto', label: 'System', icon: 'theme-light-dark' },
]

/**
 * Mini phone silhouette showing a preview of what the theme looks like.
 * Renders fake UI elements (status bar, header, content lines, nav bar)
 * using the target theme's actual color values.
 */
const PhonePreview = ({ variant }: { variant: 'light' | 'dark' }) => {
  const p = PREVIEW[variant]

  return (
    <View style={[previewStyles.phone, { backgroundColor: p.bg, borderColor: p.border }]}>
      {/* Status bar dots */}
      <View style={previewStyles.statusBar}>
        <View style={[previewStyles.statusDot, { backgroundColor: p.muted }]} />
        <View style={[previewStyles.statusDot, { backgroundColor: p.muted }]} />
        <View style={[previewStyles.statusDot, { backgroundColor: p.muted }]} />
      </View>

      {/* Header bar */}
      <View style={[previewStyles.headerBar, { backgroundColor: p.surface }]}>
        <View style={[previewStyles.headerLine, { backgroundColor: p.text, width: 24 }]} />
      </View>

      {/* Content area */}
      <View style={previewStyles.contentArea}>
        <View style={[previewStyles.contentLine, { backgroundColor: p.text, width: '80%' }]} />
        <View style={[previewStyles.contentLine, { backgroundColor: p.muted, width: '60%' }]} />
        <View style={[previewStyles.accentBar, { backgroundColor: p.accent }]} />
        <View style={[previewStyles.contentLine, { backgroundColor: p.muted, width: '50%' }]} />
      </View>

      {/* Bottom nav */}
      <View style={[previewStyles.navBar, { backgroundColor: p.surface, borderTopColor: p.border }]}>
        <View style={[previewStyles.navDot, { backgroundColor: p.accent }]} />
        <View style={[previewStyles.navDot, { backgroundColor: p.muted }]} />
        <View style={[previewStyles.navDot, { backgroundColor: p.muted }]} />
      </View>
    </View>
  )
}

/**
 * The "auto" card shows a split-screen preview — left half light, right half dark —
 * to communicate "follows your device".
 */
const SplitPreview = () => {
  const l = PREVIEW.light
  const d = PREVIEW.dark

  return (
    <View style={previewStyles.phone}>
      <View style={previewStyles.splitContainer}>
        {/* Light half */}
        <View style={[previewStyles.splitHalf, { backgroundColor: l.bg, borderColor: l.border, borderRightWidth: 0, borderTopLeftRadius: 10, borderBottomLeftRadius: 10 }]}>
          <View style={[previewStyles.splitLine, { backgroundColor: l.text, width: 14 }]} />
          <View style={[previewStyles.splitLine, { backgroundColor: l.muted, width: 10 }]} />
          <View style={[previewStyles.splitAccent, { backgroundColor: l.accent }]} />
        </View>
        {/* Dark half */}
        <View style={[previewStyles.splitHalf, { backgroundColor: d.bg, borderColor: d.border, borderLeftWidth: 0, borderTopRightRadius: 10, borderBottomRightRadius: 10 }]}>
          <View style={[previewStyles.splitLine, { backgroundColor: d.text, width: 14 }]} />
          <View style={[previewStyles.splitLine, { backgroundColor: d.muted, width: 10 }]} />
          <View style={[previewStyles.splitAccent, { backgroundColor: d.accent }]} />
        </View>
      </View>
    </View>
  )
}

export const ThemePicker = ({ testID }: { testID?: string }) => {
  const { semantic } = useSemanticTheme()
  const { themeMode, setThemeMode } = useSettingsStore()
  const mode = themeMode

  return (
    <View testID={testID} style={[styles.container, { gap: semantic.space.md }]}>
      <Text
        variant="labelLarge"
        style={{
          color: semantic.color.onSurface.muted,
          textTransform: 'uppercase',
          letterSpacing: 1,
        }}
      >
        Appearance
      </Text>

      <View style={[styles.grid, { gap: semantic.space.md }]}>
        {OPTIONS.map((option) => {
          const selected = mode === option.value

          return (
            <Pressable
              key={option.value}
              onPress={() => setThemeMode(option.value)}
              testID={`theme-option-${option.value}`}
              style={({ pressed }) => [
                styles.card,
                {
                  backgroundColor: semantic.color.surface.default,
                  borderRadius: semantic.radius.lg,
                  borderWidth: 2,
                  borderColor: selected
                    ? semantic.color.primary.default
                    : semantic.color.border.default,
                  padding: semantic.space.md,
                  opacity: pressed ? 0.85 : 1,
                },
                selected && {
                  shadowColor: '#B87333',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.35,
                  shadowRadius: 8,
                  elevation: 4,
                },
              ]}
            >
              {/* Phone preview */}
              <View style={[styles.previewWrap, { marginBottom: semantic.space.sm }]}>
                {option.value === 'auto' ? (
                  <SplitPreview />
                ) : (
                  <PhonePreview variant={option.value} />
                )}
              </View>

              {/* Label row */}
              <View style={styles.labelRow}>
                <IconSymbol
                  name={option.icon}
                  size={16}
                  color={
                    selected
                      ? semantic.color.primary.default
                      : semantic.color.onSurface.muted
                  }
                />
                <Text
                  variant="labelMedium"
                  style={{
                    marginLeft: semantic.space.xs,
                    color: selected
                      ? semantic.color.primary.default
                      : semantic.color.onSurface.default,
                    fontWeight: selected ? '700' : '500',
                  }}
                >
                  {option.label}
                </Text>
              </View>

              {/* Selection indicator */}
              {selected && (
                <View
                  style={[
                    styles.checkBadge,
                    {
                      backgroundColor: semantic.color.primary.default,
                      top: semantic.space.xs,
                      right: semantic.space.xs,
                    },
                  ]}
                >
                  <IconSymbol name="check" size={10} color="#FFFFFF" />
                </View>
              )}
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {},
  grid: {
    flexDirection: 'row',
  },
  card: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  previewWrap: {
    width: '100%',
    alignItems: 'center',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBadge: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
})

const previewStyles = StyleSheet.create({
  phone: {
    width: 62,
    height: 96,
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 4,
    paddingTop: 3,
    gap: 2,
  },
  statusDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  headerBar: {
    height: 10,
    marginHorizontal: 3,
    marginTop: 3,
    borderRadius: 2,
    justifyContent: 'center',
    paddingLeft: 4,
  },
  headerLine: {
    height: 2,
    borderRadius: 1,
  },
  contentArea: {
    flex: 1,
    paddingHorizontal: 5,
    paddingTop: 5,
    gap: 4,
  },
  contentLine: {
    height: 2,
    borderRadius: 1,
  },
  accentBar: {
    height: 6,
    width: '70%',
    borderRadius: 2,
    marginVertical: 1,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 4,
    borderTopWidth: 0.5,
  },
  navDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  splitContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  splitHalf: {
    flex: 1,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  splitLine: {
    height: 2,
    borderRadius: 1,
  },
  splitAccent: {
    height: 4,
    width: 16,
    borderRadius: 2,
    marginTop: 2,
  },
})
