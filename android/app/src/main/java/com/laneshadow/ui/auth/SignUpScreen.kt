package com.laneshadow.ui.auth

import androidx.compose.runtime.Composable
import androidx.hilt.navigation.compose.hiltViewModel
import com.laneshadow.ui.AuthViewModel
import com.laneshadow.ui.auth.models.AuthScreenStep
import com.laneshadow.ui.auth.models.AuthScreenUiState
import com.laneshadow.ui.auth.viewmodels.SignUpRouteAuthEmailBranchResolver

@Composable
fun SignUpScreen(
    viewModel: AuthViewModel = hiltViewModel(),
    onNavigateToSignIn: () -> Unit = {},
) {
    AuthScreen(
        viewModel = viewModel,
        emailBranchResolver = SignUpRouteAuthEmailBranchResolver,
        initialState = AuthScreenUiState(
            step = AuthScreenStep.NewUser,
            email = "new.rider@laneshadow.com",
        ),
        onBack = onNavigateToSignIn,
    )
}
