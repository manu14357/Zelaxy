import type { ToolResponse } from '@/tools/types'

interface AshbyBaseParams {
  apiKey: string
}

export interface AshbyContactInfo {
  value: string
  type: string
  isPrimary: boolean
}

interface AshbySocialLink {
  type: string
  url: string
}

interface AshbyTag {
  id: string
  title: string
  isArchived: boolean
}

export interface AshbyFileHandle {
  id: string
  name: string
  handle: string
}

export interface AshbyCustomField {
  id: string | null
  title: string
  isPrivate: boolean
  valueLabel: string | null
  value: unknown
}

export interface AshbyUserSummary {
  id: string
  firstName: string | null
  lastName: string | null
  email: string | null
  globalRole: string | null
  isEnabled: boolean
  updatedAt: string | null
  managerId: string | null
}

export interface AshbySourceSummary {
  id: string
  title: string
  isArchived: boolean
  sourceType: {
    id: string
    title: string
    isArchived: boolean
  } | null
}

interface AshbyCandidateLocation {
  id: string | null
  locationSummary: string | null
  locationComponents: Array<{ type: string; name: string }>
}

export interface AshbyCandidate {
  id: string
  name: string
  primaryEmailAddress: AshbyContactInfo | null
  primaryPhoneNumber: AshbyContactInfo | null
  emailAddresses: AshbyContactInfo[]
  phoneNumbers: AshbyContactInfo[]
  socialLinks: AshbySocialLink[]
  linkedInUrl: string | null
  githubUrl: string | null
  profileUrl: string | null
  position: string | null
  company: string | null
  school: string | null
  timezone: string | null
  location: AshbyCandidateLocation | null
  tags: AshbyTag[]
  applicationIds: string[]
  customFields: AshbyCustomField[]
  resumeFileHandle: AshbyFileHandle | null
  fileHandles: AshbyFileHandle[]
  source: AshbySourceSummary | null
  creditedToUser: AshbyUserSummary | null
  fraudStatus: string | null
  createdAt: string | null
  updatedAt: string | null
}

export interface AshbyListCandidatesParams extends AshbyBaseParams {
  cursor?: string
  perPage?: number
  createdAfter?: string
}

export interface AshbyGetCandidateParams extends AshbyBaseParams {
  candidateId: string
}

export interface AshbyCreateCandidateParams extends AshbyBaseParams {
  name: string
  email?: string
  phoneNumber?: string
  linkedInUrl?: string
  githubUrl?: string
  website?: string
  sourceId?: string
  creditedToUserId?: string
  createdAt?: string
  alternateEmailAddresses?: string[]
}

export interface AshbyUpdateCandidateParams extends AshbyBaseParams {
  candidateId: string
  name?: string
  email?: string
  phoneNumber?: string
  linkedInUrl?: string
  githubUrl?: string
  websiteUrl?: string
  alternateEmail?: string
  sourceId?: string
  creditedToUserId?: string
  createdAt?: string
  sendNotifications?: boolean
  socialLinks?: Array<{ type: string; url: string }>
}

export interface AshbyListCandidatesResponse extends ToolResponse {
  output: {
    candidates: AshbyCandidate[]
    moreDataAvailable: boolean
    nextCursor: string | null
  }
}

export interface AshbyGetCandidateResponse extends ToolResponse {
  output: AshbyCandidate
}

export interface AshbyCreateCandidateResponse extends ToolResponse {
  output: AshbyCandidate
}

export interface AshbyUpdateCandidateResponse extends ToolResponse {
  output: AshbyCandidate
}

export interface AshbyHiringTeamMember {
  email: string | null
  firstName: string | null
  lastName: string | null
  role: string | null
  userId: string | null
}

interface AshbyApplicationCandidate {
  id: string
  name: string | null
  primaryEmailAddress: AshbyContactInfo | null
  primaryPhoneNumber: AshbyContactInfo | null
}

interface AshbyApplicationJob {
  id: string
  title: string | null
  locationId: string | null
  departmentId: string | null
}

interface AshbyApplicationStage {
  id: string
  title: string | null
  type: string | null
  orderInInterviewPlan: number | null
  interviewStageGroupId: string | null
  interviewPlanId: string | null
}

interface AshbyApplicationArchiveReason {
  id: string
  text: string | null
  reasonType: string | null
  isArchived: boolean
  customFields: AshbyCustomField[]
}

interface AshbyApplicationHistoryEntry {
  id: string
  stageId: string | null
  stageNumber: number | null
  title: string | null
  enteredStageAt: string | null
  actorId: string | null
}

export interface AshbyApplication {
  id: string
  createdAt: string | null
  updatedAt: string | null
  status: string
  customFields: AshbyCustomField[]
  candidate: AshbyApplicationCandidate
  currentInterviewStage: AshbyApplicationStage | null
  source: AshbySourceSummary | null
  archiveReason: AshbyApplicationArchiveReason | null
  archivedAt: string | null
  job: AshbyApplicationJob
  creditedToUser: AshbyUserSummary | null
  hiringTeam: AshbyHiringTeamMember[]
  appliedViaJobPostingId: string | null
  submitterClientIp: string | null
  submitterUserAgent: string | null
  applicationHistory: AshbyApplicationHistoryEntry[]
}

export interface AshbyListApplicationsParams extends AshbyBaseParams {
  cursor?: string
  perPage?: number
  status?: string
  jobId?: string
  candidateId?: string
  createdAfter?: string
}

export interface AshbyListApplicationsResponse extends ToolResponse {
  output: {
    applications: AshbyApplication[]
    moreDataAvailable: boolean
    nextCursor: string | null
  }
}

export interface AshbyGetJobPostingsParams extends AshbyBaseParams {
  jobPostingId: string
  jobBoardId?: string
  expandJob?: boolean
}

export interface AshbyGetJobPostingsResponse extends ToolResponse {
  output: {
    id: string
    title: string
    descriptionPlain: string | null
    descriptionHtml: string | null
    descriptionSocial: string | null
    departmentName: string | null
    teamName: string | null
    teamNameHierarchy: string[]
    jobId: string | null
    locationName: string | null
    isRemote: boolean
    workplaceType: string | null
    employmentType: string | null
    isListed: boolean
    publishedDate: string | null
    applicationDeadline: string | null
    externalLink: string | null
    applyLink: string | null
    updatedAt: string | null
    job: Record<string, unknown> | null
  }
}
