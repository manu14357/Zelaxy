import { createRecordTool } from '@/tools/microsoft_dataverse/create_record'
import { getRecordTool } from '@/tools/microsoft_dataverse/get_record'
import { queryRecordsTool } from '@/tools/microsoft_dataverse/query_records'

export const microsoftDataverseQueryRecordsTool = queryRecordsTool
export const microsoftDataverseCreateRecordTool = createRecordTool
export const microsoftDataverseGetRecordTool = getRecordTool
