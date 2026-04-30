package com.laneshadow.ui.auth

import com.google.common.truth.Truth.assertThat
import com.laneshadow.ui.auth.models.AuthScreenStep
import com.laneshadow.ui.auth.viewmodels.AuthScreenViewModel
import org.junit.Test

class AuthScreenViewModelTest {
    @Test
    fun continueFromEmail_rejects_invalid_email_inline() {
        val viewModel = AuthScreenViewModel()

        viewModel.onEmailChanged("elena@hey")
        viewModel.continueFromEmail()

        assertThat(viewModel.uiState.value.step).isEqualTo(AuthScreenStep.EmailEntry)
        assertThat(viewModel.uiState.value.emailError).contains("complete email")
    }

    @Test
    fun continueFromEmail_routes_known_email_to_existingUser() {
        val viewModel = AuthScreenViewModel()

        viewModel.onEmailChanged("elena@ridelaneshadow.com")
        viewModel.continueFromEmail()

        assertThat(viewModel.uiState.value.step).isEqualTo(AuthScreenStep.ExistingUser)
    }

    @Test
    fun continueFromEmail_routes_new_email_to_newUser() {
        val viewModel = AuthScreenViewModel()

        viewModel.onEmailChanged("jamie.miller@hey.com")
        viewModel.continueFromEmail()

        assertThat(viewModel.uiState.value.step).isEqualTo(AuthScreenStep.NewUser)
    }

    @Test
    fun submitting_state_is_explicit() {
        val viewModel = AuthScreenViewModel()

        viewModel.setSubmitting(true)

        assertThat(viewModel.uiState.value.isSubmitting).isTrue()
    }
}
