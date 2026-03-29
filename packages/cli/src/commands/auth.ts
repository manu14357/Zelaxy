import type { Command } from 'commander'
import inquirer from 'inquirer'
import { getClient, loginWithApiKey } from '../auth.js'
import {
  clearConfig,
  deleteProfile,
  getActiveProfile,
  getActiveProfileName,
  getConfigPath,
  listProfiles,
  setActiveProfile,
} from '../config.js'
import { dim, error, handleError, info, success, table } from '../utils.js'

export function registerAuthCommands(program: Command): void {
  const auth = program.command('auth').description('Authentication and profile management')

  // ── login ────────────────────────────────────────────────────────────────
  auth
    .command('login')
    .description('Authenticate with your Zelaxy instance')
    .option('-k, --api-key <key>', 'API key')
    .option('-u, --url <url>', 'Zelaxy server URL', 'http://localhost:3000')
    .option('-p, --profile <name>', 'Profile name', 'default')
    .action(async (opts) => {
      try {
        let apiKey = opts.apiKey
        const baseUrl = opts.url
        const profileName = opts.profile

        if (!apiKey) {
          const answers = await inquirer.prompt([
            {
              type: 'password',
              name: 'apiKey',
              message: 'Enter your API key:',
              mask: '*',
              validate: (v: string) => v.length > 0 || 'API key is required',
            },
          ])
          apiKey = answers.apiKey
        }

        const { user } = await loginWithApiKey(apiKey, baseUrl, profileName)
        success(`Logged in as ${user.name || user.email} (profile: ${profileName})`)
      } catch (err) {
        handleError(err)
      }
    })

  // ── logout ───────────────────────────────────────────────────────────────
  auth
    .command('logout')
    .description('Remove stored credentials')
    .option('-p, --profile <name>', 'Profile to remove (default: active profile)')
    .option('-a, --all', 'Remove all profiles')
    .action(async (opts) => {
      try {
        if (opts.all) {
          clearConfig()
          success('All profiles removed')
        } else {
          const name = opts.profile || getActiveProfileName()
          deleteProfile(name)
          success(`Profile "${name}" removed`)
        }
      } catch (err) {
        handleError(err)
      }
    })

  // ── status ───────────────────────────────────────────────────────────────
  auth
    .command('status')
    .description('Show current authentication status')
    .action(async () => {
      try {
        const profile = getActiveProfile()
        if (!profile) {
          info('Not logged in. Run `zelaxy auth login` to authenticate.')
          return
        }

        info(`Profile: ${getActiveProfileName()}`)
        info(`Server:  ${profile.baseUrl}`)

        const client = getClient()
        const user = await client.auth.me()
        info(`User:    ${user.name || '—'} (${user.email})`)
      } catch (err) {
        handleError(err)
      }
    })

  // ── switch ───────────────────────────────────────────────────────────────
  auth
    .command('switch')
    .description('Switch active profile')
    .argument('[name]', 'Profile name')
    .action(async (name) => {
      try {
        const profiles = listProfiles()
        const names = Object.keys(profiles)

        if (names.length === 0) {
          info('No profiles found. Run `zelaxy auth login` first.')
          return
        }

        if (!name) {
          const answer = await inquirer.prompt([
            {
              type: 'list',
              name: 'profile',
              message: 'Select profile:',
              choices: names,
              default: getActiveProfileName(),
            },
          ])
          name = answer.profile
        }

        if (!profiles[name]) {
          error(`Profile "${name}" not found.`)
          return
        }

        setActiveProfile(name)
        success(`Switched to profile "${name}"`)
      } catch (err) {
        handleError(err)
      }
    })

  // ── profiles ─────────────────────────────────────────────────────────────
  auth
    .command('profiles')
    .description('List all saved profiles')
    .action(() => {
      const profiles = listProfiles()
      const active = getActiveProfileName()
      const entries = Object.entries(profiles)

      if (entries.length === 0) {
        info('No profiles found.')
        return
      }

      const rows = entries.map(([name, p]) => [
        name === active ? `→ ${name}` : `  ${name}`,
        p.baseUrl,
        `${p.apiKey.slice(0, 8)}…`,
      ])

      console.log(table(['Profile', 'Server', 'API Key'], rows))
    })

  // ── config ───────────────────────────────────────────────────────────────
  auth
    .command('config')
    .description('Show config file path')
    .action(() => {
      dim(getConfigPath())
    })
}
