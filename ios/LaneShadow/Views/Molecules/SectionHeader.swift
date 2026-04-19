import LaneShadowTheme
import SwiftUI

// MARK: - Section Header Component

/**
 * Section header molecule component
 *
 * Section title with optional action button.
 * Following React Native component from react-native/components/ui/section-header.tsx
 *
 * ## Design Tokens Used
 * - Colors:
 *   - Title: `theme.colors.onSurface.default`
 *   - Subtitle: `theme.colors.onSurface.default` with 0.6 opacity
 *   - Action: `theme.colors.primary.default`
 * - Layout:
 *   - HStack: text left, action right
 *   - Spacing between title and subtitle: 4pt
 * - Typography:
 *   - Title: 20pt semibold
 *   - Subtitle: 14pt regular
 *   - Action: 16pt medium
 *
 * ## Parameters
 * - title: Section title text
 * - subtitle: Optional subtitle text
 * - action: Optional action button text
 * - onActionPress: Optional action button callback
 */
public struct LSSectionHeader: View {
    @Environment(\.theme) private var theme

    private let title: String
    private let subtitle: String?
    private let action: String?
    private let onActionPress: (() -> Void)?

    public init(
        title: String,
        subtitle: String? = nil,
        action: String? = nil,
        onActionPress: (() -> Void)? = nil
    ) {
        self.title = title
        self.subtitle = subtitle
        self.action = action
        self.onActionPress = onActionPress
    }

    // MARK: - Body

    public var body: some View {
        HStack(alignment: .top, spacing: theme.space.md) {
            // Title and subtitle (left side)
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.system(size: 20, weight: .semibold))
                    .foregroundStyle(theme.colors.onSurface.default)
                    .accessibilityAddTraits(.isHeader)

                if let subtitle {
                    Text(subtitle)
                        .font(.system(size: 14, weight: .regular))
                        .foregroundStyle(theme.colors.onSurface.default.opacity(0.6))
                }
            }

            Spacer()

            // Optional action button (right side)
            if let action, let onActionPress {
                Button(action: onActionPress) {
                    Text(action)
                        .font(.system(size: 16, weight: .medium))
                        .foregroundStyle(theme.colors.primary.default)
                }
                .buttonStyle(.plain)
                .accessibilityLabel(action)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .accessibilityElement(children: .contain)
    }
}

// MARK: - Preview

#Preview("SectionHeader - Basic") {
    LSSectionHeader(title: "Recent Rides")
        .laneShadowTheme()
        .padding()
}

#Preview("SectionHeader - With Subtitle") {
    LSSectionHeader(
        title: "Near San Francisco",
        subtitle: "5 rides available"
    )
    .laneShadowTheme()
    .padding()
}

#Preview("SectionHeader - With Action") {
    LSSectionHeader(
        title: "Recent Rides",
        action: "See all",
        onActionPress: {
            print("See all tapped")
        }
    )
    .laneShadowTheme()
    .padding()
}

#Preview("SectionHeader - Complete") {
    LSSectionHeader(
        title: "Saved Routes",
        subtitle: "3 routes",
        action: "Edit",
        onActionPress: {
            print("Edit tapped")
        }
    )
    .laneShadowTheme()
    .padding()
}

#Preview("SectionHeader - Dark Theme") {
    LSSectionHeader(
        title: "Popular Routes",
        subtitle: "This week",
        action: "View all",
        onActionPress: {
            print("View all tapped")
        }
    )
    .laneShadowTheme()
    .preferredColorScheme(.dark)
    .padding()
}
