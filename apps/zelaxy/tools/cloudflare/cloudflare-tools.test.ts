/**
 * Request-builder tests for the Cloudflare tools.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import {
  cloudflareCreateDnsRecordTool,
  cloudflareDeleteDnsRecordTool,
  cloudflareGetZoneTool,
  cloudflareListDnsRecordsTool,
  cloudflareListZonesTool,
  cloudflarePurgeCacheTool,
  cloudflareUpdateDnsRecordTool,
} from '@/tools/cloudflare'

const P: any = {
  apiKey: 'k',
  accessToken: 't',
  awsRegion: 'us-east-1',
  region: 'us-east-1',
  userId: 'u',
  organizationId: 'org',
  sessionId: 's',
  zoneId: 'z',
  recordId: 'r',
  host: 'https://h.clickhouse.cloud:8443',
  sql: 'SELECT 1',
  username: 'u',
  password: 'p',
  deploymentUrl: 'https://a.convex.cloud',
  adminKey: 'ak',
  path: 'p',
  url: 'https://example.com/page',
  query: 'q',
  agentId: 'ag',
  pageId: 'pg',
  stackName: 'st',
  id: 'id',
}

describe('Cloudflare tools', () => {
  it('cloudflare_list_zones: builds its request', () => {
    expect(cloudflareListZonesTool.id).toBe('cloudflare_list_zones')
    expect(cloudflareListZonesTool.request.method).toBeTruthy()
    const u =
      typeof cloudflareListZonesTool.request.url === 'function'
        ? (cloudflareListZonesTool.request.url as any)(P)
        : cloudflareListZonesTool.request.url
    expect(String(u)).toContain('api.cloudflare.com/client/v4')
    expect(Object.keys(cloudflareListZonesTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof cloudflareListZonesTool.transformResponse).toBe('function')
  })

  it('cloudflare_get_zone: builds its request', () => {
    expect(cloudflareGetZoneTool.id).toBe('cloudflare_get_zone')
    expect(cloudflareGetZoneTool.request.method).toBe('GET')
    const u =
      typeof cloudflareGetZoneTool.request.url === 'function'
        ? (cloudflareGetZoneTool.request.url as any)(P)
        : cloudflareGetZoneTool.request.url
    expect(String(u)).toContain('api.cloudflare.com/client/v4')
    expect(Object.keys(cloudflareGetZoneTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof cloudflareGetZoneTool.transformResponse).toBe('function')
  })

  it('cloudflare_list_dns_records: builds its request', () => {
    expect(cloudflareListDnsRecordsTool.id).toBe('cloudflare_list_dns_records')
    expect(cloudflareListDnsRecordsTool.request.method).toBeTruthy()
    const u =
      typeof cloudflareListDnsRecordsTool.request.url === 'function'
        ? (cloudflareListDnsRecordsTool.request.url as any)(P)
        : cloudflareListDnsRecordsTool.request.url
    expect(String(u)).toContain('api.cloudflare.com/client/v4')
    expect(Object.keys(cloudflareListDnsRecordsTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof cloudflareListDnsRecordsTool.transformResponse).toBe('function')
  })

  it('cloudflare_create_dns_record: builds its request', () => {
    expect(cloudflareCreateDnsRecordTool.id).toBe('cloudflare_create_dns_record')
    expect(cloudflareCreateDnsRecordTool.request.method).toBeTruthy()
    const u =
      typeof cloudflareCreateDnsRecordTool.request.url === 'function'
        ? (cloudflareCreateDnsRecordTool.request.url as any)(P)
        : cloudflareCreateDnsRecordTool.request.url
    expect(String(u)).toContain('api.cloudflare.com/client/v4')
    expect(Object.keys(cloudflareCreateDnsRecordTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof cloudflareCreateDnsRecordTool.transformResponse).toBe('function')
  })

  it('cloudflare_update_dns_record: builds its request', () => {
    expect(cloudflareUpdateDnsRecordTool.id).toBe('cloudflare_update_dns_record')
    expect(cloudflareUpdateDnsRecordTool.request.method).toBeTruthy()
    const u =
      typeof cloudflareUpdateDnsRecordTool.request.url === 'function'
        ? (cloudflareUpdateDnsRecordTool.request.url as any)(P)
        : cloudflareUpdateDnsRecordTool.request.url
    expect(String(u)).toContain('api.cloudflare.com/client/v4')
    expect(Object.keys(cloudflareUpdateDnsRecordTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof cloudflareUpdateDnsRecordTool.transformResponse).toBe('function')
  })

  it('cloudflare_delete_dns_record: builds its request', () => {
    expect(cloudflareDeleteDnsRecordTool.id).toBe('cloudflare_delete_dns_record')
    expect(cloudflareDeleteDnsRecordTool.request.method).toBe('DELETE')
    const u =
      typeof cloudflareDeleteDnsRecordTool.request.url === 'function'
        ? (cloudflareDeleteDnsRecordTool.request.url as any)(P)
        : cloudflareDeleteDnsRecordTool.request.url
    expect(String(u)).toContain('api.cloudflare.com/client/v4')
    expect(Object.keys(cloudflareDeleteDnsRecordTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof cloudflareDeleteDnsRecordTool.transformResponse).toBe('function')
  })

  it('cloudflare_purge_cache: builds its request', () => {
    expect(cloudflarePurgeCacheTool.id).toBe('cloudflare_purge_cache')
    expect(cloudflarePurgeCacheTool.request.method).toBeTruthy()
    const u =
      typeof cloudflarePurgeCacheTool.request.url === 'function'
        ? (cloudflarePurgeCacheTool.request.url as any)(P)
        : cloudflarePurgeCacheTool.request.url
    expect(String(u)).toContain('api.cloudflare.com/client/v4')
    expect(Object.keys(cloudflarePurgeCacheTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof cloudflarePurgeCacheTool.transformResponse).toBe('function')
  })
})
