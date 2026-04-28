package com.laneshadow.ui.organisms

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.Stable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.theme.generated.LaneShadowTheme
import com.laneshadow.theme.generated.LaneShadowTheme.IconName
import com.laneshadow.ui.atoms.ContentColor
import com.laneshadow.ui.atoms.LSText
import com.laneshadow.ui.atoms.TypographyVariant
import com.laneshadow.ui.molecules.LSFilterChip
import com.laneshadow.ui.molecules.LSToolbar
import com.laneshadow.ui.molecules.LSToolbarLeading
import com.laneshadow.ui.molecules.LSToolbarTrailing

/**
 * Specification for a filter chip in the LSNavBar filter row.
 */
@Immutable
data class FilterChipSpec(
    val label: String,
    val isSelected: Boolean = false,
)

/**
 * Specification for the search slot in LSNavBar.
 */
@Immutable
data class SearchSlotSpec(
    val placeholder: String,
)

/**
 * Sealed interface for LSNavBar leading slot variants.
 */
@Stable
sealed interface NavBarLeading {
    @Stable
    data object None : NavBarLeading

    @Stable
    data class Back(val onClick: () -> Unit) : NavBarLeading
}

/**
 * Sealed interface for LSNavBar trailing slot variants.
 */
@Stable
sealed interface NavBarTrailing {
    @Stable
    data object None : NavBarTrailing

    @Stable
    data class Action(val icon: IconName, val onClick: () -> Unit) : NavBarTrailing
}

/**
 * LSNavBar organism - modal navigation bar with optional filter-chip row or search slot.
 *
 * This organism is specifically designed for modal sheets and full-screen modal contexts.
 * It composes the LSToolbar molecule with leading/trailing slots for navigation,
 * and optionally renders a horizontally-scrolling filter-chip row or an inset search field.
 *
 * @param title The title text to display in the center of the nav bar
 * @param leading Leading slot variant (None or Back)
 * @param trailing Trailing slot variant (None or Action)
 * @param filterChips Optional list of filter chip specs to render in a horizontal row
 * @param searchSlot Optional search slot spec to render an inset search field
 * @param modifier Modifier for the root composable
 */
@Composable
fun LSNavBar(
    title: String,
    leading: NavBarLeading = NavBarLeading.None,
    trailing: NavBarTrailing = NavBarTrailing.None,
    filterChips: List<FilterChipSpec>? = null,
    searchSlot: SearchSlotSpec? = null,
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current

    // Convert NavBarLeading to LSToolbarLeading
    val toolbarLeading = when (leading) {
        NavBarLeading.None -> LSToolbarLeading.None
        is NavBarLeading.Back -> LSToolbarLeading.Back(onClick = leading.onClick)
    }

    // Convert NavBarTrailing to LSToolbarTrailing
    val toolbarTrailing = when (trailing) {
        NavBarTrailing.None -> LSToolbarTrailing.None
        is NavBarTrailing.Action -> LSToolbarTrailing.Action(
            icon = trailing.icon,
            onClick = trailing.onClick,
        )
    }

    Column(modifier = modifier) {
        // Delegate to LSToolbar molecule
        LSToolbar(
            title = title,
            leading = toolbarLeading,
            trailing = toolbarTrailing,
        )

        // Filter chip row
        if (!filterChips.isNullOrEmpty()) {
            FilterChipRow(
                chips = filterChips,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = theme.space.md, vertical = theme.space.sm)
            )
        }

        // Search slot
        if (searchSlot != null) {
            SearchSlotField(
                spec = searchSlot,
                modifier = Modifier.padding(
                    start = theme.space.md,
                    end = theme.space.md,
                    bottom = theme.space.md
                )
            )
        }
    }
}

@Composable
private fun FilterChipRow(
    chips: List<FilterChipSpec>,
    modifier: Modifier = Modifier,
) {
    LazyRow(
        modifier = modifier,
        horizontalArrangement = Arrangement.spacedBy(LocalLaneShadowTheme.current.space.sm),
        contentPadding = PaddingValues(horizontal = 0.dp, vertical = 0.dp),
    ) {
        itemsIndexed(
            items = chips,
            key = { _, chip -> chip.label }
        ) { index, chip ->
            var isSelected by remember(chip.isSelected) { mutableStateOf(chip.isSelected) }
            LSFilterChip(
                label = chip.label,
                selected = isSelected,
                onToggle = { isSelected = !isSelected },
            )
        }
    }
}

@Composable
private fun SearchSlotField(
    spec: SearchSlotSpec,
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current
    var searchText by remember { mutableStateOf("") }

    // Use the generated inset color directly since it's not exposed in semantic theme
    val insetColor = if (theme.content.primary == LaneShadowTheme.color.Content.dark.primary) {
        LaneShadowTheme.color.Surface.dark.inset
    } else {
        LaneShadowTheme.color.Surface.inset
    }

    OutlinedTextField(
        value = searchText,
        onValueChange = { searchText = it },
        modifier = modifier.fillMaxWidth(),
        placeholder = {
            LSText(
                text = spec.placeholder,
                variant = TypographyVariant.Ui.Body.Md,
                color = ContentColor.Tertiary,
            )
        },
        leadingIcon = {
            Icon(
                imageVector = Icons.Default.Search,
                contentDescription = "Search",
                tint = theme.content.tertiary,
                modifier = Modifier.size(20.dp),
            )
        },
        trailingIcon = if (searchText.isNotEmpty()) {
            {
                IconButton(
                    onClick = { searchText = "" },
                    modifier = Modifier.size(20.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Close,
                        contentDescription = "Clear search",
                        tint = theme.content.tertiary,
                    )
                }
            }
        } else {
            null
        },
        singleLine = true,
        colors = OutlinedTextFieldDefaults.colors(
            focusedContainerColor = insetColor,
            unfocusedContainerColor = insetColor,
            disabledContainerColor = insetColor,
            focusedBorderColor = theme.colors.border.default,
            unfocusedBorderColor = theme.colors.border.default,
        ),
        shape = RoundedCornerShape(theme.radius.lg),
        keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
        keyboardActions = KeyboardActions(
            onSearch = { /* Handle search */ }
        ),
    )
}
