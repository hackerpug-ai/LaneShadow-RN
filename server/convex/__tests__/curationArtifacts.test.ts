import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Id } from '../_generated/dataModel'
import {
  activateArtifactReleaseHandler,
  generateArtifactUploadUrlHandler,
  getActiveArtifactReleaseWithShardsHandler,
  upsertArtifactReleaseHandler,
  upsertArtifactShardsHandler,
} from '../curationArtifacts'

const NOW = 1_713_268_800_000

type ReleaseDoc = {
  _id: string
  source: 'curvature'
  releaseId: string
  active: boolean
  manifestStorageId: Id<'_storage'>
  fullArtifactStorageId: Id<'_storage'>
  rowCount: number
  sha256: string
  generatedAt: number
  createdAt: number
  updatedAt: number
}

type ShardDoc = {
  _id: string
  source: 'curvature'
  releaseId: string
  state: string
  storageId: Id<'_storage'>
  rowCount: number
  sha256: string
  createdAt: number
  updatedAt: number
}

const storageId = (value: string) => value as Id<'_storage'>

const makeRelease = (overrides: Partial<ReleaseDoc> = {}): ReleaseDoc => ({
  _id: 'release:1',
  source: 'curvature',
  releaseId: '2026-04-16',
  active: false,
  manifestStorageId: storageId('storage:manifest:1'),
  fullArtifactStorageId: storageId('storage:full:1'),
  rowCount: 1_013_985,
  sha256: 'ab590f7234b94c088fa1fdaa5c82cbcd3a410af9796ebd235488168075b137ed',
  generatedAt: NOW - 60_000,
  createdAt: NOW - 30_000,
  updatedAt: NOW - 30_000,
  ...overrides,
})

const makeShard = (overrides: Partial<ShardDoc> = {}): ShardDoc => ({
  _id: 'shard:1',
  source: 'curvature',
  releaseId: '2026-04-16',
  state: 'colorado',
  storageId: storageId('storage:shard:co'),
  rowCount: 16_987,
  sha256: 'c2309b72ddf7bdd0189f710e091fa37e6bbe77eb4f5bb2d5024c5f761db7d013',
  createdAt: NOW - 30_000,
  updatedAt: NOW - 30_000,
  ...overrides,
})

const createMockCtx = ({
  releases = [],
  shards = [],
  uploadUrl = 'https://example.com/upload',
}: {
  releases?: ReleaseDoc[]
  shards?: ShardDoc[]
  uploadUrl?: string
} = {}) => {
  const releaseDocs = [...releases]
  const shardDocs = [...shards]
  let nextId = 1

  const getTableDocs = (table: string) => {
    if (table === 'curation_artifact_releases') return releaseDocs
    if (table === 'curation_artifact_shards') return shardDocs
    throw new Error(`Unexpected table ${table}`)
  }

  const query = vi.fn((table: string) => ({
    withIndex: vi.fn((_indexName: string, callback: (q: any) => any) => {
      const filters = new Map<string, unknown>()
      const range = {
        eq: vi.fn((field: string, value: unknown) => {
          filters.set(field, value)
          return range
        }),
      }

      callback(range)

      const docs = getTableDocs(table).filter((doc) =>
        [...filters.entries()].every(([field, value]) => (doc as Record<string, unknown>)[field] === value)
      )

      return {
        first: vi.fn().mockResolvedValue(docs[0] ?? null),
        collect: vi.fn().mockResolvedValue([...docs]),
      }
    }),
  }))

  const insert = vi.fn(async (table: string, fields: Record<string, unknown>) => {
    const doc = { _id: `${table}:${nextId++}`, ...fields }
    if (table === 'curation_artifact_releases') {
      releaseDocs.push(doc as ReleaseDoc)
    } else if (table === 'curation_artifact_shards') {
      shardDocs.push(doc as ShardDoc)
    } else {
      throw new Error(`Unexpected table ${table}`)
    }
    return doc._id
  })

  const patch = vi.fn(async (id: string, fields: Record<string, unknown>) => {
    const doc = [...releaseDocs, ...shardDocs].find((entry) => entry._id === id)
    if (!doc) {
      throw new Error(`Document not found for patch: ${id}`)
    }
    Object.assign(doc, fields)
  })

  return {
    ctx: {
      db: { query, insert, patch },
      storage: {
        generateUploadUrl: vi.fn().mockResolvedValue(uploadUrl),
      },
    },
    releaseDocs,
    shardDocs,
    insert,
    patch,
  }
}

describe('curationArtifacts handlers', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(Date, 'now').mockReturnValue(NOW)
  })

  it('generates upload URLs via Convex storage', async () => {
    const { ctx } = createMockCtx({ uploadUrl: 'https://upload.example/artifact' })

    const result = await generateArtifactUploadUrlHandler(ctx as any)

    expect(result).toEqual({
      uploadUrl: 'https://upload.example/artifact',
    })
    expect(ctx.storage.generateUploadUrl).toHaveBeenCalledTimes(1)
  })

  it('upserts release metadata by source and releaseId', async () => {
    const existingRelease = makeRelease({
      _id: 'release:existing',
      active: true,
      sha256: 'old-sha',
    })

    const { ctx, releaseDocs } = createMockCtx({ releases: [existingRelease] })

    const insertedResult = await upsertArtifactReleaseHandler(ctx as any, {
      source: 'curvature',
      releaseId: '2026-04-17',
      manifestStorageId: storageId('storage:manifest:2'),
      fullArtifactStorageId: storageId('storage:full:2'),
      rowCount: 42,
      sha256: 'new-release-sha',
      generatedAt: NOW,
    })

    expect(insertedResult).toEqual({
      inserted: true,
      updated: false,
    })
    expect(releaseDocs).toContainEqual(
      expect.objectContaining({
        releaseId: '2026-04-17',
        active: false,
        createdAt: NOW,
        updatedAt: NOW,
      })
    )

    const updatedResult = await upsertArtifactReleaseHandler(ctx as any, {
      source: 'curvature',
      releaseId: existingRelease.releaseId,
      manifestStorageId: storageId('storage:manifest:updated'),
      fullArtifactStorageId: storageId('storage:full:updated'),
      rowCount: 100,
      sha256: 'updated-sha',
      generatedAt: NOW,
    })

    expect(updatedResult).toEqual({
      inserted: false,
      updated: true,
    })
    expect(releaseDocs[0]).toEqual(
      expect.objectContaining({
        releaseId: existingRelease.releaseId,
        active: true,
        manifestStorageId: storageId('storage:manifest:updated'),
        fullArtifactStorageId: storageId('storage:full:updated'),
        rowCount: 100,
        sha256: 'updated-sha',
        updatedAt: NOW,
      })
    )
  })

  it('upserts shards by source, releaseId, and state', async () => {
    const existingShard = makeShard({
      _id: 'shard:existing',
      state: 'alabama',
      rowCount: 10,
    })

    const { ctx, shardDocs } = createMockCtx({ shards: [existingShard] })

    const result = await upsertArtifactShardsHandler(ctx as any, {
      shards: [
        {
          source: 'curvature',
          releaseId: '2026-04-16',
          state: 'alabama',
          storageId: storageId('storage:shard:al-updated'),
          rowCount: 28_723,
          sha256: 'updated-alabama',
        },
        {
          source: 'curvature',
          releaseId: '2026-04-16',
          state: 'colorado',
          storageId: storageId('storage:shard:co'),
          rowCount: 16_987,
          sha256: 'colorado-sha',
        },
      ],
    })

    expect(result).toEqual({
      inserted: 1,
      updated: 1,
    })
    expect(shardDocs).toContainEqual(
      expect.objectContaining({
        state: 'alabama',
        storageId: storageId('storage:shard:al-updated'),
        rowCount: 28_723,
        sha256: 'updated-alabama',
        updatedAt: NOW,
      })
    )
    expect(shardDocs).toContainEqual(
      expect.objectContaining({
        state: 'colorado',
        storageId: storageId('storage:shard:co'),
        rowCount: 16_987,
        sha256: 'colorado-sha',
        createdAt: NOW,
        updatedAt: NOW,
      })
    )
  })

  it('activates one release per source', async () => {
    const releases = [
      makeRelease({
        _id: 'release:old',
        releaseId: '2026-04-15',
        active: true,
      }),
      makeRelease({
        _id: 'release:new',
        releaseId: '2026-04-16',
        active: false,
      }),
    ]

    const { ctx, releaseDocs } = createMockCtx({ releases })

    const result = await activateArtifactReleaseHandler(ctx as any, {
      source: 'curvature',
      releaseId: '2026-04-16',
    })

    expect(result).toEqual({
      activatedReleaseId: '2026-04-16',
    })
    expect(releaseDocs.find((doc) => doc._id === 'release:old')?.active).toBe(false)
    expect(releaseDocs.find((doc) => doc._id === 'release:new')?.active).toBe(true)
  })

  it('returns the active release with sorted shard metadata', async () => {
    const activeRelease = makeRelease({
      _id: 'release:active',
      active: true,
    })

    const { ctx } = createMockCtx({
      releases: [activeRelease],
      shards: [
        makeShard({
          _id: 'shard:co',
          state: 'colorado',
          storageId: storageId('storage:shard:co'),
        }),
        makeShard({
          _id: 'shard:al',
          state: 'alabama',
          storageId: storageId('storage:shard:al'),
          rowCount: 28_723,
          sha256: 'updated-alabama',
        }),
      ],
    })

    const result = await getActiveArtifactReleaseWithShardsHandler(ctx as any, {
      source: 'curvature',
    })

    expect(result).toEqual({
      source: 'curvature',
      releaseId: activeRelease.releaseId,
      active: true,
      manifestStorageId: activeRelease.manifestStorageId,
      fullArtifactStorageId: activeRelease.fullArtifactStorageId,
      rowCount: activeRelease.rowCount,
      sha256: activeRelease.sha256,
      generatedAt: activeRelease.generatedAt,
      shards: [
        {
          source: 'curvature',
          releaseId: activeRelease.releaseId,
          state: 'alabama',
          storageId: storageId('storage:shard:al'),
          rowCount: 28_723,
          sha256: 'updated-alabama',
        },
        {
          source: 'curvature',
          releaseId: activeRelease.releaseId,
          state: 'colorado',
          storageId: storageId('storage:shard:co'),
          rowCount: 16_987,
          sha256: 'c2309b72ddf7bdd0189f710e091fa37e6bbe77eb4f5bb2d5024c5f761db7d013',
        },
      ],
    })
  })
})
