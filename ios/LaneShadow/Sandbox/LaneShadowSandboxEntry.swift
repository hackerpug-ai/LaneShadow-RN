// native-sandbox: configured
import LaneShadowTheme
import NativeSandbox
import SwiftUI

struct LaneShadowSandboxEntry: View {
    var body: some View {
        SandboxRoot(
            stories: LaneShadowStories.all,
            previewWrapper: themedPreview { $0.laneShadowTheme() }
        )
    }
}
