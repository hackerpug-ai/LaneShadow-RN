package com.laneshadow.ui.auth

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.laneshadow.data.model.AuthState
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.ui.AuthViewModel
import com.laneshadow.ui.atoms.ButtonState
import com.laneshadow.ui.atoms.ButtonVariant
import com.laneshadow.ui.atoms.ContentColor
import com.laneshadow.ui.atoms.LSButton
import com.laneshadow.ui.atoms.LSSpinner
import com.laneshadow.ui.atoms.LSText
import com.laneshadow.ui.atoms.SpinnerSize
import com.laneshadow.ui.atoms.TypographyVariant
import com.laneshadow.ui.molecules.LSFormField
import com.laneshadow.ui.organisms.LSInlineErrorCallout

@Composable
fun SignUpScreen(
    viewModel: AuthViewModel = hiltViewModel(),
    onNavigateToSignIn: () -> Unit = {},
) {
    val theme = LocalLaneShadowTheme.current
    val authState by viewModel.authState.collectAsStateWithLifecycle()
    var name by rememberSaveable { mutableStateOf("") }
    var email by rememberSaveable { mutableStateOf("") }
    var password by rememberSaveable { mutableStateOf("") }
    var confirmPassword by rememberSaveable { mutableStateOf("") }
    var authError by rememberSaveable { mutableStateOf<String?>(null) }

    val isSubmitting = authState is AuthState.Loading
    val isEmailValid = email.isBlank() || (email.contains('@') && email.contains('.'))

    val passwordsMatch = password.isNotBlank() && password == confirmPassword
    val canSubmit =
        passwordsMatch &&
            email.isNotBlank() &&
            name.isNotBlank() &&
            isEmailValid &&
            !isSubmitting

    LaunchedEffect(authState) {
        authError = when (val state = authState) {
            is AuthState.Error -> state.message
            else -> null
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(theme.space.lg),
        verticalArrangement = Arrangement.spacedBy(theme.space.md),
    ) {
        LSText(
            text = "Create Account",
            variant = TypographyVariant.Opinion.Lg,
            color = ContentColor.Primary,
        )

        authError?.let { message ->
            LSInlineErrorCallout(
                body = message,
                onSuggestionTap = {},
                modifier = Modifier.fillMaxWidth(),
            )
        }

        LSFormField(
            label = "Name",
            value = name,
            onValueChange = { name = it },
            placeholder = "Avery Rider",
            keyboardOptions = KeyboardOptions(imeAction = ImeAction.Next),
        )
        LSFormField(
            label = "Email",
            value = email,
            onValueChange = {
                email = it
                authError = null
            },
            placeholder = "rider@laneshadow.com",
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email, imeAction = ImeAction.Next),
        )
        if (email.isNotBlank() && !isEmailValid) {
            LSInlineErrorCallout(
                body = "Enter a valid email address.",
                onSuggestionTap = {},
                modifier = Modifier.fillMaxWidth(),
            )
        }
        LSFormField(
            label = "Password",
            value = password,
            onValueChange = { password = it },
            placeholder = "Create a password",
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password, imeAction = ImeAction.Next),
            visualTransformation = PasswordVisualTransformation(),
        )
        LSFormField(
            label = "Confirm password",
            value = confirmPassword,
            onValueChange = { confirmPassword = it },
            placeholder = "Re-enter your password",
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password, imeAction = ImeAction.Done),
            visualTransformation = PasswordVisualTransformation(),
        )

        LSButton(
            label = "Create account",
            variant = ButtonVariant.Primary,
            state = if (canSubmit) ButtonState.Default else ButtonState.Disabled,
            onClick = { viewModel.signUp(email = email, password = password, name = name) },
            modifier = Modifier.fillMaxWidth(),
        )

        if (isSubmitting) {
            LSSpinner(size = SpinnerSize.Md)
        }

        LSButton(
            label = "Back to sign in",
            variant = ButtonVariant.Ghost,
            onClick = onNavigateToSignIn,
            modifier = Modifier.fillMaxWidth(),
        )
    }
}
