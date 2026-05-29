import type { ToolConfig } from '@/tools/types'

function parseEmails(emailField: unknown): { address: string; status: string; type: string }[] {
  if (!Array.isArray(emailField)) return []
  return emailField.map((entry: unknown) => {
    if (Array.isArray(entry)) {
      return {
        address: entry[0] ?? '',
        status: entry[1] ?? 'UNKNOWN',
        type: entry[2] ?? 'UNKNOWN',
      }
    }
    return { address: String(entry), status: 'UNKNOWN', type: 'UNKNOWN' }
  })
}

export const sixtyfourFindPhoneTool: ToolConfig = {
  id: 'sixtyfour_find_phone',
  name: 'Sixtyfour Find Phone',
  description: 'Find phone numbers for a lead using Sixtyfour AI.',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Sixtyfour API key',
    },
    name: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Full name of the person',
    },
    company: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Company name',
    },
    linkedinUrl: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'LinkedIn profile URL',
    },
    domain: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Company website domain',
    },
    email: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Email address',
    },
  },

  request: {
    url: 'https://api.sixtyfour.ai/find-phone',
    method: 'POST',
    headers: (params: any) => ({
      'Content-Type': 'application/json',
      'x-api-key': params.apiKey,
    }),
    body: (params: any) => ({
      lead: {
        name: params.name,
        ...(params.company && { company: params.company }),
        ...(params.linkedinUrl && { linkedin_url: params.linkedinUrl }),
        ...(params.domain && { domain: params.domain }),
        ...(params.email && { email: params.email }),
      },
    }),
  },

  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error || data.message || data.detail || `API error: ${response.status}`)
    }

    let phone: string | null = null
    if (typeof data.phone === 'string') {
      phone = data.phone || null
    } else if (Array.isArray(data.phone)) {
      phone = data.phone.map((p: { number: string; region?: string }) => p.number).join(', ')
    }

    return {
      success: true,
      output: {
        name: data.name ?? null,
        company: data.company ?? null,
        phone,
        linkedinUrl: data.linkedin_url ?? null,
      },
    }
  },

  outputs: {
    name: { type: 'string', description: 'Name of the person', optional: true },
    company: { type: 'string', description: 'Company name', optional: true },
    phone: { type: 'string', description: 'Phone number(s) found', optional: true },
    linkedinUrl: { type: 'string', description: 'LinkedIn profile URL', optional: true },
  },
}

export const sixtyfourFindEmailTool: ToolConfig = {
  id: 'sixtyfour_find_email',
  name: 'Sixtyfour Find Email',
  description: 'Find email addresses for a lead using Sixtyfour AI.',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Sixtyfour API key',
    },
    name: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Full name of the person',
    },
    company: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Company name',
    },
    linkedinUrl: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'LinkedIn profile URL',
    },
    domain: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Company website domain',
    },
    phone: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Phone number',
    },
    title: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Job title',
    },
    mode: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Email discovery mode: PROFESSIONAL (default) or PERSONAL',
    },
  },

  request: {
    url: 'https://api.sixtyfour.ai/find-email',
    method: 'POST',
    headers: (params: any) => ({
      'Content-Type': 'application/json',
      'x-api-key': params.apiKey,
    }),
    body: (params: any) => ({
      lead: {
        name: params.name,
        ...(params.company && { company: params.company }),
        ...(params.linkedinUrl && { linkedin: params.linkedinUrl }),
        ...(params.domain && { domain: params.domain }),
        ...(params.phone && { phone: params.phone }),
        ...(params.title && { title: params.title }),
      },
      ...(params.mode && { mode: params.mode }),
    }),
  },

  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error || data.message || data.detail || `API error: ${response.status}`)
    }

    return {
      success: true,
      output: {
        name: data.name ?? null,
        company: data.company ?? null,
        title: data.title ?? null,
        phone: data.phone ?? null,
        linkedinUrl: data.linkedin ?? null,
        emails: parseEmails(data.email),
        personalEmails: parseEmails(data.personal_email),
      },
    }
  },

  outputs: {
    name: { type: 'string', description: 'Name of the person', optional: true },
    company: { type: 'string', description: 'Company name', optional: true },
    title: { type: 'string', description: 'Job title', optional: true },
    phone: { type: 'string', description: 'Phone number', optional: true },
    linkedinUrl: { type: 'string', description: 'LinkedIn profile URL', optional: true },
    emails: {
      type: 'json',
      description: 'Professional email addresses found',
      properties: {
        address: { type: 'string', description: 'Email address' },
        status: { type: 'string', description: 'Validation status (OK or UNKNOWN)' },
        type: { type: 'string', description: 'Email type (COMPANY or PERSONAL)' },
      },
    },
    personalEmails: {
      type: 'json',
      description: 'Personal email addresses found (only in PERSONAL mode)',
      optional: true,
      properties: {
        address: { type: 'string', description: 'Email address' },
        status: { type: 'string', description: 'Validation status (OK or UNKNOWN)' },
        type: { type: 'string', description: 'Email type (COMPANY or PERSONAL)' },
      },
    },
  },
}

export const sixtyfourEnrichLeadTool: ToolConfig = {
  id: 'sixtyfour_enrich_lead',
  name: 'Sixtyfour Enrich Lead',
  description:
    'Enrich lead information with contact details, social profiles, and company data using Sixtyfour AI.',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Sixtyfour API key',
    },
    leadInfo: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description:
        'Lead information as JSON object with key-value pairs (e.g. name, company, title, linkedin)',
    },
    struct: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description:
        'Fields to collect as JSON object. Keys are field names, values are descriptions (e.g. {"email": "The individual\'s email address", "phone": "Phone number"})',
    },
    researchPlan: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Optional research plan to guide enrichment strategy',
    },
  },

  request: {
    url: 'https://api.sixtyfour.ai/enrich-lead',
    method: 'POST',
    headers: (params: any) => ({
      'Content-Type': 'application/json',
      'x-api-key': params.apiKey,
    }),
    body: (params: any) => {
      let leadInfo: unknown
      try {
        leadInfo = typeof params.leadInfo === 'string' ? JSON.parse(params.leadInfo) : params.leadInfo
      } catch {
        throw new Error('leadInfo must be valid JSON')
      }
      let struct: unknown
      try {
        struct = typeof params.struct === 'string' ? JSON.parse(params.struct) : params.struct
      } catch {
        throw new Error('struct must be valid JSON')
      }
      return {
        lead_info: leadInfo,
        struct,
        ...(params.researchPlan && { research_plan: params.researchPlan }),
      }
    },
  },

  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error || data.message || data.detail || `API error: ${response.status}`)
    }

    return {
      success: true,
      output: {
        notes: data.notes ?? null,
        structuredData: data.structured_data ?? {},
        references: data.references ?? {},
        confidenceScore: data.confidence_score ?? null,
      },
    }
  },

  outputs: {
    notes: { type: 'string', description: 'Research notes about the lead', optional: true },
    structuredData: {
      type: 'json',
      description: 'Enriched lead data matching the requested struct fields',
    },
    references: { type: 'json', description: 'Source URLs and descriptions used for enrichment' },
    confidenceScore: {
      type: 'number',
      description: 'Quality score for the returned data (0-10)',
      optional: true,
    },
  },
}

export const sixtyfourEnrichCompanyTool: ToolConfig = {
  id: 'sixtyfour_enrich_company',
  name: 'Sixtyfour Enrich Company',
  description:
    'Enrich company data with additional information and find associated people using Sixtyfour AI.',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Sixtyfour API key',
    },
    targetCompany: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Company data as JSON object (e.g. {"name": "Acme Inc", "domain": "acme.com"})',
    },
    struct: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description:
        'Fields to collect as JSON object. Keys are field names, values are descriptions (e.g. {"website": "Company website URL", "num_employees": "Employee count"})',
    },
    findPeople: {
      type: 'boolean',
      required: false,
      visibility: 'user-or-llm',
      description: 'Whether to find people associated with the company',
    },
    fullOrgChart: {
      type: 'boolean',
      required: false,
      visibility: 'user-or-llm',
      description: 'Whether to retrieve the full organizational chart',
    },
    researchPlan: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Optional strategy describing how the agent should search for information',
    },
    peopleFocusPrompt: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Description of people to find (roles, responsibilities)',
    },
    leadStruct: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Custom schema for returned lead data as JSON object',
    },
  },

  request: {
    url: 'https://api.sixtyfour.ai/enrich-company',
    method: 'POST',
    headers: (params: any) => ({
      'Content-Type': 'application/json',
      'x-api-key': params.apiKey,
    }),
    body: (params: any) => {
      let targetCompany: unknown
      try {
        targetCompany =
          typeof params.targetCompany === 'string'
            ? JSON.parse(params.targetCompany)
            : params.targetCompany
      } catch {
        throw new Error('targetCompany must be valid JSON')
      }
      let struct: unknown
      try {
        struct = typeof params.struct === 'string' ? JSON.parse(params.struct) : params.struct
      } catch {
        throw new Error('struct must be valid JSON')
      }
      let leadStruct: Record<string, unknown> | undefined
      try {
        leadStruct =
          params.leadStruct && typeof params.leadStruct === 'string'
            ? (JSON.parse(params.leadStruct) as Record<string, unknown>)
            : (params.leadStruct as Record<string, unknown> | undefined)
      } catch {
        throw new Error('leadStruct must be valid JSON')
      }
      return {
        target_company: targetCompany,
        struct,
        ...(params.findPeople !== undefined && { find_people: params.findPeople }),
        ...(params.fullOrgChart !== undefined && { full_org_chart: params.fullOrgChart }),
        ...(params.researchPlan && { research_plan: params.researchPlan }),
        ...(params.peopleFocusPrompt && { people_focus_prompt: params.peopleFocusPrompt }),
        ...(leadStruct && { lead_struct: leadStruct }),
      }
    },
  },

  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error || data.message || data.detail || `API error: ${response.status}`)
    }

    return {
      success: true,
      output: {
        notes: data.notes ?? null,
        structuredData: data.structured_data ?? {},
        references: data.references ?? {},
        confidenceScore: data.confidence_score ?? null,
      },
    }
  },

  outputs: {
    notes: { type: 'string', description: 'Research notes about the company', optional: true },
    structuredData: {
      type: 'json',
      description: 'Enriched company data matching the requested struct fields',
    },
    references: { type: 'json', description: 'Source URLs and descriptions used for enrichment' },
    confidenceScore: {
      type: 'number',
      description: 'Quality score for the returned data (0-10)',
      optional: true,
    },
  },
}
