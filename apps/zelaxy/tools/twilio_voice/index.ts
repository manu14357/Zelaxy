import { getCallTool } from '@/tools/twilio_voice/get_call'
import { listCallsTool } from '@/tools/twilio_voice/list_calls'
import { makeCallTool } from '@/tools/twilio_voice/make_call'

export const twilioVoiceMakeCallTool = makeCallTool
export const twilioVoiceListCallsTool = listCallsTool
export const twilioVoiceGetCallTool = getCallTool
