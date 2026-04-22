package com.laneshadow.ui.components.atoms

import com.laneshadow.ui.atoms.Glyphs

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.material3.Icon
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.testTag
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LocalLaneShadowTheme

/**
 * Collapsible dimension constants
 *
 * Following design system specifications:
 * - Header gap: 8dp (theme.space.sm)
 * - Icon size: 18dp
 * - Content top margin: 8dp (theme.space.sm)
 * - Content left indent: 24dp (theme.space.xl)
 */
private val COLLAPSIBLE_HEADER_GAP = 8.dp
private val COLLAPSIBLE_ICON_SIZE = 18.dp
private val COLLAPSIBLE_CONTENT_TOP_MARGIN = 8.dp
private val COLLAPSIBLE_CONTENT_LEFT_INDENT = 24.dp

/**
 * Collapsible component
 *
 * A collapsible section with a header that can be toggled to show/hide content.
 * The header displays a title with a chevron icon that rotates when opened/closed.
 *
 * @param title Title text to display in the header
 * @param isOpen Whether the collapsible is currently open (default: false)
 * @param onToggle Callback when the header is pressed (null makes it non-interactive)
 * @param testID Test ID for UI testing
 * @param modifier Modifier for the collapsible container
 * @param content Content composable to display when open
 */
@Composable
fun Collapsible(
    title: String,
    isOpen: Boolean = false,
    onToggle: (() -> Unit)? = null,
    testID: String? = null,
    modifier: Modifier = Modifier,
    content: @Composable ColumnScope.() -> Unit,
) {
    val theme = LocalLaneShadowTheme.current

    // Determine if collapsible should be interactive
    val isInteractive = onToggle != null

    // Build base modifier with semantics
    val baseModifier = modifier.semantics {
        if (isInteractive) {
            role = Role.Button
        }
        if (testID != null) {
            testTag = testID
        }
    }

    // Add click handling if interactive
    val interactiveModifier = if (isInteractive) {
        baseModifier.clickable(onClick = onToggle!!)
    } else {
        baseModifier
    }

    Surface(
        modifier = interactiveModifier,
        color = theme.colors.surface.default,
    ) {
        Column {
            // Header row with title and chevron
            Row(
                modifier = Modifier
                    .padding(theme.space.sm),
                horizontalArrangement = Arrangement.spacedBy(COLLAPSIBLE_HEADER_GAP),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                // Title text
                Text(
                    text = title,
                    style = theme.type.label.lg,
                    color = theme.colors.onSurface.default,
                )

                // Chevron icon that rotates based on isOpen state
                Icon(
                    imageVector = Glyphs.AutoMirrored.Filled.KeyboardArrowRight,
                    contentDescription = if (isOpen) {
                        "Collapse $title"
                    } else {
                        "Expand $title"
                    },
                    tint = theme.colors.onSurface.default.copy(alpha = 0.7f),
                    modifier = Modifier
                        .width(COLLAPSIBLE_ICON_SIZE)
                        .rotate(if (isOpen) 90f else 0f),
                )
            }

            // Content (only shown when isOpen)
            if (isOpen) {
                Column(
                    modifier = Modifier
                        .padding(
                            start = COLLAPSIBLE_CONTENT_LEFT_INDENT,
                            top = COLLAPSIBLE_CONTENT_TOP_MARGIN,
                        ),
                    content = content,
                )
            }
        }
    }
}
