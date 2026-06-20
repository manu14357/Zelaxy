/**
 * Data-enrichment subsystem — types.
 *
 * An enrichment resolves a value (e.g. a work email) by trying a cascade of providers (the Tier-F
 * integration tools) in order until one returns a non-empty result. Each provider maps the
 * enrichment's inputs to a tool's params and the tool's output back to the enrichment's outputs.
 * The runner (./run, server-only) executes the cascade and injects each provider's API key.
 */

export interface EnrichmentInputField {
  id: string
  name: string
  type: 'string' | 'number' | 'boolean'
  required?: boolean
  description?: string
}

export interface EnrichmentOutputField {
  id: string
  name: string
  type: 'string' | 'number' | 'boolean' | 'json'
}

export interface EnrichmentRunContext {
  workspaceId?: string
  /** Per-provider API keys, keyed by provider id (e.g. { leadmagic: 'sk-...' }). */
  credentials?: Record<string, string>
  signal?: AbortSignal
}

export interface EnrichmentProvider {
  /** Stable id; also the key used to look up this provider's API key in ctx.credentials. */
  id: string
  label: string
  /** Tool id executed via `executeTool` (must be a registered tool). */
  toolId: string
  /** Map enrichment inputs → tool params, or null when inputs are insufficient (cascade falls through). */
  buildParams: (inputs: Record<string, unknown>) => Record<string, unknown> | null
  /** Map the tool output → { [outputId]: value }, or null for no result. */
  mapOutput: (output: Record<string, unknown>) => Record<string, unknown> | null
}

export interface EnrichmentConfig {
  id: string
  name: string
  description: string
  inputs: EnrichmentInputField[]
  outputs: EnrichmentOutputField[]
  /** Data sources tried in order until one returns a non-empty result. */
  providers: EnrichmentProvider[]
}

export type EnrichmentRegistry = Record<string, EnrichmentConfig>
