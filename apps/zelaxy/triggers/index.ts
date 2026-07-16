// Import trigger definitions

import { airtableWebhookTrigger } from './airtable'
import { asanaWebhookTrigger } from './asana'
import { ashbyWebhookTrigger } from './ashby'
import { attioWebhookTrigger } from './attio'
import { azureDevOpsWebhookTrigger } from './azure_devops'
import { calcomWebhookTrigger } from './calcom'
import { calendlyWebhookTrigger } from './calendly'
import { circlebackWebhookTrigger } from './circleback'
import { clerkWebhookTrigger } from './clerk'
import { confluenceWebhookTrigger } from './confluence'
import { discordWebhookTrigger } from './discord'
import { dropboxWebhookTrigger } from './dropbox'
import { emailbisonWebhookTrigger } from './emailbison'
import { evernoteWebhookTrigger } from './evernote'
import { fathomWebhookTrigger } from './fathom'
import { firefliesWebhookTrigger } from './fireflies'
import { genericWebhookTrigger } from './generic'
import { githubWebhookTrigger } from './github'
import { gitlabWebhookTrigger } from './gitlab'
import { gmailPollingTrigger } from './gmail'
import { gongWebhookTrigger } from './gong'
import { googleCalendarPollingTrigger } from './google-calendar'
import { googleDocsPollingTrigger } from './google-docs'
import { googleDrivePollingTrigger } from './google-drive'
import { googleSheetsPollingTrigger } from './google-sheets'
import { grainWebhookTrigger } from './grain'
import { greenhouseWebhookTrigger } from './greenhouse'
import { hubspotPollingTrigger } from './hubspot'
import { incidentioWebhookTrigger } from './incidentio'
import { instantlyWebhookTrigger } from './instantly'
import { intercomWebhookTrigger } from './intercom'
import { jiraWebhookTrigger } from './jira'
import { lemlistWebhookTrigger } from './lemlist'
import { linearWebhookTrigger } from './linear'
import { linqWebhookTrigger } from './linq'
import { loopsWebhookTrigger } from './loops'
import { microsoftTeamsWebhookTrigger } from './microsoftteams'
import { mondayWebhookTrigger } from './monday'
import { notionWebhookTrigger } from './notion'
import { obsidianWebhookTrigger } from './obsidian'
import { oneDrivePollingTrigger } from './onedrive'
import { outlookPollingTrigger } from './outlook'
import { pagerdutyWebhookTrigger } from './pagerduty'
import { redditWebhookTrigger } from './reddit'
import { resendWebhookTrigger } from './resend'
import { revenuecatWebhookTrigger } from './revenuecat'
import { rootlyWebhookTrigger } from './rootly'
import { salesforceWebhookTrigger } from './salesforce'
import { sendblueWebhookTrigger } from './sendblue'
import { sentryWebhookTrigger } from './sentry'
import { servicenowWebhookTrigger } from './servicenow'
import { slackWebhookTrigger } from './slack'
import { stripeWebhookTrigger } from './stripe/webhook'
import { telegramWebhookTrigger } from './telegram'
import { twilioWebhookTrigger } from './twilio'
import { twilioVoiceWebhookTrigger } from './twilio_voice'
import { typeformWebhookTrigger } from './typeform'
import type { TriggerConfig, TriggerRegistry } from './types'
import { vercelWebhookTrigger } from './vercel'
import { webflowWebhookTrigger } from './webflow'
import { whatsappWebhookTrigger } from './whatsapp'
import { wordpressWebhookTrigger } from './wordpress'
import { zendeskWebhookTrigger } from './zendesk'
import { zoomWebhookTrigger } from './zoom'

// Central registry of all available triggers
export const TRIGGER_REGISTRY: TriggerRegistry = {
  slack_webhook: slackWebhookTrigger,
  ashby_webhook: ashbyWebhookTrigger,
  attio_webhook: attioWebhookTrigger,
  azure_devops_webhook: azureDevOpsWebhookTrigger,
  circleback_webhook: circlebackWebhookTrigger,
  emailbison_webhook: emailbisonWebhookTrigger,
  fathom_webhook: fathomWebhookTrigger,
  gong_webhook: gongWebhookTrigger,
  grain_webhook: grainWebhookTrigger,
  greenhouse_webhook: greenhouseWebhookTrigger,
  incidentio_webhook: incidentioWebhookTrigger,
  instantly_webhook: instantlyWebhookTrigger,
  lemlist_webhook: lemlistWebhookTrigger,
  linq_webhook: linqWebhookTrigger,
  loops_webhook: loopsWebhookTrigger,
  revenuecat_webhook: revenuecatWebhookTrigger,
  rootly_webhook: rootlyWebhookTrigger,
  sendblue_webhook: sendblueWebhookTrigger,

  airtable_webhook: airtableWebhookTrigger,
  asana_webhook: asanaWebhookTrigger,
  calcom_webhook: calcomWebhookTrigger,
  calendly_webhook: calendlyWebhookTrigger,
  clerk_webhook: clerkWebhookTrigger,
  confluence_webhook: confluenceWebhookTrigger,
  discord_webhook: discordWebhookTrigger,
  dropbox_webhook: dropboxWebhookTrigger,
  evernote_webhook: evernoteWebhookTrigger,
  fireflies_webhook: firefliesWebhookTrigger,
  generic_webhook: genericWebhookTrigger,
  github_webhook: githubWebhookTrigger,
  gitlab_webhook: gitlabWebhookTrigger,
  gmail_poller: gmailPollingTrigger,
  google_calendar_poller: googleCalendarPollingTrigger,
  google_docs_poller: googleDocsPollingTrigger,
  google_drive_poller: googleDrivePollingTrigger,
  google_sheets_poller: googleSheetsPollingTrigger,
  hubspot_poller: hubspotPollingTrigger,
  intercom_webhook: intercomWebhookTrigger,
  jira_webhook: jiraWebhookTrigger,
  linear_webhook: linearWebhookTrigger,
  microsoftteams_webhook: microsoftTeamsWebhookTrigger,
  monday_webhook: mondayWebhookTrigger,
  notion_webhook: notionWebhookTrigger,
  obsidian_webhook: obsidianWebhookTrigger,
  onedrive_poller: oneDrivePollingTrigger,
  outlook_poller: outlookPollingTrigger,
  pagerduty_webhook: pagerdutyWebhookTrigger,
  reddit_webhook: redditWebhookTrigger,
  resend_webhook: resendWebhookTrigger,
  salesforce_webhook: salesforceWebhookTrigger,
  sentry_webhook: sentryWebhookTrigger,
  servicenow_webhook: servicenowWebhookTrigger,
  stripe_webhook: stripeWebhookTrigger,
  telegram_webhook: telegramWebhookTrigger,
  twilio_voice_webhook: twilioVoiceWebhookTrigger,
  twilio_webhook: twilioWebhookTrigger,
  typeform_webhook: typeformWebhookTrigger,
  vercel_webhook: vercelWebhookTrigger,
  webflow_webhook: webflowWebhookTrigger,
  whatsapp_webhook: whatsappWebhookTrigger,
  wordpress_webhook: wordpressWebhookTrigger,
  zoom_webhook: zoomWebhookTrigger,
  zendesk_webhook: zendeskWebhookTrigger,
}

// Utility functions for working with triggers
export function getTrigger(triggerId: string): TriggerConfig | undefined {
  return TRIGGER_REGISTRY[triggerId]
}

export function getTriggersByProvider(provider: string): TriggerConfig[] {
  return Object.values(TRIGGER_REGISTRY).filter((trigger) => trigger.provider === provider)
}

export function getAllTriggers(): TriggerConfig[] {
  return Object.values(TRIGGER_REGISTRY)
}

export function getTriggerIds(): string[] {
  return Object.keys(TRIGGER_REGISTRY)
}

export function isTriggerValid(triggerId: string): boolean {
  return triggerId in TRIGGER_REGISTRY
}

// Export types for use elsewhere
export type { TriggerConfig, TriggerRegistry } from './types'
