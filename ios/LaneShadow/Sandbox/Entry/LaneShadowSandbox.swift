// native-sandbox: configured
import LaneShadowTheme
import NativeSandbox
import SwiftUI

struct LaneShadowSandbox: View {
    var body: some View {
        SandboxRoot(
            stories: LaneShadowStories.all,
            themeController: LaneShadowThemeController.shared,
            previewWrapper: { content in
                AnyView(content.laneShadowTheme())
            }
        )
    }
}

#Preview {
    LaneShadowSandbox()
}
