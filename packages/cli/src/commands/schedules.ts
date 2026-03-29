import type { Command } from 'commander'
import { getClient } from '../auth.js'
import { formatDate, handleError, info, json, spinner, success, table } from '../utils.js'

export function registerScheduleCommands(program: Command): void {
  const sch = program.command('schedules').alias('sch').description('Manage scheduled triggers')

  // ── list ─────────────────────────────────────────────────────────────────
  sch
    .command('list')
    .alias('ls')
    .description('List schedules')
    .action(async () => {
      const s = spinner('Loading schedules…').start()
      try {
        const client = getClient()
        const data = await client.schedules.list()
        s.stop()

        const items = Array.isArray(data) ? data : (data as any).data || []
        if (items.length === 0) {
          info('No schedules found.')
          return
        }
        const rows = items.map((sch: any) => [
          sch.id,
          sch.cronExpression || sch.cron || '—',
          sch.workflowId || '—',
          sch.isActive !== false ? '● active' : '○ inactive',
          formatDate(sch.nextRunAt),
        ])
        console.log(table(['ID', 'Cron', 'Workflow', 'Status', 'Next Run'], rows))
      } catch (err) {
        s.stop()
        handleError(err)
      }
    })

  // ── create ───────────────────────────────────────────────────────────────
  sch
    .command('create')
    .description('Create a schedule')
    .option('-w, --workflow <id>', 'Workflow ID')
    .option('-c, --cron <expression>', 'Cron expression')
    .action(async (opts) => {
      const s = spinner('Creating schedule…').start()
      try {
        const client = getClient()
        const result = await client.schedules.create({
          workflowId: opts.workflow,
          cronExpression: opts.cron,
        })
        s.stop()
        success(`Schedule created: ${(result as any).id}`)
      } catch (err) {
        s.stop()
        handleError(err)
      }
    })

  // ── delete ───────────────────────────────────────────────────────────────
  sch
    .command('delete')
    .description('Delete a schedule')
    .argument('<id>', 'Schedule ID')
    .action(async (id) => {
      const s = spinner('Deleting…').start()
      try {
        const client = getClient()
        await client.schedules.delete_(id)
        s.stop()
        success(`Schedule ${id} deleted.`)
      } catch (err) {
        s.stop()
        handleError(err)
      }
    })

  // ── trigger ──────────────────────────────────────────────────────────────
  sch
    .command('trigger')
    .description('Manually trigger a schedule')
    .argument('<id>', 'Schedule ID')
    .action(async (id) => {
      const s = spinner('Triggering…').start()
      try {
        const client = getClient()
        const result = await client.schedules.trigger(id)
        s.stop()
        success('Schedule triggered')
        json(result)
      } catch (err) {
        s.stop()
        handleError(err)
      }
    })
}
