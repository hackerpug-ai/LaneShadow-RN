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
                    LaneShadowApp()
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
}
