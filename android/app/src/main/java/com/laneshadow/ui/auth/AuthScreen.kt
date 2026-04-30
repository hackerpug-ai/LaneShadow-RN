package com.laneshadow.ui.auth

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.platform.UriHandler
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.disabled
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.laneshadow.data.model.AuthState
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.theme.generated.LaneShadowTheme as GeneratedTokens
import com.laneshadow.ui.AuthViewModel
import com.laneshadow.ui.atoms.ButtonState
import com.laneshadow.ui.atoms.ButtonVariant
import com.laneshadow.ui.atoms.ContentColor
import com.laneshadow.ui.atoms.DividerOrientation
import com.laneshadow.ui.atoms.IconColor
import com.laneshadow.ui.atoms.IconSize
import com.laneshadow.ui.atoms.InputState
import com.laneshadow.ui.atoms.LSButton
import com.laneshadow.ui.atoms.LSCard
import com.laneshadow.ui.atoms.LSDivider
import com.laneshadow.ui.atoms.LSIcon
import com.laneshadow.ui.atoms.LSSpinner
import com.laneshadow.ui.atoms.LSText
import com.laneshadow.ui.atoms.SpinnerSize
import com.laneshadow.ui.atoms.TypographyVariant
import com.laneshadow.ui.auth.models.AuthScreenStep
import com.laneshadow.ui.auth.models.AuthScreenUiState
import com.laneshadow.ui.auth.viewmodels.AuthEmailBranchResolver
import com.laneshadow.ui.auth.viewmodels.AuthScreenViewModel
import com.laneshadow.ui.auth.viewmodels.SignInRouteAuthEmailBranchResolver
import com.laneshadow.ui.components.AuthProvider
import com.laneshadow.ui.components.LSAuthProviderButton
import com.laneshadow.ui.molecules.LSFormField

internal const val AuthTermsUrl = "https://laneshadow.com/terms"
internal const val AuthPrivacyUrl = "https://laneshadow.com/privacy"

@Composable
fun AuthScreen(
    viewModel: AuthViewModel = hiltViewModel(),
    emailBranchResolver: AuthEmailBranchResolver = SignInRouteAuthEmailBranchResolver,
    authScreenViewModel: AuthScreenViewModel = androidx.lifecycle.viewmodel.compose.viewModel(
        factory = AuthScreenViewModel.factory(emailBranchResolver),
    ),
    initialState: AuthScreenUiState? = null,
    showBackButton: Boolean = true,
    onBack: () -> Unit = {},
    modifier: Modifier = Modifier,
) {
    val uiState by authScreenViewModel.uiState.collectAsStateWithLifecycle()
    val authState by viewModel.authState.collectAsStateWithLifecycle()
    val uriHandler = LocalUriHandler.current
    val onTerms = remember(uriHandler) {
        { openAuthLegalLink(uriHandler, AuthTermsUrl) }
    }
    val onPrivacy = remember(uriHandler) {
        { openAuthLegalLink(uriHandler, AuthPrivacyUrl) }
    }

    LaunchedEffect(initialState) {
        initialState?.let(authScreenViewModel::setPreviewState)
    }

    LaunchedEffect(authState) {
        when (val state = authState) {
            is AuthState.Loading,
            is AuthState.OAuthPending,
            -> authScreenViewModel.setSubmitting(true)
            is AuthState.Error -> authScreenViewModel.setAuthError(state.message)
            AuthState.SignedOut,
            AuthState.VerificationRequired,
            -> authScreenViewModel.setSubmitting(false)
            is AuthState.SignedIn -> authScreenViewModel.setSubmitting(false)
        }
    }

    AuthScreenContent(
        state = uiState,
        showBackButton = showBackButton,
        onBack = onBack,
        onEmailChange = authScreenViewModel::onEmailChanged,
        onPasswordChange = authScreenViewModel::onPasswordChanged,
        onDisplayNameChange = authScreenViewModel::onDisplayNameChanged,
        onContinue = authScreenViewModel::continueFromEmail,
        onEditEmail = authScreenViewModel::backToEmail,
        onSignIn = {
            authScreenViewModel.setSubmitting(true)
            viewModel.signIn(uiState.email, uiState.password)
        },
        onCreateAccount = {
            authScreenViewModel.setSubmitting(true)
            viewModel.signUp(
                email = uiState.email,
                password = uiState.password,
                name = uiState.displayName,
            )
        },
        onApple = viewModel::signInWithApple,
        onGoogle = viewModel::signInWithGoogle,
        onTerms = onTerms,
        onPrivacy = onPrivacy,
        modifier = modifier,
    )
}

internal fun openAuthLegalLink(uriHandler: UriHandler, url: String) {
    uriHandler.openUri(url)
}

@Composable
fun AuthScreenContent(
    state: AuthScreenUiState,
    showBackButton: Boolean = true,
    onBack: () -> Unit = {},
    onEmailChange: (String) -> Unit = {},
    onPasswordChange: (String) -> Unit = {},
    onDisplayNameChange: (String) -> Unit = {},
    onContinue: () -> Unit = {},
    onEditEmail: () -> Unit = {},
    onSignIn: () -> Unit = {},
    onCreateAccount: () -> Unit = {},
    onApple: () -> Unit = {},
    onGoogle: () -> Unit = {},
    onTerms: () -> Unit = {},
    onPrivacy: () -> Unit = {},
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(GeneratedTokens.color.Surface.map)
            .testTag("auth_screen")
            .semantics { contentDescription = "AuthScreen" },
    ) {
        AuthContourBackground(isSubmitting = state.isSubmitting)
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.verticalGradient(
                        colors = listOf(
                            GeneratedTokens.color.Surface.overlay,
                            GeneratedTokens.color.Surface.overlay,
                            GeneratedTokens.color.Surface.glass,
                        ),
                    ),
                ),
        )

        if (showBackButton) {
            BackGlassChip(
                onClick = onBack,
                modifier = Modifier
                    .align(Alignment.TopStart)
                    .padding(top = theme.space.xxl, start = theme.space.md),
            )
        }

        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = theme.space.lg, vertical = theme.space.xxxl),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            LSCard(
                modifier = Modifier
                    .fillMaxWidth()
                    .widthIn(max = AuthCardMaxWidth)
                    .semantics { contentDescription = "Sign in or create account" },
                backgroundColor = GeneratedTokens.color.Surface.card,
                cornerRadius = theme.radius.xl,
                shadowElevation = theme.elevation.light.level4,
                contentPadding = theme.space.lg,
                border = BorderStroke(StrokeWidth, theme.colors.border.default),
            ) {
                Column(
                    verticalArrangement = Arrangement.spacedBy(theme.space.lg),
                ) {
                    BrandBlock()
                    HeaderBlock(state.step, state.isSubmitting)
                    AuthForm(
                        state = state,
                        onEmailChange = onEmailChange,
                        onPasswordChange = onPasswordChange,
                        onDisplayNameChange = onDisplayNameChange,
                        onContinue = onContinue,
                        onEditEmail = onEditEmail,
                        onSignIn = onSignIn,
                        onCreateAccount = onCreateAccount,
                        onApple = onApple,
                        onGoogle = onGoogle,
                    )
                    FooterBlock(
                        step = state.step,
                        onTerms = onTerms,
                        onPrivacy = onPrivacy,
                    )
                }
            }
        }
    }
}

@Composable
private fun BackGlassChip(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current

    androidx.compose.material3.Surface(
        modifier = modifier
            .size(theme.space.xxl)
            .semantics {
                role = Role.Button
                contentDescription = "Back"
            },
        shape = CircleShape,
        color = GeneratedTokens.color.Surface.glass,
        border = BorderStroke(StrokeWidth, theme.colors.border.default.copy(alpha = 0.55f)),
        onClick = onClick,
    ) {
        Box(contentAlignment = Alignment.Center) {
            LSIcon(
                name = GeneratedTokens.IconName.ChevL,
                size = IconSize.Md,
                color = IconColor.Content(ContentColor.Primary),
            )
        }
    }
}

@Composable
private fun BrandBlock() {
    val theme = LocalLaneShadowTheme.current

    Column(verticalArrangement = Arrangement.spacedBy(theme.space.sm)) {
        Box(
            modifier = Modifier
                .size(theme.space.xxxl)
                .background(GeneratedTokens.color.Signal.whisper, RoundedCornerShape(theme.radius.md))
                .semantics { contentDescription = "LaneShadow compass mark" },
            contentAlignment = Alignment.Center,
        ) {
            LSIcon(
                name = GeneratedTokens.IconName.Compass,
                size = IconSize.Lg,
                color = IconColor.Content(ContentColor.Signal),
            )
        }
        LSText(
            text = "LaneShadow",
            variant = TypographyVariant.Ui.Label.Md,
            color = ContentColor.Tertiary,
        )
    }
}

@Composable
private fun HeaderBlock(step: AuthScreenStep, submitting: Boolean) {
    val subhead = when {
        submitting -> "Hold tight - checking your account..."
        step == AuthScreenStep.ExistingUser -> "Enter your password to pick up where you left off."
        step == AuthScreenStep.NewUser -> "Let's create your account so we can save your rides."
        else -> "Sign in or create an account to start planning rides."
    }

    Column(verticalArrangement = Arrangement.spacedBy(LocalLaneShadowTheme.current.space.sm)) {
        androidx.compose.material3.Text(
            text = headlineFor(step),
            style = LocalLaneShadowTheme.current.typography.opinion.xl,
            color = LocalLaneShadowTheme.current.content.primary,
        )
        LSText(
            text = subhead,
            variant = TypographyVariant.Ui.Body.Md,
            color = ContentColor.Secondary,
        )
    }
}

private fun headlineFor(step: AuthScreenStep): AnnotatedString =
    buildAnnotatedString {
        when (step) {
            AuthScreenStep.EmailEntry -> {
                append("Saddle ")
                withStyle(SpanStyle(color = GeneratedTokens.color.Signal.default, fontStyle = FontStyle.Italic)) {
                    append("up.")
                }
            }
            AuthScreenStep.ExistingUser -> {
                append("Welcome ")
                withStyle(SpanStyle(color = GeneratedTokens.color.Signal.default, fontStyle = FontStyle.Italic)) {
                    append("back.")
                }
            }
            AuthScreenStep.NewUser -> {
                append("Set ")
                withStyle(SpanStyle(color = GeneratedTokens.color.Signal.default, fontStyle = FontStyle.Italic)) {
                    append("up")
                }
                append(" shop.")
            }
        }
    }

@Composable
private fun AuthForm(
    state: AuthScreenUiState,
    onEmailChange: (String) -> Unit,
    onPasswordChange: (String) -> Unit,
    onDisplayNameChange: (String) -> Unit,
    onContinue: () -> Unit,
    onEditEmail: () -> Unit,
    onSignIn: () -> Unit,
    onCreateAccount: () -> Unit,
    onApple: () -> Unit,
    onGoogle: () -> Unit,
) {
    val theme = LocalLaneShadowTheme.current
    val disabled = state.isSubmitting
    var passwordVisible by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier.semantics { contentDescription = formDescription(state.step) },
        verticalArrangement = Arrangement.spacedBy(theme.space.md),
    ) {
        if (state.step == AuthScreenStep.EmailEntry) {
            SocialStack(disabled = disabled, onApple = onApple, onGoogle = onGoogle)
            EmailDivider()
        }

        when (state.step) {
            AuthScreenStep.EmailEntry -> {
                LSFormField(
                    label = "Email",
                    value = state.email,
                    onValueChange = onEmailChange,
                    placeholder = "you@example.com",
                    error = state.emailError,
                    state = if (state.emailError != null) InputState.Error else InputState.Default,
                    enabled = !disabled,
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Email,
                        imeAction = ImeAction.Done,
                    ),
                    inputModifier = Modifier.testTag("auth_email_field"),
                )
                PrimaryAuthButton(
                    label = "Continue",
                    submitting = disabled,
                    enabled = state.canContinueFromEmail,
                    onClick = onContinue,
                    modifier = Modifier.testTag("auth_continue_button"),
                )
            }
            AuthScreenStep.ExistingUser -> {
                ExistingEmailRow(
                    email = state.email,
                    tone = ExistingRowTone.Success,
                    onEdit = onEditEmail,
                )
                LSFormField(
                    label = "Password",
                    value = state.password,
                    onValueChange = onPasswordChange,
                    placeholder = "Enter your password",
                    error = state.authError,
                    enabled = !disabled,
                    visualTransformation = if (passwordVisible) {
                        VisualTransformation.None
                    } else {
                        PasswordVisualTransformation()
                    },
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Password,
                        imeAction = ImeAction.Done,
                    ),
                    inputModifier = Modifier.testTag("auth_password_field"),
                )
                SmallLink(text = if (passwordVisible) "Hide password" else "Show password") {
                    passwordVisible = !passwordVisible
                }
                SmallLink(text = "Forgot password?", alignEnd = true, onClick = {})
                PrimaryAuthButton(
                    label = "Sign in",
                    submitting = disabled,
                    enabled = state.canSignIn,
                    onClick = onSignIn,
                    modifier = Modifier.testTag("auth_sign_in_button"),
                )
            }
            AuthScreenStep.NewUser -> {
                ExistingEmailRow(
                    email = state.email,
                    tone = ExistingRowTone.Signal,
                    onEdit = onEditEmail,
                )
                NewAccountPrompt()
                LSFormField(
                    label = "Display name",
                    value = state.displayName,
                    onValueChange = onDisplayNameChange,
                    placeholder = "What should we call you?",
                    helper = "Shown on your saved rides and shared sessions.",
                    enabled = !disabled,
                    keyboardOptions = KeyboardOptions(imeAction = ImeAction.Next),
                    inputModifier = Modifier.testTag("auth_display_name_field"),
                )
                LSFormField(
                    label = "Create password",
                    value = state.password,
                    onValueChange = onPasswordChange,
                    placeholder = "At least 10 characters",
                    helper = "10+ characters with at least one number.",
                    enabled = !disabled,
                    visualTransformation = if (passwordVisible) {
                        VisualTransformation.None
                    } else {
                        PasswordVisualTransformation()
                    },
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Password,
                        imeAction = ImeAction.Done,
                    ),
                    inputModifier = Modifier.testTag("auth_create_password_field"),
                )
                SmallLink(text = if (passwordVisible) "Hide password" else "Show password") {
                    passwordVisible = !passwordVisible
                }
                PrimaryAuthButton(
                    label = "Create account",
                    submitting = disabled,
                    enabled = state.canCreateAccount,
                    onClick = onCreateAccount,
                    modifier = Modifier.testTag("auth_create_account_button"),
                )
            }
        }
    }
}

private fun formDescription(step: AuthScreenStep): String =
    when (step) {
        AuthScreenStep.EmailEntry -> "Sign in or create account"
        AuthScreenStep.ExistingUser -> "Sign in"
        AuthScreenStep.NewUser -> "Create account"
    }

@Composable
private fun SocialStack(
    disabled: Boolean,
    onApple: () -> Unit,
    onGoogle: () -> Unit,
) {
    val theme = LocalLaneShadowTheme.current

    Column(verticalArrangement = Arrangement.spacedBy(theme.space.sm)) {
        LSAuthProviderButton(
            provider = AuthProvider.Apple,
            onClick = onApple,
            modifier = Modifier.fillMaxWidth(),
            enabled = !disabled,
        )
        LSAuthProviderButton(
            provider = AuthProvider.Google,
            onClick = onGoogle,
            modifier = Modifier.fillMaxWidth(),
            enabled = !disabled,
        )
    }
}

@Composable
private fun EmailDivider() {
    val theme = LocalLaneShadowTheme.current

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .semantics { contentDescription = "OR CONTINUE WITH EMAIL" },
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(theme.space.sm),
    ) {
        LSDivider(orientation = DividerOrientation.Horizontal, modifier = Modifier.weight(1f))
        LSText(
            text = "OR CONTINUE WITH EMAIL",
            variant = TypographyVariant.Ui.Label.Sm,
            color = ContentColor.Tertiary,
        )
        LSDivider(orientation = DividerOrientation.Horizontal, modifier = Modifier.weight(1f))
    }
}

@Composable
private fun PrimaryAuthButton(
    label: String,
    submitting: Boolean,
    enabled: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Box(modifier = modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
        LSButton(
            label = if (submitting) "" else label,
            variant = ButtonVariant.Primary,
            state = if (!enabled && !submitting) ButtonState.Disabled else ButtonState.Default,
            onClick = if (submitting || !enabled) {
                {}
            } else {
                onClick
            },
            modifier = Modifier
                .fillMaxWidth()
                .semantics {
                    if (submitting || !enabled) {
                        disabled()
                    }
                },
        )
        if (submitting) {
            LSSpinner(size = SpinnerSize.Md, modifier = Modifier.testTag("auth_cta_spinner"))
        }
    }
}

private enum class ExistingRowTone {
    Success,
    Signal,
}

@Composable
private fun ExistingEmailRow(
    email: String,
    tone: ExistingRowTone,
    onEdit: () -> Unit,
) {
    val theme = LocalLaneShadowTheme.current
    val toneColor = if (tone == ExistingRowTone.Success) theme.colors.success.default else GeneratedTokens.color.Signal.default
    val background = toneColor.copy(alpha = 0.08f)

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(background, RoundedCornerShape(theme.radius.md))
            .padding(horizontal = theme.space.md, vertical = theme.space.sm)
            .semantics { contentDescription = "$email recognized. Edit" },
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(theme.space.sm),
    ) {
        LSIcon(
            name = if (tone == ExistingRowTone.Success) GeneratedTokens.IconName.ChevR else GeneratedTokens.IconName.Plus,
            size = IconSize.Sm,
            color = if (tone == ExistingRowTone.Success) {
                IconColor.Status(com.laneshadow.ui.atoms.StatusColor.Success)
            } else {
                IconColor.Signal
            },
        )
        LSText(
            text = email,
            variant = TypographyVariant.Ui.Body.Sm,
            color = ContentColor.Primary,
            modifier = Modifier.weight(1f),
        )
        SmallLink(text = "Edit", onClick = onEdit)
    }
}

@Composable
private fun NewAccountPrompt() {
    val theme = LocalLaneShadowTheme.current

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(GeneratedTokens.color.Signal.whisper, RoundedCornerShape(theme.radius.lg))
            .padding(theme.space.md)
            .semantics { contentDescription = "Create your password. We do not have an account for this email yet." },
        verticalAlignment = Alignment.Top,
        horizontalArrangement = Arrangement.spacedBy(theme.space.sm),
    ) {
        LSIcon(
            name = GeneratedTokens.IconName.Sparkle,
            size = IconSize.Md,
            color = IconColor.Content(ContentColor.Signal),
        )
        Column(verticalArrangement = Arrangement.spacedBy(theme.space.xs)) {
            LSText(
                text = "Create your password.",
                variant = TypographyVariant.Ui.Label.Md,
                color = ContentColor.Signal,
            )
            LSText(
                text = "We don't have an account for this email yet - let's set one up.",
                variant = TypographyVariant.Ui.Body.Sm,
                color = ContentColor.Primary,
            )
        }
    }
}

@Composable
private fun SmallLink(
    text: String,
    alignEnd: Boolean = false,
    onClick: () -> Unit,
) {
    Box(
        modifier = Modifier.fillMaxWidth(),
        contentAlignment = if (alignEnd) Alignment.CenterEnd else Alignment.CenterStart,
    ) {
        androidx.compose.material3.Surface(
            color = Color.Transparent,
            onClick = onClick,
            modifier = Modifier.semantics {
                role = Role.Button
                contentDescription = text
            },
        ) {
            LSText(
                text = text,
                variant = TypographyVariant.Ui.Label.Sm,
                color = ContentColor.Signal,
            )
        }
    }
}

@Composable
private fun FooterBlock(
    step: AuthScreenStep,
    onTerms: () -> Unit,
    onPrivacy: () -> Unit,
) {
    val theme = LocalLaneShadowTheme.current

    if (step == AuthScreenStep.ExistingUser) {
        androidx.compose.material3.Text(
            text = "Not your account? Use a different email.",
            style = theme.typography.ui.body.sm,
            color = theme.content.tertiary,
            modifier = Modifier.fillMaxWidth(),
            textAlign = TextAlign.Center,
        )
        return
    }

    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(theme.space.xs),
    ) {
        androidx.compose.material3.Text(
            text = "By continuing, you agree to our",
            style = theme.typography.ui.body.sm,
            color = theme.content.tertiary,
            textAlign = TextAlign.Center,
        )
        Row(
            horizontalArrangement = Arrangement.spacedBy(theme.space.xs),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            FooterLink(text = "Terms", onClick = onTerms)
            androidx.compose.material3.Text(
                text = "&",
                style = theme.typography.ui.body.sm,
                color = theme.content.tertiary,
            )
            FooterLink(text = "Privacy Policy", onClick = onPrivacy)
        }
    }
}

@Composable
private fun FooterLink(
    text: String,
    onClick: () -> Unit,
) {
    val theme = LocalLaneShadowTheme.current

    androidx.compose.material3.Surface(
        color = Color.Transparent,
        onClick = onClick,
        modifier = Modifier.semantics {
            role = Role.Button
            contentDescription = text
        },
    ) {
        androidx.compose.material3.Text(
            text = text,
            style = theme.typography.ui.body.sm,
            color = GeneratedTokens.color.Signal.default,
            textDecoration = TextDecoration.Underline,
        )
    }
}

@Composable
private fun AuthContourBackground(isSubmitting: Boolean) {
    val contourColor = LocalLaneShadowTheme.current.colors.border.default.copy(alpha = if (isSubmitting) 0.20f else 0.32f)

    Canvas(modifier = Modifier.fillMaxSize()) {
        val rows = listOf(0.22f, 0.34f, 0.46f, 0.58f, 0.70f, 0.82f)
        rows.forEachIndexed { index, yFactor ->
            val y = size.height * yFactor
            val path = Path().apply {
                moveTo(-size.width * 0.08f, y)
                cubicTo(
                    size.width * 0.20f,
                    y - 28f,
                    size.width * 0.42f,
                    y + 38f,
                    size.width * 0.62f,
                    y,
                )
                cubicTo(
                    size.width * 0.78f,
                    y - 26f,
                    size.width * 0.92f,
                    y + 18f,
                    size.width * 1.08f,
                    y - 22f,
                )
            }
            drawPath(
                path = path,
                color = contourColor,
                style = Stroke(width = if (index % 2 == 0) 1.4f else 1.0f, cap = StrokeCap.Round),
            )
        }

        drawCircle(
            color = GeneratedTokens.color.Signal.default.copy(alpha = 0.08f),
            radius = size.width * 0.42f,
            center = Offset(size.width * 0.86f, size.height * 0.10f),
        )
    }
}

private val AuthCardMaxWidth = 390.dp
private val StrokeWidth = 1.dp
