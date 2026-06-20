import { createBoardTool } from '@/tools/trello/create_board'
import { createCardTool } from '@/tools/trello/create_card'
import { getBoardTool } from '@/tools/trello/get_board'
import { listCardsTool } from '@/tools/trello/list_cards'
import { moveCardTool } from '@/tools/trello/move_card'

export const trelloCreateCardTool = createCardTool
export const trelloListCardsTool = listCardsTool
export const trelloGetBoardTool = getBoardTool
export const trelloCreateBoardTool = createBoardTool
export const trelloMoveCardTool = moveCardTool
