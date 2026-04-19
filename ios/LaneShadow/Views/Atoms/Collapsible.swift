import LaneShadowTheme
import SwiftUI

/// Collapsible component - Expandable content section with header
///
/// Following the translation matrix specification:
/// - Header: HStack with 8pt gap (theme.space.sm), center aligned
/// - Icon: 18pt chevron.right SF Symbol, rotates 0→90deg on open via .rotationEffect
/// - Icon color: theme.colors.onSurface.default with 0.7 alpha
/// - Title: theme.colors.onSurface.default, semibold 14pt
/// - Content: shown only when isOpen, 8pt top margin (theme.space.sm), 24pt left indent (theme.space.xl)
/// - Background: theme.colors.surface.default
/// - A11y: .accessibilityIdentifier(testID)
public struct LSCollapsible<Content: View>: View {
    // MARK: - Properties

    @Environment(\.theme) private var theme
    @Binding private var isOpen: Bool

    private let title: String
    private let testID: String?
    private let content: () -> Content

    // MARK: - Initialization

    /// Creates a Collapsible with the given title and content
    /// - Parameters:
    ///   - title: The title text for the collapsible header
    ///   - isOpen: Binding to control open/closed state
    ///   - testID: Test identifier for UI testing
    ///   - content: The collapsible content
    public init(
        _ title: String,
        isOpen: Binding<Bool>,
        testID: String? = nil,
        @ViewBuilder content: @escaping () -> Content
    ) {
        self.title = title
        self._isOpen = isOpen
        self.testID = testID
        self.content = content
    }

    // MARK: - Body

    public var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Header - always visible
            Button {
                withAnimation(.easeInOut(duration: 0.2)) {
                    isOpen.toggle()
                }
            } label: {
                headerContent
            }
            .buttonStyle(.plain)

            // Content - shown only when isOpen
            if isOpen {
                content()
                    .padding(.top, theme.space.sm) // 8pt top margin
                    .padding(.leading, theme.space.xl) // 24pt left indent
                    .transition(.opacity.combined(with: .move(edge: .top)))
            }
        }
        .accessibilityIdentifier(testID ?? "collapsible")
        .accessibilityElement(children: .contain)
        .accessibilityLabel(title)
        .accessibilityValue(isOpen ? "Expanded" : "Collapsed")
        .accessibilityAction {
            withAnimation(.easeInOut(duration: 0.2)) {
                isOpen.toggle()
            }
        }
    }

    // MARK: - Header Content

    private var headerContent: some View {
        HStack(alignment: .center, spacing: theme.space.sm) {
            Text(title)
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(theme.colors.onSurface.default)

            Spacer()

            Image(systemName: "chevron.right")
                .font(.system(size: 18))
                .foregroundStyle(theme.colors.onSurface.default.opacity(0.7))
                .rotationEffect(.degrees(isOpen ? 90 : 0))
                .animation(.easeInOut(duration: 0.2), value: isOpen)
        }
        .frame(maxWidth: .infinity)
        .padding(theme.space.md)
        .background(theme.colors.surface.default)
    }
}

// MARK: - Preview

#Preview("Collapsible - Closed") {
    LSCollapsible("Settings", isOpen: .constant(false)) {
        VStack(alignment: .leading, spacing: 8) {
            Text("Setting 1")
            Text("Setting 2")
            Text("Setting 3")
        }
        .font(.system(size: 14))
    }
    .laneShadowTheme()
    .padding()
}

#Preview("Collapsible - Open") {
    LSCollapsible("Settings", isOpen: .constant(true)) {
        VStack(alignment: .leading, spacing: 8) {
            Text("Setting 1")
            Text("Setting 2")
            Text("Setting 3")
        }
        .font(.system(size: 14))
    }
    .laneShadowTheme()
    .padding()
}

#Preview("Collapsible - Interactive") {
    struct InteractiveExample: View {
        @State private var isOpen1 = false
        @State private var isOpen2 = true
        @State private var isOpen3 = false

        var body: some View {
            VStack(spacing: 16) {
                LSCollapsible("Section 1", isOpen: $isOpen1, testID: "section-1") {
                    Text("Content for section 1")
                        .font(.system(size: 14))
                }

                LSCollapsible("Section 2", isOpen: $isOpen2, testID: "section-2") {
                    Text("Content for section 2")
                        .font(.system(size: 14))
                }

                LSCollapsible("Section 3", isOpen: $isOpen3, testID: "section-3") {
                    Text("Content for section 3")
                        .font(.system(size: 14))
                }
            }
            .laneShadowTheme()
            .padding()
        }
    }

    return InteractiveExample()
}
