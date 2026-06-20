import { deleteOneTool } from '@/tools/mongodb/delete_one'
import { findTool } from '@/tools/mongodb/find'
import { insertOneTool } from '@/tools/mongodb/insert_one'
import { updateOneTool } from '@/tools/mongodb/update_one'

export const mongodbFindTool = findTool
export const mongodbInsertOneTool = insertOneTool
export const mongodbUpdateOneTool = updateOneTool
export const mongodbDeleteOneTool = deleteOneTool
