package com.laneshadow.ui.components.molecules

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LocalLaneShadowTheme

/**
 * Date range preset options
 *
 * Following RN wrapper API from react-native/components/ui/date-range-picker.tsx
 */
enum class DateRangePreset(val label: String, val daysBack: Int?) {
    ALL("All time", null),
    WEEK("Last week", 7),
    MONTH("Last month", 30),
    THREE_MONTHS("Last 3 months", 90),
}

/**
 * Date range data type
 *
 * Following RN wrapper API from react-native/components/ui/date-range-picker.tsx
 */
data class DateRange(
    val afterDate: Long? = null,
    val beforeDate: Long? = null,
)

/**
 * DateRangePicker molecule component
 *
 * Chip-style date range picker with preset options for filtering routes by creation date.
 * Following React Native wrapper patterns from react-native/components/ui/date-range-picker.tsx
 *
 * @param onDateRangeChange Callback when date range changes
 * @param modifier Modifier for the picker container
 * @param testId Test ID for UI testing
 */
@Composable
fun DateRangePicker(
    onDateRangeChange: (DateRange) -> Unit,
    modifier: Modifier = Modifier,
    testId: String? = null,
) {
    val theme = LocalLaneShadowTheme.current

    // State for selected preset (default: ALL)
    var selected by rememberSaveable { mutableStateOf(DateRangePreset.ALL) }

    // Compute date range for a preset
    fun getDateRange(preset: DateRangePreset): DateRange {
        val daysBack = preset.daysBack ?: return DateRange(afterDate = null, beforeDate = null)
        val afterDate = System.currentTimeMillis() - (daysBack * 24 * 60 * 60 * 1000L)
        return DateRange(afterDate = afterDate, beforeDate = null)
    }

    // Handle chip press
    fun handlePress(preset: DateRangePreset) {
        if (preset == DateRangePreset.ALL) {
            selected = DateRangePreset.ALL
            onDateRangeChange(DateRange(afterDate = null, beforeDate = null))
            return
        }
        if (preset == selected) {
            // Toggle off — deselect back to "All time"
            selected = DateRangePreset.ALL
            onDateRangeChange(DateRange(afterDate = null, beforeDate = null))
            return
        }
        selected = preset
        onDateRangeChange(getDateRange(preset))
    }

    // Build semantics
    val pickerModifier = modifier.semantics {
        contentDescription = testId ?: "date-range-picker"
    }

    Surface(
        modifier = pickerModifier,
        color = theme.colors.background.default,
    ) {
        Row(
            modifier = Modifier
                .horizontalScroll(rememberScrollState())
                .padding(horizontal = theme.space.md),
        ) {
            DateRangePreset.entries.forEachIndexed { index, preset ->
                if (index > 0) {
                    // Spacing between chips
                    androidx.compose.foundation.layout.Spacer(modifier = Modifier.width(theme.space.sm))
                }

                val isSelected = selected == preset

                // Chip background color
                val chipBackgroundColor = if (isSelected) {
                    theme.colors.primary.default
                } else {
                    theme.colors.surfaceVariant.default
                }

                // Chip text color
                val chipTextColor = if (isSelected) {
                    theme.colors.onPrimary.default
                } else {
                    theme.colors.onSurface.default
                }

                // Chip border (only for unselected)
                val chipBorder = if (!isSelected) {
                    BorderStroke(1.dp, theme.colors.border.default)
                } else {
                    null
                }

                val chipTestId = "${testId ?: "date-range-picker"}-chip-${preset.name.lowercase()}"

                Surface(
                    color = chipBackgroundColor,
                    shape = androidx.compose.foundation.shape.RoundedCornerShape(theme.radius.full),
                    border = chipBorder,
                    modifier = Modifier
                        .clickable { handlePress(preset) }
                        .semantics {
                            contentDescription = chipTestId
                        }
                ) {
                    Text(
                        text = preset.label,
                        style = theme.type.label.sm,
                        color = chipTextColor,
                        modifier = Modifier.padding(
                            horizontal = theme.space.md,
                            vertical = theme.space.sm,
                        ),
                    )
                }
            }
        }
    }
}
