import { githubConnector } from './github'
import type { ConnectorDefinition } from './types'
import { webConnector } from './web'

/** Every available connector, keyed by type. */
export const CONNECTOR_REGISTRY: Record<string, ConnectorDefinition> = {
  github: githubConnector,
  web: webConnector,
}

export function getConnector(type: string): ConnectorDefinition | undefined {
  return CONNECTOR_REGISTRY[type]
}

export const CONNECTOR_TYPES = Object.keys(CONNECTOR_REGISTRY)
