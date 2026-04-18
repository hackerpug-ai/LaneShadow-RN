package com.laneshadow.ui.sandbox.stories

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.ui.sandbox.model.SandboxStory
import com.laneshadow.ui.sandbox.registry.RnReferenceRegistry

object AppStories {
    val all: List<SandboxStory> =
        RnReferenceRegistry.all
            .sortedBy { it.id }
            .map { scenario ->
                SandboxStory(
                    id = scenario.id,
                    tier = scenario.tier,
                    component = scenario.componentName,
                    name = scenario.stateName,
                    summary = scenario.summary,
                ) {
                    ScenarioStoryCard(
                        title = scenario.componentName,
                        state = scenario.stateName,
                        fixtureKey = scenario.fixtureKey,
                        summary = scenario.summary,
                    )
                }
            }
}

@Composable
private fun ScenarioStoryCard(
    title: String,
    state: String,
    fixtureKey: String,
    summary: String,
) {
    val theme = LocalLaneShadowTheme.current

    Surface(
        color = theme.colors.surface.default,
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(theme.space.lg),
            verticalArrangement = Arrangement.spacedBy(theme.space.sm),
        ) {
            Text(text = title, style = theme.type.title.md, color = theme.colors.onSurface.default)
            Text(text = "State: $state", style = theme.type.body.md, color = theme.colors.onSurface.default)
            Text(text = "Fixture: $fixtureKey", style = theme.type.body.sm, color = theme.colors.onSurface.default)
            Text(text = summary, style = theme.type.label.sm, color = theme.colors.onSurface.default)
            Button(
                onClick = {},
                modifier = Modifier.semantics { contentDescription = "Sandbox primary action" },
            ) {
                Text(text = "Open story by id", style = theme.type.label.md)
            }
            OutlinedButton(
                onClick = {},
                modifier = Modifier.semantics { contentDescription = "Sandbox secondary action" },
            ) {
                Text(text = "Back to catalog", style = theme.type.label.md)
            }
        }
    }
}
