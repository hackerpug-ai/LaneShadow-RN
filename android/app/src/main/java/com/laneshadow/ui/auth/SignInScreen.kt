package com.laneshadow.ui.auth

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.laneshadow.data.model.AuthState
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.ui.AuthViewModel
import com.laneshadow.ui.atoms.ButtonState
import com.laneshadow.ui.atoms.ButtonVariant
import com.laneshadow.ui.atoms.ContentColor
import com.laneshadow.ui.atoms.LSButton
import com.laneshadow.ui.atoms.LSDivider
import com.laneshadow.ui.atoms.LSSpinner
import com.laneshadow.ui.atoms.LSText
import com.laneshadow.ui.atoms.SpinnerSize
import com.laneshadow.ui.atoms.TypographyVariant
import com.laneshadow.ui.auth.models.SignInStep
import com.laneshadow.ui.auth.viewmodels.SignInViewModel
import com.laneshadow.ui.components.AuthProvider
import com.laneshadow.ui.components.LSAuthProviderButton
import com.laneshadow.ui.molecules.LSFormField
import com.laneshadow.ui.organisms.LSInlineErrorCallout

@Composable
fun SignInScreen(
    viewModel: AuthViewModel = hiltViewModel(),
    signInViewModel: SignInViewModel = androidx.lifecycle.viewmodel.compose.viewModel(),
    onNavigateToSignUp: () -> Unit = {},
) {
    val uiState by signInViewModel.uiState.collectAsStateWithLifecycle()
    val authState by viewModel.authState.collectAsStateWithLifecycle()
    var passwordVisible by remember { mutableStateOf(false) }
    val theme = LocalLaneShadowTheme.current

    LaunchedEffect(authState) {
        when (val state = authState) {
            is AuthState.Loading,
            is AuthState.OAuthPending,
            -> signInViewModel.setLoading(true)
            is AuthState.Error -> signInViewModel.setError(state.message)
            AuthState.SignedOut,
            AuthState.VerificationRequired,
            -> signInViewModel.setLoading(false)
            is AuthState.SignedIn -> signInViewModel.setLoading(false)
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(theme.space.lg),
        verticalArrangement = Arrangement.spacedBy(theme.space.md),
    ) {
        LSText(
            text = "Welcome Back",
            variant = TypographyVariant.Opinion.Lg,
            color = ContentColor.Primary,
        )

        LSText(
            text = "Sign in to continue planning your next ride.",
            variant = TypographyVariant.Ui.Body.Md,
            color = ContentColor.Secondary,
        )

        uiState.error?.let { message ->
            LSInlineErrorCallout(
                body = message,
                onSuggestionTap = {},
                modifier = Modifier.fillMaxWidth(),
            )
        }

        when (uiState.step) {
            SignInStep.Email -> {
                LSFormField(
                    label = "Email",
                    value = uiState.email,
                    onValueChange = signInViewModel::onEmailChanged,
                    placeholder = "rider@laneshadow.com",
                    error = if (uiState.error != null) uiState.error else null,
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Email,
                        imeAction = ImeAction.Next,
                    ),
                )
                LSButton(
                    label = "Continue",
                    variant = ButtonVariant.Primary,
                    state = if (uiState.isLoading) ButtonState.Disabled else ButtonState.Default,
                    onClick = signInViewModel::continueToPassword,
                    modifier = Modifier.fillMaxWidth(),
                )
            }

            SignInStep.Password -> {
                LSFormField(
                    label = "Password",
                    value = uiState.password,
                    onValueChange = signInViewModel::onPasswordChanged,
                    placeholder = "Enter your password",
                    error = if (uiState.error != null) uiState.error else null,
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Password,
                        imeAction = ImeAction.Done,
                    ),
                    visualTransformation = if (passwordVisible) {
                        VisualTransformation.None
                    } else {
                        PasswordVisualTransformation()
                    },
                )

                LSButton(
                    label = if (passwordVisible) "Hide password" else "Show password",
                    variant = ButtonVariant.Ghost,
                    onClick = { passwordVisible = !passwordVisible },
                    modifier = Modifier.fillMaxWidth(),
                )

                LSButton(
                    label = "Sign in",
                    variant = ButtonVariant.Primary,
                    state = if (uiState.isLoading || !uiState.canSubmitPassword) {
                        ButtonState.Disabled
                    } else {
                        ButtonState.Default
                    },
                    onClick = {
                        signInViewModel.setLoading(true)
                        viewModel.signIn(uiState.email, uiState.password)
                    },
                    modifier = Modifier.fillMaxWidth(),
                )

                LSButton(
                    label = "Back",
                    variant = ButtonVariant.Outline,
                    onClick = signInViewModel::backToEmail,
                    modifier = Modifier.fillMaxWidth(),
                )
            }
        }

        if (uiState.isLoading) {
            LSSpinner(size = SpinnerSize.Md)
        }

        LSDivider(modifier = Modifier.fillMaxWidth())

        LSAuthProviderButton(
            provider = AuthProvider.Google,
            onClick = viewModel::signInWithGoogle,
            modifier = Modifier.fillMaxWidth(),
            enabled = !uiState.isLoading,
        )

        LSAuthProviderButton(
            provider = AuthProvider.Apple,
            onClick = viewModel::signInWithApple,
            modifier = Modifier.fillMaxWidth(),
            enabled = !uiState.isLoading,
        )

        LSButton(
            label = "Create account",
            variant = ButtonVariant.Ghost,
            onClick = onNavigateToSignUp,
            modifier = Modifier.fillMaxWidth(),
        )
    }
}
