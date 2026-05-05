package com.laneshadow.e2e.auth

import android.content.Context
import android.content.Intent
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.junit4.createEmptyComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performClick
import androidx.test.core.app.ActivityScenario
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.laneshadow.EXTRA_BYPASS_AUTH
import com.laneshadow.EXTRA_RESET_AUTH
import com.laneshadow.MainActivity
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Verifies the debug-only "Bypass auth (UI tests only)" entry-stack button:
 *
 *  - When MainActivity is launched with EXTRA_BYPASS_AUTH = true, the button
 *    renders inline with the three OAuth/email buttons and tapping it
 *    short-circuits the Clerk flow into the authenticated MainNavGraph.
 *  - Without the extra, the button must NOT render so production builds and
 *    real-auth E2E suites are unaffected.
 *
 * Companion to the iOS AuthBypassE2ETests at
 * `ios/LaneShadowUITests/Auth/AuthBypassE2ETests.swift`.
 */
@RunWith(AndroidJUnit4::class)
class AuthBypassE2ETest {

    @get:Rule
    val composeRule = createEmptyComposeRule()

    @Test
    fun bypassButtonRendersAndShortCircuitsAuth() {
        ActivityScenario.launch<MainActivity>(launchIntent(bypassAuth = true)).use {
            composeRule.waitUntil(timeoutMillis = 10_000) {
                composeRule
                    .onAllNodes(hasTestTag("auth_bypass_button"), useUnmergedTree = false)
                    .fetchSemanticsNodes(atLeastOneRootRequired = false)
                    .isNotEmpty()
            }

            composeRule.onNodeWithTag("auth_bypass_button").assertIsDisplayed()
            composeRule.onNodeWithTag("auth_bypass_button").performClick()

            composeRule.waitUntil(timeoutMillis = 10_000) {
                composeRule
                    .onAllNodes(hasTestTag("auth_screen"))
                    .fetchSemanticsNodes(atLeastOneRootRequired = false)
                    .isEmpty()
            }
        }
    }

    @Test
    fun bypassButtonHiddenWithoutLaunchExtra() {
        ActivityScenario.launch<MainActivity>(launchIntent(bypassAuth = false)).use {
            composeRule.waitUntil(timeoutMillis = 10_000) {
                composeRule
                    .onAllNodes(hasTestTag("auth_screen"))
                    .fetchSemanticsNodes(atLeastOneRootRequired = false)
                    .isNotEmpty()
            }

            composeRule.onNodeWithTag("auth_continue_with_email").assertIsDisplayed()

            val bypassNodes = composeRule
                .onAllNodes(hasTestTag("auth_bypass_button"))
                .fetchSemanticsNodes(atLeastOneRootRequired = false)
            check(bypassNodes.isEmpty()) {
                "Expected the bypass button to be hidden when EXTRA_BYPASS_AUTH is unset, but it was rendered."
            }
        }
    }

    private fun launchIntent(bypassAuth: Boolean): Intent {
        val context = ApplicationProvider.getApplicationContext<Context>()
        return Intent(context, MainActivity::class.java)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
            .putExtra(EXTRA_RESET_AUTH, true)
            .putExtra(EXTRA_BYPASS_AUTH, bypassAuth)
    }
}
