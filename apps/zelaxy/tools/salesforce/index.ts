import { createRecordTool } from '@/tools/salesforce/create_record'
import { getRecordTool } from '@/tools/salesforce/get_record'
import { queryTool } from '@/tools/salesforce/query'
import { updateRecordTool } from '@/tools/salesforce/update_record'

export const salesforceCreateRecordTool = createRecordTool
export const salesforceQueryTool = queryTool
export const salesforceUpdateRecordTool = updateRecordTool
export const salesforceGetRecordTool = getRecordTool
