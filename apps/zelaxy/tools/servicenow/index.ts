import { createRecordTool } from '@/tools/servicenow/create_record'
import { getRecordTool } from '@/tools/servicenow/get_record'
import { queryTableTool } from '@/tools/servicenow/query_table'
import { updateRecordTool } from '@/tools/servicenow/update_record'

export const servicenowQueryTableTool = queryTableTool
export const servicenowCreateRecordTool = createRecordTool
export const servicenowGetRecordTool = getRecordTool
export const servicenowUpdateRecordTool = updateRecordTool
