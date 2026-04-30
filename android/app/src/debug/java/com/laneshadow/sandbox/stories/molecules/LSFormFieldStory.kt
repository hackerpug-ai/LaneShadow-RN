package com.laneshadow.sandbox.stories.molecules

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import com.laneshadow.theme.LaneShadowTheme
import com.laneshadow.theme.generated.LaneShadowTheme.IconName
import androidx.compose.ui.text.input.PasswordVisualTransformation
import com.laneshadow.ui.atoms.InputState
import com.laneshadow.ui.molecules.LSFormField
import com.nativesandbox.model.ComponentTier
import com.nativesandbox.model.Story

object LSFormFieldStory {
    val all: List<Story> = listOf(
        Story(
            id = "molecules.formfield.default",
            tier = ComponentTier.Molecule,
            component = "LSFormField",
            name = "Default",
            summary = "Form field in default state with label and input.",
            content = { DefaultFormFieldStory() },
        ),
        Story(
            id = "molecules.formfield.auth",
            tier = ComponentTier.Molecule,
            component = "LSFormField",
            name = "Auth",
            summary = "Auth-ready form state with leading/trailing icons and helper text.",
            content = { AuthFormFieldStory() },
        ),
        Story(
            id = "molecules.formfield.error",
            tier = ComponentTier.Molecule,
            component = "LSFormField",
            name = "Error",
            summary = "Form field with error state showing error message.",
            content = { ErrorFormFieldStory() },
        ),
    )
}

@Composable
private fun DefaultFormFieldStory() {
    LaneShadowTheme {
        StoryColumn {
            var email by remember { mutableStateOf("") }

            LSFormField(
                label = "Email",
                value = email,
                onValueChange = { email = it },
                placeholder = "you@example.com",
            )
        }
    }
}

@Composable
private fun AuthFormFieldStory() {
    LaneShadowTheme {
        StoryColumn {
            var email by remember { mutableStateOf("user@example.com") }
            var password by remember { mutableStateOf("password123") }

            LSFormField(
                label = "Email",
                value = email,
                onValueChange = { email = it },
                placeholder = "you@example.com",
                state = InputState.Focused,
                helper = "Use your account email",
                leadingIcon = IconName.Send,
            )

            LSFormField(
                label = "Password",
                value = password,
                onValueChange = { password = it },
                placeholder = "Enter password",
                leadingIcon = IconName.Sparkle,
                trailingIcon = IconName.Close,
                visualTransformation = PasswordVisualTransformation(),
            )
        }
    }
}

@Composable
private fun ErrorFormFieldStory() {
    LaneShadowTheme {
        StoryColumn {
            var email by remember { mutableStateOf("invalid-email") }

            LSFormField(
                label = "Email",
                value = email,
                onValueChange = { email = it },
                error = "Please enter a valid email address",
                placeholder = "you@example.com",
            )
        }
    }
}

@Composable
private fun StoryColumn(content: @Composable () -> Unit) {
    Column(
        modifier = Modifier.padding(com.laneshadow.theme.LocalLaneShadowTheme.current.space.lg),
        verticalArrangement = Arrangement.spacedBy(com.laneshadow.theme.LocalLaneShadowTheme.current.space.md),
    ) {
        content()
    }
}
