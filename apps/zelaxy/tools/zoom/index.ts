import { createMeetingTool } from '@/tools/zoom/create_meeting'
import { getMeetingTool } from '@/tools/zoom/get_meeting'
import { listMeetingsTool } from '@/tools/zoom/list_meetings'
import { listUsersTool } from '@/tools/zoom/list_users'

export const zoomListMeetingsTool = listMeetingsTool
export const zoomCreateMeetingTool = createMeetingTool
export const zoomGetMeetingTool = getMeetingTool
export const zoomListUsersTool = listUsersTool
