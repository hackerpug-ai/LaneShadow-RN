package com.laneshadow.ui.atoms

import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.semantics.SemanticsPropertyKey
import androidx.compose.ui.semantics.SemanticsPropertyReceiver
import androidx.compose.ui.semantics.semantics
import com.laneshadow.theme.LaneShadowThemeValues
import com.laneshadow.theme.LocalLaneShadowTheme

internal const val ScrimOpacityTokenPath = "opacity.scrim"

val LSScrimColorKey = SemanticsPropertyKey<Color>("LSScrimColor")
val LSScrimOpacityKey = SemanticsPropertyKey<Float>("LSScrimOpacity")
val LSScrimBlockingKey = SemanticsPropertyKey<Boolean>("LSScrimBlocking")

private var SemanticsPropertyReceiver.lsScrimColor by LSScrimColorKey
private var SemanticsPropertyReceiver.lsScrimOpacity by LSScrimOpacityKey
private var SemanticsPropertyReceiver.lsScrimBlocking by LSScrimBlockingKey

@Composable
fun LSScrim(
    opacity: Float = 0.35f,
    blocking: Boolean = false,
    onTap: (() -> Unit)? = null,
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current
    val resolvedColor = resolvedScrimColor(theme, opacity)

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(resolvedColor)
            .then(
                if (blocking) {
                    Modifier.pointerInput(onTap) {
                        detectTapGestures(onTap = { onTap?.invoke() })
                    }
                } else {
                    Modifier
                }
            )
            .semantics {
                lsScrimColor = resolvedColor
                lsScrimOpacity = resolvedColor.alpha
                lsScrimBlocking = blocking
            },
    )
}

internal fun resolvedScrimColor(theme: LaneShadowThemeValues, opacity: Float): Color {
    val tokenColor = theme.colors.scrim.default
    val tokenOpacity = defaultScrimOpacity(theme)

    return if (opacity == tokenOpacity) {
        tokenColor
    } else {
        tokenColor.copy(alpha = opacity)
    }
}

internal fun defaultScrimOpacity(theme: LaneShadowThemeValues): Float {
    val tokenColor = theme.colors.scrim.default

    return tokenColor.alpha
}
