package com.laneshadow.ui.components

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import com.laneshadow.ui.atoms.ButtonState
import com.laneshadow.ui.atoms.ButtonVariant
import com.laneshadow.ui.atoms.LSButton

enum class AuthProvider {
    Google,
    Apple,
    Email,
}

@Composable
fun LSAuthProviderButton(
    provider: AuthProvider,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
) {
    val label = when (provider) {
        AuthProvider.Google -> "Continue with Google"
        AuthProvider.Apple -> "Continue with Apple"
        AuthProvider.Email -> "Continue with Email"
    }

    LSButton(
        label = label,
        variant = when (provider) {
            AuthProvider.Google, AuthProvider.Email -> ButtonVariant.Secondary
            AuthProvider.Apple -> ButtonVariant.Primary
        },
        state = if (enabled) ButtonState.Default else ButtonState.Disabled,
        onClick = onClick,
        modifier = modifier.semantics { contentDescription = label },
    )
}
