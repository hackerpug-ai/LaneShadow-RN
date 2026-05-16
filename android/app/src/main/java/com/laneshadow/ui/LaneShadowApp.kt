package com.laneshadow.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.navigation.compose.rememberNavController
import com.laneshadow.data.model.AuthState
import com.laneshadow.data.repository.AuthRepository
import com.laneshadow.navigation.AuthNavGraph
import com.laneshadow.navigation.MainNavGraph
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.ui.atoms.ContentColor
import com.laneshadow.ui.atoms.LSSpinner
import com.laneshadow.ui.atoms.LSText
import com.laneshadow.ui.atoms.SpinnerSize
import com.laneshadow.ui.atoms.TypographyVariant
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val authRepository: AuthRepository,
) : ViewModel() {
    val authState: StateFlow<AuthState> = authRepository.observeAuthState().stateIn(
        scope = viewModelScope,
        started = kotlinx.coroutines.flow.SharingStarted.WhileSubscribed(5000),
        initialValue = AuthState.Loading,
    )

    fun handleOAuthCallback(callbackUri: android.net.Uri) {
        viewModelScope.launch {
            authRepository.handleOAuthCallback(callbackUri)
        }
    }

    fun signIn(email: String, password: String) {
        viewModelScope.launch {
            authRepository.signIn(email = email, password = password)
        }
    }

    fun signUp(email: String, password: String, name: String) {
        viewModelScope.launch {
            authRepository.signUp(email = email, password = password, name = name)
        }
    }

    fun completeSignUpVerification(code: String) {
        viewModelScope.launch {
            authRepository.completeSignUpVerification(code)
        }
    }

    fun signInWithGoogle() {
        viewModelScope.launch {
            authRepository.signInWithGoogle()
        }
    }

    fun signInWithApple() {
        viewModelScope.launch {
            authRepository.signInWithApple()
        }
    }

    fun signOut() {
        viewModelScope.launch {
            authRepository.signOut()
        }
    }

    /**
     * Debug-only short-circuit used by the auth-screen "Bypass auth (UI tests
     * only)" button so test suites can skip past Clerk OAuth without entering
     * real credentials. Caller is responsible for gating this on
     * [BuildConfig.DEBUG] and the test-mode intent extra; the repository will
     * additionally refuse to do anything in release builds.
     */
    fun bypassForTesting() {
        viewModelScope.launch {
            authRepository.bypassForTesting()
        }
    }

    /**
     * E2E-test-only silent auth using real Clerk credentials from BuildConfig.
     * Produces a real Convex JWT suitable for E2E testing that exercises the
     * full auth flow and Convex integration.
     *
     * Caller is responsible for gating this on [BuildConfig.DEBUG] and the
     * EXTRA_E2E_BYPASS_AUTH intent extra; the repository will additionally
     * refuse to do anything in release builds.
     */
    fun e2eBypassWithCredentials() {
        viewModelScope.launch {
            try {
                authRepository.e2eBypassWithCredentials(
                    email = com.laneshadow.BuildConfig.CLERK_TEST_EMAIL,
                    password = com.laneshadow.BuildConfig.CLERK_TEST_PASSWORD,
                )
            } catch (error: Exception) {
                // Log the exception; it will be reflected in the authState
                android.util.Log.e(TAG, "E2E bypass failed", error)
            }
        }
    }
}

@Composable
fun LaneShadowApp(
    resetAuthOnLaunch: Boolean = false,
    uiTestBypassEnabled: Boolean = false,
    e2eBypassEnabled: Boolean = false,
    authViewModel: AuthViewModel = hiltViewModel(),
) {
    val authState by authViewModel.authState.collectAsStateWithLifecycle()
    val navController = rememberNavController()
    var didResetAuth by remember(resetAuthOnLaunch) { mutableStateOf(false) }
    var didE2EBypass by remember(e2eBypassEnabled) { mutableStateOf(false) }

    LaunchedEffect(resetAuthOnLaunch) {
        if (resetAuthOnLaunch && !didResetAuth) {
            didResetAuth = true
            authViewModel.signOut()
        }
    }

    LaunchedEffect(e2eBypassEnabled) {
        if (e2eBypassEnabled && !didE2EBypass) {
            didE2EBypass = true
            authViewModel.e2eBypassWithCredentials()
        }
    }

    when (authState) {
        is AuthState.Loading -> SplashScreen()
        is AuthState.SignedIn -> MainNavGraph(navController = navController, authViewModel = authViewModel)
        AuthState.SignedOut,
        is AuthState.OAuthPending,
        AuthState.VerificationRequired,
        is AuthState.Error,
        -> AuthNavGraph(
            navController = navController,
            authViewModel = authViewModel,
            uiTestBypassEnabled = uiTestBypassEnabled,
        )
    }
}

@Composable
fun SplashScreen() {
    val theme = LocalLaneShadowTheme.current
    Column(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(theme.space.md, Alignment.CenterVertically),
    ) {
        LSSpinner(size = SpinnerSize.Md)
        LSText(
            text = "Loading",
            variant = TypographyVariant.Ui.Body.Md,
            color = ContentColor.Primary,
        )
    }
}

private const val TAG = "AuthViewModel"
