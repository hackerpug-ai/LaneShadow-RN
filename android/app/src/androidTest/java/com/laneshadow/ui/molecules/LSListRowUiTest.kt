package com.laneshadow.ui.molecules

import androidx.compose.ui.Modifier
import androidx.compose.foundation.layout.Column
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertHasClickAction
import androidx.compose.ui.test.assertHasNoClickAction
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performClick
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.laneshadow.theme.LaneShadowTheme
import com.laneshadow.theme.generated.LaneShadowTheme.IconName
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class LSListRowUiTest {
    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun tap_callback_fires_once_non_tap_row_has_no_indication() {
        var tapCount = 0

        composeTestRule.setContent {
            LaneShadowTheme {
                Column {
                    LSListRow(
                        title = "Jordan Kim",
                        subtitle = "Ride alerts enabled",
                        leading = LSListRowLeading.Avatar(initials = "JK"),
                        trailing = LSListRowTrailing.Button(label = "Follow"),
                        onTap = { tapCount += 1 },
                        modifier = Modifier.testTag("list-row-interactive"),
                    )

                    LSListRow(
                        title = "Notifications",
                        subtitle = "Ride alerts and mentions",
                        leading = LSListRowLeading.Icon(name = IconName.Menu),
                        trailing = LSListRowTrailing.Chevron,
                        onTap = null,
                        modifier = Modifier.testTag("list-row-static"),
                    )
                }
            }
        }

        composeTestRule.onNodeWithTag("list-row-interactive")
            .assertHasClickAction()
            .assert(SemanticsMatcher.expectValue(SemanticsProperties.Role, Role.Button))
            .performClick()

        composeTestRule.runOnIdle {
            assertEquals(1, tapCount)
        }

        composeTestRule.onNodeWithTag("list-row-static")
            .assertHasNoClickAction()
            .assert(SemanticsMatcher.keyNotDefined(SemanticsProperties.Role))
    }
}
