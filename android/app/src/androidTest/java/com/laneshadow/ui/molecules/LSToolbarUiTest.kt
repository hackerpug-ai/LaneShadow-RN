package com.laneshadow.ui.molecules

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.laneshadow.theme.LaneShadowTheme
import com.laneshadow.theme.generated.LaneShadowTheme.IconName
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class LSToolbarUiTest {
    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun window_insets_system_bars_respected() {
        var toolbarBounds: Rect = Rect.Zero

        composeTestRule.setContent {
            LaneShadowTheme {
                Box(modifier = Modifier.fillMaxSize()) {
                    LSToolbar(
                        leading = LSToolbarLeading.Back(onClick = {}),
                        title = "Insets",
                        trailing = LSToolbarTrailing.Action(icon = IconName.Menu, onClick = {}),
                        modifier = Modifier.testTag("toolbar-insets"),
                    )
                }
            }
        }

        composeTestRule.onNodeWithTag("toolbar-insets").fetchSemanticsNode().let {
            toolbarBounds = it.boundsInRoot
        }

        assertTrue("toolbar top must be padded below status bar", toolbarBounds.top > 0f)
    }
}
