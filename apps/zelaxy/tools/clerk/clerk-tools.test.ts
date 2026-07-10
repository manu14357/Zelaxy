/**
 * Request-builder tests for the Clerk tools.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import {
  clerkCreateOrganizationTool,
  clerkCreateUserTool,
  clerkDeleteUserTool,
  clerkGetOrganizationTool,
  clerkGetUserTool,
  clerkListOrganizationsTool,
  clerkListSessionsTool,
  clerkListUsersTool,
  clerkRevokeSessionTool,
  clerkUpdateUserTool,
} from '@/tools/clerk'

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

describe('Clerk tools', () => {
  it('clerk_list_users: builds its request', () => {
    expect(clerkListUsersTool.id).toBe('clerk_list_users')
    expect(clerkListUsersTool.request.method).toBeTruthy()
    const u =
      typeof clerkListUsersTool.request.url === 'function'
        ? (clerkListUsersTool.request.url as any)(P)
        : clerkListUsersTool.request.url
    expect(String(u)).toContain('api.clerk.com/v1')
    expect(Object.keys(clerkListUsersTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof clerkListUsersTool.transformResponse).toBe('function')
  })

  it('clerk_get_user: builds its request', () => {
    expect(clerkGetUserTool.id).toBe('clerk_get_user')
    expect(clerkGetUserTool.request.method).toBe('GET')
    const u =
      typeof clerkGetUserTool.request.url === 'function'
        ? (clerkGetUserTool.request.url as any)(P)
        : clerkGetUserTool.request.url
    expect(String(u)).toContain('api.clerk.com/v1')
    expect(Object.keys(clerkGetUserTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof clerkGetUserTool.transformResponse).toBe('function')
  })

  it('clerk_create_user: builds its request', () => {
    expect(clerkCreateUserTool.id).toBe('clerk_create_user')
    expect(clerkCreateUserTool.request.method).toBeTruthy()
    const u =
      typeof clerkCreateUserTool.request.url === 'function'
        ? (clerkCreateUserTool.request.url as any)(P)
        : clerkCreateUserTool.request.url
    expect(String(u)).toContain('api.clerk.com/v1')
    expect(Object.keys(clerkCreateUserTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof clerkCreateUserTool.transformResponse).toBe('function')
  })

  it('clerk_update_user: builds its request', () => {
    expect(clerkUpdateUserTool.id).toBe('clerk_update_user')
    expect(clerkUpdateUserTool.request.method).toBeTruthy()
    const u =
      typeof clerkUpdateUserTool.request.url === 'function'
        ? (clerkUpdateUserTool.request.url as any)(P)
        : clerkUpdateUserTool.request.url
    expect(String(u)).toContain('api.clerk.com/v1')
    expect(Object.keys(clerkUpdateUserTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof clerkUpdateUserTool.transformResponse).toBe('function')
  })

  it('clerk_delete_user: builds its request', () => {
    expect(clerkDeleteUserTool.id).toBe('clerk_delete_user')
    expect(clerkDeleteUserTool.request.method).toBe('DELETE')
    const u =
      typeof clerkDeleteUserTool.request.url === 'function'
        ? (clerkDeleteUserTool.request.url as any)(P)
        : clerkDeleteUserTool.request.url
    expect(String(u)).toContain('api.clerk.com/v1')
    expect(Object.keys(clerkDeleteUserTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof clerkDeleteUserTool.transformResponse).toBe('function')
  })

  it('clerk_list_organizations: builds its request', () => {
    expect(clerkListOrganizationsTool.id).toBe('clerk_list_organizations')
    expect(clerkListOrganizationsTool.request.method).toBeTruthy()
    const u =
      typeof clerkListOrganizationsTool.request.url === 'function'
        ? (clerkListOrganizationsTool.request.url as any)(P)
        : clerkListOrganizationsTool.request.url
    expect(String(u)).toContain('api.clerk.com/v1')
    expect(Object.keys(clerkListOrganizationsTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof clerkListOrganizationsTool.transformResponse).toBe('function')
  })

  it('clerk_get_organization: builds its request', () => {
    expect(clerkGetOrganizationTool.id).toBe('clerk_get_organization')
    expect(clerkGetOrganizationTool.request.method).toBe('GET')
    const u =
      typeof clerkGetOrganizationTool.request.url === 'function'
        ? (clerkGetOrganizationTool.request.url as any)(P)
        : clerkGetOrganizationTool.request.url
    expect(String(u)).toContain('api.clerk.com/v1')
    expect(Object.keys(clerkGetOrganizationTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof clerkGetOrganizationTool.transformResponse).toBe('function')
  })

  it('clerk_create_organization: builds its request', () => {
    expect(clerkCreateOrganizationTool.id).toBe('clerk_create_organization')
    expect(clerkCreateOrganizationTool.request.method).toBeTruthy()
    const u =
      typeof clerkCreateOrganizationTool.request.url === 'function'
        ? (clerkCreateOrganizationTool.request.url as any)(P)
        : clerkCreateOrganizationTool.request.url
    expect(String(u)).toContain('api.clerk.com/v1')
    expect(Object.keys(clerkCreateOrganizationTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof clerkCreateOrganizationTool.transformResponse).toBe('function')
  })

  it('clerk_list_sessions: builds its request', () => {
    expect(clerkListSessionsTool.id).toBe('clerk_list_sessions')
    expect(clerkListSessionsTool.request.method).toBeTruthy()
    const u =
      typeof clerkListSessionsTool.request.url === 'function'
        ? (clerkListSessionsTool.request.url as any)(P)
        : clerkListSessionsTool.request.url
    expect(String(u)).toContain('api.clerk.com/v1')
    expect(Object.keys(clerkListSessionsTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof clerkListSessionsTool.transformResponse).toBe('function')
  })

  it('clerk_revoke_session: builds its request', () => {
    expect(clerkRevokeSessionTool.id).toBe('clerk_revoke_session')
    expect(clerkRevokeSessionTool.request.method).toBe('POST')
    const u =
      typeof clerkRevokeSessionTool.request.url === 'function'
        ? (clerkRevokeSessionTool.request.url as any)(P)
        : clerkRevokeSessionTool.request.url
    expect(String(u)).toContain('api.clerk.com/v1')
    expect(Object.keys(clerkRevokeSessionTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof clerkRevokeSessionTool.transformResponse).toBe('function')
  })
})
