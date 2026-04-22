package com.laneshadow.ui.atoms

import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.laneshadow.theme.LaneShadowTheme
import com.laneshadow.theme.generated.LaneShadowTheme.IconName
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class LSIconCatalogInstrumentationTest {
    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    @OptIn(ExperimentalLayoutApi::class)
    fun icon_catalog_renders_all_25_names_without_crash() {
        composeTestRule.setContent {
            LaneShadowTheme {
                FlowRow {
                    IconName.entries.forEach { iconName ->
                        LSIcon(
                            name = iconName,
                            modifier = Modifier.testTag("catalog-icon"),
                        )
                    }
                }
            }
        }

        composeTestRule.onAllNodesWithTag("catalog-icon")
            .assertCountEquals(IconName.entries.size)
    }
}
