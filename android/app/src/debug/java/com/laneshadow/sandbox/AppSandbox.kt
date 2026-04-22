// native-sandbox: configured
package com.laneshadow.sandbox

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.IconButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.laneshadow.sandbox.stories.AppStories
import com.laneshadow.theme.LaneShadowTheme
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.theme.generated.LaneShadowTheme.IconName
import com.laneshadow.ui.atoms.LSIcon
import com.nativesandbox.model.Story
import com.nativesandbox.theming.themedPreview
import com.nativesandbox.views.SandboxRoot

@Composable
fun AppSandbox(route: SandboxRoute = SandboxRoute(shouldOpenSandbox = true, storyId = null)) {
    var selectedStoryId by remember(route.storyId) { mutableStateOf(route.storyId) }
    val selectedStory = selectedStoryId?.let { storyId -> AppStories.all.firstOrNull { it.id == storyId } }
    val previewWrapper = themedPreview { content -> LaneShadowTheme { content() } }

    if (selectedStory != null) {
        LaneShadowTheme {
            AppSandboxStoryDetail(
                story = selectedStory,
                previewWrapper = previewWrapper,
                onBack = { selectedStoryId = null },
            )
        }
        return
    }

    SandboxRoot(
        stories = AppStories.all,
        themeController = LaneShadowThemeController,
        previewWrapper = previewWrapper,
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun AppSandboxStoryDetail(
    story: Story,
    previewWrapper: @Composable (content: @Composable () -> Unit) -> Unit,
    onBack: () -> Unit,
) {
    val theme = LocalLaneShadowTheme.current

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(story.name) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        LSIcon(name = IconName.ChevL, contentDescription = "Back")
                    }
                },
            )
        },
    ) { innerPadding ->
        Column(
            modifier =
                Modifier
                    .fillMaxSize()
                    .padding(innerPadding)
                    .verticalScroll(rememberScrollState())
                    .padding(theme.space.lg),
            verticalArrangement = Arrangement.spacedBy(theme.space.xl),
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(theme.space.xs)) {
                Text(
                    text = story.component,
                    style = theme.type.label.sm,
                    color = theme.colors.onSurface.default.copy(alpha = 0.72f),
                )
                Text(
                    text = story.name,
                    style = theme.type.heading.md,
                    color = theme.colors.onSurface.default,
                )
                Text(
                    text = story.summary,
                    style = theme.type.body.md,
                    color = theme.colors.onSurface.default.copy(alpha = 0.72f),
                )
                Text(
                    text = story.id,
                    style = theme.type.label.sm,
                    color = theme.colors.onSurface.default.copy(alpha = 0.72f),
                )
            }

            Text(
                text = "PREVIEW",
                style = theme.type.label.sm,
                color = theme.colors.onSurface.default.copy(alpha = 0.72f),
            )

            Box(
                modifier =
                    Modifier
                        .fillMaxWidth()
                        .heightIn(min = theme.space.xxxl * 5)
                        .background(
                            color = theme.colors.surfaceVariant.default,
                            shape = RoundedCornerShape(theme.radius.lg),
                        )
                        .border(
                            width = 1.dp,
                            color = theme.colors.border.default,
                            shape = RoundedCornerShape(theme.radius.lg),
                        )
                        .clip(RoundedCornerShape(theme.radius.lg))
                        .padding(theme.space.lg),
            ) {
                previewWrapper { story.content() }
            }

            Text(
                text = "DETAILS",
                style = theme.type.label.sm,
                color = theme.colors.onSurface.default.copy(alpha = 0.72f),
            )

            Row(modifier = Modifier.fillMaxWidth()) {
                Text(
                    text = "Tier",
                    style = theme.type.body.md,
                    color = theme.colors.onSurface.default,
                )
                Spacer(modifier = Modifier.weight(1f))
                Text(
                    text = story.tier.title,
                    style = theme.type.body.md,
                    color = theme.colors.onSurface.default.copy(alpha = 0.72f),
                )
            }
        }
    }
}
