package com.laneshadow.sandbox.stories.templates

import androidx.compose.ui.Modifier
import com.laneshadow.theme.LaneShadowTheme
import com.laneshadow.ui.auth.AuthScreenContent
import com.laneshadow.ui.auth.models.AuthScreenStep
import com.laneshadow.ui.auth.models.AuthScreenUiState
import com.nativesandbox.model.ComponentTier
import com.nativesandbox.model.PreviewMode
import com.nativesandbox.model.Story

object AuthScreenStory {
    val all: List<Story> = listOf(
        authStory(
            id = "templates.auth-screen.email-entry",
            name = "AuthScreen S01 Email Entry",
            state = AuthScreenUiState(),
            darkTheme = false,
        ),
        authStory(
            id = "templates.auth-screen.existing-user",
            name = "AuthScreen S02 Existing User",
            state = AuthScreenUiState(
                step = AuthScreenStep.ExistingUser,
                email = "elena@ridelaneshadow.com",
                password = "saddleback",
            ),
            darkTheme = false,
        ),
        authStory(
            id = "templates.auth-screen.new-user",
            name = "AuthScreen S03 New User",
            state = AuthScreenUiState(
                step = AuthScreenStep.NewUser,
                email = "jamie.miller@hey.com",
                displayName = "Jamie",
                password = "copperride42",
            ),
            darkTheme = false,
        ),
        authStory(
            id = "templates.auth-screen.invalid-email",
            name = "AuthScreen V01 Invalid Email",
            state = AuthScreenUiState(
                email = "elena@hey",
                emailError = "That doesn't look like a complete email address.",
            ),
            darkTheme = false,
        ),
        authStory(
            id = "templates.auth-screen.submitting",
            name = "AuthScreen V02 Submitting",
            state = AuthScreenUiState(
                email = "elena@ridelaneshadow.com",
                isSubmitting = true,
            ),
            darkTheme = false,
        ),
        authStory(
            id = "templates.auth-screen.dark",
            name = "AuthScreen S04 Dark",
            state = AuthScreenUiState(),
            darkTheme = true,
        ),
    )

    private fun authStory(
        id: String,
        name: String,
        state: AuthScreenUiState,
        darkTheme: Boolean,
    ): Story =
        Story(
            id = id,
            tier = ComponentTier.Template,
            component = "AuthScreen",
            name = name,
            summary = "AuthScreen variant compared against .spec/design/system/views/auth-screen/auth-screen.html.",
            previewMode = PreviewMode.FullScreen,
            content = {
                LaneShadowTheme(darkTheme = darkTheme) {
                    AuthScreenContent(
                        state = state,
                        showBackButton = true,
                        modifier = Modifier,
                    )
                }
            },
        )
}
