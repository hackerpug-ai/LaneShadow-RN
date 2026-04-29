package com.laneshadow.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
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
}

@Composable
fun LaneShadowApp(authViewModel: AuthViewModel = hiltViewModel()) {
    val authState by authViewModel.authState.collectAsStateWithLifecycle()
    val navController = rememberNavController()

    when (authState) {
        is AuthState.Loading -> SplashScreen()
        is AuthState.SignedIn -> MainNavGraph(navController = navController, authViewModel = authViewModel)
        AuthState.SignedOut,
        is AuthState.OAuthPending,
        AuthState.VerificationRequired,
        is AuthState.Error,
        -> AuthNavGraph(navController = navController, authViewModel = authViewModel)
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
