import { createItemTool } from '@/tools/monday/create_item'
import { getBoardItemsTool } from '@/tools/monday/get_board_items'
import { listBoardsTool } from '@/tools/monday/list_boards'
import { updateItemTool } from '@/tools/monday/update_item'

export const mondayListBoardsTool = listBoardsTool
export const mondayGetBoardItemsTool = getBoardItemsTool
export const mondayCreateItemTool = createItemTool
export const mondayUpdateItemTool = updateItemTool
