import type { ToolConfig } from '@/tools/types'
import { databricksHost, parseDatabricksResponse } from './utils'

export const databricksListCatalogsTool: ToolConfig = {
  id: 'databricks_list_catalogs',
  name: 'Databricks List Catalogs',
  description: 'List Unity Catalog catalogs in a Databricks workspace.',
  version: '1.0.0',

  params: {
    host: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Databricks workspace URL',
    },
    token: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Databricks Personal Access Token',
    },
  },

  request: {
    url: (params) => `https://${databricksHost(params.host)}/api/2.1/unity-catalog/catalogs`,
    method: 'GET',
    headers: (params) => ({
      Accept: 'application/json',
      Authorization: `Bearer ${params.token}`,
    }),
  },

  transformResponse: async (response: Response) => {
    const data = await parseDatabricksResponse(response)
    const catalogs = (data.catalogs ?? []).map(
      (c: { name: string; comment?: string; catalog_type?: string }) => ({
        name: c.name,
        comment: c.comment ?? null,
        catalogType: c.catalog_type ?? null,
      })
    )
    return { success: true, output: { catalogs } }
  },

  outputs: {
    catalogs: { type: 'json', description: 'Array of Unity Catalog catalogs' },
  },
}
