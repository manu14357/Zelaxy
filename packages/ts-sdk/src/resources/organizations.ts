import { BaseClient } from '../base'
import type { Organization, OrganizationMember, Workspace } from '../types'

export class OrganizationsResource extends BaseClient {
  async list(): Promise<Organization[]> {
    const result = await this.get<Organization[] | { data: Organization[] }>('/api/organizations')
    return Array.isArray(result) ? result : result.data
  }

  async get_(id: string): Promise<Organization> {
    return this.get<Organization>(`/api/organizations/${id}`)
  }

  async create(params: { name: string }): Promise<Organization> {
    return this.post<Organization>('/api/organizations', params)
  }

  async update(id: string, params: { name?: string; logo?: string }): Promise<Organization> {
    return this.patch<Organization>(`/api/organizations/${id}`, params)
  }

  async delete_(id: string): Promise<void> {
    await this.del(`/api/organizations/${id}`)
  }

  async members(orgId: string): Promise<OrganizationMember[]> {
    const result = await this.get<OrganizationMember[] | { data: OrganizationMember[] }>(
      `/api/organizations/${orgId}/members`
    )
    return Array.isArray(result) ? result : result.data
  }

  async invite(orgId: string, email: string, role?: string): Promise<any> {
    return this.post(`/api/organizations/${orgId}/invitations`, { email, role })
  }

  async removeMember(orgId: string, memberId: string): Promise<void> {
    await this.del(`/api/organizations/${orgId}/members/${memberId}`)
  }

  // ─── Workspaces ──────────────────────────────────────────────────────

  async workspaces(): Promise<Workspace[]> {
    const result = await this.get<Workspace[] | { data: Workspace[] }>('/api/workspaces')
    return Array.isArray(result) ? result : result.data
  }

  async workspace(id: string): Promise<Workspace> {
    return this.get<Workspace>(`/api/workspaces/${id}`)
  }

  async createWorkspace(params: { name: string; organizationId?: string }): Promise<Workspace> {
    return this.post<Workspace>('/api/workspaces', params)
  }

  async deleteWorkspace(id: string): Promise<void> {
    await this.del(`/api/workspaces/${id}`)
  }
}
