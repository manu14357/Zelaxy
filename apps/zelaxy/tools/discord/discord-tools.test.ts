/**
 * Request-builder tests for the Discord tools.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { discordGetMessagesTool } from '@/tools/discord/get_messages'
import { discordGetServerTool } from '@/tools/discord/get_server'
import { discordGetUserTool } from '@/tools/discord/get_user'
import { discordSendMessageTool } from '@/tools/discord/send_message'

const P: any = {
  apiKey: 'k',
  accessToken: 't',
  host: 'https://myws.databricks.com',
  site: 'datadoghq.com',
  runId: 'r',
  jobId: 'j',
  clusterId: 'c',
  catalogName: 'cat',
  monitorId: 'm',
  incidentId: 'i',
  dashboardId: 'd',
  workspaceId: 'w',
  sessionId: 's',
  secretName: 'sec',
  snapshotId: 'sn',
  channelId: 'ch',
  guildId: 'g',
  serverId: 'sv',
  userId: 'u',
  envelopeId: 'e',
  accountId: 'a',
  path: '/p',
  fileId: 'f',
  folderId: '0',
  query: 'q',
  personId: 'p',
  email: 'e@x.com',
  fullName: 'n',
  repositoryLocationName: 'rl',
  repositoryName: 'rn',
  jobName: 'jn',
  sql: 'SELECT 1',
  warehouseId: 'wh',
  id: 'id',
  name: 'n',
  message: 'm',
}

describe('Discord tools', () => {
  it('discord_get_messages: builds its request', () => {
    expect(discordGetMessagesTool.id).toBe('discord_get_messages')
    expect(discordGetMessagesTool.request.method).toBe('GET')
    const u =
      typeof discordGetMessagesTool.request.url === 'function'
        ? (discordGetMessagesTool.request.url as any)(P)
        : discordGetMessagesTool.request.url
    expect(String(u)).toContain('discord.com/api/v10')
    expect(Object.keys(discordGetMessagesTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof discordGetMessagesTool.transformResponse).toBe('function')
  })

  it('discord_get_server: builds its request', () => {
    expect(discordGetServerTool.id).toBe('discord_get_server')
    expect(discordGetServerTool.request.method).toBe('GET')
    const u =
      typeof discordGetServerTool.request.url === 'function'
        ? (discordGetServerTool.request.url as any)(P)
        : discordGetServerTool.request.url
    expect(String(u)).toContain('discord.com/api/v10')
    expect(Object.keys(discordGetServerTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof discordGetServerTool.transformResponse).toBe('function')
  })

  it('discord_get_user: builds its request', () => {
    expect(discordGetUserTool.id).toBe('discord_get_user')
    expect(discordGetUserTool.request.method).toBe('GET')
    const u =
      typeof discordGetUserTool.request.url === 'function'
        ? (discordGetUserTool.request.url as any)(P)
        : discordGetUserTool.request.url
    expect(String(u)).toContain('discord.com/api/v10')
    expect(Object.keys(discordGetUserTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof discordGetUserTool.transformResponse).toBe('function')
  })

  it('discord_send_message: builds its request', () => {
    expect(discordSendMessageTool.id).toBe('discord_send_message')
    expect(discordSendMessageTool.request.method).toBe('POST')
    const u =
      typeof discordSendMessageTool.request.url === 'function'
        ? (discordSendMessageTool.request.url as any)(P)
        : discordSendMessageTool.request.url
    expect(String(u)).toContain('discord.com/api/v10')
    expect(Object.keys(discordSendMessageTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof discordSendMessageTool.transformResponse).toBe('function')
  })
})
