// native-sandbox: configured
package com.laneshadow.sandbox

import androidx.compose.runtime.Composable
import com.laneshadow.sandbox.stories.AppStories
import com.laneshadow.theme.LaneShadowTheme
import com.nativesandbox.theming.themedPreview
import com.nativesandbox.views.SandboxRoot

@Composable
fun AppSandbox() {
    SandboxRoot(
        stories = AppStories.all,
        previewWrapper = themedPreview { content -> LaneShadowTheme { content() } },
    )
}
