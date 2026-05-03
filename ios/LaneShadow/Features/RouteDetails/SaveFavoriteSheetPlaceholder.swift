import LaneShadowTheme
import SwiftUI

/// SaveFavoriteSheetPlaceholder — minimal entry point for saving a favorite route.
///
/// This is a V3 placeholder. The full SaveFavoriteSheet implementation ships in Sprint 05.
/// This placeholder provides the presentation entry point and basic structure.
@MainActor
struct SaveFavoriteSheetPlaceholder: View {
    @Environment(\.dismiss) var dismiss
    @Environment(\.theme) private var theme

    var body: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: theme.space.md) {
                LSText("Save Route", variant: .label.lg, color: .primary)
                    .padding(.horizontal, theme.space.lg)
                    .padding(.top, theme.space.lg)

                Divider()
                    .padding(.vertical, theme.space.sm)

                LSText(
                    "Save this route to your library for quick access later.",
                    variant: .body.sm,
                    color: .secondary
                )
                .padding(.horizontal, theme.space.lg)

                Spacer()

                HStack(spacing: theme.space.sm) {
                    Button(action: { dismiss() }) {
                        Text("Cancel")
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, theme.space.sm)
                            .foregroundStyle(theme.colors.onSurface.default)
                    }
                    .buttonStyle(.bordered)

                    Button(action: { dismiss() }) {
                        Text("Save")
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, theme.space.sm)
                            .foregroundStyle(theme.colors.onPrimary.default)
                            .background(theme.colors.primary.default)
                            .cornerRadius(theme.radius.sm)
                    }
                }
                .padding(.horizontal, theme.space.lg)
                .padding(.bottom, theme.space.lg)
            }
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}
