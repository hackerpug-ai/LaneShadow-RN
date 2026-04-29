package com.laneshadow.navigation

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
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.testTagsAsResourceId
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.navigation
import androidx.navigation.compose.rememberNavController
import com.laneshadow.ui.AuthViewModel

@Composable
fun AuthNavGraph(
    navController: NavHostController = rememberNavController(),
    authViewModel: AuthViewModel,
) {
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
                SignInRoute(
                    onSignIn = authViewModel::signIn,
                    onGoogleSignIn = authViewModel::signInWithGoogle,
                    onAppleSignIn = authViewModel::signInWithApple,
                    onNavigateToSignUp = { navController.navigate(Route.SignUp) },
                )
            }
            composable<Route.SignUp> {
                SignUpRoute(
                    onSignUp = authViewModel::signUp,
                    onNavigateToVerify = { navController.navigate(Route.Verify) },
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
private fun SignInRoute(
    onSignIn: (String, String) -> Unit,
    onGoogleSignIn: () -> Unit,
    onAppleSignIn: () -> Unit,
    onNavigateToSignUp: () -> Unit,
) {
    var email by rememberSaveable { mutableStateOf("") }
    var password by rememberSaveable { mutableStateOf("") }

    Column(modifier = Modifier.fillMaxSize()) {
        Text(text = "Sign in", style = MaterialTheme.typography.headlineSmall)
        OutlinedTextField(value = email, onValueChange = { email = it }, label = { Text("Email") })
        OutlinedTextField(value = password, onValueChange = { password = it }, label = { Text("Password") })
        Button(onClick = { onSignIn(email, password) }) { Text("Sign in") }
        Button(onClick = onGoogleSignIn) { Text("Continue with Google") }
        Button(onClick = onAppleSignIn) { Text("Continue with Apple") }
        Button(onClick = onNavigateToSignUp) { Text("Create account") }
    }
}

@Composable
private fun SignUpRoute(
    onSignUp: (String, String, String) -> Unit,
    onNavigateToVerify: () -> Unit,
) {
    var name by rememberSaveable { mutableStateOf("") }
    var email by rememberSaveable { mutableStateOf("") }
    var password by rememberSaveable { mutableStateOf("") }

    Column(modifier = Modifier.fillMaxSize()) {
        Text(text = "Sign up", style = MaterialTheme.typography.headlineSmall)
        OutlinedTextField(value = name, onValueChange = { name = it }, label = { Text("Name") })
        OutlinedTextField(value = email, onValueChange = { email = it }, label = { Text("Email") })
        OutlinedTextField(value = password, onValueChange = { password = it }, label = { Text("Password") })
        Button(onClick = {
            onSignUp(email, password, name)
            onNavigateToVerify()
        }) { Text("Create account") }
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
