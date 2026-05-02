package com.laneshadow.ui.idle

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.laneshadow.data.chat.ChatRepository
import com.laneshadow.data.session.SessionRepository
import com.laneshadow.data.user.UserRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import java.time.LocalTime
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

@HiltViewModel
class IdleViewModel @Inject constructor(
    private val userRepository: UserRepository,
    private val sessionRepository: SessionRepository,
    private val chatRepository: ChatRepository,
) : ViewModel() {
    private val _state = MutableStateFlow(IdleUiState())
    val state: StateFlow<IdleUiState> = _state.asStateFlow()

    init {
        observeCurrentUser()
        observeSessions()
    }

    fun onInputChange(value: String) {
        _state.update { current ->
            current.copy(
                inputValue = value,
                errorToast = null,
            )
        }
    }

    fun onSuggestionTap(suggestion: SuggestionChip) {
        onInputChange(suggestion.text)
        onSend(suggestion.text)
    }

    fun onSend(content: String) {
        if (content.isBlank()) {
            return
        }

        viewModelScope.launch {
            val createResult = sessionRepository.createSession(content)
            if (createResult.isFailure) {
                _state.update { current ->
                    current.copy(
                        errorToast = createResult.exceptionOrNull()?.message
                            ?: "Unable to start planning.",
                        navigateTo = null,
                    )
                }
                return@launch
            }

            val sessionId = createResult.getOrThrow()
            val sendResult = chatRepository.sendMessage(sessionId, content)
            if (sendResult.isFailure) {
                _state.update { current ->
                    current.copy(
                        errorToast = sendResult.exceptionOrNull()?.message
                            ?: "Unable to send planning request.",
                        navigateTo = null,
                    )
                }
                return@launch
            }

            _state.update { current ->
                current.copy(
                    inputValue = "",
                    errorToast = null,
                    navigateTo = IdleNavTarget.Planning(sessionId),
                )
            }
        }
    }

    fun consumeNavigation() {
        _state.update { current ->
            current.copy(navigateTo = null)
        }
    }

    fun consumeErrorToast() {
        _state.update { current ->
            current.copy(errorToast = null)
        }
    }

    private fun observeCurrentUser() {
        viewModelScope.launch {
            userRepository.subscribeToCurrentUser().collect { user ->
                val displayName = user?.displayName?.takeIf { it.isNotBlank() } ?: "Rider"
                val timeOfDay = timeOfDayLabel(LocalTime.now().hour)
                _state.update { current ->
                    current.copy(
                        greeting = buildGreeting(timeOfDay, displayName),
                        greetingMeta = "READY TO RIDE",
                        greetingEmphasis = displayName,
                        isLoading = false,
                    )
                }
            }
        }
    }

    private fun observeSessions() {
        viewModelScope.launch {
            sessionRepository.subscribeToSessions().collect { sessions ->
                _state.update { current ->
                    current.copy(recentSessions = sessions)
                }
            }
        }
    }
}
