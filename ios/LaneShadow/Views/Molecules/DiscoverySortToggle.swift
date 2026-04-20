import LaneShadowTheme
import SwiftUI

// MARK: - Sort Mode Type

/**
 * Sort mode for discovery results
 *
 * Defines how rides are sorted in discovery view.
 */
public enum LSSortMode: String, Sendable {
    case best
    case nearest
}

// MARK: - Discovery Sort Toggle Component

/**
 * DiscoverySortToggle molecule component
 *
 * Small glassmorphic toggle for switching between "Best" and "Nearest" sort modes.
 * Following React Native component from react-native/components/ui/discovery-sort-toggle.tsx
 *
 * ## Design Tokens Used
 * - Colors:
 *   - Surface background: `theme.colors.surface.default` (0.8 opacity)
 *   - Border: `theme.colors.border.default` (0.13 opacity)
 * - Layout:
 *   - Corner radius: `theme.radius.md`
 * - Component:
 *   - Uses LSToggleGroup for toggle functionality
 *
 * ## Behavior
 * - Displays "Best" and "Nearest" options
 * - Self-aligns to leading edge
 * - Triggers onModeChange callback when mode changes
 *
 * ## Parameters
 * - mode: Current sort mode (best or nearest)
 * - onModeChange: Callback when mode changes
 */
public struct LSDiscoverySortToggle: View {
    @Environment(\.theme) private var theme

    private let mode: LSSortMode
    private let onModeChange: (LSSortMode) -> Void

    /// Creates a DiscoverySortToggle
    /// - Parameters:
    ///   - mode: Current sort mode
    ///   - onModeChange: Callback when mode changes
    public init(
        mode: LSSortMode,
        onModeChange: @escaping (LSSortMode) -> Void
    ) {
        self.mode = mode
        self.onModeChange = onModeChange
    }

    public var body: some View {
        LSToggleGroup(
            value: mode.rawValue,
            onValueChange: { rawValue in
                guard let newMode = LSSortMode(rawValue: rawValue) else { return }
                onModeChange(newMode)
            }
        ) {
            LSToggleGroupItem(value: "best") {
                Text("Best")
                    .accessibilityLabel("Best")
            }
            LSToggleGroupItem(value: "nearest") {
                Text("Nearest")
                    .accessibilityLabel("Nearest")
            }
        }
        .accessibilityLabel("Sort by")
        .accessibilityHint("Double-tap to change sort order")
        .padding(12)
        .background(
            RoundedRectangle(cornerRadius: theme.radius.md)
                .fill(theme.colors.surface.default.opacity(0.8))
        )
        .overlay(
            RoundedRectangle(cornerRadius: theme.radius.md)
                .stroke(theme.colors.border.default.opacity(0.13), lineWidth: 1)
        )
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    // MARK: - Test Helpers

    /// Simulates a mode change (for testing)
    func simulateModeChange(_ newMode: LSSortMode) {
        onModeChange(newMode)
    }
}

// MARK: - Preview

#Preview("Discovery Sort Toggle") {
    struct PreviewWrapper: View {
        @State private var mode: LSSortMode = .best

        var body: some View {
            VStack(alignment: .leading, spacing: 24) {
                Text("Discovery Sort Toggle")
                    .font(.title)
                    .padding(.horizontal)

                LSDiscoverySortToggle(
                    mode: mode,
                    onModeChange: { newMode in
                        mode = newMode
                    }
                )
                .padding()

                Text("Selected mode: \(mode.rawValue)")
                    .font(.caption)
                    .padding(.horizontal)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(theme.colors.background.default)
        }

        @Environment(\.theme) private var theme
    }

    return PreviewWrapper()
        .laneShadowTheme()
}

#Preview("Dark theme") {
    struct PreviewWrapper: View {
        @State private var mode: LSSortMode = .nearest

        var body: some View {
            VStack(alignment: .leading, spacing: 24) {
                Text("Discovery Sort Toggle")
                    .font(.title)
                    .foregroundStyle(theme.colors.onSurface.default)

                LSDiscoverySortToggle(
                    mode: mode,
                    onModeChange: { newMode in
                        mode = newMode
                    }
                )

                Text("Selected mode: \(mode.rawValue)")
                    .font(.caption)
                    .foregroundStyle(theme.colors.onSurface.default)
            }
            .padding()
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(theme.colors.background.default)
        }

        @Environment(\.theme) private var theme
    }

    return PreviewWrapper()
        .laneShadowTheme()
        .preferredColorScheme(.dark)
}
