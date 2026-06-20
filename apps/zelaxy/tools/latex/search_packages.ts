import type { LatexPackagesResponse, SearchPackagesParams } from '@/tools/latex/types'
import type { ToolConfig } from '@/tools/types'

export const searchPackagesTool: ToolConfig<SearchPackagesParams, LatexPackagesResponse> = {
  id: 'latex_search_packages',
  name: 'LaTeX Search Packages',
  description:
    'Search the TeX Live packages available to the LaTeX compiler by name or description (latex.ytotech.com/packages).',
  version: '1.0.0',

  params: {
    query: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Search terms matched against package names and descriptions',
    },
  },

  request: {
    url: 'https://latex.ytotech.com/packages',
    method: 'GET',
    headers: () => ({
      Accept: 'application/json',
    }),
  },

  transformResponse: async (response, params) => {
    const data = await response.json()
    const query = (params?.query ?? '').trim().toLowerCase()
    const all: Record<string, any>[] = Array.isArray(data?.packages) ? data.packages : []
    const matches = query
      ? all.filter(
          (pkg) =>
            String(pkg?.name ?? '')
              .toLowerCase()
              .includes(query) ||
            String(pkg?.shortdesc ?? '')
              .toLowerCase()
              .includes(query)
        )
      : all
    return {
      success: true,
      output: {
        data: matches,
        metadata: { count: matches.length, status: response.status },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'TeX Live packages matching the query' },
    metadata: {
      type: 'json',
      description: 'Search metadata',
      properties: {
        count: { type: 'number', description: 'Number of matching packages' },
        status: { type: 'number', description: 'HTTP status code returned by the service' },
      },
    },
  },
}
