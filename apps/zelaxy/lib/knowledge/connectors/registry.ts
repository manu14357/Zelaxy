import { confluenceConnector } from './confluence'
import { githubConnector } from './github'
import { googleDriveConnector } from './google_drive'
import { notionConnector } from './notion'
import { slackConnector } from './slack'
import type { ConnectorDefinition } from './types'
import { webConnector } from './web'
import { zendeskConnector } from './zendesk'

/** Every available connector, keyed by type. */
export const CONNECTOR_REGISTRY: Record<string, ConnectorDefinition> = {
  github: githubConnector,
  web: webConnector,
  notion: notionConnector,
  slack: slackConnector,
  confluence: confluenceConnector,
  google_drive: googleDriveConnector,
  zendesk: zendeskConnector,
}

export function getConnector(type: string): ConnectorDefinition | undefined {
  return CONNECTOR_REGISTRY[type]
}

export const CONNECTOR_TYPES = Object.keys(CONNECTOR_REGISTRY)
