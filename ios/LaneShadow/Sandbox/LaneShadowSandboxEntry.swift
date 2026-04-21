// native-sandbox: configured
import LaneShadowTheme
import NativeSandbox
import SwiftUI

struct LaneShadowSandboxEntry: View {
    let selectedStoryId: String?
    @State private var activeStoryId: String?

    init(selectedStoryId: String? = nil) {
        self.selectedStoryId = selectedStoryId
        _activeStoryId = State(initialValue: selectedStoryId)
    }

    var body: some View {
        Group {
            if let story = LaneShadowStories.all.first(where: { $0.id == activeStoryId }) {
                LaneShadowSandboxStoryDetail(
                    story: story,
                    onBack: { activeStoryId = nil }
                )
            } else {
                SandboxRoot(
                    stories: LaneShadowStories.all,
                    themeController: LaneShadowThemeController.shared,
                    previewWrapper: { content in
                        AnyView(content.laneShadowTheme())
                    }
                )
            }
        }
        .onChange(of: selectedStoryId) { newValue in
            activeStoryId = newValue
        }
    }
}

private struct LaneShadowSandboxStoryDetail: View {
    @Environment(\.theme) private var theme

    let story: Story
    let onBack: () -> Void

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: theme.space.lg) {
                    VStack(alignment: .leading, spacing: theme.space.xs) {
                        Text(story.component)
                            .font(theme.type.label.sm.font)
                            .foregroundStyle(theme.colors.onSurface.default.opacity(0.72))

                        Text(story.name)
                            .font(theme.type.heading.md.font)
                            .foregroundStyle(theme.colors.onSurface.default)

                        if let summary = story.summary {
                            Text(summary)
                                .font(theme.type.body.md.font)
                                .foregroundStyle(theme.colors.onSurface.default.opacity(0.72))
                        }

                        Text(story.id)
                            .font(theme.type.label.sm.font.monospaced())
                            .foregroundStyle(theme.colors.onSurface.default.opacity(0.72))
                    }

                    Text("PREVIEW")
                        .font(theme.type.label.sm.font.weight(.semibold))
                        .foregroundStyle(theme.colors.onSurface.default.opacity(0.72))

                    AnyView(
                        story.render(story.initialArgs)
                            .padding(theme.space.lg)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .laneShadowTheme()
                    )
                    .frame(maxWidth: .infinity, minHeight: 200, alignment: .leading)
                    .background(theme.colors.surfaceVariant.default)
                    .overlay {
                        RoundedRectangle(cornerRadius: theme.radius.lg, style: .continuous)
                            .stroke(theme.colors.border.default, lineWidth: 1)
                    }
                    .clipShape(RoundedRectangle(cornerRadius: theme.radius.lg, style: .continuous))

                    Text("DETAILS")
                        .font(theme.type.label.sm.font.weight(.semibold))
                        .foregroundStyle(theme.colors.onSurface.default.opacity(0.72))

                    HStack {
                        Text("Tier")
                            .font(theme.type.body.md.font)
                            .foregroundStyle(theme.colors.onSurface.default)
                        Spacer()
                        Text(story.tier.title)
                            .font(theme.type.body.md.font)
                            .foregroundStyle(theme.colors.onSurface.default.opacity(0.72))
                    }
                }
                .padding(theme.space.lg)
            }
            .background(theme.colors.surface.default)
            .navigationTitle(story.name)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("All Stories", action: onBack)
                }
            }
        }
        .laneShadowTheme()
    }
}
