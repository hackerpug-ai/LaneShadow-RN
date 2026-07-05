/**
 * Integration tests for ScoreDimensionBar + ScoreDimensionBarSection (AC-1).
 *
 * Acceptance Criteria:
 * - AC-1 (PRIMARY — integration tier):
 *   GIVEN a real getCuratedRouteDetail payload shape (compositeScore 0.81,
 *         5 dimensions with 0-1 scores) passed as props
 *   WHEN the section renders
 *   THEN headline text == '81/100'
 *        AND each bar fill width == `${Math.round(score*100)}%`
 *        (scenic 74%, curvature 62%, technical 55%, traffic 30%, remoteness 88%)
 *   AND when all dimension scores AND compositeScore are null/undefined,
 *        the section renders NOTHING (null omission — caller layout does not
 *        collapse).
 *
 * This is a pure presentational component — the payload is passed as props,
 * NOT fetched. No Convex client mocking is needed; the test runs in jsdom.
 */

import { render, within } from '@testing-library/react-native'
import { MD3DarkTheme, PaperProvider } from 'react-native-paper'
import { describe, expect, it, vi } from 'vitest'

import type { ExtendedTheme } from '../../../styles/types'
import { ScoreDimensionBar, ScoreDimensionBarSection } from '../score-dimension-bar'

// ---------------------------------------------------------------------------
// Mock semantic theme — deterministic values so assertions on style are stable
// ---------------------------------------------------------------------------

const mockSemanticTheme: ExtendedTheme['semantic'] = {
  color: {
    primary: { default: '#EE7C2B' },
    secondary: { default: '#F2EFED' },
    tertiary: { default: '#3A8BE3' },
    success: { default: '#4D8470' },
    warning: { default: '#C46F1B' },
    warningContainer: { default: '#FCE8D4' },
    onWarningContainer: { default: '#1E1A16' },
    danger: { default: '#C9423C' },
    info: { default: '#3A8BE3' },
    surface: { default: '#F8F7F6' },
    surfaceVariant: { default: '#FDFBF8' },
    background: { default: '#F8F7F6' },
    onSurface: {
      default: '#1E1A16',
      muted: '#49454F',
      subtle: '#79747E',
      disabled: '#9CA3AF',
    },
    onPrimary: { default: '#FFFFFF' },
    onSecondary: { default: '#49454F' },
    secondaryContainer: { default: '#F9D5B5' },
    onSecondaryContainer: { default: '#1E1A16', muted: '#49454F', subtle: '#79747E' },
    border: { default: '#E5DED9' },
    input: { default: '#F2EFED' },
    ring: { default: '#EE7C2B' },
    card: { default: '#FDFBF8' },
    popover: { default: '#FDFBF8' },
    accent: { default: '#EE7C2B' },
    orange: { default: '#EE7C2B' },
    muted: { default: '#F2EFED' },
    divider: { default: '#EDE7E1' },
    scrim: { default: 'rgba(34,24,16,0.35)' },
    routeSelected: { default: '#EE7C2B' },
    routeAlternate: { default: '#4D8470' },
  },
  space: {
    xs: 4,
    sm: 8, // spacing.3 → ~8dp bar height + between-bars rhythm
    md: 12, // spacing.4 → ~12dp headline-to-first-bar gap
    lg: 16,
    xl: 24,
    '2xl': 32,
    '3xl': 48,
    '4xl': 64,
  },
  radius: {
    none: 0,
    sm: 6,
    md: 10,
    lg: 14,
    xl: 20,
    '2xl': 32,
    full: 9999, // pill
  },
  type: {
    label: {
      sm: { fontSize: 9, lineHeight: 9, fontWeight: '600' as const },
      md: { fontSize: 10, lineHeight: 10, fontWeight: '600' as const },
      lg: { fontSize: 11, lineHeight: 11, fontWeight: '500' as const },
    },
    body: {
      sm: { fontSize: 11, lineHeight: 16, fontWeight: '400' as const },
      md: { fontSize: 12, lineHeight: 18, fontWeight: '400' as const },
      lg: { fontSize: 14, lineHeight: 21, fontWeight: '400' as const },
    },
    title: {
      sm: { fontSize: 12, lineHeight: 15, fontWeight: '600' as const },
      md: { fontSize: 14, lineHeight: 18, fontWeight: '600' as const },
      lg: { fontSize: 17, lineHeight: 21, fontWeight: '600' as const },
    },
    heading: {
      sm: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const },
      md: { fontSize: 17, lineHeight: 22, fontWeight: '400' as const },
      lg: { fontSize: 22, lineHeight: 26, fontWeight: '400' as const },
    },
    display: {
      sm: { fontSize: 17, lineHeight: 22, fontWeight: '400' as const },
      md: { fontSize: 22, lineHeight: 26, fontWeight: '400' as const },
      lg: { fontSize: 30, lineHeight: 34, fontWeight: '400' as const },
    },
  },
  elevation: {
    0: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    1: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.18,
      shadowRadius: 3,
      elevation: 1,
    },
    2: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.21,
      shadowRadius: 6,
      elevation: 2,
    },
    3: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.24,
      shadowRadius: 9,
      elevation: 3,
    },
    4: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.27,
      shadowRadius: 12,
      elevation: 4,
    },
    5: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.3,
      shadowRadius: 15,
      elevation: 5,
    },
  },
  control: { minTouchTarget: 44, minHeight: 44 },
  opacity: { pressed: 0.7, disabled: 0.38 },
  borderWidth: { thin: 1 },
}

vi.mock('../../../hooks/use-semantic-theme', () => ({
  useSemanticTheme: () => ({ semantic: mockSemanticTheme }),
}))

// ---------------------------------------------------------------------------
// Render helper
// ---------------------------------------------------------------------------

const renderWithPaper = (ui: React.ReactElement) =>
  render(<PaperProvider theme={MD3DarkTheme}>{ui}</PaperProvider>)

// ---------------------------------------------------------------------------
// Fixtures — real getCuratedRouteDetail payload shape, passed as props
// (compositeScore 0.81; curvature 0.62; scenic 0.74; technical 0.55;
//  traffic 0.30; remoteness 0.88)
// ---------------------------------------------------------------------------

const ROUTE_DETAIL_PAYLOAD = {
  compositeScore: 0.81,
  dimensions: [
    { key: 'curvature', label: 'Curvature', score: 0.62 },
    { key: 'scenic', label: 'Scenic', score: 0.74 },
    { key: 'technical', label: 'Technical', score: 0.55 },
    { key: 'traffic', label: 'Traffic', score: 0.3 },
    { key: 'remoteness', label: 'Remoteness', score: 0.88 },
  ],
} as const

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ScoreDimensionBarSection (AC-1)', () => {
  describe('headline', () => {
    it('renders composite headline as "81/100" for compositeScore 0.81', () => {
      const { getByTestId } = renderWithPaper(
        <ScoreDimensionBarSection {...ROUTE_DETAIL_PAYLOAD} />,
      )

      const headline = getByTestId('score-composite-headline')
      expect(headline.props.children).toBe('81/100')
    })

    it('omits the headline when compositeScore is null', () => {
      const { queryByTestId } = renderWithPaper(
        <ScoreDimensionBarSection
          compositeScore={null}
          dimensions={ROUTE_DETAIL_PAYLOAD.dimensions}
        />,
      )

      expect(queryByTestId('score-composite-headline')).toBeNull()
    })
  })

  describe('bar fill widths track Math.round(score*100)%', () => {
    const cases: Array<[string, number, string]> = [
      ['curvature', 0.62, '62%'],
      ['scenic', 0.74, '74%'],
      ['technical', 0.55, '55%'],
      ['traffic', 0.3, '30%'],
      ['remoteness', 0.88, '88%'],
    ]

    it.each(cases)('renders %s bar fill width === %s (score %s)', (key, _score, expectedWidth) => {
      const { getByTestId } = renderWithPaper(
        <ScoreDimensionBarSection {...ROUTE_DETAIL_PAYLOAD} />,
      )

      const fill = getByTestId(`score-bar-${key}-fill`)
      // Width must be a percentage string derived from Math.round(score*100),
      // NEVER a hard-coded literal in the component.
      expect(fill.props.style.width).toBe(expectedWidth)
    })
  })

  describe('bar rows expose stable testIDs and labels', () => {
    it('renders one row per dimension with testID score-bar-{key}', () => {
      const { getByTestId } = renderWithPaper(
        <ScoreDimensionBarSection {...ROUTE_DETAIL_PAYLOAD} />,
      )

      for (const dim of ROUTE_DETAIL_PAYLOAD.dimensions) {
        expect(getByTestId(`score-bar-${dim.key}`)).toBeTruthy()
      }
    })

    it.each([
      ['curvature', 'Curvature', '62%'],
      ['scenic', 'Scenic', '74%'],
      ['technical', 'Technical', '55%'],
      ['traffic', 'Traffic', '30%'],
      ['remoteness', 'Remoteness', '88%'],
    ])('renders %s row with label "%s" and percent "%s"', (key, label, percent) => {
      const { getByTestId } = renderWithPaper(
        <ScoreDimensionBarSection {...ROUTE_DETAIL_PAYLOAD} />,
      )

      const row = getByTestId(`score-bar-${key}`)
      const labelNode = within(row).getByText(label)
      const percentNode = within(row).getByText(percent)

      expect(labelNode).toBeTruthy()
      expect(percentNode).toBeTruthy()
    })
  })

  describe('token compliance — fill uses copper, track uses inset-substitute', () => {
    it('uses semantic.color.primary.default (#EE7C2B) for the fill', () => {
      const { getByTestId } = renderWithPaper(
        <ScoreDimensionBarSection {...ROUTE_DETAIL_PAYLOAD} />,
      )

      const fill = getByTestId('score-bar-scenic-fill')
      expect(fill.props.style.backgroundColor).toBe('#EE7C2B')
    })

    it('uses the inset-substitute token (secondary.default) for the track', () => {
      const { getByTestId } = renderWithPaper(
        <ScoreDimensionBarSection {...ROUTE_DETAIL_PAYLOAD} />,
      )

      const track = getByTestId('score-bar-scenic-track')
      // Assumption: surface.inset token absent in semantic.tokens.json; using
      // secondary.default (matches existing Progress primitive's track pattern — Rule of 2).
      // RN may flatten styles into an array — read via helper.
      expect(readStyleProp(track.props.style, 'backgroundColor')).toBe('#F2EFED')
    })

    it('uses semantic.radius.full (9999) for the fill (pill)', () => {
      const { getByTestId } = renderWithPaper(
        <ScoreDimensionBarSection {...ROUTE_DETAIL_PAYLOAD} />,
      )

      const fill = getByTestId('score-bar-scenic-fill')
      expect(fill.props.style.borderRadius).toBe(9999)
    })
  })

  describe('graceful null-omission (renders nothing when all scores null)', () => {
    it('returns null when compositeScore is null AND every dimension score is null', () => {
      const { queryByTestId, toJSON } = renderWithPaper(
        <ScoreDimensionBarSection
          compositeScore={null}
          dimensions={[
            { key: 'curvature', label: 'Curvature', score: null },
            { key: 'scenic', label: 'Scenic', score: null },
            { key: 'technical', label: 'Technical', score: null },
            { key: 'traffic', label: 'Traffic', score: null },
            { key: 'remoteness', label: 'Remoteness', score: null },
          ]}
        />,
      )

      // No headline
      expect(queryByTestId('score-composite-headline')).toBeNull()
      // No bars
      for (const key of ['curvature', 'scenic', 'technical', 'traffic', 'remoteness']) {
        expect(queryByTestId(`score-bar-${key}`)).toBeNull()
      }
      // Renders nothing visible — caller layout does not collapse.
      // toJSON() returns the wrapper PaperProvider View; its children must be empty/null.
      const tree = toJSON()
      const wrapperChildren = (tree as { children?: unknown })?.children
      expect(wrapperChildren == null || isEmptyRender(wrapperChildren)).toBe(true)
    })

    it('returns null when compositeScore is undefined AND every dimension score is undefined', () => {
      const { queryByTestId } = renderWithPaper(
        <ScoreDimensionBarSection
          compositeScore={undefined}
          dimensions={[
            { key: 'curvature', label: 'Curvature', score: undefined },
            { key: 'scenic', label: 'Scenic', score: undefined },
          ]}
        />,
      )

      expect(queryByTestId('score-composite-headline')).toBeNull()
      expect(queryByTestId('score-bar-curvature')).toBeNull()
    })

    it('still renders available rows when only SOME dimensions are null (does not collapse entire section)', () => {
      const { getByTestId, queryByTestId } = renderWithPaper(
        <ScoreDimensionBarSection
          compositeScore={0.5}
          dimensions={[
            { key: 'curvature', label: 'Curvature', score: 0.62 },
            { key: 'scenic', label: 'Scenic', score: null }, // omitted at row level
            { key: 'technical', label: 'Technical', score: 0.55 },
          ]}
        />,
      )

      expect(getByTestId('score-composite-headline').props.children).toBe('50/100')
      expect(getByTestId('score-bar-curvature')).toBeTruthy()
      expect(queryByTestId('score-bar-scenic')).toBeNull()
      expect(getByTestId('score-bar-technical')).toBeTruthy()
    })
  })

  describe('ScoreDimensionBar (single row, exported)', () => {
    it('renders the row at the contracted testID by default', () => {
      const { getByTestId } = renderWithPaper(
        <ScoreDimensionBar dimension={{ key: 'scenic', label: 'Scenic', score: 0.74 }} />,
      )

      expect(getByTestId('score-bar-scenic')).toBeTruthy()
    })

    it('renders the row minHeight 44 (future tap affordance — no reflow)', () => {
      const { getByTestId } = renderWithPaper(
        <ScoreDimensionBar dimension={{ key: 'scenic', label: 'Scenic', score: 0.74 }} />,
      )

      const row = getByTestId('score-bar-scenic')
      // Flatten style array (RN passes styles as arrays)
      const minHeight = readStyleProp(row.props.style, 'minHeight')
      expect(minHeight).toBe(44)
    })

    it('label has minWidth 80', () => {
      const { getByTestId } = renderWithPaper(
        <ScoreDimensionBar dimension={{ key: 'scenic', label: 'Scenic', score: 0.74 }} />,
      )

      const row = getByTestId('score-bar-scenic')
      const label = within(row).getByText('Scenic')
      const minWidth = readStyleProp(label.props.style, 'minWidth')
      expect(minWidth).toBe(80)
    })
  })
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * RN style may arrive as an array of objects (StyleSheet.flatten) — read a
 * single key robustly across shapes.
 */
function readStyleProp(style: unknown, key: string): unknown {
  if (style == null) return undefined
  if (Array.isArray(style)) {
    for (const entry of style) {
      const v = readStyleProp(entry, key)
      if (v !== undefined) return v
    }
    return undefined
  }
  if (typeof style === 'object') {
    return (style as Record<string, unknown>)[key]
  }
  return undefined
}

function isEmptyRender(node: unknown): boolean {
  if (node == null) return true
  if (Array.isArray(node)) return node.every(isEmptyRender)
  if (typeof node === 'object' && 'children' in node) {
    return isEmptyRender((node as { children: unknown }).children)
  }
  return false
}
