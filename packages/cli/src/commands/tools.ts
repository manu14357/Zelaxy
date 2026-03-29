import type { Command } from 'commander'
import { getClient } from '../auth.js'
import { handleError, info, spinner, table, truncate } from '../utils.js'

export function registerToolsCommands(program: Command): void {
  const tools = program.command('tools').description('Manage tools and integrations')

  // ── list ─────────────────────────────────────────────────────────────────
  tools
    .command('list')
    .alias('ls')
    .description('List available tools')
    .action(async () => {
      const s = spinner('Loading tools…').start()
      try {
        const client = getClient()
        const data = await client.tools.list()
        s.stop()

        const items = Array.isArray(data) ? data : (data as any).data || []
        if (items.length === 0) {
          info('No tools found.')
          return
        }
        const rows = items.map((t: any) => [
          t.id,
          truncate(t.name || '—', 30),
          t.category || '—',
          t.isConnected ? '● connected' : '○ disconnected',
        ])
        console.log(table(['ID', 'Name', 'Category', 'Status'], rows))
      } catch (err) {
        s.stop()
        handleError(err)
      }
    })

  // ── custom list ──────────────────────────────────────────────────────────
  tools
    .command('custom')
    .description('List custom tools')
    .action(async () => {
      const s = spinner('Loading custom tools…').start()
      try {
        const client = getClient()
        const data = await client.tools.customList()
        s.stop()

        const items = Array.isArray(data) ? data : (data as any).data || []
        if (items.length === 0) {
          info('No custom tools found.')
          return
        }
        const rows = items.map((t: any) => [
          t.id,
          truncate(t.name || '—', 30),
          truncate(t.description || '—', 50),
        ])
        console.log(table(['ID', 'Name', 'Description'], rows))
      } catch (err) {
        s.stop()
        handleError(err)
      }
    })

  // ── oauth ────────────────────────────────────────────────────────────────
  tools
    .command('oauth')
    .description('List OAuth tool connections')
    .action(async () => {
      try {
        const client = getClient()
        const data = await client.tools.oauthConnections()
        const items = Array.isArray(data) ? data : (data as any).data || []
        if (items.length === 0) {
          info('No OAuth connections found.')
          return
        }
        const rows = items.map((c: any) => [
          c.provider,
          c.isConnected ? '● connected' : '○ disconnected',
          c.email || '—',
        ])
        console.log(table(['Provider', 'Status', 'Account'], rows))
      } catch (err) {
        handleError(err)
      }
    })
}
