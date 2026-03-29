import type { Command } from 'commander'
import { getClient } from '../auth.js'
import { formatDate, handleError, info, spinner, success, table, truncate } from '../utils.js'

export function registerOrgCommands(program: Command): void {
  const org = program
    .command('orgs')
    .alias('org')
    .description('Manage organizations and workspaces')

  // ── list ─────────────────────────────────────────────────────────────────
  org
    .command('list')
    .alias('ls')
    .description('List organizations')
    .action(async () => {
      const s = spinner('Loading organizations…').start()
      try {
        const client = getClient()
        const data = await client.organizations.list()
        s.stop()

        const items = Array.isArray(data) ? data : (data as any).data || []
        if (items.length === 0) {
          info('No organizations found.')
          return
        }
        const rows = items.map((o: any) => [o.id, truncate(o.name || '—', 40), o.role || '—'])
        console.log(table(['ID', 'Name', 'Role'], rows))
      } catch (err) {
        s.stop()
        handleError(err)
      }
    })

  // ── members ──────────────────────────────────────────────────────────────
  org
    .command('members')
    .description('List organization members')
    .argument('<org-id>', 'Organization ID')
    .action(async (orgId) => {
      try {
        const client = getClient()
        const data = await client.organizations.members(orgId)
        const items = Array.isArray(data) ? data : (data as any).data || []
        if (items.length === 0) {
          info('No members found.')
          return
        }
        const rows = items.map((m: any) => [
          m.userId || m.id || '—',
          m.name || m.email || '—',
          m.role || '—',
        ])
        console.log(table(['User ID', 'Name/Email', 'Role'], rows))
      } catch (err) {
        handleError(err)
      }
    })

  // ── invite ───────────────────────────────────────────────────────────────
  org
    .command('invite')
    .description('Invite a member to an organization')
    .argument('<org-id>', 'Organization ID')
    .argument('<email>', 'Email to invite')
    .action(async (orgId, email) => {
      const s = spinner('Sending invite…').start()
      try {
        const client = getClient()
        await client.organizations.invite(orgId, email)
        s.stop()
        success(`Invitation sent to ${email}`)
      } catch (err) {
        s.stop()
        handleError(err)
      }
    })

  // ── workspaces ───────────────────────────────────────────────────────────
  org
    .command('workspaces')
    .description('List workspaces in an organization')
    .argument('<org-id>', 'Organization ID')
    .action(async (orgId) => {
      try {
        const client = getClient()
        const data = await client.organizations.workspaces()
        const items = Array.isArray(data) ? data : (data as any).data || []
        if (items.length === 0) {
          info('No workspaces found.')
          return
        }
        const rows = items.map((w: any) => [
          w.id,
          truncate(w.name || '—', 40),
          formatDate(w.createdAt),
        ])
        console.log(table(['ID', 'Name', 'Created'], rows))
      } catch (err) {
        handleError(err)
      }
    })
}
