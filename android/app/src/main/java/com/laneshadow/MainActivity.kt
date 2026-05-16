// native-sandbox: configured
package com.laneshadow

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import com.laneshadow.navigation.DeepLinkBus
import com.laneshadow.theme.LaneShadowTheme
import com.laneshadow.ui.LaneShadowApp
import dagger.hilt.android.AndroidEntryPoint

const val EXTRA_RESET_AUTH = "com.laneshadow.extra.RESET_AUTH"
const val EXTRA_BYPASS_AUTH = "com.laneshadow.extra.BYPASS_AUTH"
const val EXTRA_E2E_BYPASS_AUTH = "com.laneshadow.extra.E2E_BYPASS_AUTH"

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    private var currentIntent: Intent? by mutableStateOf(null)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        dispatchOAuthCallbackIfPresent(intent)
        currentIntent = intent
        setContent {
            val shouldShowSandbox = if (BuildConfig.DEBUG) {
                SandboxChecker.shouldOpen(currentIntent)
            } else {
                false
            }

            if (shouldShowSandbox) {
                if (BuildConfig.DEBUG) {
                    SandboxChecker.Content(currentIntent)
                }
            } else {
                LaneShadowTheme {
                    LaneShadowApp(
                        resetAuthOnLaunch = shouldResetAuthForTesting(currentIntent),
                        uiTestBypassEnabled = shouldBypassAuthForTesting(currentIntent),
                        e2eBypassEnabled = shouldE2EBypassAuthForTesting(currentIntent),
                    )
                }
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        dispatchOAuthCallbackIfPresent(intent)
        currentIntent = intent
    }

    private fun dispatchOAuthCallbackIfPresent(intent: Intent?) {
        val callbackUri = intent?.data ?: return
        if (callbackUri.scheme == "laneshadow" && callbackUri.host == "oauth-callback") {
            DeepLinkBus.publish(callbackUri)
        }
    }

    private fun shouldResetAuthForTesting(intent: Intent?): Boolean =
        BuildConfig.DEBUG && intent?.getBooleanExtra(EXTRA_RESET_AUTH, false) == true

    private fun shouldBypassAuthForTesting(intent: Intent?): Boolean =
        BuildConfig.DEBUG && intent?.getBooleanExtra(EXTRA_BYPASS_AUTH, false) == true

    private fun shouldE2EBypassAuthForTesting(intent: Intent?): Boolean =
        BuildConfig.DEBUG && intent?.getBooleanExtra(EXTRA_E2E_BYPASS_AUTH, false) == true
}
