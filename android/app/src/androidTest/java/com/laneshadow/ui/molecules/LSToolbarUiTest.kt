package com.laneshadow.ui.molecules

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.unit.dp
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.laneshadow.theme.LaneShadowTheme
import com.laneshadow.theme.generated.LaneShadowTheme.IconName
import org.junit.Assert.assertEquals
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
        var toolbarWithInsetsBounds: Rect = Rect.Zero
        var toolbarNoInsetsBounds: Rect = Rect.Zero
        var injectedTopInsetPx by mutableIntStateOf(0)

        composeTestRule.setContent {
            LaneShadowTheme {
                val density = LocalDensity.current
                injectedTopInsetPx = with(density) { 24.dp.roundToPx() }

                Box(modifier = Modifier.fillMaxSize()) {
                    Column {
                        LSToolbar(
                            leading = LSToolbarLeading.Back(onClick = {}),
                            title = "Insets",
                            trailing = LSToolbarTrailing.Action(icon = IconName.Menu, onClick = {}),
                            modifier = Modifier.testTag("toolbar-insets"),
                            windowInsets = WindowInsets(0, injectedTopInsetPx, 0, 0),
                        )

                        LSToolbar(
                            leading = LSToolbarLeading.Back(onClick = {}),
                            title = "No Insets",
                            trailing = LSToolbarTrailing.Action(icon = IconName.Menu, onClick = {}),
                            modifier = Modifier.testTag("toolbar-no-insets"),
                            windowInsets = WindowInsets(0, 0, 0, 0),
                        )
                    }
                }
            }
        }

        toolbarWithInsetsBounds = composeTestRule.onNodeWithTag("toolbar-insets").fetchSemanticsNode().boundsInRoot
        toolbarNoInsetsBounds = composeTestRule.onNodeWithTag("toolbar-no-insets").fetchSemanticsNode().boundsInRoot

        val extraHeightFromInsets = toolbarWithInsetsBounds.height - toolbarNoInsetsBounds.height

        assertTrue("test must inject a positive top inset", injectedTopInsetPx > 0)
        assertEquals(
            "toolbar height delta must equal injected top system inset",
            injectedTopInsetPx.toFloat(),
            extraHeightFromInsets,
            1.0f,
        )
    }
}
