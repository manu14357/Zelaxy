import type { QuartrGetCompanyParams, QuartrObjectResponse } from '@/tools/quartr/types'
import type { ToolConfig } from '@/tools/types'

export const getCompanyTool: ToolConfig<QuartrGetCompanyParams, QuartrObjectResponse> = {
  id: 'quartr_get_company',
  name: 'Quartr Get Company',
  description: 'Retrieve a single company from Quartr by its company ID',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Quartr API key',
    },
    companyId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Quartr company ID (e.g. 4742)',
    },
  },

  request: {
    url: (params) =>
      `https://api.quartr.com/public/v3/companies/${encodeURIComponent(String(params.companyId).trim())}`,
    method: 'GET',
    headers: (params) => ({ 'x-api-key': params.apiKey }),
  },

  transformResponse: async (response) => {
    const json = await response.json()
    const company = json.data ?? json
    return {
      success: true,
      output: { data: company, metadata: { id: company?.id ?? null } },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The requested Quartr company object' },
    metadata: {
      type: 'json',
      description: 'Company identifiers',
      properties: {
        id: { type: 'number', description: 'Quartr company ID' },
      },
    },
  },
}
