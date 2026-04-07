/**
 * PlanningBottomSheet
 *
 * Displays a structured timeline of planning events (tool calls and agent
 * completions) in a bottom sheet. Shows only completed steps — pending events
 * are filtered out. Each row shows a checkmark, a summary description, and a
 * right-aligned duration. A divider and total row appear at the bottom.
 *
 * Usage:
 *   <PlanningBottomSheet
 *     isVisible={sheetVisible}
 *     onClose={() => setSheetVisible(false)}
 *     events={parsedEvents}
 *     totalDurationMs={content.totalDurationMs}
 *   />
 *
 * Following styles/RULES.md: useSemanticTheme() for all visual properties.
 * Following components/CLAUDE.md: named export, no hardcoded colors or spacing.
 */

import { FlatList, StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { IconSymbol } from '../ui/icon-symbol'
import { BottomSheetWrapper } from './bottom-sheet-wrapper'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PlanningEvent = {
  type: 'tool_pending' | 'tool_complete' | 'agent_complete'
  tool?: string
  agent: string
  summary?: string
  durationMs?: number
  ts: number
}

export type PlanningBottomSheetProps = {
  isVisible: boolean
  onClose: () => void
  events: PlanningEvent[]
  totalDurationMs: number
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Format a duration in milliseconds as a human-readable seconds string.
 * Uses one decimal place for values under 10 seconds (e.g. "0.2s", "4.1s"),
 * and rounded seconds for longer durations (e.g. "12s").
 */
function formatEventDuration(ms: number): string {
  if (ms < 10_000) {
    return `${(ms / 1000).toFixed(1)}s`
  }
  return `${Math.round(ms / 1000)}s`
}

// ---------------------------------------------------------------------------
// Event row
// ---------------------------------------------------------------------------

type EventRowProps = {
  summary: string
  durationMs: number
  testID?: string
}

const EventRow = ({ summary, durationMs, testID }: EventRowProps) => {
  const { semantic } = useSemanticTheme()

  return (
    <View style={styles.row} testID={testID}>
      <IconSymbol
        name="check-circle-outline"
        size={16}
        color={semantic.color.success.default}
        testID={`${testID}-icon`}
      />
      <Text
        variant="bodyMedium"
        style={[
          styles.rowSummary,
          { color: semantic.color.onSurface.default },
        ]}
        numberOfLines={2}
        testID={`${testID}-summary`}
      >
        {summary}
      </Text>
      <Text
        variant="labelMedium"
        style={[
          styles.rowDuration,
          { color: semantic.color.onSurface.subtle ?? semantic.color.onSurface.muted ?? semantic.color.onSurface.default },
        ]}
        testID={`${testID}-duration`}
      >
        {formatEventDuration(durationMs)}
      </Text>
    </View>
  )
}

// ---------------------------------------------------------------------------
// PlanningBottomSheet
// ---------------------------------------------------------------------------

export const PlanningBottomSheet = ({
  isVisible,
  onClose,
  events,
  totalDurationMs,
}: PlanningBottomSheetProps) => {
  const { semantic } = useSemanticTheme()

  // Only show completed steps — filter out pending events
  const completedEvents = events.filter(
    (e) => e.type === 'tool_complete' || e.type === 'agent_complete'
  )

  return (
    <BottomSheetWrapper
      isVisible={isVisible}
      onClose={onClose}
      preset="content"
      testID="planning-bottom-sheet"
    >
      {/* Header */}
      <Text
        variant="titleMedium"
        style={{ color: semantic.color.onSurface.default }}
        testID="planning-bottom-sheet-title"
      >
        Planning Steps
      </Text>

      {/* Event list */}
      <FlatList
        data={completedEvents}
        keyExtractor={(item, index) => `${item.type}-${item.ts}-${index}`}
        scrollEnabled={false}
        renderItem={({ item, index }) => (
          <EventRow
            summary={item.summary ?? item.tool ?? item.agent}
            durationMs={item.durationMs ?? 0}
            testID={`planning-bottom-sheet-event-${index}`}
          />
        )}
        ItemSeparatorComponent={() => (
          <View
            style={[
              styles.itemSeparator,
              { backgroundColor: semantic.color.border.default },
            ]}
          />
        )}
        testID="planning-bottom-sheet-list"
      />

      {/* Divider before total */}
      <View
        style={[
          styles.divider,
          { backgroundColor: semantic.color.border.default },
        ]}
        testID="planning-bottom-sheet-divider"
      />

      {/* Total row */}
      <View style={styles.row} testID="planning-bottom-sheet-total">
        <View style={styles.totalSpacer} />
        <Text
          variant="labelLarge"
          style={[
            styles.totalLabel,
            {
              color: semantic.color.onSurface.default,
              fontWeight: '700',
            },
          ]}
          testID="planning-bottom-sheet-total-label"
        >
          Total
        </Text>
        <Text
          variant="labelLarge"
          style={[
            styles.rowDuration,
            {
              color: semantic.color.onSurface.default,
              fontWeight: '700',
            },
          ]}
          testID="planning-bottom-sheet-total-duration"
        >
          {formatEventDuration(totalDurationMs)}
        </Text>
      </View>
    </BottomSheetWrapper>
  )
}

PlanningBottomSheet.displayName = 'PlanningBottomSheet'

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    minHeight: 44,
    paddingVertical: 4,
  },
  rowSummary: {
    flex: 1,
    lineHeight: 20,
  },
  rowDuration: {
    minWidth: 44,
    textAlign: 'right',
  },
  itemSeparator: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 2,
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  totalSpacer: {
    // Aligns with the icon column (16px icon + 10px gap)
    width: 26,
  },
  totalLabel: {
    flex: 1,
  },
})
