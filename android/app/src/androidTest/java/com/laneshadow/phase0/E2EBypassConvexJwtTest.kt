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
 * Verifies that EXTRA_E2E_BYPASS_AUTH produces a real Convex JWT via silent auth:
 *
 * - When MainActivity is launched with EXTRA_E2E_BYPASS_AUTH=true AND
 *   BuildConfig.DEBUG, the app performs Clerk silent-auth using
 *   CLERK_TEST_EMAIL and CLERK_TEST_PASSWORD from BuildConfig.
 *
 * - After successful authentication, authState transitions to SignedIn with
 *   a real user (not synthetic), and MapApp renders with testTag "idlescreen".
 *
 * - The JWT saved to TokenStore is a real Convex-signed token, NOT the stub
 *   "ui-test-jwt" used by bypassForTesting().
 *
 * - This proves that Convex queries will succeed (no 401 from stub token).
 *   The test waits for a Convex-driven greeting element to render as proof.
 */
@RunWith(AndroidJUnit4::class)
class E2EBypassConvexJwtTest {

    @get:Rule
    val composeRule = createEmptyComposeRule()

    @Test
    fun e2eBypassAuthProducesRealConvexJwt() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        val tokenStore = EncryptedTokenStore(context)

        val intent = Intent(context, MainActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
            putExtra(EXTRA_RESET_AUTH, true)
            putExtra(EXTRA_E2E_BYPASS_AUTH, true)
        }

        ActivityScenario.launch<MainActivity>(intent).use {
            // Wait for MapApp to render with idlescreen tag
            composeRule.waitUntil(timeoutMillis = 60_000) {
                composeRule.onAllNodes(hasTestTag("idlescreen"), useUnmergedTree = true)
                    .fetchSemanticsNodes()
                    .isNotEmpty()
            }

            // Verify JWT is NOT the stub token (this would mean bypassForTesting() was used)
            val jwt = runBlocking { tokenStore.readJwt() }
            check(jwt != "ui-test-jwt") {
                "Expected real Convex JWT, but got stub token 'ui-test-jwt'. " +
                    "E2E bypass must use Clerk silent-auth, not bypassForTesting()."
            }

            // Verify JWT is not null/blank (real JWT exists)
            check(!jwt.isNullOrBlank()) {
                "Expected real JWT after e2e bypass, but TokenStore returned null/blank"
            }

            // Wait for Convex-driven greeting element to render as proof that
            // queries succeeded with the real JWT (no 401 errors)
            composeRule.waitUntil(timeoutMillis = 30_000) {
                composeRule.onAllNodes(hasTestTag("idlescreen-current-user-greeting"), useUnmergedTree = true)
                    .fetchSemanticsNodes()
                    .isNotEmpty()
            }
        }
    }
}
