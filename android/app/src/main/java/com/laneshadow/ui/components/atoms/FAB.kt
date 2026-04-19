package com.laneshadow.ui.components.atoms

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.disabled
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.laneshadow.theme.LocalLaneShadowTheme

/**
 * FAB dimension constants
 *
 * Following FAB.md matrix values:
 * - Standard FAB: 56×56dp
 * - Icon size: 24dp
 * - Corner radius: 16dp (radius.xl)
 * - Elevation: 6dp
 * - Icon-label spacing: 12dp (space.md)
 */
private val FAB_SIZE = 56.dp
private val FAB_ICON_SIZE = 24.dp
private val FAB_ELEVATION = 6.dp
private val FAB_CORNER_RADIUS = 16.dp
private const val FAB_DISABLED_OPACITY = 0.5f

/**
 * FAB (Floating Action Button) component
 *
 * Following RN wrapper API from react-native/components/ui/fab.tsx
 *
 * @param icon Optional icon composable to display
 * @param label Optional text label for the FAB
 * @param onPress Callback when FAB is pressed
 * @param visible Whether the FAB is visible (animated)
 * @param disabled Whether the FAB is disabled (adds opacity and prevents interaction)
 * @param modifier Modifier for the FAB container
 * @param testID Test ID for UI testing
 */
@Composable
fun FAB(
    icon: @Composable (() -> Unit)? = null,
    label: String? = null,
    onPress: () -> Unit,
    visible: Boolean = true,
    disabled: Boolean = false,
    modifier: Modifier = Modifier,
    testID: String? = null,
) {
    val theme = LocalLaneShadowTheme.current

    AnimatedVisibility(
        visible = visible,
        enter = fadeIn(),
        exit = fadeOut(),
    ) {
        val fabModifier = modifier
            .semantics {
                role = Role.Button
                if (disabled) {
                    disabled()
                }
            }
            .alpha(if (disabled) FAB_DISABLED_OPACITY else 1f)

        Surface(
            modifier = fabModifier,
            shape = androidx.compose.foundation.shape.RoundedCornerShape(theme.radius.xl),
            color = theme.colors.primary.default,
            tonalElevation = FAB_ELEVATION,
            shadowElevation = FAB_ELEVATION,
        ) {
            Box(
                modifier = Modifier
                    .then(
                        if (label != null) {
                            Modifier
                        } else {
                            Modifier.size(FAB_SIZE)
                        }
                    )
                    .padding(
                        start = if (icon != null && label != null) theme.space.md else 0.dp,
                        end = if (icon != null && label != null) theme.space.md else 0.dp,
                    ),
            ) {
                Row {
                    if (icon != null) {
                        Box(
                            modifier = Modifier.size(FAB_ICON_SIZE),
                        ) {
                            icon()
                        }
                    }

                    if (label != null) {
                        if (icon != null) {
                            Spacer(modifier = Modifier.width(theme.space.md))
                        }
                        Text(
                            text = label.uppercase(),
                            style = theme.type.label.md.copy(
                                fontSize = 14.sp,
                                letterSpacing = 0.75.sp,
                            ),
                            color = theme.colors.onSurface.default,
                        )
                    }
                }
            }
        }
    }
}
