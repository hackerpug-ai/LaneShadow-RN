/**
 * IntentSearchSheet Component
 *
 * Bottom sheet for natural language route discovery (UC-DISC-07).
 * Displays four visual states: idle, cache_hit, searching, offline_unsupported.
 *
 * DESIGN TASK: This component renders mock states for visual verification.
 * No real data hooks — CUR-013 will wire useIntentSearch.
 *
 * States:
 * - idle: Empty input field ready for user input
 * - cache_hit: Instant results with no spinner, shows intent summary pill
 * - searching: Loading spinner with status message
 * - offline_unsupported: "Connect to search" message with recent-intent chips
 *
 * Following styles/RULES.md:
 * - useSemanticTheme() for all styling
 * - BottomSheetWrapper for consistent sheet behavior
 * - Glassmorphic overlay pattern
 * - Copper accent for interactive elements
 */

import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { BottomSheetWrapper } from '../sheets/bottom-sheet-wrapper'
import { Button } from '../ui/button'
import { IconSymbol, type IconName } from '../ui/icon-symbol'
import { IntentSummaryPill } from './intent-summary-pill'

/**
 * Search state union type
 * Each state represents a distinct visual treatment
 */
export type SearchState =
  | { status: 'idle' }
  | { status: 'cache_hit'; summary: string }
  | { status: 'searching' }
  | { status: 'offline_unsupported'; recentIntents: string[] }
  | { status: 'results'; summary: string }

export type IntentSearchSheetProps = {
  /** Current search state — determines which UI to render */
  searchState: SearchState
  /** Callback when user submits search query */
  onSearch: (query: string) => void
  /** Callback when user taps clear button (resets to browse mode) */
  onClear: () => void
  /** Callback when user taps a recent-intent chip in offline state */
  onRecentIntentTap: (intent: string) => void
  /** Whether the sheet is visible */
  visible: boolean
  /** Current search query text */
  query: string
  /** Callback when query text changes */
  onChangeQuery: (text: string) => void
}

/**
 * IntentSearchSheet with four distinct visual states
 *
 * AC-001: Input with keyboard
 * AC-002: Cache hit instant (no spinner)
 * AC-003: Online loading spinner
 * AC-004: Offline empty state with chips
 * AC-005: Clear search resets to browse
 */
export const IntentSearchSheet = ({
  searchState,
  onSearch,
  onClear,
  onRecentIntentTap,
  visible,
  query,
  onChangeQuery,
}: IntentSearchSheetProps) => {
  const { semantic } = useSemanticTheme()

  const isSearching = searchState.status === 'searching'
  const isDisabled = isSearching

  return (
    <BottomSheetWrapper
      isVisible={visible}
      onClose={onClear}
      preset="half"
      hasTextInput={true}
      testID="intent-search-sheet"
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: semantic.color.border.default }]}>
          <Text
            variant="titleLarge"
            style={{ color: semantic.color.onSurface.default }}
          >
            Describe your ideal ride
          </Text>
          <Text
            variant="bodyMedium"
            style={{ color: semantic.color.onSurface.muted }}
          >
            Say &quot;scenic coastal roads&quot; or &quot;twisty mountain passes&quot;
          </Text>
        </View>

        {/* Input Row with Clear Button */}
        <View
          style={[
            styles.inputRow,
            {
              backgroundColor: semantic.color.surface.default,
              borderRadius: semantic.radius.lg,
              borderWidth: 1,
              borderColor: semantic.color.border.default,
            },
          ]}
        >
          <View style={styles.inputContainer}>
            <IconSymbol
              name="magnify"
              size={20}
              color={semantic.color.onSurface.muted}
              style={styles.searchIcon}
            />
            {/* Note: Using regular TextInput for design mock.
                In production, this should use BottomSheetTextInput per CLAUDE.md */}
            <Text
              variant="bodyLarge"
              style={{
                flex: 1,
                color: query ? semantic.color.onSurface.default : semantic.color.onSurface.subtle,
              }}
              onPress={() => {
                // In production, this would focus the TextInput
                // For design mock, just show the query text
              }}
            >
              {query || 'Type your ideal ride...'}
            </Text>
          </View>

          <Button
            size="icon"
            icon={<IconSymbol name="close" size={20} color={semantic.color.onSurface.muted} />}
            variant="ghost"
            onPress={onClear}
            disabled={!query && !isSearching}
            testID="clear-search-button"
            style={styles.clearButton}
          />
        </View>

        {/* Cache Hit State — Instant results, no spinner */}
        {searchState.status === 'cache_hit' && (
          <View style={styles.stateContainer} testID="cache-hit-state">
            <IntentSummaryPill text={searchState.summary} onDismiss={onClear} />
          </View>
        )}

        {/* Searching State — Spinner with status message */}
        {searchState.status === 'searching' && (
          <View style={styles.stateContainer} testID="searching-state">
            <View style={[styles.loadingContainer, { gap: semantic.space.md }]}>
              <ActivityIndicator
                size="large"
                color={semantic.color.primary.default}
                testID="search-spinner"
              />
              <Text
                variant="bodyLarge"
                style={{ color: semantic.color.onSurface.default, textAlign: 'center' }}
              >
                Finding your perfect ride...
              </Text>
              <Text
                variant="bodySmall"
                style={{ color: semantic.color.onSurface.muted, textAlign: 'center' }}
              >
                This usually takes 1-2 seconds
              </Text>
            </View>
          </View>
        )}

        {/* Offline Unsupported State — Empty state with chips */}
        {searchState.status === 'offline_unsupported' && (
          <View style={styles.stateContainer} testID="offline-state">
            <View style={[styles.offlineContainer, { gap: semantic.space.lg }]}>
              {/* Empty state message */}
              <View style={[styles.emptyState, { gap: semantic.space.md }]}>
                <IconSymbol
                  name="wifi-off"
                  size={48}
                  color={semantic.color.onSurface.subtle}
                  testID="offline-icon"
                />
                <Text
                  variant="titleMedium"
                  style={{ color: semantic.color.onSurface.default, textAlign: 'center' }}
                >
                  Connect to search
                </Text>
                <Text
                  variant="bodyMedium"
                  style={{ color: semantic.color.onSurface.muted, textAlign: 'center' }}
                >
                  You&apos;re offline. Try one of these popular rides instead:
                </Text>
              </View>

              {/* Recent intent chips */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[styles.chipsContainer, { gap: semantic.space.sm }]}
                testID="recent-intent-chips"
              >
                {searchState.recentIntents.map((intent, index) => (
                  <View
                    key={index}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: semantic.color.surfaceVariant.default,
                        borderRadius: semantic.radius.full,
                        borderWidth: 1,
                        borderColor: semantic.color.border.default,
                      },
                    ]}
                  >
                    <Text
                      variant="labelMedium"
                      style={{ color: semantic.color.primary.default }}
                      onPress={() => onRecentIntentTap(intent)}
                      testID={`recent-intent-chip-${index}`}
                    >
                      {intent}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        )}

        {/* Results State — Shows intent summary pill */}
        {searchState.status === 'results' && (
          <View style={styles.stateContainer} testID="results-state">
            <IntentSummaryPill text={searchState.summary} onDismiss={onClear} />
          </View>
        )}
      </View>
    </BottomSheetWrapper>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 16,
  },
  header: {
    gap: 4,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    paddingHorizontal: 12,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchIcon: {
    marginLeft: 4,
  },
  clearButton: {
    width: 32,
    height: 32,
  },
  stateContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  offlineContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  chipsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
})
