import LaneShadowTheme
import SwiftUI

// MARK: - App Header Component

/**
 * App header molecule component
 *
 * Provides a consistent app header with title, optional subtitle, and action areas.
 * Following React Native component from react-native/components/ui/molecules/app-header.tsx
 *
 * ## Design Tokens Used
 * - Colors:
 *   - `theme.colors.surface.default` (background)
 *   - `theme.colors.onSurface.default` (title/subtitle text)
 * - Layout:
 *   - Height: 48-56pt typical
 *   - Padding: horizontal 16pt, vertical 12pt
 *   - Leading icon area: 24pt tappable
 * - Typography:
 *   - Title: 16pt semibold
 *   - Subtitle: 14pt regular with 0.7 opacity
 * - Elevation:
 *   - Shadow radius 4pt, y offset 2pt (when elevated)
 *
 * ## Parameters
 * - title: Header title text
 * - subtitle: Optional subtitle text
 * - leadingIcon: Optional left icon (back, menu, etc.)
 * - trailingContent: Optional right action buttons
 * - elevated: Whether to show shadow (default: false)
 * - onLeadingClick: Optional tap handler for leading icon
 */
public struct LSAppHeader: View {
    @Environment(\.theme) private var theme

    private let title: String
    private let subtitle: String?
    private let leadingIcon: AnyView?
    private let trailingContent: AnyView?
    private let elevated: Bool
    private let onLeadingClick: (() -> Void)?

    public init(
        title: String,
        subtitle: String? = nil,
        leadingIcon: AnyView? = nil,
        trailingContent: AnyView? = nil,
        elevated: Bool = false,
        onLeadingClick: (() -> Void)? = nil
    ) {
        self.title = title
        self.subtitle = subtitle
        self.leadingIcon = leadingIcon
        self.trailingContent = trailingContent
        self.elevated = elevated
        self.onLeadingClick = onLeadingClick
    }

    // MARK: - Body

    public var body: some View {
        HStack(alignment: .center) {
            // Leading icon area
            if let leadingIcon {
                Button(action: {
                    onLeadingClick?()
                }) {
                    leadingIcon
                        .frame(width: 24, height: 24)
                }
                .buttonStyle(PlainButtonStyle())
            } else {
                Spacer()
                    .frame(width: 24, height: 24)
            }

            Spacer()

            // Title and subtitle
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(theme.colors.onSurface.default)

                if let subtitle {
                    Text(subtitle)
                        .font(.system(size: 14, weight: .regular))
                        .foregroundStyle(theme.colors.onSurface.default.opacity(0.7))
                }
            }

            Spacer()

            // Trailing content area
            if let trailingContent {
                trailingContent
            } else {
                Spacer()
                    .frame(width: 24, height: 24)
            }
        }
        .frame(maxWidth: .infinity)
        .frame(height: 48)
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(theme.colors.surface.default)
        .if(elevated) { view in
            view.shadow(
                color: Color.black.opacity(0.1),
                radius: 4,
                y: 2
            )
        }
    }
}

// MARK: - Conditional View Modifier

private extension View {
    @ViewBuilder
    func `if`(
        _ condition: Bool,
        transform: (Self) -> some View
    ) -> some View {
        if condition {
            transform(self)
        } else {
            self
        }
    }
}

// MARK: - Preview

#Preview("AppHeader - Basic") {
    LSAppHeader(title: "Rides")
        .laneShadowTheme()
}

#Preview("AppHeader - With Subtitle") {
    LSAppHeader(
        title: "Rides",
        subtitle: "Near San Francisco"
    )
    .laneShadowTheme()
}

#Preview("AppHeader - With Leading Icon") {
    LSAppHeader(
        title: "Rides",
        leadingIcon: AnyView(
            Image(systemName: "chevron.left")
                .foregroundStyle(Color.black)
        ),
        onLeadingClick: {
            print("Back tapped")
        }
    )
    .laneShadowTheme()
}

#Preview("AppHeader - With Trailing Content") {
    LSAppHeader(
        title: "Rides",
        trailingContent: AnyView(
            HStack(spacing: 12) {
                Image(systemName: "magnifyingglass")
                Image(systemName: "ellipsis")
            }
            .foregroundStyle(Color.black)
        )
    )
    .laneShadowTheme()
}

#Preview("AppHeader - Complete") {
    LSAppHeader(
        title: "Rides",
        subtitle: "Near San Francisco",
        leadingIcon: AnyView(
            Image(systemName: "chevron.left")
                .foregroundStyle(Color.black)
        ),
        trailingContent: AnyView(
            HStack(spacing: 12) {
                Image(systemName: "magnifyingglass")
                Image(systemName: "ellipsis")
            }
            .foregroundStyle(Color.black)
        ),
        elevated: true,
        onLeadingClick: {
            print("Back tapped")
        }
    )
    .laneShadowTheme()
}
