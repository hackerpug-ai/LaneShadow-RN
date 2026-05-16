package com.laneshadow.phase0

import android.content.Context
import android.content.Intent
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.junit4.createEmptyComposeRule
import androidx.test.core.app.ActivityScenario
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.laneshadow.EXTRA_E2E_BYPASS_AUTH
import com.laneshadow.EXTRA_RESET_AUTH
import com.laneshadow.MainActivity
import com.laneshadow.data.store.EncryptedTokenStore
import kotlinx.coroutines.runBlocking
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Phase 0 proof-of-correctness: EXTRA_E2E_BYPASS_AUTH must establish a real
 * Clerk session (no UI dance) and land the user at MapApp's idle screen.
 *
 * Asserts:
 * - MapApp idle screen renders (testTag "idlescreen")
 * - TokenStore JWT is NOT the stub "ui-test-jwt" (proves e2e path taken,
 *   not the bypassForTesting() sandbox path)
 * - TokenStore JWT is non-null/blank (real JWT present)
 *
 * Out of scope (intentionally):
 * - Convex queries succeeding with the JWT (J2 MapApp Core Loop will assert
 *   Convex-driven content separately)
 * - Auth UI flow itself (owned by Clerk)
 */
@RunWith(AndroidJUnit4::class)
class E2EBypassAuthTest {

    @get:Rule
    val composeRule = createEmptyComposeRule()

    @Test
    fun e2eBypassAuthReachesMapApp() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        val tokenStore = EncryptedTokenStore(context)

        val intent = Intent(context, MainActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
            putExtra(EXTRA_RESET_AUTH, true)
            putExtra(EXTRA_E2E_BYPASS_AUTH, true)
        }

        ActivityScenario.launch<MainActivity>(intent).use {
            // Wait for MapApp idle screen — proves bypass landed authenticated.
            composeRule.waitUntil(timeoutMillis = 60_000) {
                composeRule.onAllNodes(hasTestTag("idlescreen"), useUnmergedTree = true)
                    .fetchSemanticsNodes()
                    .isNotEmpty()
            }

            // Prove the e2e bypass path was taken (not the sandbox stub path).
            val jwt = runBlocking { tokenStore.readJwt() }
            check(jwt != "ui-test-jwt") {
                "Expected real Clerk JWT, but got stub token 'ui-test-jwt'. " +
                    "E2E bypass must use Clerk silent-auth, not bypassForTesting()."
            }
            check(!jwt.isNullOrBlank()) {
                "Expected real JWT after e2e bypass, but TokenStore returned null/blank"
            }
        }
    }
}
