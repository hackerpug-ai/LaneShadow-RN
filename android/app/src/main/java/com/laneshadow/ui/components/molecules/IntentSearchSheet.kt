package com.laneshadow.ui.components.molecules

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.laneshadow.ui.components.atoms.IconSymbol
import com.laneshadow.theme.LocalLaneShadowTheme

/**
 * Search state sealed class
 *
 * Each state represents a distinct visual treatment for the intent search sheet.
 */
sealed class SearchState {
    /** Empty input field ready for user input */
    object Idle : SearchState()

    /** Instant results with no spinner, shows intent summary pill */
    data class CacheHit(val summary: String) : SearchState()

    /** Loading spinner with status message */
    object Searching : SearchState()

    /** "Connect to search" message with recent-intent chips */
    data class OfflineUnsupported(val recentIntents: List<String>) : SearchState()

    /** Shows intent summary pill with results */
    data class Results(val summary: String) : SearchState()
}

/**
 * IntentSearchSheet molecule component
 *
 * Bottom sheet for natural language route discovery (UC-DISC-07).
 * Displays four visual states: idle, cache_hit, searching, offline_unsupported.
 * Following React Native wrapper patterns from react-native/components/discovery/intent-search-sheet.tsx
 *
 * States:
 * - idle: Empty input field ready for user input
 * - cache_hit: Instant results with no spinner, shows intent summary pill
 * - searching: Loading spinner with status message
 * - offline_unsupported: "Connect to search" message with recent-intent chips
 * - results: Shows intent summary pill
 *
 * @param searchState Current search state — determines which UI to render
 * @param onSearch Callback when user submits search query
 * @param onClear Callback when user taps clear button (resets to browse mode)
 * @param onRecentIntentTap Callback when user taps a recent-intent chip in offline state
 * @param visible Whether the sheet is visible
 * @param query Current search query text
 * @param onChangeQuery Callback when query text changes
 * @param modifier Modifier for the sheet container
 * @param testID Optional test identifier for UI testing
 */
@Composable
fun IntentSearchSheet(
    searchState: SearchState,
    onSearch: (String) -> Unit,
    onClear: () -> Unit,
    onRecentIntentTap: (String) -> Unit,
    visible: Boolean,
    query: String,
    onChangeQuery: (String) -> Unit,
    modifier: Modifier = Modifier,
    testID: String? = null,
) {
    if (!visible) {
        return
    }

    val theme = LocalLaneShadowTheme.current
    val isSearching = searchState == SearchState.Searching

    // Build accessibility description
    val accessibilityDescription = when (searchState) {
        is SearchState.Idle -> "Describe your ideal ride. Enter your search query."
        is SearchState.CacheHit -> "Cache hit: ${searchState.summary}"
        is SearchState.Searching -> "Searching for your perfect ride"
        is SearchState.OfflineUnsupported -> "You're offline. Connect to search or try a recent ride."
        is SearchState.Results -> "Results: ${searchState.summary}"
    }

    AlertDialog(
        onDismissRequest = onClear,
        modifier = modifier
            .testTag(testID ?: "intent-search-sheet")
            .semantics {
                contentDescription = accessibilityDescription
            },
        title = null,
        text = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = theme.space.md),
                verticalArrangement = Arrangement.spacedBy(theme.space.md),
            ) {
                // Header with title and subtitle
                Column(
                    verticalArrangement = Arrangement.spacedBy(theme.space.xs),
                ) {
                    // Title: "Describe your ideal ride" (title.lg)
                    Text(
                        text = "Describe your ideal ride",
                        color = theme.colors.onSurface.default,
                        style = theme.type.title.lg,
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag(testID?.let { "$it-title" } ?: "intent-search-title"),
                    )

                    // Subtitle: "Say \"scenic coastal roads\" or \"twisty mountain passes\"" (body.md)
                    Text(
                        text = "Say \"scenic coastal roads\" or \"twisty mountain passes\"",
                        color = theme.colors.onSurface.default.copy(alpha = 0.6f),
                        style = theme.type.body.md,
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag(testID?.let { "$it-subtitle" } ?: "intent-search-subtitle"),
                    )
                }

                // Divider
                Spacer(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(1.dp)
                        .background(theme.colors.border.default)
                        .testTag(testID?.let { "$it-divider" } ?: "intent-search-divider"),
                )

                // Input Row with Search Icon, Text Field, and Clear Button
                Surface(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp)
                        .testTag(testID?.let { "$it-input-row" } ?: "intent-search-input-row"),
                    shape = RoundedCornerShape(theme.radius.lg),
                    color = theme.colors.surface.default,
                    border = BorderStroke(1.dp, theme.colors.border.default),
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 12.dp),
                        horizontalArrangement = Arrangement.spacedBy(theme.space.sm),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        // Search icon (magnify, 20dp)
                        IconSymbol(
                            name = "search",
                            size = 20.dp,
                            color = theme.colors.onSurface.default.copy(alpha = 0.6f),
                            modifier = Modifier
                                .padding(start = 4.dp)
                                .testTag(testID?.let { "$it-search-icon" } ?: "intent-search-icon"),
                        )

                        // Text input field
                        BasicTextField(
                            value = query,
                            onValueChange = onChangeQuery,
                            modifier = Modifier
                                .weight(1f)
                                .testTag(testID?.let { "$it-input" } ?: "intent-search-input"),
                            enabled = !isSearching,
                            singleLine = true,
                            textStyle = TextStyle(
                                color = theme.colors.onSurface.default,
                                fontSize = theme.type.body.lg.fontSize,
                                fontWeight = theme.type.body.lg.fontWeight,
                            ),
                            cursorBrush = SolidColor(theme.colors.primary.default),
                            keyboardOptions = KeyboardOptions.Default.copy(
                                keyboardType = KeyboardType.Text
                            ),
                            decorationBox = { innerTextField ->
                                if (query.isEmpty()) {
                                    Text(
                                        text = "Type your ideal ride...",
                                        color = theme.colors.onSurface.default.copy(alpha = 0.5f),
                                        style = theme.type.body.lg,
                                    )
                                }
                                innerTextField()
                            },
                        )

                        // Clear button (close icon)
                        IconButton(
                            onClick = onClear,
                            enabled = query.isNotEmpty() || isSearching,
                            modifier = Modifier
                                .size(32.dp)
                                .testTag(testID?.let { "$it-clear-button" } ?: "intent-search-clear-button"),
                        ) {
                            IconSymbol(
                                name = "close",
                                size = 20.dp,
                                color = theme.colors.onSurface.default.copy(alpha = 0.6f),
                            )
                        }
                    }
                }

                // State-specific content
                when (searchState) {
                    is SearchState.Idle -> {
                        // No additional content for idle state
                        Spacer(modifier = Modifier.height(theme.space.md))
                    }

                    is SearchState.CacheHit -> {
                        // Cache hit: show intent summary pill
                        IntentSummaryPill(
                            summary = searchState.summary,
                            onDismiss = onClear,
                            modifier = Modifier
                                .testTag(testID?.let { "$it-cache-hit" } ?: "intent-search-cache-hit"),
                        )
                    }

                    is SearchState.Searching -> {
                        // Searching: spinner with status message
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 32.dp)
                                .testTag(testID?.let { "$it-searching" } ?: "intent-search-searching"),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(theme.space.md),
                        ) {
                            // Activity indicator spinner
                            CircularProgressIndicator(
                                modifier = Modifier
                                    .size(theme.space.xl)
                                    .testTag(testID?.let { "$it-spinner" } ?: "intent-search-spinner"),
                                color = theme.colors.primary.default,
                            )

                            // "Finding your perfect ride..." (body.lg)
                            Text(
                                text = "Finding your perfect ride...",
                                color = theme.colors.onSurface.default,
                                style = theme.type.body.lg,
                                textAlign = TextAlign.Center,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .testTag(testID?.let { "$it-searching-text" } ?: "intent-search-searching-text"),
                            )

                            // "This usually takes 1-2 seconds" (body.sm)
                            Text(
                                text = "This usually takes 1-2 seconds",
                                color = theme.colors.onSurface.default.copy(alpha = 0.6f),
                                style = theme.type.body.sm,
                                textAlign = TextAlign.Center,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .testTag(testID?.let { "$it-searching-subtext" } ?: "intent-search-searching-subtext"),
                            )
                        }
                    }

                    is SearchState.OfflineUnsupported -> {
                        // Offline unsupported: empty state with recent intent chips
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag(testID?.let { "$it-offline" } ?: "intent-search-offline"),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(theme.space.lg),
                        ) {
                            // Empty state message
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 24.dp),
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.spacedBy(theme.space.md),
                            ) {
                                // wifi-off icon (48dp)
                                IconSymbol(
                                    name = "wifi-off",
                                    size = 48.dp,
                                    color = theme.colors.onSurface.default.copy(alpha = 0.5f),
                                    modifier = Modifier
                                        .testTag(testID?.let { "$it-offline-icon" } ?: "intent-search-offline-icon"),
                                )

                                // "Connect to search" (title.md)
                                Text(
                                    text = "Connect to search",
                                    color = theme.colors.onSurface.default,
                                    style = theme.type.title.md,
                                    textAlign = TextAlign.Center,
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .testTag(testID?.let { "$it-offline-title" } ?: "intent-search-offline-title"),
                                )

                                // "You're offline. Try one of these popular rides instead:" (body.md)
                                Text(
                                    text = "You're offline. Try one of these popular rides instead:",
                                    color = theme.colors.onSurface.default.copy(alpha = 0.6f),
                                    style = theme.type.body.md,
                                    textAlign = TextAlign.Center,
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .testTag(testID?.let { "$it-offline-body" } ?: "intent-search-offline-body"),
                                )
                            }

                            // Recent intent chips (horizontal scroll)
                            LazyRow(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = theme.space.md)
                                    .testTag(testID?.let { "$it-recent-chips" } ?: "intent-search-recent-chips"),
                                horizontalArrangement = Arrangement.spacedBy(theme.space.sm),
                            ) {
                                items(searchState.recentIntents) { intent ->
                                    RecentIntentChip(
                                        intent = intent,
                                        onTap = onRecentIntentTap,
                                        modifier = Modifier
                                            .testTag("${testID?.let { "$it-" } ?: "intent-search-"}recent-chip-${intent.hashCode()}"),
                                    )
                                }
                            }
                        }
                    }

                    is SearchState.Results -> {
                        // Results: show intent summary pill
                        IntentSummaryPill(
                            summary = searchState.summary,
                            onDismiss = onClear,
                            modifier = Modifier
                                .testTag(testID?.let { "$it-results" } ?: "intent-search-results"),
                        )
                    }
                }
            }
        },
        confirmButton = { /* No confirm button for this sheet */ },
        dismissButton = { /* No dismiss button for this sheet */ },
        containerColor = theme.colors.surface.default,
        shape = RoundedCornerShape(theme.radius.xl),
    )
}

/**
 * IntentSummaryPill composable
 *
 * Simple pill showing intent summary with dismiss button.
 * Inline implementation since IntentSummaryPill atom doesn't exist yet on Android.
 *
 * @param summary Intent summary text to display
 * @param onDismiss Callback when dismiss button is tapped
 * @param modifier Modifier for the pill container
 */
@Composable
private fun IntentSummaryPill(
    summary: String,
    onDismiss: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current

    Surface(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(theme.radius.lg),
        color = theme.colors.surfaceVariant.default,
        border = BorderStroke(1.dp, theme.colors.border.default),
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(theme.space.md),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            // Summary text (body.md)
            Text(
                text = summary,
                color = theme.colors.onSurface.default,
                style = theme.type.body.md,
                modifier = Modifier.weight(1f),
            )

            // Dismiss button
            IconButton(
                onClick = onDismiss,
                modifier = Modifier.size(24.dp),
            ) {
                IconSymbol(
                    name = "close",
                    size = 18.dp,
                    color = theme.colors.onSurface.default.copy(alpha = 0.6f),
                )
            }
        }
    }
}

/**
 * RecentIntentChip composable
 *
 * Individual recent intent chip for offline state.
 *
 * @param intent Intent text to display
 * @param onTap Callback when chip is tapped
 * @param modifier Modifier for the chip
 */
@Composable
private fun RecentIntentChip(
    intent: String,
    onTap: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current

    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(theme.radius.full),
        color = theme.colors.surfaceVariant.default,
        border = BorderStroke(1.dp, theme.colors.border.default),
        onClick = { onTap(intent) },
    ) {
        Text(
            text = intent,
            color = theme.colors.primary.default,
            style = theme.type.label.md,
            modifier = Modifier.padding(
                horizontal = 16.dp,
                vertical = 8.dp,
            ),
        )
    }
}
