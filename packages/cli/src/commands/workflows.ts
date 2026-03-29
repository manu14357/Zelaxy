import type { Command } from 'commander'
import { getClient } from '../auth.js'
import {
  error,
  formatDate,
  handleError,
  info,
  json,
  spinner,
  success,
  table,
  truncate,
} from '../utils.js'

export function registerWorkflowCommands(program: Command): void {
  const wf = program.command('workflows').alias('wf').description('Manage workflows')

  // ── list ─────────────────────────────────────────────────────────────────
  wf.command('list')
    .alias('ls')
    .description('List all workflows')
    .action(async () => {
      const s = spinner('Loading workflows…').start()
      try {
        const client = getClient()
        const data = await client.workflows.list()
        s.stop()

        const workflows = Array.isArray(data) ? data : (data as any).data || []
        if (workflows.length === 0) {
          info('No workflows found.')
          return
        }

        const rows = workflows.map((w: any) => [
          w.id,
          truncate(w.name || '—', 40),
          w.isDeployed ? '● deployed' : '○ draft',
          formatDate(w.updatedAt || w.createdAt),
        ])
        console.log(table(['ID', 'Name', 'Status', 'Updated'], rows))
      } catch (err) {
        s.stop()
        handleError(err)
      }
    })

  // ── get ──────────────────────────────────────────────────────────────────
  wf.command('get')
    .description('Get workflow details')
    .argument('<id>', 'Workflow ID')
    .option('--json', 'Output raw JSON')
    .action(async (id, opts) => {
      try {
        const client = getClient()
        const workflow = await client.workflows.get_(id)
        if (opts.json) {
          json(workflow)
        } else {
          info(`Name:     ${workflow.name || '—'}`)
          info(`ID:       ${workflow.id}`)
          info(`Deployed: ${workflow.isDeployed ? 'Yes' : 'No'}`)
          info(`Updated:  ${formatDate(workflow.updatedAt)}`)
          if (workflow.description) info(`Desc:     ${workflow.description}`)
        }
      } catch (err) {
        handleError(err)
      }
    })

  // ── create ───────────────────────────────────────────────────────────────
  wf.command('create')
    .description('Create a new workflow')
    .argument('<name>', 'Workflow name')
    .option('-d, --description <desc>', 'Workflow description')
    .action(async (name, opts) => {
      const s = spinner('Creating workflow…').start()
      try {
        const client = getClient()
        const workflow = await client.workflows.create({ name, description: opts.description })
        s.stop()
        success(`Workflow created: ${workflow.id}`)
      } catch (err) {
        s.stop()
        handleError(err)
      }
    })

  // ── delete ───────────────────────────────────────────────────────────────
  wf.command('delete')
    .description('Delete a workflow')
    .argument('<id>', 'Workflow ID')
    .action(async (id) => {
      const s = spinner('Deleting workflow…').start()
      try {
        const client = getClient()
        await client.workflows.delete_(id)
        s.stop()
        success(`Workflow ${id} deleted.`)
      } catch (err) {
        s.stop()
        handleError(err)
      }
    })

  // ── execute ──────────────────────────────────────────────────────────────
  wf.command('execute')
    .alias('run')
    .description('Execute a workflow')
    .argument('<id>', 'Workflow ID')
    .option('-i, --input <json>', 'JSON input data')
    .option('-t, --timeout <ms>', 'Timeout in ms', '30000')
    .action(async (id, opts) => {
      const s = spinner('Executing workflow…').start()
      try {
        const client = getClient()
        const input = opts.input ? JSON.parse(opts.input) : undefined
        const result = await client.workflows.execute(id, {
          input,
          timeout: Number.parseInt(opts.timeout, 10),
        })
        s.stop()

        if (result.success) {
          success('Execution completed')
        } else {
          error(`Execution failed: ${result.error || 'unknown error'}`)
        }
        json(result)
      } catch (err) {
        s.stop()
        handleError(err)
      }
    })

  // ── deploy ───────────────────────────────────────────────────────────────
  wf.command('deploy')
    .description('Deploy a workflow')
    .argument('<id>', 'Workflow ID')
    .action(async (id) => {
      const s = spinner('Deploying workflow…').start()
      try {
        const client = getClient()
        await client.workflows.deploy(id)
        s.stop()
        success(`Workflow ${id} deployed.`)
      } catch (err) {
        s.stop()
        handleError(err)
      }
    })

  // ── duplicate ────────────────────────────────────────────────────────────
  wf.command('duplicate')
    .description('Duplicate a workflow')
    .argument('<id>', 'Workflow ID')
    .action(async (id) => {
      const s = spinner('Duplicating…').start()
      try {
        const client = getClient()
        const result = await client.workflows.duplicate(id)
        s.stop()
        success(`Duplicated as ${(result as any).id || 'new workflow'}`)
      } catch (err) {
        s.stop()
        handleError(err)
      }
    })

  // ── logs ─────────────────────────────────────────────────────────────────
  wf.command('logs')
    .description('Show workflow execution logs')
    .argument('<id>', 'Workflow ID')
    .action(async (id) => {
      try {
        const client = getClient()
        const logs = await client.workflows.logs(id)
        const entries = Array.isArray(logs) ? logs : (logs as any).data || []
        if (entries.length === 0) {
          info('No logs found.')
          return
        }
        for (const log of entries) {
          console.log(`[${formatDate(log.createdAt)}] ${log.status} — ${log.duration || '—'}ms`)
        }
      } catch (err) {
        handleError(err)
      }
    })

  // ── export ───────────────────────────────────────────────────────────────
  wf.command('export')
    .description('Export workflow as YAML')
    .argument('<id>', 'Workflow ID')
    .action(async (id) => {
      try {
        const client = getClient()
        const yaml = await client.workflows.exportYaml(id)
        console.log(yaml)
      } catch (err) {
        handleError(err)
      }
    })

  // ── import ───────────────────────────────────────────────────────────────
  wf.command('import')
    .description('Import workflow from YAML')
    .argument('<file>', 'Path to YAML file')
    .action(async (file) => {
      try {
        const { readFileSync } = await import('fs')
        const content = readFileSync(file, 'utf-8')
        const client = getClient()
        const result = await client.workflows.importYaml(content)
        success(`Workflow imported: ${(result as any).id || 'done'}`)
      } catch (err) {
        handleError(err)
      }
    })

  // ── status ───────────────────────────────────────────────────────────────
  wf.command('status')
    .description('Show workflow deployment status')
    .argument('<id>', 'Workflow ID')
    .action(async (id) => {
      try {
        const client = getClient()
        const status = await client.workflows.status(id)
        info(`Deployed:            ${status.isDeployed ? 'Yes' : 'No'}`)
        info(`Published:           ${status.isPublished ? 'Yes' : 'No'}`)
        info(`Needs Redeployment:  ${status.needsRedeployment ? 'Yes' : 'No'}`)
        if (status.deployedAt) info(`Deployed At: ${formatDate(status.deployedAt)}`)
      } catch (err) {
        handleError(err)
      }
    })
}
