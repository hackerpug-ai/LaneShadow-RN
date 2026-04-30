package com.laneshadow.ui.auth

import androidx.compose.runtime.Composable
import androidx.hilt.navigation.compose.hiltViewModel
import com.laneshadow.ui.AuthViewModel
import com.laneshadow.ui.auth.viewmodels.AuthScreenViewModel
import com.laneshadow.ui.auth.viewmodels.SignInViewModel
import com.laneshadow.ui.auth.viewmodels.SignInRouteAuthEmailBranchResolver

@Composable
fun SignInScreen(
    viewModel: AuthViewModel = hiltViewModel(),
    signInViewModel: SignInViewModel = androidx.lifecycle.viewmodel.compose.viewModel(),
    authScreenViewModel: AuthScreenViewModel = androidx.lifecycle.viewmodel.compose.viewModel(
        factory = AuthScreenViewModel.factory(SignInRouteAuthEmailBranchResolver),
    ),
    onNavigateToSignUp: () -> Unit = {},
) {
    AuthScreen(
        viewModel = viewModel,
        authScreenViewModel = authScreenViewModel,
        showBackButton = false,
    )
}
