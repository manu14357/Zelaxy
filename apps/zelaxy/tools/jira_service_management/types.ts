import type { OutputProperty, ToolResponse } from '@/tools/types'

/**
 * Shared auth for every Jira Service Management tool.
 *
 * JSM moved from Basic auth (siteUrl/email/apiToken) to OAuth to match the rest of the Atlassian
 * surface and reach parity with upstream. Existing JSM workflows keep their tool ids but must
 * reconnect with a Jira credential.
 */
export interface JiraSmBaseParams {
  accessToken: string
  cloudId: string
}

export interface JiraSmListServiceDesksParams {
  accessToken: string
  cloudId: string
  start?: number
  limit?: number
}

export interface JiraSmCreateRequestParams extends JiraSmBaseParams {
  serviceDeskId: string
  requestTypeId: string
  requestFieldValues: Record<string, any>
}

export interface JiraSmGetRequestParams extends JiraSmBaseParams {
  issueIdOrKey: string
  expand?: string
}

export interface JiraSmListRequestsParams extends JiraSmBaseParams {
  serviceDeskId?: string
  requestOwnership?: string
  requestStatus?: string
  searchTerm?: string
  start?: number
  limit?: number
}

export interface JiraSmObjectResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { id?: string; issueKey?: string }
  }
}

export interface JiraSmListResponse extends ToolResponse {
  output: {
    data: Record<string, any>[]
    metadata: { count: number; isLastPage: boolean }
  }
}

export type JiraSmResponse = JiraSmObjectResponse | JiraSmListResponse

/** Shared params for the OAuth-authenticated Service Desk API tools */
export interface JsmBaseParams {
  accessToken: string
  cloudId: string
}

/** Reusable user output properties */
export const JSM_USER_OUTPUT_PROPERTIES = {
  accountId: { type: 'string', description: 'Atlassian account ID' },
  displayName: { type: 'string', description: 'User display name' },
  emailAddress: { type: 'string', description: 'User email address', optional: true },
  active: { type: 'boolean', description: 'Whether the account is active' },
} as const

/** Output properties for a queue item */
export const JSM_QUEUE_ITEM_PROPERTIES = {
  id: { type: 'string', description: 'Queue ID' },
  name: { type: 'string', description: 'Queue name' },
  jql: { type: 'string', description: 'JQL filter for the queue' },
  fields: { type: 'json', description: 'Fields displayed in the queue' },
  issueCount: { type: 'number', description: 'Number of issues in the queue' },
} as const

/** Output properties for a request type item */
export const JSM_REQUEST_TYPE_ITEM_PROPERTIES = {
  id: { type: 'string', description: 'Request type ID' },
  name: { type: 'string', description: 'Request type name' },
  description: { type: 'string', description: 'Request type description' },
  helpText: { type: 'string', description: 'Help text for customers', optional: true },
  issueTypeId: { type: 'string', description: 'Associated Jira issue type ID' },
  serviceDeskId: { type: 'string', description: 'Parent service desk ID' },
  groupIds: { type: 'json', description: 'Groups this request type belongs to' },
  icon: { type: 'json', description: 'Request type icon with id and links', optional: true },
} as const

/** Output properties for a request type field */
export const JSM_REQUEST_TYPE_FIELD_PROPERTIES = {
  fieldId: {
    type: 'string',
    description: 'Field identifier (e.g., summary, description, customfield_10010)',
  },
  name: { type: 'string', description: 'Human-readable field name' },
  description: { type: 'string', description: 'Help text for the field', optional: true },
  required: { type: 'boolean', description: 'Whether the field is required' },
  visible: { type: 'boolean', description: 'Whether the field is visible' },
  validValues: { type: 'json', description: 'Allowed values for select fields' },
  presetValues: { type: 'json', description: 'Pre-populated values', optional: true },
  defaultValues: { type: 'json', description: 'Default values for the field', optional: true },
  jiraSchema: {
    type: 'json',
    description: 'Jira field schema with type, system, custom, customId',
  },
} as const

/** Output properties for a transition item */
export const JSM_TRANSITION_ITEM_PROPERTIES = {
  id: { type: 'string', description: 'Transition ID' },
  name: { type: 'string', description: 'Transition name' },
} as const

/** Output properties for an SLA item */
export const JSM_SLA_ITEM_PROPERTIES = {
  id: { type: 'string', description: 'SLA metric ID' },
  name: { type: 'string', description: 'SLA metric name' },
  completedCycles: {
    type: 'json',
    description:
      'Completed SLA cycles with startTime, stopTime, breachTime, breached, goalDuration, elapsedTime, remainingTime (each time as DateDTO, durations as DurationDTO)',
  },
  ongoingCycle: {
    type: 'json',
    description:
      'Ongoing SLA cycle with startTime, breachTime, breached, paused, withinCalendarHours, goalDuration, elapsedTime, remainingTime',
    optional: true,
  },
} as const

/** Output properties for an approver item */
export const JSM_APPROVER_ITEM_PROPERTIES = {
  approver: {
    type: 'object',
    description: 'Approver user details',
    properties: JSM_USER_OUTPUT_PROPERTIES,
  },
  approverDecision: { type: 'string', description: 'Decision: pending, approved, or declined' },
} as const

/** Output properties for an approval item */
export const JSM_APPROVAL_ITEM_PROPERTIES = {
  id: { type: 'string', description: 'Approval ID' },
  name: { type: 'string', description: 'Approval description' },
  finalDecision: { type: 'string', description: 'Final decision: pending, approved, or declined' },
  canAnswerApproval: { type: 'boolean', description: 'Whether current user can respond' },
  approvers: {
    type: 'array',
    description: 'List of approvers with their decisions',
    items: {
      type: 'object',
      properties: JSM_APPROVER_ITEM_PROPERTIES,
    },
  },
  createdDate: { type: 'json', description: 'Creation date', optional: true },
  completedDate: { type: 'json', description: 'Completion date', optional: true },
} as const

/** Output properties for a comment item */
export const JSM_COMMENT_ITEM_PROPERTIES = {
  id: { type: 'string', description: 'Comment ID' },
  body: { type: 'string', description: 'Comment body text' },
  public: { type: 'boolean', description: 'Whether the comment is public' },
  author: {
    type: 'object',
    description: 'Comment author',
    properties: JSM_USER_OUTPUT_PROPERTIES,
  },
  created: {
    type: 'json',
    description: 'Creation date with iso8601, friendly, epochMillis',
  },
  renderedBody: {
    type: 'json',
    description: 'HTML-rendered comment body (when expand=renderedBody)',
    optional: true,
  },
} as const

/** Queue representation */
interface JsmQueue {
  id: string
  name: string
  jql: string
  fields: string[]
  issueCount: number
}

/** Request type representation */
interface JsmRequestType {
  id: string
  name: string
  description: string
  helpText?: string
  issueTypeId?: string
  serviceDeskId: string
  groupIds: string[]
  icon: {
    id: string
    name: string
  }
}

/** Request type field representation */
interface JsmRequestTypeField {
  fieldId: string
  name: string
  description?: string
  required: boolean
  visible?: boolean
  validValues: Array<{ value: string; label: string; children?: unknown[] }>
  presetValues?: unknown[]
  defaultValues?: unknown[]
  jiraSchema: { type: string; system?: string; custom?: string; customId?: number }
}

/** Transition representation */
interface JsmTransition {
  id: string
  name: string
}

/** SLA representation */
interface JsmSla {
  id: string
  name: string
  completedCycles: Array<{
    startTime: { iso8601: string; friendly: string; epochMillis: number }
    stopTime: { iso8601: string; friendly: string; epochMillis: number }
    breachTime?: { iso8601: string; friendly: string; epochMillis: number }
    breached: boolean
    goalDuration?: { millis: number; friendly: string }
    elapsedTime?: { millis: number; friendly: string }
    remainingTime?: { millis: number; friendly: string }
  }>
  ongoingCycle?: {
    startTime: { iso8601: string }
    breachTime?: { iso8601: string }
    breached: boolean
    paused: boolean
    withinCalendarHours: boolean
    goalDuration?: { millis: number; friendly: string }
    elapsedTime?: { millis: number; friendly: string }
    remainingTime?: { millis: number; friendly: string }
  }
}

/** Approver representation */
interface JsmApprover {
  accountId: string
  displayName: string
  emailAddress?: string
  approverDecision: 'pending' | 'approved' | 'declined'
}

/** Approval representation */
interface JsmApproval {
  id: string
  name: string
  finalDecision: 'pending' | 'approved' | 'declined'
  canAnswerApproval: boolean
  approvers: JsmApprover[]
  createdDate?: { iso8601: string; friendly: string }
  completedDate?: { iso8601: string; friendly: string }
}

/** Comment representation */
interface JsmComment {
  id: string
  body: string
  public: boolean
  author: {
    accountId: string
    displayName: string
    emailAddress?: string
  }
  created: { iso8601: string; friendly: string }
}

export interface JsmGetQueuesParams extends JsmBaseParams {
  serviceDeskId: string
  includeCount?: boolean
  start?: number
  limit?: number
}

export interface JsmGetRequestTypesParams extends JsmBaseParams {
  serviceDeskId: string
  searchQuery?: string
  groupId?: string
  expand?: string
  start?: number
  limit?: number
}

export interface JsmGetRequestTypeFieldsParams extends JsmBaseParams {
  serviceDeskId: string
  requestTypeId: string
}

export interface JsmGetTransitionsParams extends JsmBaseParams {
  issueIdOrKey: string
  start?: number
  limit?: number
}

export interface JsmTransitionRequestParams extends JsmBaseParams {
  issueIdOrKey: string
  transitionId: string
  comment?: string
}

export interface JsmGetSlaParams extends JsmBaseParams {
  issueIdOrKey: string
  start?: number
  limit?: number
}

export interface JsmGetApprovalsParams extends JsmBaseParams {
  issueIdOrKey: string
  start?: number
  limit?: number
}

export interface JsmAnswerApprovalParams extends JsmBaseParams {
  issueIdOrKey: string
  approvalId: string
  decision: 'approve' | 'decline'
}

export interface JsmAddCommentParams extends JsmBaseParams {
  issueIdOrKey: string
  body: string
  isPublic: boolean
}

export interface JsmGetCommentsParams extends JsmBaseParams {
  issueIdOrKey: string
  isPublic?: boolean
  internal?: boolean
  expand?: string
  start?: number
  limit?: number
}

export interface JsmGetQueuesResponse extends ToolResponse {
  output: {
    ts: string
    queues: JsmQueue[]
    total: number
    isLastPage: boolean
  }
}

export interface JsmGetRequestTypesResponse extends ToolResponse {
  output: {
    ts: string
    requestTypes: JsmRequestType[]
    total: number
    isLastPage: boolean
  }
}

export interface JsmGetRequestTypeFieldsResponse extends ToolResponse {
  output: {
    ts: string
    serviceDeskId: string
    requestTypeId: string
    canAddRequestParticipants: boolean
    canRaiseOnBehalfOf: boolean
    requestTypeFields: JsmRequestTypeField[]
  }
}

export interface JsmGetTransitionsResponse extends ToolResponse {
  output: {
    ts: string
    issueIdOrKey: string
    transitions: JsmTransition[]
    total: number
    isLastPage: boolean
  }
}

export interface JsmTransitionRequestResponse extends ToolResponse {
  output: {
    ts: string
    issueIdOrKey: string
    transitionId: string
    success: boolean
  }
}

export interface JsmGetSlaResponse extends ToolResponse {
  output: {
    ts: string
    issueIdOrKey: string
    slas: JsmSla[]
    total: number
    isLastPage: boolean
  }
}

export interface JsmGetApprovalsResponse extends ToolResponse {
  output: {
    ts: string
    issueIdOrKey: string
    approvals: JsmApproval[]
    total: number
    isLastPage: boolean
  }
}

export interface JsmAnswerApprovalResponse extends ToolResponse {
  output: {
    ts: string
    issueIdOrKey: string
    approvalId: string
    decision: string
    id: string | null
    name: string | null
    finalDecision: string | null
    canAnswerApproval: boolean | null
    approvers: Array<{
      approver: {
        accountId: string
        displayName: string
        emailAddress?: string
        active?: boolean
      }
      approverDecision: string
    }> | null
    createdDate: { iso8601: string; friendly: string; epochMillis: number } | null
    completedDate: { iso8601: string; friendly: string; epochMillis: number } | null
    approval?: Record<string, unknown>
    success: boolean
  }
}

export interface JsmAddCommentResponse extends ToolResponse {
  output: {
    ts: string
    issueIdOrKey: string
    commentId: string
    body: string
    isPublic: boolean
    author: { accountId: string; displayName: string; emailAddress?: string } | null
    createdDate: { iso8601: string; friendly: string } | null
    success: boolean
  }
}

export interface JsmGetCommentsResponse extends ToolResponse {
  output: {
    ts: string
    issueIdOrKey: string
    comments: JsmComment[]
    total: number
    isLastPage: boolean
  }
}

/**
 * JSM Forms (ProForma) tools.
 *
 * These authenticate with OAuth and address the site by cloudId, so they do not extend
 * JiraSmBaseParams, which now carries the OAuth accessToken/cloudId pair.
 */
export interface JiraSmFormsBaseParams {
  accessToken: string
  cloudId: string
}

/** Output properties for a FormTemplateIndexEntry (project form templates endpoint) */
export const JIRA_SM_FORM_TEMPLATE_PROPERTIES = {
  id: { type: 'string', description: 'Form template ID (UUID)' },
  name: { type: 'string', description: 'Form template name' },
  updated: { type: 'string', description: 'Last updated timestamp (ISO 8601)' },
  issueCreateIssueTypeIds: {
    type: 'json',
    description: 'Issue type IDs that auto-attach this form on issue create',
  },
  issueCreateRequestTypeIds: {
    type: 'json',
    description: 'Request type IDs that auto-attach this form on issue create',
  },
  portalRequestTypeIds: {
    type: 'json',
    description: 'Request type IDs that show this form on the customer portal',
  },
  recommendedIssueRequestTypeIds: {
    type: 'json',
    description: 'Request type IDs that recommend this form',
  },
} as const

/** Output properties for a FormIndexEntry (issue forms list endpoint) */
export const JIRA_SM_ISSUE_FORM_PROPERTIES = {
  id: { type: 'string', description: 'Form instance ID (UUID)' },
  name: { type: 'string', description: 'Form name' },
  updated: { type: 'string', description: 'Last updated timestamp (ISO 8601)' },
  submitted: { type: 'boolean', description: 'Whether the form has been submitted' },
  lock: { type: 'boolean', description: 'Whether the form is locked' },
  internal: { type: 'boolean', description: 'Whether the form is internal-only', optional: true },
  formTemplateId: {
    type: 'string',
    description: 'Source form template ID (UUID)',
    optional: true,
  },
} as const

/** FormQuestion per the JSM Forms OpenAPI spec */
interface JiraSmFormQuestion {
  label: string
  type: string
  validation: { rq?: boolean; [key: string]: unknown }
  choices?: Array<{ id: string; label: string; other?: boolean }>
  dcId?: string
  defaultAnswer?: Record<string, unknown>
  description?: string
  jiraField?: string
  questionKey?: string
}

/** FormTemplateIndexEntry per the JSM Forms OpenAPI spec */
interface JiraSmFormTemplate {
  id: string
  name: string
  updated: string
  issueCreateIssueTypeIds: number[]
  issueCreateRequestTypeIds: number[]
  portalRequestTypeIds: number[]
  recommendedIssueRequestTypeIds: number[]
}

/** FormIndexEntry (issue form) per the JSM Forms OpenAPI spec */
interface JiraSmIssueForm {
  id: string
  name: string
  updated: string
  submitted: boolean
  lock: boolean
  internal?: boolean
  formTemplateId?: string
}

interface JiraSmFormSimplifiedAnswer {
  label?: string
  answer?: string
  fieldKey?: string
  choice?: string
}

export interface JiraSmGetFormTemplatesParams extends JiraSmFormsBaseParams {
  projectIdOrKey: string
}

export interface JiraSmGetFormTemplatesResponse extends ToolResponse {
  output: {
    ts: string
    projectIdOrKey: string
    templates: JiraSmFormTemplate[]
    total: number
  }
}

export interface JiraSmGetIssueFormsParams extends JiraSmFormsBaseParams {
  issueIdOrKey: string
}

export interface JiraSmGetIssueFormsResponse extends ToolResponse {
  output: {
    ts: string
    issueIdOrKey: string
    forms: JiraSmIssueForm[]
    total: number
  }
}

export interface JiraSmAttachFormParams extends JiraSmFormsBaseParams {
  issueIdOrKey: string
  formTemplateId: string
}

export interface JiraSmAttachFormResponse extends ToolResponse {
  output: {
    ts: string
    issueIdOrKey: string
    id: string
    name: string
    updated: string | null
    submitted: boolean
    lock: boolean
    internal: boolean | null
    formTemplateId: string | null
  }
}

export interface JiraSmGetFormParams extends JiraSmFormsBaseParams {
  issueIdOrKey: string
  formId: string
}

export interface JiraSmGetFormResponse extends ToolResponse {
  output: {
    ts: string
    issueIdOrKey: string
    formId: string
    design: Record<string, unknown> | null
    state: {
      answers: Record<string, unknown>
      status: string
      visibility: string
    } | null
    updated: string | null
  }
}

export interface JiraSmGetFormStructureParams extends JiraSmFormsBaseParams {
  projectIdOrKey: string
  formId: string
}

export interface JiraSmGetFormStructureResponse extends ToolResponse {
  output: {
    ts: string
    projectIdOrKey: string
    formId: string
    design: {
      questions: Record<string, JiraSmFormQuestion>
      layout: unknown[]
      conditions: Record<string, unknown>
      sections: Record<string, unknown>
      settings: { name: string; submit: { lock: boolean; pdf: boolean }; language?: string }
    } | null
    updated: string | null
    publish: Record<string, unknown> | null
  }
}

export interface JiraSmGetFormAnswersParams extends JiraSmFormsBaseParams {
  issueIdOrKey: string
  formId: string
}

export interface JiraSmGetFormAnswersResponse extends ToolResponse {
  output: {
    ts: string
    issueIdOrKey: string
    formId: string
    answers: JiraSmFormSimplifiedAnswer[] | null
  }
}

export interface JiraSmSaveFormAnswersParams extends JiraSmFormsBaseParams {
  issueIdOrKey: string
  formId: string
  answers: Record<string, unknown>
}

export interface JiraSmSaveFormAnswersResponse extends ToolResponse {
  output: {
    ts: string
    issueIdOrKey: string
    formId: string
    state: { status: string } | null
    updated: string | null
  }
}

export interface JiraSmSubmitFormParams extends JiraSmFormsBaseParams {
  issueIdOrKey: string
  formId: string
}

export interface JiraSmSubmitFormResponse extends ToolResponse {
  output: {
    ts: string
    issueIdOrKey: string
    formId: string
    status: string
  }
}

export interface JiraSmReopenFormParams extends JiraSmFormsBaseParams {
  issueIdOrKey: string
  formId: string
}

export interface JiraSmReopenFormResponse extends ToolResponse {
  output: {
    ts: string
    issueIdOrKey: string
    formId: string
    status: string
  }
}

export interface JiraSmCopyFormsParams extends JiraSmFormsBaseParams {
  sourceIssueIdOrKey: string
  targetIssueIdOrKey: string
  formIds?: string[]
}

export interface JiraSmCopyFormsResponse extends ToolResponse {
  output: {
    ts: string
    sourceIssueIdOrKey: string
    targetIssueIdOrKey: string
    copiedForms: Array<Record<string, unknown>>
    errors: Array<Record<string, unknown>>
  }
}

export interface JiraSmDeleteFormParams extends JiraSmFormsBaseParams {
  issueIdOrKey: string
  formId: string
}

export interface JiraSmDeleteFormResponse extends ToolResponse {
  output: {
    ts: string
    issueIdOrKey: string
    formId: string
    deleted: boolean
  }
}

export interface JiraSmExternaliseFormParams extends JiraSmFormsBaseParams {
  issueIdOrKey: string
  formId: string
}

export interface JiraSmExternaliseFormResponse extends ToolResponse {
  output: {
    ts: string
    issueIdOrKey: string
    formId: string
    visibility: string
  }
}

export interface JiraSmInternaliseFormParams extends JiraSmFormsBaseParams {
  issueIdOrKey: string
  formId: string
}

export interface JiraSmInternaliseFormResponse extends ToolResponse {
  output: {
    ts: string
    issueIdOrKey: string
    formId: string
    visibility: string
  }
}

/* -------------------------------------------------------------------------- */
/* Assets (Insight / CMDB)                                                     */
/* -------------------------------------------------------------------------- */

/** Base params shared by every JSM Assets tool */
export interface JiraSmAssetsBaseParams {
  accessToken: string
  domain: string
  /** Jira Cloud ID (resolved from the domain when omitted) */
  cloudId?: string
  /** Assets workspace ID (resolved from the cloudId when omitted) */
  workspaceId?: string
}

/** A single attribute value entry on an Assets object */
export interface JiraSmAssetObjectAttributeValue {
  value: string | null
  displayValue: string | null
  searchValue?: string | null
  referencedType?: boolean
  referencedObject?: Record<string, unknown> | null
}

/** A resolved attribute on an Assets object (read shape) */
export interface JiraSmAssetObjectAttribute {
  id: string
  objectTypeAttributeId: string
  objectAttributeValues: JiraSmAssetObjectAttributeValue[]
}

/** An Assets object as returned by get/create/update */
export interface JiraSmAssetObject {
  id: string
  label: string | null
  objectKey: string | null
  globalId: string | null
  created: string | null
  updated: string | null
  hasAvatar: boolean
  objectType: Record<string, unknown> | null
  attributes: JiraSmAssetObjectAttribute[]
  link: string | null
}

/** Attribute payload for creating/updating an Assets object */
export interface JiraSmAssetObjectAttributeInput {
  objectTypeAttributeId: string
  objectAttributeValues: Array<{ value: unknown }>
}

/** Raw attribute value as returned by the Assets API (before normalization) */
export interface JiraSmRawAssetObjectAttributeValue {
  value?: string | null
  displayValue?: string | null
  searchValue?: string | null
  referencedType?: boolean
  referencedObject?: Record<string, unknown> | null
}

/** Raw attribute as returned by the Assets API (before normalization) */
export interface JiraSmRawAssetObjectAttribute {
  id?: string
  objectTypeAttributeId?: string
  objectAttributeValues?: JiraSmRawAssetObjectAttributeValue[]
}

/** Raw Assets object as returned by get/create/update/AQL (before normalization) */
export interface JiraSmRawAssetObject {
  id: string
  label?: string | null
  objectKey?: string | null
  globalId?: string | null
  created?: string | null
  updated?: string | null
  hasAvatar?: boolean
  objectType?: Record<string, unknown> | null
  attributes?: JiraSmRawAssetObjectAttribute[]
  _links?: { self?: string } | null
}

/** Output property descriptors reused across Assets object responses */
export const JIRA_SM_ASSET_OBJECT_PROPERTIES: Record<string, OutputProperty> = {
  id: { type: 'string', description: 'Object ID' },
  label: { type: 'string', description: 'Human-readable object label', optional: true },
  objectKey: { type: 'string', description: 'Object key (e.g., HOST-123)', optional: true },
  globalId: { type: 'string', description: 'Global object ID', optional: true },
  objectType: { type: 'json', description: 'Object type metadata', optional: true },
  attributes: { type: 'json', description: 'Resolved attribute values for the object' },
  hasAvatar: { type: 'boolean', description: 'Whether the object has an avatar', optional: true },
  created: { type: 'string', description: 'Creation timestamp', optional: true },
  updated: { type: 'string', description: 'Last update timestamp', optional: true },
  link: { type: 'string', description: 'Self link to the object', optional: true },
}

export interface JiraSmListObjectSchemasParams extends JiraSmAssetsBaseParams {
  startAt?: number
  maxResults?: number
  includeCounts?: boolean
}

export interface JiraSmListObjectSchemasResponse extends ToolResponse {
  output: {
    ts: string
    schemas: Array<Record<string, unknown>>
    total: number
    isLast: boolean
  }
}

export interface JiraSmGetObjectSchemaParams extends JiraSmAssetsBaseParams {
  schemaId: string
}

export interface JiraSmGetObjectSchemaResponse extends ToolResponse {
  output: {
    ts: string
    schema: Record<string, unknown> | null
  }
}

export interface JiraSmListObjectTypesParams extends JiraSmAssetsBaseParams {
  schemaId: string
  excludeAbstract?: boolean
}

export interface JiraSmListObjectTypesResponse extends ToolResponse {
  output: {
    ts: string
    objectTypes: Array<Record<string, unknown>>
    total: number
  }
}

export interface JiraSmGetObjectTypeAttributesParams extends JiraSmAssetsBaseParams {
  objectTypeId: string
  onlyValueEditable?: boolean
  query?: string
}

export interface JiraSmGetObjectTypeAttributesResponse extends ToolResponse {
  output: {
    ts: string
    attributes: Array<Record<string, unknown>>
    total: number
  }
}

export interface JiraSmSearchObjectsAqlParams extends JiraSmAssetsBaseParams {
  qlQuery: string
  page?: number
  resultsPerPage?: number
  includeAttributes?: boolean
  objectTypeId?: string
  objectSchemaId?: string
}

export interface JiraSmSearchObjectsAqlResponse extends ToolResponse {
  output: {
    ts: string
    objects: Array<Record<string, unknown>>
    total: number
    pageNumber: number
    pageSize: number
  }
}

export interface JiraSmGetObjectParams extends JiraSmAssetsBaseParams {
  objectId: string
}

export interface JiraSmGetObjectResponse extends ToolResponse {
  output: {
    ts: string
    object: JiraSmAssetObject | null
  }
}

export interface JiraSmCreateObjectParams extends JiraSmAssetsBaseParams {
  objectTypeId: string
  attributes: JiraSmAssetObjectAttributeInput[]
}

export interface JiraSmCreateObjectResponse extends ToolResponse {
  output: {
    ts: string
    object: JiraSmAssetObject | null
  }
}

export interface JiraSmUpdateObjectParams extends JiraSmAssetsBaseParams {
  objectId: string
  attributes: JiraSmAssetObjectAttributeInput[]
  objectTypeId?: string
}

export interface JiraSmUpdateObjectResponse extends ToolResponse {
  output: {
    ts: string
    object: JiraSmAssetObject | null
  }
}

export interface JiraSmDeleteObjectParams extends JiraSmAssetsBaseParams {
  objectId: string
}

export interface JiraSmDeleteObjectResponse extends ToolResponse {
  output: {
    ts: string
    objectId: string
    deleted: boolean
  }
}

/**
 * These tools call Atlassian directly rather than through a proxy route, so `cloudId`
 * cannot be resolved from a domain at request time and must be supplied upfront.
 */
export interface JiraSmOAuthBaseParams {
  accessToken: string
  cloudId: string
}

export interface JiraSmParticipant {
  accountId: string
  displayName: string
  emailAddress?: string
  active: boolean
}

export interface JiraSmCustomer {
  accountId: string
  name: string
  key: string
  emailAddress: string
  displayName: string
  active: boolean
  timeZone: string
}

export interface JiraSmOrganization {
  id: string
  name: string
}

export interface JiraSmAddParticipantsParams extends JiraSmOAuthBaseParams {
  issueIdOrKey: string
  accountIds: string
}

export interface JiraSmAddParticipantsResponse extends ToolResponse {
  output: {
    ts: string
    issueIdOrKey: string
    participants: JiraSmParticipant[]
    success: boolean
  }
}

export interface JiraSmGetParticipantsParams extends JiraSmOAuthBaseParams {
  issueIdOrKey: string
  start?: number
  limit?: number
}

export interface JiraSmGetParticipantsResponse extends ToolResponse {
  output: {
    ts: string
    issueIdOrKey: string
    participants: JiraSmParticipant[]
    total: number
    isLastPage: boolean
  }
}

export interface JiraSmAddCustomerParams extends JiraSmOAuthBaseParams {
  serviceDeskId: string
  accountIds: string
}

export interface JiraSmAddCustomerResponse extends ToolResponse {
  output: {
    ts: string
    serviceDeskId: string
    success: boolean
  }
}

export interface JiraSmGetCustomersParams extends JiraSmOAuthBaseParams {
  serviceDeskId: string
  query?: string
  start?: number
  limit?: number
}

export interface JiraSmGetCustomersResponse extends ToolResponse {
  output: {
    ts: string
    customers: JiraSmCustomer[]
    total: number
    isLastPage: boolean
  }
}

export interface JiraSmCreateOrganizationParams extends JiraSmOAuthBaseParams {
  name: string
}

export interface JiraSmCreateOrganizationResponse extends ToolResponse {
  output: {
    ts: string
    organizationId: string
    name: string
    success: boolean
  }
}

export interface JiraSmAddOrganizationParams extends JiraSmOAuthBaseParams {
  serviceDeskId: string
  organizationId: string
}

export interface JiraSmAddOrganizationResponse extends ToolResponse {
  output: {
    ts: string
    serviceDeskId: string
    organizationId: string
    success: boolean
  }
}

export interface JiraSmGetOrganizationsParams extends JiraSmOAuthBaseParams {
  serviceDeskId: string
  start?: number
  limit?: number
}

export interface JiraSmGetOrganizationsResponse extends ToolResponse {
  output: {
    ts: string
    organizations: JiraSmOrganization[]
    total: number
    isLastPage: boolean
  }
}

export const JIRA_SM_PARTICIPANT_ITEM_PROPERTIES = {
  accountId: { type: 'string', description: 'Atlassian account ID' },
  displayName: { type: 'string', description: 'Display name' },
  emailAddress: { type: 'string', description: 'Email address', optional: true },
  active: { type: 'boolean', description: 'Whether the account is active' },
} as const

export const JIRA_SM_CUSTOMER_ITEM_PROPERTIES = {
  accountId: { type: 'string', description: 'Atlassian account ID' },
  displayName: { type: 'string', description: 'Display name' },
  emailAddress: { type: 'string', description: 'Email address' },
  active: { type: 'boolean', description: 'Whether the account is active' },
  timeZone: { type: 'string', description: 'User timezone', optional: true },
} as const

export const JIRA_SM_ORGANIZATION_ITEM_PROPERTIES = {
  id: { type: 'string', description: 'Organization ID' },
  name: { type: 'string', description: 'Organization name' },
} as const
