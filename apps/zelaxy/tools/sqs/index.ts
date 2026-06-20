import { listQueuesTool } from '@/tools/sqs/list_queues'
import { receiveMessageTool } from '@/tools/sqs/receive_message'
import { sendMessageTool } from '@/tools/sqs/send_message'

export const sqsSendMessageTool = sendMessageTool
export const sqsReceiveMessageTool = receiveMessageTool
export const sqsListQueuesTool = listQueuesTool
