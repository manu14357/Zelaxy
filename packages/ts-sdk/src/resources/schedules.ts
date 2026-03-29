import { BaseClient } from '../base'
import type { Schedule, ScheduleCreateParams } from '../types'

export class SchedulesResource extends BaseClient {
  async list(): Promise<Schedule[]> {
    const result = await this.get<Schedule[] | { data: Schedule[] }>('/api/schedules')
    return Array.isArray(result) ? result : result.data
  }

  async get_(id: string): Promise<Schedule> {
    return this.get<Schedule>(`/api/schedules/${id}`)
  }

  async create(params: ScheduleCreateParams): Promise<Schedule> {
    return this.post<Schedule>('/api/schedules', params)
  }

  async update(
    id: string,
    params: Partial<ScheduleCreateParams & { isActive: boolean }>
  ): Promise<Schedule> {
    return this.patch<Schedule>(`/api/schedules/${id}`, params)
  }

  async delete_(id: string): Promise<void> {
    await this.del(`/api/schedules/${id}`)
  }

  async trigger(id: string): Promise<any> {
    return this.post(`/api/schedules/execute`, { scheduleId: id })
  }

  async status(id: string): Promise<any> {
    return this.get(`/api/schedules/${id}/status`)
  }
}
