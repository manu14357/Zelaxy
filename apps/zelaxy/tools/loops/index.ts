import { createContactTool } from '@/tools/loops/create_contact'
import { sendEventTool } from '@/tools/loops/send_event'
import { sendTransactionalTool } from '@/tools/loops/send_transactional'
import { updateContactTool } from '@/tools/loops/update_contact'

export const loopsCreateContactTool = createContactTool
export const loopsUpdateContactTool = updateContactTool
export const loopsSendEventTool = sendEventTool
export const loopsSendTransactionalTool = sendTransactionalTool
