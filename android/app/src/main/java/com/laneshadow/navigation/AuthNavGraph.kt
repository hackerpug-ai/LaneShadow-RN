package com.laneshadow.navigation

import android.net.Uri
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.testTagsAsResourceId
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.navigation
import androidx.navigation.compose.rememberNavController
import com.laneshadow.data.model.AuthState
import com.laneshadow.ui.AuthViewModel
import com.laneshadow.ui.auth.OAuthCallbackScreen
import com.laneshadow.ui.auth.SignInScreen
import com.laneshadow.ui.auth.SignUpScreen

@Composable
fun AuthNavGraph(
    navController: NavHostController = rememberNavController(),
    authViewModel: AuthViewModel,
) {
    var callbackUri by remember { mutableStateOf<Uri?>(null) }
    val authState by authViewModel.authState.collectAsStateWithLifecycle()

    LaunchedEffect(navController) {
        DeepLinkBus.callbacks.collect { uri ->
            callbackUri = uri
            navController.navigate(Route.OAuthCallback)
        }
    }

    LaunchedEffect(authState) {
        if (authState is AuthState.SignedOut && navController.currentDestination?.route == Route.OAuthCallback::class.qualifiedName) {
            navController.navigate(Route.SignIn) {
                popUpTo(Route.OAuthCallback) { inclusive = true }
                launchSingleTop = true
            }
            DeepLinkBus.consumeLatest()
        }
    }

    NavHost(
        navController = navController,
        startDestination = Route.Splash,
        modifier = Modifier.semantics { testTagsAsResourceId = true },
    ) {
        composable<Route.Splash> {
            LaunchedEffect(Unit) {
                navController.navigate(Route.SignIn) {
                    popUpTo(Route.Splash) { inclusive = true }
                }
            }
            Text(text = "Loading", style = MaterialTheme.typography.bodyMedium)
        }
        navigation<Route.SignIn>(startDestination = Route.SignIn) {
            composable<Route.SignIn> {
                SignInScreen(
                    viewModel = authViewModel,
                    onNavigateToSignUp = { navController.navigate(Route.SignUp) },
                )
            }
            composable<Route.SignUp> {
                SignUpScreen(
                    viewModel = authViewModel,
                    onNavigateToSignIn = {
                        navController.navigate(Route.SignIn) {
                            popUpTo(Route.SignUp) { inclusive = true }
                        }
                    },
                )
            }
            composable<Route.OAuthCallback> {
                OAuthCallbackScreen(
                    deepLinkUri = callbackUri,
                    viewModel = authViewModel,
                )
            }
            composable<Route.Verify> {
                VerifyRoute(
                    onVerify = authViewModel::completeSignUpVerification,
                    onNavigateToSignIn = {
                        navController.navigate(Route.SignIn) {
                            popUpTo(Route.SignIn) { inclusive = true }
                        }
                    },
                )
            }
        }
    }
}

@Composable
private fun VerifyRoute(
    onVerify: (String) -> Unit,
    onNavigateToSignIn: () -> Unit,
) {
    var code by rememberSaveable { mutableStateOf("") }

    Column(modifier = Modifier.fillMaxSize()) {
        Text(text = "Verify", style = MaterialTheme.typography.headlineSmall)
        OutlinedTextField(value = code, onValueChange = { code = it }, label = { Text("Verification code") })
        Button(onClick = { onVerify(code) }) { Text("Verify") }
        Button(onClick = onNavigateToSignIn) { Text("Back to sign in") }
    }
}
