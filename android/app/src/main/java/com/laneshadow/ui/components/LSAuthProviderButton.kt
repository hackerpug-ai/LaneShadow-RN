package com.laneshadow.ui.components

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.laneshadow.theme.generated.LaneShadowTheme.IconName
import com.laneshadow.ui.atoms.ButtonState
import com.laneshadow.ui.atoms.ButtonVariant
import com.laneshadow.ui.atoms.LSButton

enum class AuthProvider {
    Google,
    Apple,
}

@Composable
fun LSAuthProviderButton(
    provider: AuthProvider,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
) {
    LSButton(
        label = when (provider) {
            AuthProvider.Google -> "Continue with Google"
            AuthProvider.Apple -> "Continue with Apple"
        },
        variant = ButtonVariant.Secondary,
        state = if (enabled) ButtonState.Default else ButtonState.Disabled,
        leadingIcon = when (provider) {
            AuthProvider.Google -> IconName.Route
            AuthProvider.Apple -> IconName.Compass
        },
        onClick = onClick,
        modifier = modifier,
    )
}
