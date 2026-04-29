package com.laneshadow.ui

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.navigation.compose.rememberNavController
import com.laneshadow.data.model.AuthState
import com.laneshadow.data.repository.AuthRepository
import com.laneshadow.navigation.AuthNavGraph
import com.laneshadow.navigation.DeepLinkBus
import com.laneshadow.navigation.MainNavGraph
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
}

@Composable
fun LaneShadowApp(authViewModel: AuthViewModel = hiltViewModel()) {
    val authState by authViewModel.authState.collectAsState()
    val navController = rememberNavController()

    LaunchedEffect(authViewModel) {
        DeepLinkBus.callbacks.collect { callbackUri ->
            authViewModel.handleOAuthCallback(callbackUri)
        }
    }

    when (authState) {
        is AuthState.Loading,
        is AuthState.OAuthPending,
        AuthState.VerificationRequired,
        is AuthState.Error,
        -> SplashScreen()
        AuthState.SignedOut -> AuthNavGraph(navController)
        is AuthState.SignedIn -> MainNavGraph(navController)
    }
}

@Composable
fun SplashScreen() {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        CircularProgressIndicator()
    }
}
