import type {
  AshbyApplication,
  AshbyCandidate,
  AshbyContactInfo,
  AshbyCustomField,
  AshbyFileHandle,
  AshbyHiringTeamMember,
  AshbySourceSummary,
  AshbyUserSummary,
} from '@/tools/ashby/types'
import type { OutputProperty } from '@/tools/types'

type Unknown = Record<string, unknown>

export function ashbyAuthHeaders(apiKey: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json; version=1',
    Authorization: `Basic ${btoa(`${apiKey}:`)}`,
  }
}

export function ashbyErrorMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== 'object') return fallback
  const d = data as Unknown
  const info = d.errorInfo as Unknown | undefined
  if (info && typeof info.message === 'string' && info.message) return info.message
  if (Array.isArray(d.errors) && d.errors.length > 0) {
    return d.errors.map((e) => String(e)).join('; ')
  }
  return fallback
}

function mapContact(raw: unknown): AshbyContactInfo | null {
  if (!raw || typeof raw !== 'object') return null
  const c = raw as Unknown
  return {
    value: (c.value as string) ?? '',
    type: (c.type as string) ?? 'Other',
    isPrimary: (c.isPrimary as boolean) ?? true,
  }
}

function mapContactArray(raw: unknown): AshbyContactInfo[] {
  if (!Array.isArray(raw)) return []
  return raw.map((c) => mapContact(c)).filter((c): c is AshbyContactInfo => c !== null)
}

function mapCustomFields(raw: unknown): AshbyCustomField[] {
  if (!Array.isArray(raw)) return []
  return raw.map((f) => {
    const cf = f as Unknown
    return {
      id: (cf.id as string) ?? null,
      title: (cf.title as string) ?? '',
      isPrivate: (cf.isPrivate as boolean) ?? false,
      valueLabel: (cf.valueLabel as string) ?? null,
      value: cf.value ?? null,
    }
  })
}

function mapFileHandle(raw: unknown): AshbyFileHandle | null {
  if (!raw || typeof raw !== 'object') return null
  const f = raw as Unknown
  return {
    id: (f.id as string) ?? '',
    name: (f.name as string) ?? '',
    handle: (f.handle as string) ?? '',
  }
}

function mapFileHandles(raw: unknown): AshbyFileHandle[] {
  if (!Array.isArray(raw)) return []
  return raw.map((f) => mapFileHandle(f)).filter((f): f is AshbyFileHandle => f !== null)
}

export function mapUserSummary(raw: unknown): AshbyUserSummary | null {
  if (!raw || typeof raw !== 'object') return null
  const u = raw as Unknown
  return {
    id: (u.id as string) ?? '',
    firstName: (u.firstName as string) ?? null,
    lastName: (u.lastName as string) ?? null,
    email: (u.email as string) ?? null,
    globalRole: (u.globalRole as string) ?? null,
    isEnabled: (u.isEnabled as boolean) ?? false,
    updatedAt: (u.updatedAt as string) ?? null,
    managerId: (u.managerId as string) ?? null,
  }
}

function mapSource(raw: unknown): AshbySourceSummary | null {
  if (!raw || typeof raw !== 'object') return null
  const s = raw as Unknown
  const sourceType = s.sourceType as Unknown | undefined
  return {
    id: (s.id as string) ?? '',
    title: (s.title as string) ?? '',
    isArchived: (s.isArchived as boolean) ?? false,
    sourceType: sourceType
      ? {
          id: (sourceType.id as string) ?? '',
          title: (sourceType.title as string) ?? '',
          isArchived: (sourceType.isArchived as boolean) ?? false,
        }
      : null,
  }
}

function mapHiringTeam(raw: unknown): AshbyHiringTeamMember[] {
  if (!Array.isArray(raw)) return []
  return raw.map((m) => {
    const mem = m as Unknown
    return {
      email: (mem.email as string) ?? null,
      firstName: (mem.firstName as string) ?? null,
      lastName: (mem.lastName as string) ?? null,
      role: (mem.role as string) ?? null,
      userId: (mem.userId as string) ?? null,
    }
  })
}

export function mapCandidate(raw: unknown): AshbyCandidate {
  const c = (raw ?? {}) as Unknown
  const socialLinks = Array.isArray(c.socialLinks)
    ? (c.socialLinks as Array<{ type?: string; url?: string }>)
    : []
  const location = c.location as Unknown | undefined
  const locationComponents = Array.isArray(location?.locationComponents)
    ? (location?.locationComponents as Array<{ type?: string; name?: string }>)
    : []
  return {
    id: (c.id as string) ?? '',
    name: (c.name as string) ?? '',
    primaryEmailAddress: mapContact(c.primaryEmailAddress),
    primaryPhoneNumber: mapContact(c.primaryPhoneNumber),
    emailAddresses: mapContactArray(c.emailAddresses),
    phoneNumbers: mapContactArray(c.phoneNumbers),
    socialLinks: socialLinks.map((l) => ({
      type: l.type ?? '',
      url: l.url ?? '',
    })),
    linkedInUrl: socialLinks.find((l) => l.type === 'LinkedIn')?.url ?? null,
    githubUrl: socialLinks.find((l) => l.type === 'GitHub')?.url ?? null,
    profileUrl: (c.profileUrl as string) ?? null,
    position: (c.position as string) ?? null,
    company: (c.company as string) ?? null,
    school: (c.school as string) ?? null,
    timezone: (c.timezone as string) ?? null,
    location: location
      ? {
          id: (location.id as string) ?? null,
          locationSummary: (location.locationSummary as string) ?? null,
          locationComponents: locationComponents.map((lc) => ({
            type: lc.type ?? '',
            name: lc.name ?? '',
          })),
        }
      : null,
    tags: Array.isArray(c.tags)
      ? (c.tags as Array<{ id?: string; title?: string; isArchived?: boolean }>).map((t) => ({
          id: t.id ?? '',
          title: t.title ?? '',
          isArchived: t.isArchived ?? false,
        }))
      : [],
    applicationIds: Array.isArray(c.applicationIds) ? (c.applicationIds as string[]) : [],
    customFields: mapCustomFields(c.customFields),
    resumeFileHandle: mapFileHandle(c.resumeFileHandle),
    fileHandles: mapFileHandles(c.fileHandles),
    source: mapSource(c.source),
    creditedToUser: mapUserSummary(c.creditedToUser),
    fraudStatus: (c.fraudStatus as string) ?? null,
    createdAt: (c.createdAt as string) ?? null,
    updatedAt: (c.updatedAt as string) ?? null,
  }
}

export function mapApplication(raw: unknown): AshbyApplication {
  const a = (raw ?? {}) as Unknown
  const candidate = a.candidate as Unknown | undefined
  const job = a.job as Unknown | undefined
  const stage = a.currentInterviewStage as Unknown | undefined
  const archiveReason = a.archiveReason as Unknown | undefined
  return {
    id: (a.id as string) ?? '',
    createdAt: (a.createdAt as string) ?? null,
    updatedAt: (a.updatedAt as string) ?? null,
    status: (a.status as string) ?? '',
    customFields: mapCustomFields(a.customFields),
    candidate: {
      id: (candidate?.id as string) ?? '',
      name: (candidate?.name as string) ?? null,
      primaryEmailAddress: mapContact(candidate?.primaryEmailAddress),
      primaryPhoneNumber: mapContact(candidate?.primaryPhoneNumber),
    },
    currentInterviewStage: stage
      ? {
          id: (stage.id as string) ?? '',
          title: (stage.title as string) ?? null,
          type: (stage.type as string) ?? null,
          orderInInterviewPlan: (stage.orderInInterviewPlan as number) ?? null,
          interviewStageGroupId: (stage.interviewStageGroupId as string) ?? null,
          interviewPlanId: (stage.interviewPlanId as string) ?? null,
        }
      : null,
    source: mapSource(a.source),
    archiveReason: archiveReason
      ? {
          id: (archiveReason.id as string) ?? '',
          text: (archiveReason.text as string) ?? null,
          reasonType: (archiveReason.reasonType as string) ?? null,
          isArchived: (archiveReason.isArchived as boolean) ?? false,
          customFields: mapCustomFields(archiveReason.customFields),
        }
      : null,
    archivedAt: (a.archivedAt as string) ?? null,
    job: {
      id: (job?.id as string) ?? '',
      title: (job?.title as string) ?? null,
      locationId: (job?.locationId as string) ?? null,
      departmentId: (job?.departmentId as string) ?? null,
    },
    creditedToUser: mapUserSummary(a.creditedToUser),
    hiringTeam: mapHiringTeam(a.hiringTeam),
    appliedViaJobPostingId: (a.appliedViaJobPostingId as string) ?? null,
    submitterClientIp: (a.submitterClientIp as string) ?? null,
    submitterUserAgent: (a.submitterUserAgent as string) ?? null,
    applicationHistory: Array.isArray(a.applicationHistory)
      ? (a.applicationHistory as Unknown[]).map((h) => ({
          id: (h.id as string) ?? '',
          stageId: (h.stageId as string) ?? null,
          stageNumber: (h.stageNumber as number) ?? null,
          title: (h.title as string) ?? null,
          enteredStageAt: (h.enteredStageAt as string) ?? null,
          actorId: (h.actorId as string) ?? null,
        }))
      : [],
  }
}

export const CONTACT_INFO_OUTPUT = {
  type: 'object',
  description: 'Contact info',
  optional: true,
  properties: {
    value: { type: 'string', description: 'Value (email or phone number)' },
    type: { type: 'string', description: 'Contact type (Personal, Work, Other)' },
    isPrimary: { type: 'boolean', description: 'Whether this is the primary contact' },
  },
} as const satisfies OutputProperty

export const CUSTOM_FIELDS_OUTPUT = {
  type: 'array',
  description: 'Custom field values',
  items: {
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Custom field UUID' },
      title: { type: 'string', description: 'Field title' },
      isPrivate: { type: 'boolean', description: 'Whether the field is private' },
      valueLabel: { type: 'string', description: 'Human-readable value label', optional: true },
      value: { type: 'string', description: 'Raw field value (type depends on fieldType)' },
    },
  },
} as const satisfies OutputProperty

export const FILE_HANDLE_OUTPUT = {
  type: 'object',
  description: 'File reference',
  optional: true,
  properties: {
    id: { type: 'string', description: 'File UUID' },
    name: { type: 'string', description: 'File name' },
    handle: { type: 'string', description: 'File handle used with file.info' },
  },
} as const satisfies OutputProperty

export const FILE_HANDLES_OUTPUT = {
  type: 'array',
  description: 'File references',
  items: {
    type: 'object',
    properties: {
      id: { type: 'string', description: 'File UUID' },
      name: { type: 'string', description: 'File name' },
      handle: { type: 'string', description: 'File handle used with file.info' },
    },
  },
} as const satisfies OutputProperty

export const USER_SUMMARY_OUTPUT = {
  type: 'object',
  description: 'User summary',
  optional: true,
  properties: {
    id: { type: 'string', description: 'User UUID' },
    firstName: { type: 'string', description: 'First name', optional: true },
    lastName: { type: 'string', description: 'Last name', optional: true },
    email: { type: 'string', description: 'Email', optional: true },
    globalRole: { type: 'string', description: 'Role', optional: true },
    isEnabled: { type: 'boolean', description: 'Whether enabled' },
    updatedAt: { type: 'string', description: 'Last update timestamp', optional: true },
    managerId: { type: 'string', description: "User ID of the user's manager", optional: true },
  },
} as const satisfies OutputProperty

export const SOURCE_SUMMARY_OUTPUT = {
  type: 'object',
  description: 'Attribution source',
  optional: true,
  properties: {
    id: { type: 'string', description: 'Source UUID' },
    title: { type: 'string', description: 'Source title' },
    isArchived: { type: 'boolean', description: 'Whether archived' },
    sourceType: {
      type: 'object',
      description: 'Source type grouping',
      optional: true,
      properties: {
        id: { type: 'string', description: 'Source type UUID' },
        title: { type: 'string', description: 'Source type title' },
        isArchived: { type: 'boolean', description: 'Whether archived' },
      },
    },
  },
} as const satisfies OutputProperty

export const HIRING_TEAM_OUTPUT = {
  type: 'array',
  description: 'Hiring team members',
  items: {
    type: 'object',
    properties: {
      userId: { type: 'string', description: 'User UUID' },
      firstName: { type: 'string', description: 'First name' },
      lastName: { type: 'string', description: 'Last name' },
      email: { type: 'string', description: 'Email' },
      role: { type: 'string', description: 'Hiring team role' },
    },
  },
} as const satisfies OutputProperty

export const CANDIDATE_OUTPUTS = {
  id: { type: 'string', description: 'Candidate UUID' },
  name: { type: 'string', description: 'Full name' },
  primaryEmailAddress: { ...CONTACT_INFO_OUTPUT, description: 'Primary email contact info' },
  primaryPhoneNumber: { ...CONTACT_INFO_OUTPUT, description: 'Primary phone contact info' },
  emailAddresses: {
    type: 'array',
    description: 'All email addresses',
    items: {
      type: 'object',
      properties: {
        value: { type: 'string', description: 'Email address' },
        type: { type: 'string', description: 'Contact type' },
        isPrimary: { type: 'boolean', description: 'Whether primary' },
      },
    },
  },
  phoneNumbers: {
    type: 'array',
    description: 'All phone numbers',
    items: {
      type: 'object',
      properties: {
        value: { type: 'string', description: 'Phone number' },
        type: { type: 'string', description: 'Contact type' },
        isPrimary: { type: 'boolean', description: 'Whether primary' },
      },
    },
  },
  socialLinks: {
    type: 'array',
    description: 'Social network links',
    items: {
      type: 'object',
      properties: {
        type: { type: 'string', description: 'Link type (LinkedIn, GitHub, Twitter, etc.)' },
        url: { type: 'string', description: 'Profile URL' },
      },
    },
  },
  linkedInUrl: { type: 'string', description: 'LinkedIn profile URL', optional: true },
  githubUrl: { type: 'string', description: 'GitHub profile URL', optional: true },
  profileUrl: { type: 'string', description: 'URL to the candidate Ashby profile', optional: true },
  position: { type: 'string', description: 'Current position or title', optional: true },
  company: { type: 'string', description: 'Current company', optional: true },
  school: { type: 'string', description: 'Most recent school', optional: true },
  timezone: { type: 'string', description: 'Candidate timezone', optional: true },
  location: {
    type: 'object',
    description: 'Candidate location',
    optional: true,
    properties: {
      id: { type: 'string', description: 'Location UUID', optional: true },
      locationSummary: { type: 'string', description: 'Human-readable location summary' },
      locationComponents: {
        type: 'array',
        description: 'Structured location parts (city, region, country, etc.)',
        items: {
          type: 'object',
          properties: {
            type: { type: 'string', description: 'Component type' },
            name: { type: 'string', description: 'Component value' },
          },
        },
      },
    },
  },
  tags: {
    type: 'array',
    description: 'Tags applied to the candidate',
    items: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Tag UUID' },
        title: { type: 'string', description: 'Tag title' },
        isArchived: { type: 'boolean', description: 'Whether archived' },
      },
    },
  },
  applicationIds: {
    type: 'array',
    description: 'IDs of associated applications',
    items: { type: 'string', description: 'Application UUID' },
  },
  customFields: CUSTOM_FIELDS_OUTPUT,
  resumeFileHandle: { ...FILE_HANDLE_OUTPUT, description: 'Resume file reference' },
  fileHandles: { ...FILE_HANDLES_OUTPUT, description: 'All uploaded file references' },
  source: SOURCE_SUMMARY_OUTPUT,
  creditedToUser: { ...USER_SUMMARY_OUTPUT, description: 'User credited with sourcing' },
  fraudStatus: { type: 'string', description: 'Fraud detection status', optional: true },
  createdAt: { type: 'string', description: 'ISO 8601 creation timestamp' },
  updatedAt: { type: 'string', description: 'ISO 8601 last update timestamp' },
} as const satisfies Record<string, OutputProperty>

export const APPLICATION_OUTPUTS = {
  id: { type: 'string', description: 'Application UUID' },
  status: { type: 'string', description: 'Status (Active, Hired, Archived, Lead)' },
  customFields: CUSTOM_FIELDS_OUTPUT,
  candidate: {
    type: 'object',
    description: 'Associated candidate summary',
    properties: {
      id: { type: 'string', description: 'Candidate UUID' },
      name: { type: 'string', description: 'Candidate name' },
      primaryEmailAddress: { ...CONTACT_INFO_OUTPUT, description: 'Primary email' },
      primaryPhoneNumber: { ...CONTACT_INFO_OUTPUT, description: 'Primary phone' },
    },
  },
  currentInterviewStage: {
    type: 'object',
    description: 'Current interview stage',
    optional: true,
    properties: {
      id: { type: 'string', description: 'Stage UUID' },
      title: { type: 'string', description: 'Stage title' },
      type: { type: 'string', description: 'Stage type' },
      orderInInterviewPlan: { type: 'number', description: 'Position in plan', optional: true },
      interviewStageGroupId: { type: 'string', description: 'Stage group UUID', optional: true },
      interviewPlanId: { type: 'string', description: 'Interview plan UUID', optional: true },
    },
  },
  source: SOURCE_SUMMARY_OUTPUT,
  archiveReason: {
    type: 'object',
    description: 'Reason for archival (when archived)',
    optional: true,
    properties: {
      id: { type: 'string', description: 'Reason UUID' },
      text: { type: 'string', description: 'Reason text' },
      reasonType: { type: 'string', description: 'Reason category' },
      isArchived: { type: 'boolean', description: 'Whether the reason is archived' },
      customFields: CUSTOM_FIELDS_OUTPUT,
    },
  },
  archivedAt: { type: 'string', description: 'ISO 8601 archive timestamp', optional: true },
  job: {
    type: 'object',
    description: 'Associated job summary',
    properties: {
      id: { type: 'string', description: 'Job UUID' },
      title: { type: 'string', description: 'Job title' },
      locationId: { type: 'string', description: 'Location UUID', optional: true },
      departmentId: { type: 'string', description: 'Department UUID', optional: true },
    },
  },
  creditedToUser: { ...USER_SUMMARY_OUTPUT, description: 'User credited with the application' },
  hiringTeam: HIRING_TEAM_OUTPUT,
  appliedViaJobPostingId: {
    type: 'string',
    description: 'Job posting UUID the candidate applied through',
    optional: true,
  },
  submitterClientIp: { type: 'string', description: 'Submitter IP address', optional: true },
  submitterUserAgent: {
    type: 'string',
    description: 'Submitter browser user agent',
    optional: true,
  },
  createdAt: { type: 'string', description: 'ISO 8601 creation timestamp' },
  updatedAt: { type: 'string', description: 'ISO 8601 last update timestamp' },
  applicationHistory: {
    type: 'array',
    description: 'Stage history',
    items: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'History entry UUID' },
        stageId: { type: 'string', description: 'Interview stage UUID', optional: true },
        stageNumber: { type: 'number', description: 'Stage order number', optional: true },
        title: { type: 'string', description: 'Stage title at the time', optional: true },
        enteredStageAt: { type: 'string', description: 'ISO 8601 entry timestamp', optional: true },
        actorId: { type: 'string', description: 'Actor UUID', optional: true },
      },
    },
  },
} as const satisfies Record<string, OutputProperty>
