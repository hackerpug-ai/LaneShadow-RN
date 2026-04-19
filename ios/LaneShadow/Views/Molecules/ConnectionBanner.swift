import LaneShadowTheme
import SwiftUI

// MARK: - Connection Banner Component

/**
 * Connection banner molecule component
 *
 * Displays a full-width warning banner for network connection status.
 * Following React Native component from react-native/components/ui/connection-banner.tsx
 *
 * ## Design Tokens Used
 * - Colors:
 *   - Background: `theme.colors.warning.default`
 *   - Text: `Color.white` (onPrimary equivalent)
 * - Layout:
 *   - Width: `.infinity` (full-width)
 *   - Padding: 12pt all sides (theme.space.md equivalent)
 * - Typography:
 *   - System font, 14pt (bodySmall equivalent), medium weight
 * - Icon:
 *   - System wifi icon (20pt)
 *
 * ## Parameters
 * - message: Banner message text (default: "Connection Required - Some features may be limited")
 * - isVisible: Show/hide the banner (default: true)
 *
 * ## Usage
 * ```swift
 * LSConnectionBanner()
 * LSConnectionBanner(message: "Offline mode - Changes will sync when connected")
 * LSConnectionBanner(isVisible: hasNetworkIssue)
 * ```
 */
public struct LSConnectionBanner: View {
    @Environment(\.theme) private var theme

    private let message: String
    private let isVisible: Bool

    public init(
        message: String = "Connection Required - Some features may be limited",
        isVisible: Bool = true
    ) {
        self.message = message
        self.isVisible = isVisible
    }

    // MARK: - Body

    public var body some View {
        if isVisible {
            HStack(spacing: 8) {
                // Wifi/exclamation icon on the left
                Image(systemName: "wifi.exclamationmark")
                    .font(.system(size: 20, weight: .medium))
                    .foregroundStyle(Color.white)

                // Message text
                Text(message)
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(Color.white)
                    .frame(maxWidth: .infinity, alignment: .center)
            }
            .frame(maxWidth: .infinity)
            .padding(12)
            .background(theme.colors.warning.default)
            .accessibilityElement(children: .combine)
            .accessibilityLabel("Connection status: \(message)")
        }
    }
}

// MARK: - Preview

#Preview("ConnectionBanner - Default") {
    VStack(spacing: 0) {
        LSConnectionBanner()

        Spacer()

        Text("App content goes here")
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(Color.gray.opacity(0.1))
    }
    .laneShadowTheme()
}

#Preview("ConnectionBanner - Custom Message") {
    VStack(spacing: 0) {
        LSConnectionBanner(message: "Offline mode - Changes will sync when connected")

        Spacer()

        Text("App content goes here")
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(Color.gray.opacity(0.1))
    }
    .laneShadowTheme()
}

#Preview("ConnectionBanner - Hidden") {
    VStack(spacing: 0) {
        LSConnectionBanner(isVisible: false)

        Spacer()

        Text("Banner is hidden - app content shows normally")
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(Color.gray.opacity(0.1))
    }
    .laneShadowTheme()
}

#Preview("ConnectionBanner - Dark Mode") {
    VStack(spacing: 0) {
        LSConnectionBanner()

        Spacer()

        Text("Dark mode content")
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(Color.black)
    }
    .laneShadowTheme()
    .preferredColorScheme(.dark)
}
