import type { Command } from 'commander'
import inquirer from 'inquirer'
import { getClient } from '../auth.js'
import { handleError, info, spinner, success, table, truncate } from '../utils.js'

export function registerAgentCommands(program: Command): void {
  const ag = program.command('agents').alias('ag').description('Manage AI agents (workflow-based)')

  // ── create (interactive wizard) ──────────────────────────────────────────
  ag.command('create')
    .description('Create a new agent via interactive wizard')
    .action(async () => {
      try {
        const client = getClient()

        // Fetch available models
        let models: string[] = []
        try {
          const providerModels = await client.providers.models()
          const allModels = Array.isArray(providerModels)
            ? providerModels
            : (providerModels as any).data || []
          models = allModels.map((m: any) => m.id || m.name || String(m))
        } catch {
          models = [
            'gpt-4o',
            'gpt-4o-mini',
            'claude-sonnet-4-20250514',
            'claude-3-5-haiku-20241022',
          ]
        }

        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'name',
            message: 'Agent name:',
            validate: (v: string) => v.length > 0 || 'Required',
          },
          { type: 'list', name: 'model', message: 'Model:', choices: models },
          { type: 'editor', name: 'systemPrompt', message: 'System prompt (opens editor):' },
          { type: 'number', name: 'temperature', message: 'Temperature (0-2):', default: 0.7 },
        ])

        const s = spinner('Creating agent workflow…').start()

        // Create a workflow with an agent block configuration
        const workflow = await client.workflows.create({
          name: answers.name,
          description: `Agent: ${answers.name}`,
        })

        s.stop()
        success(`Agent created as workflow: ${(workflow as any).id}`)
        info(`Configure the agent block in the UI or use 'zelaxy chat ${(workflow as any).id}'`)
      } catch (err) {
        handleError(err)
      }
    })

  // ── list ─────────────────────────────────────────────────────────────────
  ag.command('list')
    .alias('ls')
    .description('List workflows that serve as agents')
    .action(async () => {
      const s = spinner('Loading agents…').start()
      try {
        const client = getClient()
        const data = await client.workflows.list()
        s.stop()

        const workflows = Array.isArray(data) ? data : (data as any).data || []
        // Filter workflows that have agent-like properties
        const agents = workflows.filter(
          (w: any) =>
            w.name?.toLowerCase().includes('agent') ||
            w.description?.toLowerCase().includes('agent')
        )

        if (agents.length === 0) {
          info('No agent workflows found. Create one with `zelaxy agents create`.')
          return
        }

        const rows = agents.map((w: any) => [
          w.id,
          truncate(w.name || '—', 40),
          w.isDeployed ? '● deployed' : '○ draft',
        ])
        console.log(table(['ID', 'Name', 'Status'], rows))
      } catch (err) {
        s.stop()
        handleError(err)
      }
    })

  // ── chat (shortcut) ─────────────────────────────────────────────────────
  ag.command('chat')
    .description('Start interactive chat with an agent')
    .argument('<id>', 'Workflow/agent ID')
    .action(async (id) => {
      // Delegate to the chat command
      info(`Starting chat with agent ${id}…`)
      info(`Use \`zelaxy chat ${id}\` for the full interactive experience.`)
    })

  // ── delete ───────────────────────────────────────────────────────────────
  ag.command('delete')
    .description('Delete an agent workflow')
    .argument('<id>', 'Workflow ID')
    .action(async (id) => {
      const s = spinner('Deleting agent…').start()
      try {
        const client = getClient()
        await client.workflows.delete_(id)
        s.stop()
        success(`Agent ${id} deleted.`)
      } catch (err) {
        s.stop()
        handleError(err)
      }
    })
}
