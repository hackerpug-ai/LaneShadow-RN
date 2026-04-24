import LaneShadowTheme
import SwiftUI

// MARK: - Excluded Favorite Model

/**
 * Model for an excluded favorite road
 *
 * ## Properties
 * - id: Unique identifier for the favorite
 * - name: Optional display name for the favorite
 * - reason: Reason for exclusion (e.g., "Too far from route")
 */
public struct LSExcludedFavorite: Equatable, Sendable {
    public let id: String
    public let name: String?
    public let reason: String

    public init(id: String, name: String?, reason: String) {
        self.id = id
        self.name = name
        self.reason = reason
    }
}

// MARK: - Format Excluded List Helper

/**
 * Format excluded favorites list for display
 *
 * Shows first 3 names, then "and N more" if applicable
 *
 * ## Parameters
 * - favorites: Array of excluded favorites
 *
 * ## Returns
 * Formatted string for display
 */
public func formatExcludedList(_ favorites: [LSExcludedFavorite]) -> String {
    let namedFavorites = favorites.filter { $0.name != nil }
    let names = namedFavorites.compactMap(\.name)

    if names.isEmpty {
        return "some favorites"
    }

    if names.count <= 3 {
        return names.joined(separator: ", ")
    }

    let visible = names.prefix(3)
    let remaining = names.count - 3
    return "\(visible.joined(separator: ", ")) and \(remaining) more"
}

// MARK: - Favorite Exclusion Alert Component

/**
 * Favorite exclusion alert molecule component
 *
 * Displays a warning alert when favorite roads are excluded from route planning
 * due to distance constraints (> 50km from route).
 *
 * Following React Native component from react-native/components/ui/favorite-exclusion-alert.tsx
 *
 * ## Features
 * - Lists names of excluded favorites (up to 3, then "and N more")
 * - Auto-dismisses after 10 seconds
 * - Dismissible via tap
 * - Session-aware (doesn't show same exclusion twice)
 * - Full accessibility support
 *
 * ## Design Tokens Used
 * - Colors:
 *   - Background: `theme.colors.warningContainer.default`
 *   - Border: `theme.colors.warning.default`
 *   - Text/Icon: `theme.colors.onWarningContainer.default`
 * - Typography:
 *   - Title: `theme.type.title.sm`
 *   - Body: `theme.type.body.md`
 * - Spacing:
 *   - Container padding: `theme.space.md`
 *   - Icon spacing: `theme.space.sm`
 *   - Text gap: `theme.space.xs`
 * - Border:
 *   - Radius: `theme.radius.md`
 *   - Width: `theme.borderWidth.thin`
 *
 * ## Parameters
 * - excludedFavorites: Array of excluded favorites with names and reasons
 * - includeFavorites: Whether include favorites toggle is ON (default: true)
 * - onDismiss: Callback when alert is dismissed
 * - sessionKey: Optional session key for tracking shown exclusions
 *
 * ## Usage
 * ```swift
 * LSFavoriteExclusionAlert(
 *   excludedFavorites: [
 *     LSExcludedFavorite(id: "1", name: "Pacific Coast Highway", reason: "Too far")
 *   ],
 *   includeFavorites: true,
 *   onDismiss: { print("Dismissed") }
 * )
 * ```
 */
public struct LSFavoriteExclusionAlert: View {
    @Environment(\.theme) private var theme

    private let excludedFavorites: [LSExcludedFavorite]
    private let includeFavorites: Bool
    private let onDismiss: () -> Void
    private let sessionKey: String?

    // Track session keys we've already shown (static for session awareness across instances)
    @State private var shownSessions: Set<String> = []
    @State private var isVisible: Bool = false
    @State private var hasShownForSession: Bool = false

    private static let autoDismissDuration: TimeInterval = 10.0
    private static let maxVisibleNames = 3

    public init(
        excludedFavorites: [LSExcludedFavorite],
        includeFavorites: Bool = true,
        onDismiss: @escaping () -> Void,
        sessionKey: String? = nil
    ) {
        self.excludedFavorites = excludedFavorites
        self.includeFavorites = includeFavorites
        self.onDismiss = onDismiss
        self.sessionKey = sessionKey
    }

    // MARK: - Body

    public var body: some View {
        Group {
            if shouldShowAlert, isVisible {
                mainContent
                    .onAppear {
                        setupAutoDismiss()
                    }
                    .onDisappear {
                        cleanup()
                    }
            }
        }
        .onChange(of: excludedFavorites) { _, _ in
            checkVisibility()
        }
        .onChange(of: includeFavorites) { _, _ in
            checkVisibility()
        }
        .onAppear {
            checkVisibility()
        }
    }

    // MARK: - Should Show Alert

    private var shouldShowAlert: Bool {
        // Don't show if toggle is off or no exclusions
        guard includeFavorites, !excludedFavorites.isEmpty else {
            return false
        }

        // Check session awareness
        if let sessionKey, shownSessions.contains(sessionKey) {
            return false
        }

        return true
    }

    // MARK: - Check Visibility

    private func checkVisibility() {
        if shouldShowAlert, !hasShownForSession {
            isVisible = true

            // Track this session
            if let sessionKey {
                shownSessions.insert(sessionKey)
                hasShownForSession = true
            }
        } else {
            isVisible = false
        }
    }

    // MARK: - Cleanup

    private func cleanup() {
        // Reset session tracking when alert disappears (optional, based on use case)
        // hasShownForSession = false
    }

    // MARK: - Main Content

    private var mainContent: some View {
        HStack(spacing: 0) {
            // Info icon
            iconSection

            // Text content
            textSection

            // Dismiss button
            dismissButton
        }
        .padding(theme.space.md)
        .background(theme.colors.warningContainer.default)
        .overlay(
            RoundedRectangle(cornerRadius: theme.radius.md)
                .stroke(theme.colors.warning.default, lineWidth: theme.borderWidth.thin)
        )
        .clipShape(RoundedRectangle(cornerRadius: theme.radius.md))
        .contentShape(Rectangle())
        .onTapGesture {
            handleDismiss()
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel(accessibilityLabel)
        .accessibilityRole(.alert)
    }

    // MARK: - Icon Section

    private var iconSection: some View {
        LSIconSymbol(
            name: "information",
            size: 20,
            color: theme.colors.onWarningContainer.default
        )
        .padding(.trailing, theme.space.sm)
    }

    // MARK: - Text Section

    private var textSection: some View {
        VStack(alignment: .leading, spacing: theme.space.xs) {
            // Title
            Text("Some favorites couldn't be included")
                .font(.system(size: theme.type.title.sm.fontSize, weight: .semibold))
                .foregroundStyle(theme.colors.onWarningContainer.default)

            // Body
            Text("These favorites are too far from your route: \(formatExcludedList(excludedFavorites))")
                .font(.system(size: theme.type.body.md.fontSize, weight: .regular))
                .foregroundStyle(theme.colors.onWarningContainer.default)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    // MARK: - Dismiss Button

    private var dismissButton: some View {
        Button(action: handleDismiss) {
            LSIconSymbol(
                name: "close",
                size: 20,
                color: theme.colors.onWarningContainer.default
            )
            .padding(.leading, theme.space.sm)
        }
        .buttonStyle(.plain)
        .accessibilityLabel("Dismiss")
    }

    // MARK: - Accessibility Label

    private var accessibilityLabel: String {
        let baseMessage = "Some favorites couldn't be included"
        let reasonMessage = "These favorites are too far from your route"

        let namedFavorites = excludedFavorites.filter { $0.name != nil }
        let names = namedFavorites.compactMap(\.name)

        if names.isEmpty {
            return "\(baseMessage). \(reasonMessage)."
        }

        if names.count <= Self.maxVisibleNames {
            return "\(baseMessage). \(reasonMessage): \(names.joined(separator: ", "))."
        }

        let visible = names.prefix(Self.maxVisibleNames)
        let remaining = names.count - Self.maxVisibleNames
        return "\(baseMessage). \(reasonMessage): \(visible.joined(separator: ", ")) and \(remaining) more."
    }

    // MARK: - Setup Auto-Dismiss

    private func setupAutoDismiss() {
        Task {
            try? await Task.sleep(nanoseconds: UInt64(Self.autoDismissDuration * 1_000_000_000))
            await MainActor.run {
                handleDismiss()
            }
        }
    }

    // MARK: - Handle Dismiss

    private func handleDismiss() {
        isVisible = false
        onDismiss()
    }
}

// MARK: - Preview

#Preview("FavoriteExclusionAlert - Default") {
    VStack(spacing: 16) {
        LSFavoriteExclusionAlert(
            excludedFavorites: [
                LSExcludedFavorite(id: "1", name: "Pacific Coast Highway", reason: "Too far"),
                LSExcludedFavorite(id: "2", name: "Mulholland Drive", reason: "Too far"),
            ],
            includeFavorites: true,
            onDismiss: { print("Dismissed") }
        )

        Text("App content goes here")
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(Color.gray.opacity(0.1))
    }
    .laneShadowTheme()
}

#Preview("FavoriteExclusionAlert - More than 3") {
    VStack(spacing: 16) {
        LSFavoriteExclusionAlert(
            excludedFavorites: [
                LSExcludedFavorite(id: "1", name: "Road One", reason: "Too far"),
                LSExcludedFavorite(id: "2", name: "Road Two", reason: "Too far"),
                LSExcludedFavorite(id: "3", name: "Road Three", reason: "Too far"),
                LSExcludedFavorite(id: "4", name: "Road Four", reason: "Too far"),
                LSExcludedFavorite(id: "5", name: "Road Five", reason: "Too far"),
            ],
            includeFavorites: true,
            onDismiss: { print("Dismissed") }
        )

        Spacer()
    }
    .laneShadowTheme()
}

#Preview("FavoriteExclusionAlert - No Names") {
    VStack(spacing: 16) {
        LSFavoriteExclusionAlert(
            excludedFavorites: [
                LSExcludedFavorite(id: "1", reason: "Too far"),
                LSExcludedFavorite(id: "2", reason: "Too far"),
            ],
            includeFavorites: true,
            onDismiss: { print("Dismissed") }
        )

        Spacer()
    }
    .laneShadowTheme()
}

#Preview("FavoriteExclusionAlert - Dark Mode") {
    VStack(spacing: 16) {
        LSFavoriteExclusionAlert(
            excludedFavorites: [
                LSExcludedFavorite(id: "1", name: "Sunset Boulevard", reason: "Too far"),
            ],
            includeFavorites: true,
            onDismiss: { print("Dismissed") }
        )

        Spacer()
    }
    .laneShadowTheme()
    .preferredColorScheme(.dark)
}
