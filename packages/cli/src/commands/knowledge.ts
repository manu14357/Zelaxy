import type { Command } from 'commander'
import { getClient } from '../auth.js'
import { formatDate, handleError, info, spinner, success, table, truncate } from '../utils.js'

export function registerKnowledgeCommands(program: Command): void {
  const kb = program.command('knowledge').alias('kb').description('Manage knowledge bases')

  // ── list ─────────────────────────────────────────────────────────────────
  kb.command('list')
    .alias('ls')
    .description('List knowledge bases')
    .action(async () => {
      const s = spinner('Loading knowledge bases…').start()
      try {
        const client = getClient()
        const data = await client.knowledge.list()
        s.stop()

        const items = Array.isArray(data) ? data : (data as any).data || []
        if (items.length === 0) {
          info('No knowledge bases found.')
          return
        }

        const rows = items.map((k: any) => [
          k.id,
          truncate(k.name || '—', 40),
          k.documentCount ?? '—',
          formatDate(k.createdAt),
        ])
        console.log(table(['ID', 'Name', 'Documents', 'Created'], rows))
      } catch (err) {
        s.stop()
        handleError(err)
      }
    })

  // ── create ───────────────────────────────────────────────────────────────
  kb.command('create')
    .description('Create a knowledge base')
    .argument('<name>', 'Knowledge base name')
    .option('-d, --description <desc>', 'Description')
    .action(async (name, opts) => {
      const s = spinner('Creating knowledge base…').start()
      try {
        const client = getClient()
        const result = await client.knowledge.create({ name, description: opts.description })
        s.stop()
        success(`Knowledge base created: ${(result as any).id}`)
      } catch (err) {
        s.stop()
        handleError(err)
      }
    })

  // ── delete ───────────────────────────────────────────────────────────────
  kb.command('delete')
    .description('Delete a knowledge base')
    .argument('<id>', 'Knowledge base ID')
    .action(async (id) => {
      const s = spinner('Deleting…').start()
      try {
        const client = getClient()
        await client.knowledge.delete_(id)
        s.stop()
        success(`Knowledge base ${id} deleted.`)
      } catch (err) {
        s.stop()
        handleError(err)
      }
    })

  // ── documents ────────────────────────────────────────────────────────────
  kb.command('documents')
    .alias('docs')
    .description('List documents in a knowledge base')
    .argument('<kb-id>', 'Knowledge base ID')
    .action(async (kbId) => {
      try {
        const client = getClient()
        const data = await client.knowledge.documents(kbId)
        const docs = Array.isArray(data) ? data : (data as any).data || []
        if (docs.length === 0) {
          info('No documents found.')
          return
        }
        const rows = docs.map((d: any) => [
          d.id,
          truncate(d.name || d.fileName || '—', 50),
          d.status || '—',
        ])
        console.log(table(['ID', 'Name', 'Status'], rows))
      } catch (err) {
        handleError(err)
      }
    })

  // ── upload ───────────────────────────────────────────────────────────────
  kb.command('upload')
    .description('Upload a document to a knowledge base')
    .argument('<kb-id>', 'Knowledge base ID')
    .argument('<file>', 'File path to upload')
    .action(async (kbId, filePath) => {
      const s = spinner('Uploading document…').start()
      try {
        const { readFileSync } = await import('fs')
        const { basename } = await import('path')
        const content = readFileSync(filePath)
        const name = basename(filePath)

        const client = getClient()
        const result = await client.knowledge.uploadDocument(kbId, {
          content,
          name,
          type: 'application/octet-stream',
        })
        s.stop()
        success(`Document uploaded: ${(result as any).id || name}`)
      } catch (err) {
        s.stop()
        handleError(err)
      }
    })

  // ── search ───────────────────────────────────────────────────────────────
  kb.command('search')
    .description('Semantic search in a knowledge base')
    .argument('<kb-id>', 'Knowledge base ID')
    .argument('<query...>', 'Search query')
    .action(async (kbId, queryParts) => {
      const s = spinner('Searching…').start()
      try {
        const client = getClient()
        const results = await client.knowledge.search(kbId, queryParts.join(' '))
        s.stop()

        const items = Array.isArray(results) ? results : (results as any).data || []
        if (items.length === 0) {
          info('No results found.')
          return
        }
        for (const item of items) {
          console.log(
            `\n─── ${item.documentName || item.fileName || 'Result'} (score: ${item.score?.toFixed(3) || '—'}) ───`
          )
          console.log(truncate(item.content || item.text || '', 500))
        }
      } catch (err) {
        s.stop()
        handleError(err)
      }
    })
}
