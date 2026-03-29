import type { Command } from 'commander'
import inquirer from 'inquirer'
import { getClient } from '../auth.js'
import { handleError, info, json, spinner, success, table, truncate } from '../utils.js'

export function registerMcpCommands(program: Command): void {
  const mcp = program.command('mcp').description('Manage MCP servers')

  // ── list ─────────────────────────────────────────────────────────────────
  mcp
    .command('list')
    .alias('ls')
    .description('List MCP servers')
    .action(async () => {
      const s = spinner('Loading MCP servers…').start()
      try {
        const client = getClient()
        const data = await client.tools.mcpServers()
        s.stop()

        const items = Array.isArray(data) ? data : (data as any).data || []
        if (items.length === 0) {
          info('No MCP servers found.')
          return
        }
        const rows = items.map((srv: any) => [
          srv.id,
          truncate(srv.name || '—', 30),
          srv.url || '—',
          srv.status || '—',
        ])
        console.log(table(['ID', 'Name', 'URL', 'Status'], rows))
      } catch (err) {
        s.stop()
        handleError(err)
      }
    })

  // ── add ──────────────────────────────────────────────────────────────────
  mcp
    .command('add')
    .description('Add a new MCP server')
    .option('-n, --name <name>', 'Server name')
    .option('-u, --url <url>', 'Server URL')
    .action(async (opts) => {
      try {
        let name = opts.name
        let url = opts.url

        if (!name || !url) {
          const answers = await inquirer.prompt([
            ...(!name
              ? [
                  {
                    type: 'input',
                    name: 'name',
                    message: 'Server name:',
                    validate: (v: string) => v.length > 0 || 'Required',
                  },
                ]
              : []),
            ...(!url
              ? [
                  {
                    type: 'input',
                    name: 'url',
                    message: 'Server URL:',
                    validate: (v: string) => v.length > 0 || 'Required',
                  },
                ]
              : []),
          ])
          name = name || answers.name
          url = url || answers.url
        }

        const s = spinner('Adding MCP server…').start()
        const client = getClient()
        const result = await client.tools.mcpServerCreate({ name, url })
        s.stop()
        success(`MCP server added: ${(result as any).id || name}`)
      } catch (err) {
        handleError(err)
      }
    })

  // ── remove ───────────────────────────────────────────────────────────────
  mcp
    .command('remove')
    .description('Remove an MCP server')
    .argument('<id>', 'Server ID')
    .action(async (id) => {
      const s = spinner('Removing MCP server…').start()
      try {
        const client = getClient()
        await client.tools.mcpServerDelete(id)
        s.stop()
        success(`MCP server ${id} removed.`)
      } catch (err) {
        s.stop()
        handleError(err)
      }
    })

  // ── test ─────────────────────────────────────────────────────────────────
  mcp
    .command('test')
    .description('Test MCP server connection')
    .argument('<id>', 'Server ID')
    .action(async (id) => {
      const s = spinner('Testing connection…').start()
      try {
        const client = getClient()
        const result = await client.tools.mcpServerTest(id)
        s.stop()
        success('Connection successful')
        json(result)
      } catch (err) {
        s.stop()
        handleError(err)
      }
    })

  // ── tools ────────────────────────────────────────────────────────────────
  mcp
    .command('tools')
    .description('List tools from an MCP server')
    .argument('<id>', 'Server ID')
    .action(async (id) => {
      const s = spinner('Loading tools…').start()
      try {
        const client = getClient()
        const data = await client.tools.mcpServerTools(id)
        s.stop()

        const items = Array.isArray(data) ? data : (data as any).data || []
        if (items.length === 0) {
          info('No tools found on this server.')
          return
        }
        const rows = items.map((t: any) => [t.name || '—', truncate(t.description || '—', 60)])
        console.log(table(['Name', 'Description'], rows))
      } catch (err) {
        s.stop()
        handleError(err)
      }
    })
}
