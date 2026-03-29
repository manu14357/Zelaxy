import type { Command } from 'commander'
import { getClient } from '../auth.js'
import { handleError, info, json, spinner, success, table, truncate } from '../utils.js'

export function registerTemplateCommands(program: Command): void {
  const tpl = program
    .command('templates')
    .alias('tpl')
    .description('Browse and use workflow templates')

  // ── list ─────────────────────────────────────────────────────────────────
  tpl
    .command('list')
    .alias('ls')
    .description('List available templates')
    .action(async () => {
      const s = spinner('Loading templates…').start()
      try {
        const client = getClient()
        const data = await client.templates.list()
        s.stop()

        const items = Array.isArray(data) ? data : (data as any).data || []
        if (items.length === 0) {
          info('No templates found.')
          return
        }
        const rows = items.map((t: any) => [
          t.id,
          truncate(t.name || '—', 40),
          t.category || '—',
          truncate(t.description || '—', 50),
        ])
        console.log(table(['ID', 'Name', 'Category', 'Description'], rows))
      } catch (err) {
        s.stop()
        handleError(err)
      }
    })

  // ── info ─────────────────────────────────────────────────────────────────
  tpl
    .command('info')
    .description('Show template details')
    .argument('<id>', 'Template ID')
    .action(async (id) => {
      try {
        const client = getClient()
        const tpl = await client.templates.get_(id)
        json(tpl)
      } catch (err) {
        handleError(err)
      }
    })

  // ── use ──────────────────────────────────────────────────────────────────
  tpl
    .command('use')
    .description('Create a workflow from a template')
    .argument('<id>', 'Template ID')
    .action(async (id) => {
      const s = spinner('Creating workflow from template…').start()
      try {
        const client = getClient()
        const result = await client.templates.use(id)
        s.stop()
        success(`Workflow created from template: ${(result as any).id || 'done'}`)
      } catch (err) {
        s.stop()
        handleError(err)
      }
    })
}
