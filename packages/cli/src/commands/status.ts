import chalk from 'chalk'
import type { Command } from 'commander'
import { getClient } from '../auth.js'
import { getActiveProfile, getActiveProfileName } from '../config.js'
import { error, handleError, info, success } from '../utils.js'

export function registerStatusCommand(program: Command): void {
  program
    .command('status')
    .description('Check connection to Zelaxy server')
    .action(async () => {
      const profile = getActiveProfile()
      if (!profile) {
        info('Not logged in. Run `zelaxy auth login` first.')
        return
      }

      console.log(chalk.cyan.bold('\n  Zelaxy Status\n'))
      info(`Profile: ${getActiveProfileName()}`)
      info(`Server:  ${profile.baseUrl}`)

      try {
        const client = getClient()
        const user = await client.auth.me()
        success(`Connected as ${user.name || user.email}`)

        // Try to get some basic stats
        try {
          const workflows = await client.workflows.list()
          const count = Array.isArray(workflows)
            ? workflows.length
            : (workflows as any).data?.length || 0
          info(`Workflows: ${count}`)
        } catch {
          // Not critical
        }
      } catch (err: any) {
        if (err.code === 'ECONNREFUSED') {
          error(`Cannot connect to ${profile.baseUrl}`)
          info('Is the Zelaxy server running?')
        } else {
          handleError(err)
        }
      }
      console.log()
    })
}
