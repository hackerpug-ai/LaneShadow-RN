package com.laneshadow.ui.organisms

import androidx.compose.runtime.Composable
import androidx.compose.runtime.Stable
import androidx.compose.ui.Modifier
import com.laneshadow.theme.generated.LaneShadowTheme.IconName
import com.laneshadow.ui.molecules.LSToolbar
import com.laneshadow.ui.molecules.LSToolbarLeading
import com.laneshadow.ui.molecules.LSToolbarTrailing

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
 * LSNavBar organism - modal navigation bar that delegates to LSToolbar molecule.
 *
 * This organism is specifically designed for modal sheets and full-screen modal contexts.
 * It composes the LSToolbar molecule with leading/trailing slots for navigation.
 *
 * @param title The title text to display in the center of the nav bar
 * @param leading Leading slot variant (None or Back)
 * @param trailing Trailing slot variant (None or Action)
 * @param modifier Modifier for the root composable
 */
@Composable
fun LSNavBar(
    title: String,
    leading: NavBarLeading = NavBarLeading.None,
    trailing: NavBarTrailing = NavBarTrailing.None,
    modifier: Modifier = Modifier,
) {
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

    // Delegate to LSToolbar molecule
    LSToolbar(
        title = title,
        leading = toolbarLeading,
        trailing = toolbarTrailing,
        modifier = modifier,
    )
}
