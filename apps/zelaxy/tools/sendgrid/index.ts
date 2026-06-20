import { addContactTool } from '@/tools/sendgrid/add_contact'
import { listContactsTool } from '@/tools/sendgrid/list_contacts'
import { sendEmailTool } from '@/tools/sendgrid/send_email'

export const sendgridSendEmailTool = sendEmailTool
export const sendgridAddContactTool = addContactTool
export const sendgridListContactsTool = listContactsTool
