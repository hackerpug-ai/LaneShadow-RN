import LaneShadowTheme
import SwiftUI

struct ThemeCollapsible<Header: View, Content: View>: View {
    @Environment(\.theme) private var theme

    @Binding var isOpen: Bool
    let accessibilityLabel: String?
    @ViewBuilder let header: () -> Header
    @ViewBuilder let content: () -> Content

    init(
        isOpen: Binding<Bool>,
        accessibilityLabel: String? = nil,
        @ViewBuilder header: @escaping () -> Header,
        @ViewBuilder content: @escaping () -> Content
    ) {
        _isOpen = isOpen
        self.accessibilityLabel = accessibilityLabel
        self.header = header
        self.content = content
    }

    var body: some View {
        VStack(alignment: .leading, spacing: theme.space.sm) {
            Button {
                isOpen.toggle()
            } label: {
                HStack(spacing: theme.space.sm) {
                    ThemeIcon(
                        name: isOpen ? "chevron-down" : "chevron-right",
                        size: theme.space.md,
                        color: theme.colors.muted.default
                    )
                    header()
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
            }
            .buttonStyle(.plain)

            if isOpen {
                content()
                    .padding(.leading, theme.space.xl)
                    .transition(.opacity.combined(with: .move(edge: .top)))
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .animation(.easeInOut(duration: 0.18), value: isOpen)
        .accessibilityElement(children: .contain)
        .accessibilityLabel(accessibilityLabel ?? "ThemeCollapsible")
    }
}
