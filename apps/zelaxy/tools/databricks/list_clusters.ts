import type { ToolConfig } from '@/tools/types'
import { databricksHeaders, databricksHost, parseDatabricksResponse } from './utils'

export const databricksListClustersTool: ToolConfig = {
  id: 'databricks_list_clusters',
  name: 'Databricks List Clusters',
  description: 'List all clusters in a Databricks workspace.',
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
    url: (params) => `https://${databricksHost(params.host)}/api/2.0/clusters/list`,
    method: 'GET',
    headers: databricksHeaders,
  },

  transformResponse: async (response: Response) => {
    const data = await parseDatabricksResponse(response)
    const clusters = (data.clusters ?? []).map(
      (c: {
        cluster_id: string
        cluster_name: string
        state: string
        cluster_source: string
        spark_version: string
        node_type_id: string
        num_workers?: number
      }) => ({
        clusterId: c.cluster_id,
        name: c.cluster_name,
        state: c.state,
        source: c.cluster_source,
        sparkVersion: c.spark_version,
        nodeTypeId: c.node_type_id,
        numWorkers: c.num_workers ?? null,
      })
    )
    return { success: true, output: { clusters } }
  },

  outputs: {
    clusters: { type: 'json', description: 'Array of cluster objects' },
  },
}
