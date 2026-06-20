/**
 * Built-in enrichment definitions (provider cascades over the Tier-F integration tools).
 *
 * Output field mappings read common response shapes defensively (`output` then `output.data`),
 * since the underlying tools return raw provider JSON.
 */

import type { EnrichmentConfig } from '@/lib/enrichments/types'

/** Read a nested value trying both the raw output and an `output.data` envelope. */
function pick(output: Record<string, unknown>, ...keys: string[]): unknown {
  const data = (output.data as Record<string, unknown> | undefined) ?? {}
  for (const k of keys) {
    if (output[k] !== undefined && output[k] !== null && output[k] !== '') return output[k]
    if (data[k] !== undefined && data[k] !== null && data[k] !== '') return data[k]
  }
  return undefined
}

export const workEmailEnrichment: EnrichmentConfig = {
  id: 'work_email',
  name: 'Work Email',
  description: "Find a person's work email from their name and company domain",
  inputs: [
    { id: 'firstName', name: 'First Name', type: 'string', required: true },
    { id: 'lastName', name: 'Last Name', type: 'string', required: true },
    { id: 'domain', name: 'Company Domain', type: 'string', required: true },
  ],
  outputs: [{ id: 'email', name: 'Work Email', type: 'string' }],
  providers: [
    {
      id: 'leadmagic',
      label: 'LeadMagic',
      toolId: 'leadmagic_email_finder',
      buildParams: (i) =>
        i.firstName && i.lastName && i.domain
          ? { first_name: i.firstName, last_name: i.lastName, domain: i.domain }
          : null,
      mapOutput: (o) => {
        const email = pick(o, 'email')
        return email ? { email } : null
      },
    },
    {
      id: 'findymail',
      label: 'Findymail',
      toolId: 'findymail_find_email',
      buildParams: (i) =>
        i.firstName && i.lastName && i.domain
          ? { name: `${i.firstName} ${i.lastName}`, domain: i.domain }
          : null,
      mapOutput: (o) => {
        const email = pick(o, 'email')
        return email ? { email } : null
      },
    },
    {
      id: 'prospeo',
      label: 'Prospeo',
      toolId: 'prospeo_email_finder',
      buildParams: (i) =>
        i.firstName && i.lastName && i.domain
          ? { first_name: i.firstName, last_name: i.lastName, company: i.domain }
          : null,
      mapOutput: (o) => {
        const email = pick(o, 'email')
        return email ? { email } : null
      },
    },
  ],
}

export const emailVerificationEnrichment: EnrichmentConfig = {
  id: 'email_verification',
  name: 'Email Verification',
  description: 'Verify whether an email address is valid and deliverable',
  inputs: [{ id: 'email', name: 'Email', type: 'string', required: true }],
  outputs: [
    { id: 'status', name: 'Status', type: 'string' },
    { id: 'valid', name: 'Valid', type: 'boolean' },
  ],
  providers: [
    {
      id: 'neverbounce',
      label: 'NeverBounce',
      toolId: 'neverbounce_verify_email',
      buildParams: (i) => (i.email ? { email: i.email } : null),
      mapOutput: (o) => {
        const status = pick(o, 'result', 'status')
        return status ? { status, valid: status === 'valid' } : null
      },
    },
    {
      id: 'zerobounce',
      label: 'ZeroBounce',
      toolId: 'zerobounce_validate_email',
      buildParams: (i) => (i.email ? { email: i.email } : null),
      mapOutput: (o) => {
        const status = pick(o, 'status')
        return status ? { status, valid: status === 'valid' } : null
      },
    },
    {
      id: 'millionverifier',
      label: 'MillionVerifier',
      toolId: 'millionverifier_verify_email',
      buildParams: (i) => (i.email ? { email: i.email } : null),
      mapOutput: (o) => {
        const status = pick(o, 'result', 'resultcode')
        return status ? { status, valid: status === 'ok' || status === 'valid' } : null
      },
    },
  ],
}

export const companyInfoEnrichment: EnrichmentConfig = {
  id: 'company_info',
  name: 'Company Info',
  description: 'Enrich a company by name or domain',
  inputs: [{ id: 'domain', name: 'Company Domain or Name', type: 'string', required: true }],
  outputs: [{ id: 'company', name: 'Company', type: 'json' }],
  providers: [
    {
      id: 'peopledatalabs',
      label: 'People Data Labs',
      toolId: 'peopledatalabs_company_enrich',
      buildParams: (i) => (i.domain ? { name: i.domain, website: i.domain } : null),
      mapOutput: (o) => {
        const company = (o.data as unknown) ?? o
        return company ? { company } : null
      },
    },
  ],
}
