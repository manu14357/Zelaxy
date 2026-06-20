import {
  companyInfoEnrichment,
  emailVerificationEnrichment,
  workEmailEnrichment,
} from '@/lib/enrichments/enrichments'
import type { EnrichmentConfig, EnrichmentRegistry } from '@/lib/enrichments/types'

export const ENRICHMENT_REGISTRY: EnrichmentRegistry = {
  [workEmailEnrichment.id]: workEmailEnrichment,
  [emailVerificationEnrichment.id]: emailVerificationEnrichment,
  [companyInfoEnrichment.id]: companyInfoEnrichment,
}

export const ALL_ENRICHMENTS: EnrichmentConfig[] = Object.values(ENRICHMENT_REGISTRY)

export function getEnrichment(id: string | undefined): EnrichmentConfig | undefined {
  return id ? ENRICHMENT_REGISTRY[id] : undefined
}
