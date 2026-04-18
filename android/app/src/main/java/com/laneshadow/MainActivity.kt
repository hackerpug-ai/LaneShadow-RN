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
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import com.laneshadow.theme.LaneShadowTheme
import com.laneshadow.theme.LocalLaneShadowTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            LaneShadowTheme {
                LaneShadowAppContent(deploymentId = BuildConfig.CONVEX_DEPLOYMENT)
            }
        }
    }
}

@Composable
private fun LaneShadowAppContent(deploymentId: String) {
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
