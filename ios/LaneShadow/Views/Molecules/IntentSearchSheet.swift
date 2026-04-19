import LaneShadowTheme
import SwiftUI

// MARK: - Search State Enum

/**
 * Search state for intent search sheet
 *
 * Represents the visual and interaction state of the search interface
 */
public enum LSSearchState: Sendable, Equatable {
    /// Empty input field ready for user input
    case idle
    /// Instant results with no spinner, shows intent summary pill
    case cacheHit(summary: String)
    /// Loading spinner with status message
    case searching
    /// Offline empty state with recent intent chips
    case offlineUnsupported(recentIntents: [String])
    /// Shows intent summary pill with results
    case results(summary: String)

    public static func == (lhs: LSSearchState, rhs: LSSearchState) -> Bool {
        switch (lhs, rhs) {
        case (.idle, .idle),
             (.searching, .searching):
            true
        case let (.cacheHit(lSummary), .cacheHit(rSummary)),
             let (.results(lSummary), .results(rSummary)):
            lSummary == rSummary
        case let (.offlineUnsupported(lIntents), .offlineUnsupported(rIntents)):
            lIntents == rIntents
        default:
            false
        }
    }
}

// MARK: - Intent Search Sheet Component

/**
 * Intent search sheet molecule component
 *
 * Bottom sheet for natural language route discovery (UC-DISC-07).
 * Displays four visual states: idle, cache_hit, searching, offline_unsupported.
 * Following React Native component from react-native/components/discovery/intent-search-sheet.tsx
 *
 * ## Design Tokens Used
 * - Colors:
 *   - Background: `theme.colors.surface.default`
 *   - Border: `theme.colors.border.default`
 *   - Header text: `theme.colors.onSurface.default`, `theme.colors.onSurface.muted`
 *   - Input row background: `theme.colors.surface.default`
 *   - Input row border: `theme.colors.border.default`
 *   - Search icon: `theme.colors.onSurface.muted`
 *   - Text: `theme.colors.onSurface.default`, `theme.colors.onSurface.subtle`
 *   - Primary: `theme.colors.primary.default`
 *   - Surface variant: `theme.colors.surfaceVariant.default`
 * - Layout:
 *   - Container gap: `theme.space.md` (16pt)
 *   - Header gap: `theme.space.xs` (4pt)
 *   - Header padding bottom: `theme.space.lg` (16pt)
 *   - Input row height: 48pt
 *   - Input row padding: `theme.space.md` (12pt)
 *   - Icon margin: `theme.space.sm` (8pt)
 *   - Clear button: 32x32pt
 *   - State container gap: `theme.space.md` to `theme.space.lg`
 *   - Chip padding: `theme.space.md` horizontal, `theme.space.sm` vertical
 *   - Chip radius: `theme.radius.full`
 * - Typography:
 *   - Title: `theme.type.title.lg`
 *   - Subtitle: `theme.type.body.md`
 *   - Input text: `theme.type.body.lg`
 *   - Status text: `theme.type.body.lg`, `theme.type.body.sm`
 *   - Offline title: `theme.type.title.md`
 *   - Offline message: `theme.type.body.md`
 *   - Chip text: `theme.type.label.md`
 * - Radius:
 *   - Input row: `theme.radius.lg`
 *   - Chips: `theme.radius.full`
 * - States:
 *   - idle: Empty input with placeholder
 *   - cache_hit: Shows LSIntentSummaryPill
 *   - searching: ProgressView with status messages
 *   - offline_unsupported: Empty state with wifi-off icon and chips
 *   - results: Shows LSIntentSummaryPill
 *
 * ## Parameters
 * - searchState: Current search state (determines which UI to render)
 * - onSearch: Callback when user submits search query
 * - onClear: Callback when user taps clear button (resets to browse mode)
 * - onRecentIntentTap: Callback when user taps a recent-intent chip in offline state
 * - visible: Whether the sheet is visible
 * - query: Current search query text
 * - onChangeQuery: Callback when query text changes
 * - testID: Optional testing identifier for UI tests
 *
 * ## Accessibility
 * - Header: "Describe your ideal ride" label
 * - Input: "Search for rides" label
 * - Clear button: "Clear search" label
 * - Recent intent chips: "{intent} ride" label each
 */
public struct LSIntentSearchSheet: View {
    @Environment(\.theme) private var theme

    private let searchState: LSSearchState
    private let onSearch: (String) -> Void
    private let onClear: () -> Void
    private let onRecentIntentTap: (String) -> Void
    private let visible: Bool
    @Binding private var query: String
    private let onChangeQuery: (String) -> Void
    private let testID: String

    public init(
        searchState: LSSearchState,
        onSearch: @escaping (String) -> Void,
        onClear: @escaping () -> Void,
        onRecentIntentTap: @escaping (String) -> Void,
        visible: Bool,
        query: Binding<String>,
        onChangeQuery: @escaping (String) -> Void,
        testID: String = "intent-search-sheet"
    ) {
        self.searchState = searchState
        self.onSearch = onSearch
        self.onClear = onClear
        self.onRecentIntentTap = onRecentIntentTap
        self.visible = visible
        _query = query
        self.onChangeQuery = onChangeQuery
        self.testID = testID
    }

    // MARK: - Body

    public var body: some View {
        VStack(spacing: 0) {
            if visible {
                sheetContent
            }
        }
    }

    // MARK: - Sheet Content

    private var sheetContent: some View {
        VStack(spacing: theme.space.md) {
            // Header
            headerView

            // Input row with clear button
            inputRowView

            // State-specific content
            stateContentView
        }
        .padding(theme.space.lg)
        .background(theme.colors.surface.default)
        .accessibilityIdentifier(testID)
    }

    // MARK: - Header

    private var headerView: some View {
        VStack(alignment: .leading, spacing: theme.space.xs) {
            Text("Describe your ideal ride")
                .font(theme.type.title.lg.font)
                .foregroundStyle(theme.colors.onSurface.default)

            Text("Say \"scenic coastal roads\" or \"twisty mountain passes\"")
                .font(theme.type.body.md.font)
                .foregroundStyle(theme.colors.onSurface.muted)
        }
        .padding(.bottom, theme.space.lg)
        .overlay(
            Rectangle()
                .fill(theme.colors.border.default)
                .frame(height: 1),
            alignment: .bottom
        )
        .accessibilityElement(children: .combine)
        .accessibilityLabel("Describe your ideal ride search")
    }

    // MARK: - Input Row

    private var inputRowView: some View {
        HStack(alignment: .center, spacing: 0) {
            // Search icon and text input
            HStack(alignment: .center, spacing: theme.space.sm) {
                LSIconSymbol(
                    name: "magnify",
                    size: 20,
                    color: theme.colors.onSurface.muted
                )
                .padding(.leading, 4)

                Text(query.isEmpty ? "Type your ideal ride..." : query)
                    .font(theme.type.body.lg.font)
                    .foregroundStyle(
                        query.isEmpty
                            ? theme.colors.onSurface.subtle
                            : theme.colors.onSurface.default
                    )
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .onTapGesture {
                        // In production, this would focus a TextField
                        // For design mock, just show the query text
                    }
            }

            // Clear button
            if !query.isEmpty || isSearching {
                Button(action: onClear) {
                    LSIconSymbol(
                        name: "close",
                        size: 20,
                        color: theme.colors.onSurface.muted
                    )
                    .frame(width: 32, height: 32)
                    .contentShape(Rectangle())
                }
                .buttonStyle(PlainButtonStyle())
                .accessibilityLabel("Clear search")
                .accessibilityIdentifier("\(testID)-clear")
            }
        }
        .frame(height: 48)
        .padding(.horizontal, 12)
        .background(theme.colors.surface.default)
        .clipShape(RoundedRectangle(cornerRadius: theme.radius.lg))
        .overlay(
            RoundedRectangle(cornerRadius: theme.radius.lg)
                .stroke(theme.colors.border.default, lineWidth: 1)
        )
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Search input")
    }

    // MARK: - State Content

    @ViewBuilder
    private var stateContentView: some View {
        switch searchState {
        case .idle:
            idleView

        case let .cacheHit(summary):
            cacheHitView(summary: summary)

        case .searching:
            searchingView

        case let .offlineUnsupported(recentIntents):
            offlineView(recentIntents: recentIntents)

        case let .results(summary):
            resultsView(summary: summary)
        }
    }

    // MARK: - Idle View

    private var idleView: some View {
        VStack(spacing: theme.space.md) {
            Spacer()
                .frame(minHeight: 100)
        }
        .accessibilityIdentifier("\(testID)-idle")
    }

    // MARK: - Cache Hit View

    private func cacheHitView(summary: String) -> some View {
        VStack(spacing: theme.space.md) {
            LSIntentSummaryPill(
                text: summary,
                onDismiss: onClear,
                testID: "\(testID)-cache-pill"
            )

            Spacer()
                .frame(minHeight: 100)
        }
        .accessibilityIdentifier("\(testID)-cache-hit")
    }

    // MARK: - Searching View

    private var searchingView: some View {
        VStack(spacing: theme.space.md) {
            Spacer()
                .frame(minHeight: 40)

            ProgressView()
                .scaleEffect(1.2)
                .tint(theme.colors.primary.default)
                .accessibilityIdentifier("\(testID)-spinner")

            Text("Finding your perfect ride...")
                .font(theme.type.body.lg.font)
                .foregroundStyle(theme.colors.onSurface.default)

            Text("This usually takes 1-2 seconds")
                .font(theme.type.body.sm.font)
                .foregroundStyle(theme.colors.onSurface.muted)

            Spacer()
                .frame(minHeight: 60)
        }
        .accessibilityIdentifier("\(testID)-searching")
    }

    // MARK: - Offline View

    private func offlineView(recentIntents: [String]) -> some View {
        VStack(spacing: theme.space.lg) {
            // Empty state message
            VStack(spacing: theme.space.md) {
                LSIconSymbol(
                    name: "wifi-off",
                    size: 48,
                    color: theme.colors.onSurface.subtle
                )
                .accessibilityIdentifier("\(testID)-offline-icon")

                Text("Connect to search")
                    .font(theme.type.title.md.font)
                    .foregroundStyle(theme.colors.onSurface.default)

                Text("You're offline. Try one of these popular rides instead:")
                    .font(theme.type.body.md.font)
                    .foregroundStyle(theme.colors.onSurface.muted)
                    .multilineTextAlignment(.center)
            }

            // Recent intent chips
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: theme.space.sm) {
                    ForEach(Array(recentIntents.enumerated()), id: \.offset) { index, intent in
                        Button(action: { onRecentIntentTap(intent) }) {
                            Text(intent)
                                .font(theme.type.label.md.font)
                                .foregroundStyle(theme.colors.primary.default)
                                .padding(.horizontal, theme.space.md)
                                .padding(.vertical, theme.space.sm)
                                .background(theme.colors.surfaceVariant.default)
                                .clipShape(Capsule())
                                .overlay(
                                    Capsule()
                                        .stroke(theme.colors.border.default, lineWidth: 1)
                                )
                        }
                        .buttonStyle(PlainButtonStyle())
                        .accessibilityLabel("\(intent) ride")
                        .accessibilityIdentifier("\(testID)-chip-\(index)")
                    }
                }
                .padding(.horizontal, theme.space.md)
            }
        }
        .accessibilityIdentifier("\(testID)-offline")
    }

    // MARK: - Results View

    private func resultsView(summary: String) -> some View {
        VStack(spacing: theme.space.md) {
            LSIntentSummaryPill(
                text: summary,
                onDismiss: onClear,
                testID: "\(testID)-results-pill"
            )

            Spacer()
                .frame(minHeight: 100)
        }
        .accessibilityIdentifier("\(testID)-results")
    }

    // MARK: - Computed Properties

    private var isSearching: Bool {
        if case .searching = searchState {
            return true
        }
        return false
    }
}

// MARK: - Preview

#Preview("Intent Search Sheet - Idle") {
    struct IdleDemo: View {
        @State private var query = ""

        var body: some View {
            LSIntentSearchSheet(
                searchState: .idle,
                onSearch: { _ in },
                onClear: {},
                onRecentIntentTap: { _ in },
                visible: true,
                query: $query,
                onChangeQuery: { _ in }
            )
            .laneShadowTheme()
        }
    }

    return IdleDemo()
}

#Preview("Intent Search Sheet - Cache Hit") {
    struct CacheHitDemo: View {
        @State private var query = "scenic coastal roads"

        var body: some View {
            LSIntentSearchSheet(
                searchState: .cacheHit(summary: "Twisty mountain roads near you"),
                onSearch: { _ in },
                onClear: {},
                onRecentIntentTap: { _ in },
                visible: true,
                query: $query,
                onChangeQuery: { _ in }
            )
            .laneShadowTheme()
        }
    }

    return CacheHitDemo()
}

#Preview("Intent Search Sheet - Searching") {
    struct SearchingDemo: View {
        @State private var query = "twisty mountain passes"

        var body: some View {
            LSIntentSearchSheet(
                searchState: .searching,
                onSearch: { _ in },
                onClear: {},
                onRecentIntentTap: { _ in },
                visible: true,
                query: $query,
                onChangeQuery: { _ in }
            )
            .laneShadowTheme()
        }
    }

    return SearchingDemo()
}

#Preview("Intent Search Sheet - Offline") {
    struct OfflineDemo: View {
        @State private var query = ""

        var body: some View {
            LSIntentSearchSheet(
                searchState: .offlineUnsupported(recentIntents: [
                    "Scenic coastal routes",
                    "Twisty mountain passes",
                    "Wine country backroads",
                    "Desert sunset rides",
                ]),
                onSearch: { _ in },
                onClear: {},
                onRecentIntentTap: { print("Tapped: \($0)") },
                visible: true,
                query: $query,
                onChangeQuery: { _ in }
            )
            .laneShadowTheme()
        }
    }

    return OfflineDemo()
}

#Preview("Intent Search Sheet - Results") {
    struct ResultsDemo: View {
        @State private var query = "scenic routes near me"

        var body: some View {
            LSIntentSearchSheet(
                searchState: .results(summary: "Scenic coastal routes with elevation gain"),
                onSearch: { _ in },
                onClear: {},
                onRecentIntentTap: { _ in },
                visible: true,
                query: $query,
                onChangeQuery: { _ in }
            )
            .laneShadowTheme()
        }
    }

    return ResultsDemo()
}

#Preview("Intent Search Sheet - All States") {
    struct AllStatesDemo: View {
        @State private var currentState: LSSearchState = .idle
        @State private var query = ""

        var body: some View {
            VStack(spacing: 20) {
                // State picker
                Picker("State", selection: $currentState) {
                    Text("Idle").tag(LSSearchState.idle)
                    Text("Cache Hit").tag(LSSearchState.cacheHit(summary: "Twisty mountain roads"))
                    Text("Searching").tag(LSSearchState.searching)
                    Text("Offline").tag(LSSearchState.offlineUnsupported(recentIntents: [
                        "Scenic routes",
                        "Mountain passes",
                    ]))
                    Text("Results").tag(LSSearchState.results(summary: "Scenic coastal routes"))
                }
                .pickerStyle(.segmented)
                .padding()

                // Sheet
                LSIntentSearchSheet(
                    searchState: currentState,
                    onSearch: { _ in },
                    onClear: { query = "" },
                    onRecentIntentTap: { _ in },
                    visible: true,
                    query: $query,
                    onChangeQuery: { _ in }
                )
            }
            .laneShadowTheme()
        }
    }

    return AllStatesDemo()
}
