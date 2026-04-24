package com.laneshadow.ui.molecules

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performTouchInput
import androidx.compose.ui.test.swipeDown
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.laneshadow.theme.LaneShadowTheme
import com.laneshadow.ui.atoms.ContentColor
import com.laneshadow.ui.atoms.LSText
import com.laneshadow.ui.atoms.TypographyVariant
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class LSBottomSheetUiTest {
    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun drag_to_dismiss_fires_on_dismiss_once() {
        var dismissCount by mutableIntStateOf(0)

        composeTestRule.setContent {
            LaneShadowTheme {
                var visible by remember { mutableStateOf(true) }

                if (visible) {
                    LSBottomSheet(
                        detent = BottomSheetDetent.Medium,
                        onDismiss = {
                            dismissCount += 1
                            visible = false
                        },
                    ) {
                        LSText(
                            text = "Sheet Content",
                            variant = TypographyVariant.Ui.Body.Md,
                            color = ContentColor.Primary,
                        )
                    }
                }
            }
        }

        composeTestRule.onNodeWithTag(LSBottomSheetSurfaceTag).performTouchInput {
            swipeDown()
        }

        composeTestRule.waitUntil(timeoutMillis = 5_000) {
            dismissCount == 1
        }
        composeTestRule.runOnIdle {
            assertEquals(1, dismissCount)
        }
        assertTrue(
            composeTestRule.onAllNodesWithTag(LSBottomSheetHandleTag).fetchSemanticsNodes().isEmpty(),
        )
    }
}
