/**
 * ProvenanceCaption — calm muted Text leaf for inferred geometry lines.
 *
 * UC-SURF-05 / S6-T4: render literal provenance copy ONLY for
 * `ai_reconstructed` and `name_routed`. Silent (no node) for
 * `scraped_promoted`, unset, or any other value.
 *
 * Pattern source: detail summary muted Text
 * (`app/(app)/curated-route/[id].tsx` summary block).
 * Anti-pattern: Badge, warning/alert color, empty testID shell.
 */

import { Text } from 'react-native-paper'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'

export type GeometryProvenance = 'scraped_promoted' | 'ai_reconstructed' | 'name_routed'

/** Literal caption copy — do not paraphrase (UC-SURF-05 / design handoff). */
const CAPTION_BY_PROVENANCE: Readonly<Partial<Record<GeometryProvenance, string>>> = {
  ai_reconstructed: 'Route line reconstructed from the ride description',
  name_routed: 'Route line generated from the road name',
}

export type ProvenanceCaptionProps = {
  geometryProvenance?: GeometryProvenance | null
}

/**
 * Resolve caption string for a provenance value. Returns null when silent.
 * Exported for unit-style assertions without mounting theme.
 */
export function resolveProvenanceCaption(
  geometryProvenance: GeometryProvenance | null | undefined,
): string | null {
  if (!geometryProvenance) return null
  return CAPTION_BY_PROVENANCE[geometryProvenance] ?? null
}

/**
 * Calm muted provenance caption. Present ONLY when copy resolves;
 * testID `curated-detail-provenance` is absent when silent.
 */
export function ProvenanceCaption({ geometryProvenance }: ProvenanceCaptionProps): React.ReactNode {
  const { semantic } = useSemanticTheme()
  const caption = resolveProvenanceCaption(geometryProvenance)
  if (!caption) return null

  return (
    <Text
      testID="curated-detail-provenance"
      style={[semantic.type.body.sm, { color: semantic.color.onSurface.subtle }]}
    >
      {caption}
    </Text>
  )
}
