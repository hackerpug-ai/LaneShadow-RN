package com.laneshadow.ui

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.laneshadow.LaneShadowAppContent
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class LoginSmokeTest {
    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun appContentRendersWithoutCrash() {
        composeTestRule.setContent {
            LaneShadowAppContent(deploymentId = "dev:test-deployment")
        }
        composeTestRule.onNodeWithText("LaneShadow placeholder").assertIsDisplayed()
    }

    @Test
    fun appContentShowsDeploymentInfo() {
        composeTestRule.setContent {
            LaneShadowAppContent(deploymentId = "dev:test-deployment")
        }
        composeTestRule.onNodeWithText("deployment: dev:test-deployment").assertIsDisplayed()
    }
}
