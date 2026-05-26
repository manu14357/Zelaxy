import type { AshbyGetJobPostingsParams, AshbyGetJobPostingsResponse } from '@/tools/ashby/types'
import { ashbyAuthHeaders, ashbyErrorMessage } from '@/tools/ashby/utils'
import type { ToolConfig } from '@/tools/types'

export const ashbyGetJobPostingsTool: ToolConfig<
  AshbyGetJobPostingsParams,
  AshbyGetJobPostingsResponse
> = {
  id: 'ashby_get_job_postings',
  name: 'Ashby Get Job Postings',
  description: 'Retrieves full details about a single job posting by its ID.',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Ashby API Key',
    },
    jobPostingId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The UUID of the job posting to fetch',
    },
    jobBoardId: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description:
        'Optional job board UUID. If omitted, returns posting for the external job board.',
    },
    expandJob: {
      type: 'boolean',
      required: false,
      visibility: 'user-or-llm',
      description: 'Whether to expand and include the related job object in the response',
    },
  },

  request: {
    url: 'https://api.ashbyhq.com/jobPosting.info',
    method: 'POST',
    headers: (params) => ashbyAuthHeaders(params.apiKey),
    body: (params) => {
      const body: Record<string, unknown> = { jobPostingId: params.jobPostingId.trim() }
      if (params.jobBoardId) body.jobBoardId = params.jobBoardId.trim()
      if (params.expandJob) body.expand = ['job']
      return body
    },
  },

  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!data.success) {
      throw new Error(ashbyErrorMessage(data, 'Failed to get job posting'))
    }
    const r = (data.results ?? {}) as Record<string, unknown>
    return {
      success: true,
      output: {
        id: (r.id as string) ?? '',
        title: (r.title as string) ?? '',
        descriptionPlain: (r.descriptionPlain as string) ?? null,
        descriptionHtml: (r.descriptionHtml as string) ?? null,
        descriptionSocial: (r.descriptionSocial as string) ?? null,
        departmentName: (r.departmentName as string) ?? null,
        teamName: (r.teamName as string) ?? null,
        teamNameHierarchy: Array.isArray(r.teamNameHierarchy)
          ? (r.teamNameHierarchy as string[])
          : [],
        jobId: (r.jobId as string) ?? null,
        locationName: (r.locationName as string) ?? null,
        isRemote: (r.isRemote as boolean) ?? false,
        workplaceType: (r.workplaceType as string) ?? null,
        employmentType: (r.employmentType as string) ?? null,
        isListed: (r.isListed as boolean) ?? false,
        publishedDate: (r.publishedDate as string) ?? null,
        applicationDeadline: (r.applicationDeadline as string) ?? null,
        externalLink: (r.externalLink as string) ?? null,
        applyLink: (r.applyLink as string) ?? null,
        updatedAt: (r.updatedAt as string) ?? null,
        job: (r.job as Record<string, unknown>) ?? null,
      },
    }
  },

  outputs: {
    id: { type: 'string', description: 'Job posting UUID' },
    title: { type: 'string', description: 'Job posting title' },
    descriptionPlain: {
      type: 'string',
      description: 'Full description in plain text',
      optional: true,
    },
    descriptionHtml: { type: 'string', description: 'Full description in HTML', optional: true },
    descriptionSocial: {
      type: 'string',
      description: 'Shortened description for social sharing',
      optional: true,
    },
    departmentName: { type: 'string', description: 'Department name', optional: true },
    teamName: { type: 'string', description: 'Team name', optional: true },
    teamNameHierarchy: {
      type: 'array',
      description: 'Hierarchy of team names from root to team',
      items: { type: 'string', description: 'Team name' },
    },
    jobId: { type: 'string', description: 'Associated job UUID', optional: true },
    locationName: { type: 'string', description: 'Primary location name', optional: true },
    isRemote: { type: 'boolean', description: 'Whether the posting is remote' },
    workplaceType: {
      type: 'string',
      description: 'Workplace type (OnSite, Remote, Hybrid)',
      optional: true,
    },
    employmentType: { type: 'string', description: 'Employment type', optional: true },
    isListed: { type: 'boolean', description: 'Whether publicly listed on the job board' },
    publishedDate: { type: 'string', description: 'ISO 8601 published date', optional: true },
    applicationDeadline: {
      type: 'string',
      description: 'ISO 8601 application deadline',
      optional: true,
    },
    externalLink: {
      type: 'string',
      description: 'External link to the job posting',
      optional: true,
    },
    applyLink: { type: 'string', description: 'Direct apply link', optional: true },
    updatedAt: { type: 'string', description: 'ISO 8601 last update timestamp', optional: true },
    job: {
      type: 'object',
      description: 'The expanded job object (when expandJob=true)',
      optional: true,
    },
  },
}
