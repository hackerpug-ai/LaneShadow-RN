// native-sandbox: configured
package com.laneshadow

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import com.laneshadow.theme.LaneShadowTheme
import com.laneshadow.theme.LocalLaneShadowTheme

class MainActivity : ComponentActivity() {
    private var currentIntent: android.content.Intent? by mutableStateOf(null)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
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
                    LaneShadowAppContent(deploymentId = BuildConfig.CONVEX_DEPLOYMENT)
                }
            }
        }
    }

    override fun onNewIntent(intent: android.content.Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        currentIntent = intent
    }
}


@Composable
internal fun LaneShadowAppContent(deploymentId: String) {
    val theme = LocalLaneShadowTheme.current
    Surface(modifier = Modifier.fillMaxSize(), color = theme.colors.background.default) {
        Column(
            modifier = Modifier.fillMaxSize().padding(theme.space.xl),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text(
                text = "LaneShadow placeholder",
                style = theme.type.heading.md,
                color = theme.colors.onSurface.default,
            )
            Text(
                text = "hello:get value",
                style = theme.type.body.md,
                color = theme.colors.onSurface.default,
            )
            Text(
                text = if (deploymentId.isBlank()) "deployment: missing" else "deployment: $deploymentId",
                style = theme.type.body.sm,
                color = theme.colors.onSurface.default,
            )
        }
    }
}

@Preview(showBackground = true)
@Composable
private fun LaneShadowAppContentPreview() {
    LaneShadowTheme {
        LaneShadowAppContent(deploymentId = "dev:quirky-panther-164")
    }
}
