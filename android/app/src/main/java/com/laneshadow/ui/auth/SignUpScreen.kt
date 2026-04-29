package com.laneshadow.ui.auth

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.hilt.navigation.compose.hiltViewModel
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.ui.AuthViewModel
import com.laneshadow.ui.atoms.ButtonState
import com.laneshadow.ui.atoms.ButtonVariant
import com.laneshadow.ui.atoms.ContentColor
import com.laneshadow.ui.atoms.LSButton
import com.laneshadow.ui.atoms.LSText
import com.laneshadow.ui.atoms.LSTextField
import com.laneshadow.ui.atoms.TypographyVariant

@Composable
fun SignUpScreen(viewModel: AuthViewModel = hiltViewModel()) {
    val theme = LocalLaneShadowTheme.current
    var name by rememberSaveable { mutableStateOf("") }
    var email by rememberSaveable { mutableStateOf("") }
    var password by rememberSaveable { mutableStateOf("") }
    var confirmPassword by rememberSaveable { mutableStateOf("") }

    val passwordsMatch = password.isNotBlank() && password == confirmPassword

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

        LSTextField(
            value = name,
            onValueChange = { name = it },
            placeholder = "Name",
            keyboardOptions = KeyboardOptions(imeAction = ImeAction.Next),
        )
        LSTextField(
            value = email,
            onValueChange = { email = it },
            placeholder = "Email",
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email, imeAction = ImeAction.Next),
        )
        LSTextField(
            value = password,
            onValueChange = { password = it },
            placeholder = "Password",
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password, imeAction = ImeAction.Next),
        )
        LSTextField(
            value = confirmPassword,
            onValueChange = { confirmPassword = it },
            placeholder = "Confirm password",
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password, imeAction = ImeAction.Done),
        )

        LSButton(
            label = "Create account",
            variant = ButtonVariant.Primary,
            state = if (passwordsMatch && email.isNotBlank() && name.isNotBlank()) {
                ButtonState.Default
            } else {
                ButtonState.Disabled
            },
            onClick = { viewModel.signUp(email = email, password = password, name = name) },
            modifier = Modifier.fillMaxWidth(),
        )
    }
}
