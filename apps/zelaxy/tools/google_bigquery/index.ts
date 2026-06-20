import { listDatasetsTool } from '@/tools/google_bigquery/list_datasets'
import { listTablesTool } from '@/tools/google_bigquery/list_tables'
import { queryTool } from '@/tools/google_bigquery/query'

export const googleBigqueryQueryTool = queryTool
export const googleBigqueryListDatasetsTool = listDatasetsTool
export const googleBigqueryListTablesTool = listTablesTool
