import type { Command } from 'commander'
import { getClient } from '../auth.js'
import { formatDate, handleError, info, spinner, success, table } from '../utils.js'

export function registerKeyCommands(program: Command): void {
  const keys = program.command('keys').description('Manage API keys')

  // ── list ─────────────────────────────────────────────────────────────────
  keys
    .command('list')
    .alias('ls')
    .description('List API keys')
    .action(async () => {
      const s = spinner('Loading API keys…').start()
      try {
        const client = getClient()
        const data = await client.auth.apiKeys()
        s.stop()

        const items = Array.isArray(data) ? data : (data as any).data || []
        if (items.length === 0) {
          info('No API keys found.')
          return
        }
        const rows = items.map((k: any) => [
          k.id,
          k.name || '—',
          k.key ? `${k.key.slice(0, 12)}…` : '—',
          formatDate(k.createdAt),
          formatDate(k.lastUsedAt),
        ])
        console.log(table(['ID', 'Name', 'Key', 'Created', 'Last Used'], rows))
      } catch (err) {
        s.stop()
        handleError(err)
      }
    })

  // ── create ───────────────────────────────────────────────────────────────
  keys
    .command('create')
    .description('Create a new API key')
    .argument('<name>', 'Key name')
    .action(async (name) => {
      const s = spinner('Creating API key…').start()
      try {
        const client = getClient()
        const result = await client.auth.createApiKey(name)
        s.stop()
        success(`API key created: ${(result as any).name || name}`)
        if ((result as any).key) {
          info(`Key: ${(result as any).key}`)
          info('Save this key — it will not be shown again.')
        }
      } catch (err) {
        s.stop()
        handleError(err)
      }
    })

  // ── revoke ───────────────────────────────────────────────────────────────
  keys
    .command('revoke')
    .alias('delete')
    .description('Revoke an API key')
    .argument('<id>', 'Key ID')
    .action(async (id) => {
      const s = spinner('Revoking API key…').start()
      try {
        const client = getClient()
        await client.auth.deleteApiKey(id)
        s.stop()
        success(`API key ${id} revoked.`)
      } catch (err) {
        s.stop()
        handleError(err)
      }
    })
}
