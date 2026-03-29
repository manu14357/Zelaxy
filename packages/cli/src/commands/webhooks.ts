import type { Command } from 'commander'
import { getClient } from '../auth.js'
import { handleError, info, json, spinner, success, table, truncate } from '../utils.js'

export function registerWebhookCommands(program: Command): void {
  const wh = program.command('webhooks').alias('wh').description('Manage webhooks')

  // ── list ─────────────────────────────────────────────────────────────────
  wh.command('list')
    .alias('ls')
    .description('List webhooks')
    .action(async () => {
      const s = spinner('Loading webhooks…').start()
      try {
        const client = getClient()
        const data = await client.webhooks.list()
        s.stop()

        const items = Array.isArray(data) ? data : (data as any).data || []
        if (items.length === 0) {
          info('No webhooks found.')
          return
        }
        const rows = items.map((w: any) => [
          w.id,
          truncate(w.path || w.name || '—', 40),
          w.workflowId || '—',
          w.isActive !== false ? '● active' : '○ inactive',
        ])
        console.log(table(['ID', 'Path', 'Workflow', 'Status'], rows))
      } catch (err) {
        s.stop()
        handleError(err)
      }
    })

  // ── create ───────────────────────────────────────────────────────────────
  wh.command('create')
    .description('Create a webhook')
    .option('-w, --workflow <id>', 'Workflow ID')
    .option('-p, --path <path>', 'Webhook path')
    .action(async (opts) => {
      const s = spinner('Creating webhook…').start()
      try {
        const client = getClient()
        const result = await client.webhooks.create({
          workflowId: opts.workflow,
          path: opts.path,
        })
        s.stop()
        success(`Webhook created: ${(result as any).id}`)
        if ((result as any).url) info(`URL: ${(result as any).url}`)
      } catch (err) {
        s.stop()
        handleError(err)
      }
    })

  // ── delete ───────────────────────────────────────────────────────────────
  wh.command('delete')
    .description('Delete a webhook')
    .argument('<id>', 'Webhook ID')
    .action(async (id) => {
      const s = spinner('Deleting…').start()
      try {
        const client = getClient()
        await client.webhooks.delete_(id)
        s.stop()
        success(`Webhook ${id} deleted.`)
      } catch (err) {
        s.stop()
        handleError(err)
      }
    })

  // ── test ─────────────────────────────────────────────────────────────────
  wh.command('test')
    .description('Send a test event to a webhook')
    .argument('<id>', 'Webhook ID')
    .action(async (id) => {
      const s = spinner('Sending test event…').start()
      try {
        const client = getClient()
        const result = await client.webhooks.test(id)
        s.stop()
        success('Test event sent')
        json(result)
      } catch (err) {
        s.stop()
        handleError(err)
      }
    })
}
