import { beforeEach, describe, expect, it, vi } from 'vitest'

// --- hoisted mutable state shared between the mocks and the tests --------------------------------
const h = vi.hoisted(() => {
  const tables = {
    knowledgeBaseConnector: { __t: 'connector' },
    knowledgeBase: { __t: 'kb' },
    document: { __t: 'document' },
    embedding: { __t: 'embedding' },
  }
  return {
    tables,
    connectorRow: null as any,
    kbRow: null as any,
    existingDocs: [] as any[],
    inserted: [] as any[],
    updated: [] as any[], // { table, vals }
    deletedFrom: [] as any[], // table
    getConnectorImpl: null as any,
  }
})

vi.mock('@/lib/logs/console/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), debug: vi.fn(), error: vi.fn() }),
}))

vi.mock('drizzle-orm', () => ({
  eq: (...a: any[]) => ({ eq: a }),
  and: (...a: any[]) => ({ and: a }),
  isNull: (...a: any[]) => ({ isNull: a }),
}))

vi.mock('@/db/schema', () => h.tables)

const processDocumentAsync = vi.fn()
vi.mock('@/app/api/knowledge/utils', () => ({
  processDocumentAsync: (...a: any[]) => processDocumentAsync(...a),
}))

vi.mock('./registry', () => ({
  getConnector: (type: string) => (h.getConnectorImpl ? h.getConnectorImpl(type) : undefined),
}))

vi.mock('@/db', () => {
  function rowsFor(table: any) {
    if (table === h.tables.knowledgeBaseConnector) return h.connectorRow ? [h.connectorRow] : []
    if (table === h.tables.knowledgeBase) return h.kbRow ? [h.kbRow] : []
    if (table === h.tables.document) return h.existingDocs
    return []
  }
  const db = {
    select: () => ({
      from: (table: any) => {
        const rows = rowsFor(table)
        const builder: any = {
          where: () => builder,
          limit: async () => rows,
          then: (resolve: any, reject: any) => Promise.resolve(rows).then(resolve, reject),
        }
        return builder
      },
    }),
    insert: (table: any) => ({
      values: async (vals: any) => {
        h.inserted.push({ table, vals })
      },
    }),
    update: (table: any) => ({
      set: (vals: any) => ({
        where: async () => {
          h.updated.push({ table, vals })
        },
      }),
    }),
    delete: (table: any) => ({
      where: async () => {
        h.deletedFrom.push(table)
      },
    }),
  }
  return { db }
})

import { runConnectorSync } from './sync-runner'
import type { ConnectorDefinition } from './types'
import { hashContent } from './utils'

function resetState() {
  h.connectorRow = null
  h.kbRow = null
  h.existingDocs = []
  h.inserted = []
  h.updated = []
  h.deletedFrom = []
  h.getConnectorImpl = null
  processDocumentAsync.mockReset()
}

const KB = {
  id: 'kb-1',
  chunkingConfig: { maxSize: 1024, overlap: 200 },
  embeddingModel: 'text-embedding-3-small',
}

beforeEach(resetState)

describe('runConnectorSync — legacy fetchDocuments connectors', () => {
  it('adds new, updates changed, skips unchanged, and deletes removed documents', async () => {
    h.connectorRow = {
      id: 'conn-1',
      type: 'legacy',
      knowledgeBaseId: 'kb-1',
      config: {},
      credential: null,
      createdBy: 'user-1',
      frequency: 'daily',
      failedCount: 0,
    }
    h.kbRow = KB
    h.existingDocs = [
      { id: 'doc-b', externalId: 'b', contentHash: hashContent('BBB') }, // unchanged
      { id: 'doc-c', externalId: 'c', contentHash: hashContent('OLD') }, // changed
      { id: 'doc-d', externalId: 'd', contentHash: hashContent('DDD') }, // removed at source
    ]

    const fetchDocuments = vi.fn().mockResolvedValue([
      { externalId: 'a', filename: 'a.md', content: 'AAA' },
      { externalId: 'b', filename: 'b.md', content: 'BBB' },
      { externalId: 'c', filename: 'c.md', content: 'CCC-new' },
    ])
    h.getConnectorImpl = (): ConnectorDefinition => ({
      type: 'legacy',
      displayName: 'Legacy',
      requiresCredential: false,
      fetchDocuments,
    })

    const summary = await runConnectorSync('conn-1')

    expect(summary).toMatchObject({ added: 1, updated: 1, deleted: 1, failed: 0 })
    expect(summary.error).toBeUndefined()

    // One new document inserted (a).
    expect(h.inserted).toHaveLength(1)
    expect(h.inserted[0].vals).toMatchObject({ externalId: 'a', contentHash: hashContent('AAA') })

    // Two documents reprocessed: the changed one (added new too). processDocumentAsync runs for a and c.
    expect(processDocumentAsync).toHaveBeenCalledTimes(2)

    // The removed doc 'd' was deleted (document delete happened).
    expect(h.deletedFrom).toContain(h.tables.document)
  })

  it('records an error when the connector type is unknown', async () => {
    h.connectorRow = {
      id: 'conn-x',
      type: 'nope',
      knowledgeBaseId: 'kb-1',
      config: {},
      credential: null,
      createdBy: 'u',
      frequency: 'manual',
      failedCount: 0,
    }
    h.getConnectorImpl = () => undefined
    const summary = await runConnectorSync('conn-x')
    expect(summary.error).toMatch(/Unknown connector type/)
  })
})

describe('runConnectorSync — new paginated + deferred connectors', () => {
  it('paginates listDocuments and only calls getDocument for new/changed refs', async () => {
    h.connectorRow = {
      id: 'conn-2',
      type: 'paged',
      knowledgeBaseId: 'kb-1',
      config: { credentialId: 'cred-1' },
      credential: null,
      createdBy: 'user-9',
      frequency: 'hourly',
      failedCount: 0,
    }
    h.kbRow = KB
    h.existingDocs = [
      { id: 'd1', externalId: 'x1', contentHash: 'h1' }, // unchanged (refHash matches) -> skip fetch
      { id: 'd3', externalId: 'x3', contentHash: 'h3old' }, // changed refHash -> fetch + update
      { id: 'd9', externalId: 'x9', contentHash: 'zz' }, // removed at source -> delete
    ]

    const listDocuments = vi
      .fn()
      .mockResolvedValueOnce({
        documents: [
          { externalId: 'x1', filename: 'x1', contentHash: 'h1' },
          { externalId: 'x2', filename: 'x2', contentHash: 'h2' },
        ],
        nextCursor: 'page-2',
      })
      .mockResolvedValueOnce({
        documents: [{ externalId: 'x3', filename: 'x3', contentHash: 'h3new' }],
        nextCursor: null,
      })

    const getDocument = vi.fn(async ({ ref }: any) => ({
      content: `body-${ref.externalId}`,
      contentHash: ref.contentHash,
    }))

    h.getConnectorImpl = (): ConnectorDefinition => ({
      type: 'paged',
      displayName: 'Paged',
      requiresCredential: true,
      auth: { type: 'oauth', provider: 'linear' },
      listDocuments,
      getDocument,
    })

    const summary = await runConnectorSync('conn-2')

    expect(summary).toMatchObject({ added: 1, updated: 1, deleted: 1, failed: 0 })

    // Paginated: called twice, following the cursor.
    expect(listDocuments).toHaveBeenCalledTimes(2)
    expect(listDocuments.mock.calls[0][0].cursor).toBeUndefined()
    expect(listDocuments.mock.calls[1][0].cursor).toBe('page-2')
    // createdBy is threaded into the list context for OAuth self-resolution.
    expect(listDocuments.mock.calls[0][0].createdBy).toBe('user-9')

    // Deferred: getDocument NOT called for the unchanged x1; called for x2 (new) and x3 (changed).
    expect(getDocument).toHaveBeenCalledTimes(2)
    const fetchedIds = getDocument.mock.calls.map((c: any) => c[0].ref.externalId).sort()
    expect(fetchedIds).toEqual(['x2', 'x3'])

    expect(h.inserted).toHaveLength(1)
    expect(h.inserted[0].vals).toMatchObject({ externalId: 'x2', contentHash: 'h2' })
  })

  it('counts a per-item getDocument failure without aborting the whole sync', async () => {
    h.connectorRow = {
      id: 'conn-3',
      type: 'paged',
      knowledgeBaseId: 'kb-1',
      config: {},
      credential: null,
      createdBy: 'user-9',
      frequency: 'manual',
      failedCount: 0,
    }
    h.kbRow = KB
    h.existingDocs = []

    const listDocuments = vi.fn().mockResolvedValue({
      documents: [
        { externalId: 'ok', filename: 'ok', contentHash: 'a' },
        { externalId: 'bad', filename: 'bad', contentHash: 'b' },
      ],
      nextCursor: null,
    })
    const getDocument = vi.fn(async ({ ref }: any) => {
      if (ref.externalId === 'bad') throw new Error('boom')
      return { content: 'ok-body', contentHash: 'a' }
    })

    h.getConnectorImpl = (): ConnectorDefinition => ({
      type: 'paged',
      displayName: 'Paged',
      requiresCredential: false,
      auth: { type: 'none' },
      listDocuments,
      getDocument,
    })

    const summary = await runConnectorSync('conn-3')
    expect(summary).toMatchObject({ added: 1, failed: 1, deleted: 0 })
  })
})

describe('runConnectorSync — guards', () => {
  it('returns an error when the connector row is missing', async () => {
    h.connectorRow = null
    const summary = await runConnectorSync('missing')
    expect(summary.error).toBe('Connector not found')
  })
})
