import { Infer, v } from 'convex/values'

export const CURATION_ARTIFACT_SOURCE = {
  CURVATURE: 'curvature',
} as const

export type CurationArtifactSource =
  (typeof CURATION_ARTIFACT_SOURCE)[keyof typeof CURATION_ARTIFACT_SOURCE]

export const curationArtifactSourceValidator = v.union(v.literal('curvature'))

export const CURATION_ARTIFACT_RELEASE_METADATA_FIELDS = {
  source: curationArtifactSourceValidator,
  releaseId: v.string(),
  manifestStorageId: v.id('_storage'),
  fullArtifactStorageId: v.id('_storage'),
  rowCount: v.number(),
  sha256: v.string(),
  generatedAt: v.number(),
} as const

export const CURATION_ARTIFACT_RELEASE_FIELDS = {
  ...CURATION_ARTIFACT_RELEASE_METADATA_FIELDS,
  active: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
} as const

export const curationArtifactReleaseMetadataValidator = v.object(
  CURATION_ARTIFACT_RELEASE_METADATA_FIELDS
)
export const curationArtifactReleaseValidator = v.object(CURATION_ARTIFACT_RELEASE_FIELDS)

export type CurationArtifactReleaseMetadata = Infer<
  typeof curationArtifactReleaseMetadataValidator
>
export type CurationArtifactRelease = Infer<typeof curationArtifactReleaseValidator>

export const CURATION_ARTIFACT_SHARD_METADATA_FIELDS = {
  source: curationArtifactSourceValidator,
  releaseId: v.string(),
  state: v.string(),
  storageId: v.id('_storage'),
  rowCount: v.number(),
  sha256: v.string(),
} as const

export const CURATION_ARTIFACT_SHARD_FIELDS = {
  ...CURATION_ARTIFACT_SHARD_METADATA_FIELDS,
  createdAt: v.number(),
  updatedAt: v.number(),
} as const

export const curationArtifactShardMetadataValidator = v.object(
  CURATION_ARTIFACT_SHARD_METADATA_FIELDS
)
export const curationArtifactShardValidator = v.object(CURATION_ARTIFACT_SHARD_FIELDS)

export type CurationArtifactShardMetadata = Infer<typeof curationArtifactShardMetadataValidator>
export type CurationArtifactShard = Infer<typeof curationArtifactShardValidator>
