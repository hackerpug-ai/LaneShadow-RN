import { ConvexError, v } from 'convex/values'
import {
  CURATION_ARTIFACT_RELEASE_METADATA_FIELDS,
  CURATION_ARTIFACT_SHARD_METADATA_FIELDS,
  type CurationArtifactRelease,
  type CurationArtifactReleaseMetadata,
  type CurationArtifactShard,
  type CurationArtifactShardMetadata,
  curationArtifactSourceValidator,
} from '../shared/models/curation-artifacts'
import type { Id } from './_generated/dataModel'
import { type MutationCtx, mutation, type QueryCtx, query } from './_generated/server'

type ArtifactReleaseDoc = CurationArtifactRelease & {
  _id: Id<'curation_artifact_releases'>
}

type ArtifactShardDoc = CurationArtifactShard & {
  _id: Id<'curation_artifact_shards'>
}

const activeArtifactReleaseResultValidator = v.object({
  ...CURATION_ARTIFACT_RELEASE_METADATA_FIELDS,
  active: v.boolean(),
  shards: v.array(v.object(CURATION_ARTIFACT_SHARD_METADATA_FIELDS)),
})

const findReleaseBySourceAndId = async (
  ctx: QueryCtx | MutationCtx,
  source: CurationArtifactReleaseMetadata['source'],
  releaseId: string,
): Promise<ArtifactReleaseDoc | null> => {
  return await ctx.db
    .query('curation_artifact_releases')
    .withIndex('by_source_and_releaseId', (q: any) =>
      q.eq('source', source).eq('releaseId', releaseId),
    )
    .first()
}

const mapReleaseResult = (
  release: ArtifactReleaseDoc,
  shards: ArtifactShardDoc[],
): {
  source: CurationArtifactReleaseMetadata['source']
  releaseId: string
  manifestStorageId: CurationArtifactReleaseMetadata['manifestStorageId']
  fullArtifactStorageId: CurationArtifactReleaseMetadata['fullArtifactStorageId']
  rowCount: number
  sha256: string
  generatedAt: number
  active: boolean
  shards: CurationArtifactShardMetadata[]
} => ({
  source: release.source,
  releaseId: release.releaseId,
  manifestStorageId: release.manifestStorageId,
  fullArtifactStorageId: release.fullArtifactStorageId,
  rowCount: release.rowCount,
  sha256: release.sha256,
  generatedAt: release.generatedAt,
  active: release.active,
  shards: shards
    .map((shard) => ({
      source: shard.source,
      releaseId: shard.releaseId,
      state: shard.state,
      storageId: shard.storageId,
      rowCount: shard.rowCount,
      sha256: shard.sha256,
    }))
    .sort((left, right) => left.state.localeCompare(right.state)),
})

// ---------------------------------------------------------------------------
// Handler functions for unit testing
// ---------------------------------------------------------------------------

export const generateArtifactUploadUrlHandler = async (ctx: MutationCtx) => {
  const uploadUrl = await ctx.storage.generateUploadUrl()
  return { uploadUrl }
}

export const upsertArtifactReleaseHandler = async (
  ctx: MutationCtx,
  args: CurationArtifactReleaseMetadata,
) => {
  const now = Date.now()
  const existing = await findReleaseBySourceAndId(ctx, args.source, args.releaseId)

  if (existing) {
    await ctx.db.patch(existing._id, {
      ...args,
      updatedAt: now,
    })

    return {
      inserted: false,
      updated: true,
    }
  }

  await ctx.db.insert('curation_artifact_releases', {
    ...args,
    active: false,
    createdAt: now,
    updatedAt: now,
  })

  return {
    inserted: true,
    updated: false,
  }
}

export const upsertArtifactShardsHandler = async (
  ctx: MutationCtx,
  args: { shards: CurationArtifactShardMetadata[] },
) => {
  const now = Date.now()
  let inserted = 0
  let updated = 0

  for (const shard of args.shards) {
    const existing = await ctx.db
      .query('curation_artifact_shards')
      .withIndex('by_source_and_releaseId_and_state', (q: any) =>
        q.eq('source', shard.source).eq('releaseId', shard.releaseId).eq('state', shard.state),
      )
      .first()

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...shard,
        updatedAt: now,
      })
      updated++
      continue
    }

    await ctx.db.insert('curation_artifact_shards', {
      ...shard,
      createdAt: now,
      updatedAt: now,
    })
    inserted++
  }

  return { inserted, updated }
}

export const activateArtifactReleaseHandler = async (
  ctx: MutationCtx,
  args: {
    source: CurationArtifactReleaseMetadata['source']
    releaseId: string
  },
) => {
  const releases = (await ctx.db
    .query('curation_artifact_releases')
    .withIndex('by_source', (q: any) => q.eq('source', args.source))
    .collect()) as ArtifactReleaseDoc[]

  const target = releases.find((release) => release.releaseId === args.releaseId)

  if (!target) {
    throw new ConvexError({
      code: 'artifact_release_not_found',
      source: args.source,
      releaseId: args.releaseId,
    })
  }

  const now = Date.now()

  for (const release of releases) {
    const shouldBeActive = release.releaseId === args.releaseId
    if (release.active === shouldBeActive) {
      continue
    }

    await ctx.db.patch(release._id, {
      active: shouldBeActive,
      updatedAt: now,
    })
  }

  return {
    activatedReleaseId: args.releaseId,
  }
}

export const getActiveArtifactReleaseWithShardsHandler = async (
  ctx: QueryCtx,
  args: { source: CurationArtifactReleaseMetadata['source'] },
) => {
  const release = (await ctx.db
    .query('curation_artifact_releases')
    .withIndex('by_source_and_active', (q: any) => q.eq('source', args.source).eq('active', true))
    .first()) as ArtifactReleaseDoc | null

  if (!release) {
    return null
  }

  const shards = (await ctx.db
    .query('curation_artifact_shards')
    .withIndex('by_source_and_releaseId', (q: any) =>
      q.eq('source', release.source).eq('releaseId', release.releaseId),
    )
    .collect()) as ArtifactShardDoc[]

  return mapReleaseResult(release, shards)
}

// ---------------------------------------------------------------------------
// Public Convex surface
// ---------------------------------------------------------------------------

export const generateArtifactUploadUrl = mutation({
  args: {},
  returns: v.object({ uploadUrl: v.string() }),
  handler: generateArtifactUploadUrlHandler,
})

export const upsertArtifactRelease = mutation({
  args: CURATION_ARTIFACT_RELEASE_METADATA_FIELDS,
  returns: v.object({
    inserted: v.boolean(),
    updated: v.boolean(),
  }),
  handler: upsertArtifactReleaseHandler,
})

export const upsertArtifactShards = mutation({
  args: {
    shards: v.array(v.object(CURATION_ARTIFACT_SHARD_METADATA_FIELDS)),
  },
  returns: v.object({
    inserted: v.number(),
    updated: v.number(),
  }),
  handler: upsertArtifactShardsHandler,
})

export const activateArtifactRelease = mutation({
  args: {
    source: curationArtifactSourceValidator,
    releaseId: v.string(),
  },
  returns: v.object({
    activatedReleaseId: v.string(),
  }),
  handler: activateArtifactReleaseHandler,
})

export const getActiveArtifactReleaseWithShards = query({
  args: {
    source: curationArtifactSourceValidator,
  },
  returns: v.union(v.null(), activeArtifactReleaseResultValidator),
  handler: getActiveArtifactReleaseWithShardsHandler,
})
