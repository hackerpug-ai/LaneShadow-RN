package com.laneshadow.ui.components.molecules

import com.laneshadow.ui.atoms.Glyphs

import android.text.format.DateFormat
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.PressInteraction
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.DatePickerDialog
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TimePicker
import androidx.compose.material3.rememberDatePickerState
import androidx.compose.material3.rememberTimePickerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.ui.components.atoms.IconSymbol
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

/**
 * Formats a date for display in the departure time selector
 * Shows "Today, 2:30 PM" or "Tomorrow, 9:00 AM" or "Mar 15, 2:30 PM"
 *
 * @param millis Time in milliseconds since epoch
 * @param is24Hour Whether to use 24-hour format
 * @return Formatted date string
 */
private fun formatDepartureTime(millis: Long, is24Hour: Boolean): String {
    val now = System.currentTimeMillis()
    val calendar = Calendar.getInstance()

    val todayCalendar = Calendar.getInstance().apply {
        set(Calendar.HOUR_OF_DAY, 0)
        set(Calendar.MINUTE, 0)
        set(Calendar.SECOND, 0)
        set(Calendar.MILLISECOND, 0)
    }

    val tomorrowCalendar = Calendar.getInstance().apply {
        timeInMillis = todayCalendar.timeInMillis
        add(Calendar.DAY_OF_YEAR, 1)
    }

    val targetCalendar = Calendar.getInstance().apply {
        timeInMillis = millis
        set(Calendar.SECOND, 0)
        set(Calendar.MILLISECOND, 0)
    }

    // Time format
    val timeFormat = if (is24Hour) {
        "HH:mm"
    } else {
        "h:mm a"
    }
    val timeStr = SimpleDateFormat(timeFormat, Locale.getDefault()).format(Date(millis))

    return when {
        targetCalendar.timeInMillis == todayCalendar.timeInMillis -> "Today, $timeStr"
        targetCalendar.timeInMillis == tomorrowCalendar.timeInMillis -> "Tomorrow, $timeStr"
        else -> {
            val dateFormat = SimpleDateFormat("MMM d", Locale.getDefault())
            "${dateFormat.format(Date(millis))}, $timeStr"
        }
    }
}

/**
 * DepartureTimeSelector molecule component
 *
 * Date/time selector for planning ride departure times with styled trigger button.
 * Following React Native wrapper patterns from react-native/components/ui/departure-time-selector.tsx
 *
 * @param value Currently selected departure time (epoch millis)
 * @param onValueChange Callback when time changes (epoch millis)
 * @param label Optional label text (default: "Departure")
 * @param minimumDate Minimum selectable date (epoch millis, default: now)
 * @param modifier Modifier for the component
 * @param testId Test ID for UI testing
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DepartureTimeSelector(
    value: Long,
    onValueChange: (Long) -> Unit,
    label: String = "Departure",
    minimumDate: Long? = null,
    modifier: Modifier = Modifier,
    testId: String? = null,
) {
    val theme = LocalLaneShadowTheme.current
    val context = LocalContext.current
    val is24Hour = DateFormat.is24HourFormat(context)

    // State for date picker
    var showDatePicker by rememberSaveable { mutableStateOf(false) }
    var showTimePicker by rememberSaveable { mutableStateOf(false) }

    // Temporary state for date selection
    var selectedDateMillis by rememberSaveable { mutableStateOf(value) }

    // Pressed state for button visual feedback
    var isPressed by remember { mutableStateOf(false) }

    // Date picker state
    val datePickerState = rememberDatePickerState(
        initialSelectedDateMillis = value,
        selectableDates = object : androidx.compose.material3.SelectableDates {
            override fun isSelectableDate(utcTimeMillis: Long): Boolean {
                val minDate = minimumDate ?: System.currentTimeMillis()
                return utcTimeMillis >= minDate
            }
        }
    )

    // Time picker state
    val timePickerState = rememberTimePickerState(
        initialHour = java.util.Calendar.getInstance().apply {
            timeInMillis = value
        }.get(java.util.Calendar.HOUR_OF_DAY),
        initialMinute = java.util.Calendar.getInstance().apply {
            timeInMillis = value
        }.get(java.util.Calendar.MINUTE),
        is24Hour = is24Hour
    )

    // Handle date picker confirmation
    fun handleDateConfirm() {
        datePickerState.selectedDateMillis?.let { selectedMillis ->
            // Preserve the time from the original selection, only update the date
            val originalCalendar = java.util.Calendar.getInstance().apply {
                timeInMillis = value
            }
            val selectedCalendar = java.util.Calendar.getInstance().apply {
                timeInMillis = selectedMillis
            }

            // Set the selected date but keep the original time
            selectedCalendar.set(java.util.Calendar.HOUR_OF_DAY, originalCalendar.get(java.util.Calendar.HOUR_OF_DAY))
            selectedCalendar.set(java.util.Calendar.MINUTE, originalCalendar.get(java.util.Calendar.MINUTE))
            selectedCalendar.set(java.util.Calendar.SECOND, 0)
            selectedCalendar.set(java.util.Calendar.MILLISECOND, 0)

            selectedDateMillis = selectedCalendar.timeInMillis
            showDatePicker = false
            showTimePicker = true
        }
    }

    // Handle time picker confirmation
    fun handleTimeConfirm() {
        val timeCalendar = java.util.Calendar.getInstance().apply {
            timeInMillis = selectedDateMillis
            set(java.util.Calendar.HOUR_OF_DAY, timePickerState.hour)
            set(java.util.Calendar.MINUTE, timePickerState.minute)
            set(java.util.Calendar.SECOND, 0)
            set(java.util.Calendar.MILLISECOND, 0)
        }
        onValueChange(timeCalendar.timeInMillis)
        showTimePicker = false
    }

    // Interaction source for press detection
    val interactionSource = remember { MutableInteractionSource() }

    LaunchedEffect(interactionSource) {
        interactionSource.interactions.collect { interaction ->
            when (interaction) {
                is PressInteraction.Press -> isPressed = true
                is PressInteraction.Release -> isPressed = false
                is PressInteraction.Cancel -> isPressed = false
            }
        }
    }

    // Build content description for accessibility
    val contentDescription = "$label: ${formatDepartureTime(value, is24Hour)}"

    // Main column layout
    Column(
        modifier = modifier.semantics {
            this.contentDescription = contentDescription
            this.role = Role.Button
        }
    ) {
        // Label text (above the button)
        if (label.isNotEmpty()) {
            Text(
                text = label.uppercase(Locale.getDefault()),
                style = theme.type.label.sm,
                color = theme.colors.onSurface.default.copy(alpha = 0.6f),
                modifier = Modifier
                    .padding(bottom = theme.space.sm)
                    .semantics {
                        this.contentDescription = "$label label"
                    }
            )
        }

        // Trigger button card
        Card(
            shape = androidx.compose.foundation.shape.RoundedCornerShape(theme.radius.md),
            border = BorderStroke(1.dp, theme.colors.border.default),
            colors = CardDefaults.cardColors(
                containerColor = if (isPressed) {
                    theme.colors.primary.default.copy(alpha = 0.12f)
                } else {
                    theme.colors.surface.default
                }
            ),
            onClick = { showDatePicker = true },
            interactionSource = interactionSource,
        ) {
            Row(
                modifier = Modifier
                    .padding(theme.space.md),
                horizontalArrangement = Arrangement.spacedBy(theme.space.sm),
            ) {
                // Clock icon using IconSymbol
                IconSymbol(
                    name = "clock-outline",
                    size = 18.dp,
                    color = theme.colors.primary.default,
                    modifier = Modifier.semantics {
                        this.contentDescription = "clock icon"
                    }
                )

                // Formatted date/time text
                Text(
                    text = formatDepartureTime(value, is24Hour),
                    style = theme.type.body.md,
                    color = theme.colors.onSurface.default,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier
                        .weight(1f)
                        .semantics {
                            this.contentDescription = "selected time: ${formatDepartureTime(value, is24Hour)}"
                        }
                )

                // Chevron icon
                Icon(
                    imageVector = Glyphs.Default.ArrowDropDown,
                    contentDescription = null,
                    tint = theme.colors.primary.default,
                    modifier = Modifier.semantics {
                        this.contentDescription = "expand picker"
                    }
                )
            }
        }
    }

    // Date picker dialog
    if (showDatePicker) {
        DatePickerDialog(
            onDismissRequest = { showDatePicker = false },
            confirmButton = {
                androidx.compose.material3.TextButton(
                    onClick = { handleDateConfirm() }
                ) {
                    Text("OK")
                }
            },
            dismissButton = {
                androidx.compose.material3.TextButton(
                    onClick = { showDatePicker = false }
                ) {
                    Text("Cancel")
                }
            }
        ) {
            androidx.compose.material3.DatePicker(state = datePickerState)
        }
    }

    // Time picker dialog (custom wrapper since TimePickerDialog is not in Material3)
    if (showTimePicker) {
        Dialog(
            onDismissRequest = { showTimePicker = false },
            properties = DialogProperties(
                dismissOnBackPress = true,
                dismissOnClickOutside = true,
                usePlatformDefaultWidth = true
            )
        ) {
            Surface(
                shape = androidx.compose.foundation.shape.RoundedCornerShape(theme.radius.lg),
                color = theme.colors.surface.default,
                tonalElevation = 6.dp
            ) {
                Column(
                    modifier = Modifier.padding(theme.space.lg),
                    verticalArrangement = Arrangement.spacedBy(theme.space.md)
                ) {
                    Text(
                        text = "Select Time",
                        style = theme.type.title.md,
                        color = theme.colors.onSurface.default
                    )

                    TimePicker(state = timePickerState)

                    Row(
                        modifier = Modifier,
                        horizontalArrangement = Arrangement.End
                    ) {
                        androidx.compose.material3.TextButton(
                            onClick = { showTimePicker = false }
                        ) {
                            Text("Cancel")
                        }
                        androidx.compose.material3.TextButton(
                            onClick = { handleTimeConfirm() }
                        ) {
                            Text("OK")
                        }
                    }
                }
            }
        }
    }
}
