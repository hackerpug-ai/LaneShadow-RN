package com.laneshadow.ui.atoms

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.size
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.click
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performTouchInput
import androidx.compose.ui.unit.dp
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.laneshadow.theme.LaneShadowTheme
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class LSScrimInstrumentationTest {
    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun scrim_default_passes_touches_through() {
        val scrimTapCount = intArrayOf(0)
        val buttonTapCount = intArrayOf(0)

        composeTestRule.setContent {
            LaneShadowTheme {
                Box(
                    modifier = Modifier
                        .size(width = 320.dp, height = 640.dp)
                        .testTag("host"),
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .clickable { buttonTapCount[0] += 1 }
                            .testTag("underlay"),
                    )

                    LSScrim(
                        onTap = { scrimTapCount[0] += 1 },
                        modifier = Modifier.testTag("scrim"),
                    )
                }
            }
        }

        composeTestRule.onNodeWithTag("host").performTouchInput { click(center) }

        composeTestRule.runOnIdle {
            assertEquals(1, buttonTapCount[0])
            assertEquals(0, scrimTapCount[0])
        }
    }

    @Test
    fun scrim_blocking_intercepts_and_fires_onTap() {
        val scrimTapCount = intArrayOf(0)
        val buttonTapCount = intArrayOf(0)

        composeTestRule.setContent {
            LaneShadowTheme {
                Box(
                    modifier = Modifier
                        .size(width = 320.dp, height = 640.dp)
                        .testTag("host"),
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .clickable { buttonTapCount[0] += 1 }
                            .testTag("underlay"),
                    )

                    LSScrim(
                        blocking = true,
                        onTap = { scrimTapCount[0] += 1 },
                        modifier = Modifier.testTag("scrim"),
                    )
                }
            }
        }

        composeTestRule.onNodeWithTag("host").performTouchInput { click(center) }

        composeTestRule.runOnIdle {
            assertEquals(0, buttonTapCount[0])
            assertEquals(1, scrimTapCount[0])
        }
    }
}
