/**
 * ScoreDimensionBar primitive + CompositeScoreHeadline.
 *
 * Pure presentational component (props in, JSX out):
 *  - NO useQuery / Convex hooks — scores arrive as props
 *  - NO Map / navigation
 *  - NO animation (static for Sprint 02)
 *
 * Tokens (canonical):
 *  - Fill color:     semantic.color.primary.default  (#EE7C2B copper)
 *  - Track color:    semantic.color.secondary.default (inset-substitute — see note)
 *  - Pill radius:    semantic.radius.full             (9999)
 *  - Bar height:     semantic.space.sm                (8 — corresponds to spacing.3)
 *  - Between bars:   semantic.space.sm                (8)
 *  - Headline gap:   semantic.space.md                (12 — corresponds to spacing.4)
 *  - Label type:     semantic.type.label.sm
 *  - Headline type:  semantic.type.title.lg
 *  - Content color:  semantic.color.onSurface.default (canonical substitute for "content.primary")
 *  - Secondary text: semantic.color.onSurface.subtle  (canonical substitute for "content.secondary")
 *
 * Token-mapping assumption: the contract referenced `surface.inset` for the
 * track color, but that token does NOT exist in `tokens/semantic/semantic.tokens.json`.
 * The existing Progress primitive (components/ui/progress.tsx) uses
 * `semantic.color.secondary.default` as its track background — by the Rule of 2
 * we reuse the same token to avoid divergence.
 *
 * Design ref: .spec/prds/mvp/06-uc-dtl.md#uc-dtl-02
 */

import { useMemo } from 'react'
import type { DimensionValue, ViewStyle } from 'react-native'
import { StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'

import { useSemanticTheme } from '../../hooks/use-semantic-theme'

// ─── Types ───────────────────────────────────────────────────────────────────

/**
 * One score dimension (e.g. scenic, curvature). `score` is a 0-1 float (as
 * returned by getCuratedRouteDetail — NEVER pre-scaled to 0-100). Null/undefined
 * signals "no score for this dimension".
 */
export type ScoreDimension = {
  key: string
  label: string
  score: number | null | undefined
}

export type ScoreDimensionBarProps = {
  dimension: ScoreDimension
  /**
   * Optional testID override. When omitted, defaults to `score-bar-{dimension.key}`
   * so callers can refer to stable per-row testIDs without explicitly passing them.
   */
  testID?: string
}

export type CompositeScoreHeadlineProps = {
  /** Composite 0-1 score. Null/undefined renders nothing. */
  compositeScore: number | null | undefined
  testID?: string
}

export type ScoreDimensionBarSectionProps = {
  /** Composite 0-1 score for the headline. Null/undefined → no headline. */
  compositeScore: number | null | undefined
  /** Ordered dimensions; rendered in array order. */
  dimensions: ScoreDimension[]
  /** Small label rendered beside/below the headline (e.g. "Estimated"). */
  subtitle?: string
  /** Methodology disclosure rendered below the bars in onSurface.subtle. */
  disclaimer?: string
}

// ─── Pure helper (AC-2) ──────────────────────────────────────────────────────

/**
 * Sentinel returned by scoreToPercent when a score is missing — signals
 * "omit this row/headline entirely" to the renderer. We use `null` (rather than
 * a branded symbol) because it survives JSON serialization in snapshots and is
 * ergonomic at call sites: `scoreToPercent(s) ?? 0`.
 */
export const OMIT_SENTINEL: null = null

/**
 * Convert a 0-1 score to a 0-100 integer percent.
 * Returns OMIT_SENTINEL when the score is null/undefined (graceful omission).
 *
 * Pure closed-form arithmetic — no side effects, no I/O.
 */
export function scoreToPercent(score: number | null | undefined): number | null {
  if (score == null) return OMIT_SENTINEL
  return Math.round(score * 100)
}

// ─── CompositeScoreHeadline ─────────────────────────────────────────────────

/**
 * Renders the composite headline as exactly "NN/100".
 * Above the bars in the section; uses semantic.type.title.lg + content.primary.
 */
export const CompositeScoreHeadline = ({
  compositeScore,
  testID = 'score-composite-headline',
}: CompositeScoreHeadlineProps): React.ReactNode => {
  const { semantic } = useSemanticTheme()
  const percent = scoreToPercent(compositeScore)

  if (percent == null) return null

  const text = `${percent}/100`

  return (
    <Text
      testID={testID}
      style={[semantic.type.title.lg, { color: semantic.color.onSurface.default }]}
    >
      {text}
    </Text>
  )
}

// ─── ScoreDimensionBar (single row) ─────────────────────────────────────────

/**
 * One labeled bar row: label (left) + inset track with copper fill + percent (right).
 * Display-only — no onPress. minHeight 44 reserves a future tap affordance
 * without triggering layout reflow when interaction is added later.
 */
export const ScoreDimensionBar = ({
  dimension,
  testID,
}: ScoreDimensionBarProps): React.ReactNode => {
  const { semantic } = useSemanticTheme()
  const percent = scoreToPercent(dimension.score)

  const rowTestID = testID ?? `score-bar-${dimension.key}`

  // Fill width is ALWAYS derived from Math.round(score*100) — never hard-coded.
  // Null score → 0% (but rows with null scores are filtered upstream by the
  // section, so the only way to reach here with null is direct use of
  // ScoreDimensionBar; we render an empty track rather than crashing).
  const fillWidth: DimensionValue = `${percent ?? 0}%`

  const trackStyle: ViewStyle = {
    height: semantic.space.sm,
    borderRadius: semantic.radius.full,
    backgroundColor: semantic.color.secondary.default,
  }

  const fillStyle: ViewStyle = {
    width: fillWidth,
    height: '100%',
    borderRadius: semantic.radius.full,
    backgroundColor: semantic.color.primary.default,
  }

  return (
    <View testID={rowTestID} style={[styles.row, { minHeight: semantic.control.minHeight }]}>
      <Text
        numberOfLines={1}
        style={[
          semantic.type.label.sm,
          styles.label,
          { minWidth: LABEL_MIN_WIDTH, color: semantic.color.onSurface.subtle },
        ]}
      >
        {dimension.label}
      </Text>

      <View style={[styles.trackWrap, trackStyle]} testID={`${rowTestID}-track`}>
        <View style={fillStyle} testID={`${rowTestID}-fill`} />
      </View>

      <Text
        style={[
          semantic.type.label.sm,
          styles.percent,
          { color: semantic.color.onSurface.default },
        ]}
      >
        {percent ?? 0}%
      </Text>
    </View>
  )
}

// ─── ScoreDimensionBarSection ───────────────────────────────────────────────

/**
 * Headline + the 5 dimension bars. Pure — props in, JSX out.
 *
 * Null-omission contract: if the composite score AND every dimension score are
 * null/undefined, render NOTHING (return null) so the caller's layout does not
 * collapse. Individual null dimensions are filtered from the rendered row list
 * (the section survives partial nullity).
 */
export const ScoreDimensionBarSection = ({
  compositeScore,
  dimensions,
  subtitle,
  disclaimer,
}: ScoreDimensionBarSectionProps): React.ReactNode => {
  const { semantic } = useSemanticTheme()

  // Renderable rows = dimensions that actually have a score. We do NOT mutate
  // the caller's array.
  const renderableDimensions = useMemo(
    () => dimensions.filter((d) => d.score != null),
    [dimensions],
  )

  // Full null-omission: no headline AND no renderable bars → render nothing.
  if (compositeScore == null && renderableDimensions.length === 0) {
    return null
  }

  return (
    <View style={[styles.section, { gap: semantic.space.sm }]}>
      <View style={[styles.headlineRow, { gap: semantic.space.sm, alignItems: 'center' }]}>
        <CompositeScoreHeadline compositeScore={compositeScore} />
        {subtitle ? (
          <Text
            style={[
              semantic.type.label.sm,
              {
                color: semantic.color.onSurface.subtle,
                fontStyle: 'italic',
              },
            ]}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={{ gap: semantic.space.md }}>
        {renderableDimensions.map((dim) => (
          <ScoreDimensionBar key={dim.key} dimension={dim} />
        ))}
      </View>
      {disclaimer ? (
        <Text
          style={[
            semantic.type.body.sm,
            {
              color: semantic.color.onSurface.subtle,
              fontStyle: 'italic',
            },
          ]}
        >
          {disclaimer}
        </Text>
      ) : null}
    </View>
  )
}

// ─── Constants & styles ─────────────────────────────────────────────────────

/** Label left column reserves 80dp so percent values align column-wise. */
const LABEL_MIN_WIDTH = 80

const styles = StyleSheet.create({
  section: {
    width: '100%',
  },
  headlineRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  label: {
    marginRight: 8,
  },
  trackWrap: {
    flex: 1,
    overflow: 'hidden',
  },
  percent: {
    marginLeft: 8,
    fontVariant: ['tabular-nums'],
  },
})
