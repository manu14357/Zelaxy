/**
 * Jira Service Management API helpers.
 *
 * Zelaxy calls Atlassian directly (as the jira tools do) rather than proxying through an internal
 * route, so every JSM tool builds its URL and headers from here.
 */

import { getJiraCloudId } from '@/tools/jira/utils'
import type {
  JiraSmAssetObject,
  JiraSmAssetsBaseParams,
  JiraSmRawAssetObject,
} from '@/tools/jira_service_management/types'
import type { HttpMethod } from '@/tools/types'

export function getJsmApiBaseUrl(cloudId: string): string {
  return `https://api.atlassian.com/ex/jira/${cloudId}/rest/servicedeskapi`
}

/**
 * Base URL for the JSM Forms (ProForma) API.
 *
 * Forms is NOT served from the service desk API path — it lives under `/forms` on the same
 * gateway, hence its own builder.
 */
export function getJsmFormsApiBaseUrl(cloudId: string): string {
  return `https://api.atlassian.com/ex/jira/${cloudId}/forms`
}

export function getJsmHeaders(accessToken: string): Record<string, string> {
  return {
    Authorization: `Bearer ${accessToken}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
    // Several service desk endpoints (queues, organizations, SLA) are still gated behind
    // Atlassian's experimental opt-in and return 400 without this header.
    'X-ExperimentalApi': 'opt-in',
  }
}

/** Appends only the params that were actually provided, so we never send empty filters. */
export function buildJsmQuery(entries: Record<string, string | number | undefined>): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(entries)) {
    if (value !== undefined && value !== null && `${value}` !== '') {
      params.append(key, `${value}`)
    }
  }
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

/* -------------------------------------------------------------------------- */
/* Assets (Insight / CMDB)                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Base URL for the Assets (Insight/CMDB) API.
 *
 * Assets is keyed by BOTH the Jira `cloudId` and an Assets `workspaceId`, and lives on a
 * different path than the service desk API — hence its own builder.
 */
export function getAssetsApiBaseUrl(cloudId: string, workspaceId: string): string {
  return `https://api.atlassian.com/ex/jira/${cloudId}/jsm/assets/workspace/${workspaceId}/v1`
}

/**
 * Resolve the Assets `workspaceId` for a site via the service desk discovery endpoint.
 *
 * Atlassian provisions a single Assets workspace per site, so the first value is canonical;
 * callers on a multi-workspace site can pass an explicit `workspaceId` to skip this lookup.
 */
export async function getAssetsWorkspaceId(cloudId: string, accessToken: string): Promise<string> {
  const response = await fetch(`${getJsmApiBaseUrl(cloudId)}/assets/workspace`, {
    method: 'GET',
    headers: getJsmHeaders(accessToken),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(
      `Failed to resolve Assets workspace: ${response.status} - ${errorText || response.statusText}`
    )
  }

  const data = await response.json()
  const workspaceId: string | undefined = data?.values?.[0]?.workspaceId

  if (!workspaceId) {
    // Assets ships only with Jira Service Management Premium/Enterprise; on lower plans the
    // discovery endpoint succeeds but returns no workspace.
    throw new Error(
      'No Assets workspace found for this site. Assets (Insight) requires Jira Service Management Premium or Enterprise and must be enabled on the instance.'
    )
  }

  return workspaceId
}

/** Resolve the `cloudId` + Assets `workspaceId` pair, preferring caller-supplied values. */
export async function resolveAssetsContext(
  domain: string,
  accessToken: string,
  cloudIdParam?: string,
  workspaceIdParam?: string
): Promise<{ cloudId: string; workspaceId: string }> {
  const cloudId = cloudIdParam?.trim() || (await getJiraCloudId(domain, accessToken))
  const workspaceId = workspaceIdParam?.trim() || (await getAssetsWorkspaceId(cloudId, accessToken))
  return { cloudId, workspaceId }
}

/** Normalize a raw Assets object (from get/create/update/AQL) into the trimmed tool shape. */
export function mapAssetObject(data: JiraSmRawAssetObject): JiraSmAssetObject {
  return {
    id: data.id,
    label: data.label ?? null,
    objectKey: data.objectKey ?? null,
    globalId: data.globalId ?? null,
    created: data.created ?? null,
    updated: data.updated ?? null,
    hasAvatar: data.hasAvatar ?? false,
    objectType: data.objectType ?? null,
    attributes: (data.attributes ?? []).map((attr) => ({
      id: attr.id ?? '',
      objectTypeAttributeId: attr.objectTypeAttributeId ?? '',
      objectAttributeValues: (attr.objectAttributeValues ?? []).map((v) => ({
        value: v.value ?? null,
        displayValue: v.displayValue ?? null,
        searchValue: v.searchValue ?? null,
        referencedType: v.referencedType ?? false,
        referencedObject: v.referencedObject ?? null,
      })),
    })),
    link: data._links?.self ?? null,
  }
}

/** Turn an Atlassian error payload into the most specific message available. */
export function parseAssetsErrorMessage(
  status: number,
  statusText: string,
  errorText: string
): string {
  try {
    const errorData = JSON.parse(errorText)
    if (errorData.errorMessage) return errorData.errorMessage
    if (Array.isArray(errorData.errorMessages) && errorData.errorMessages.length > 0) {
      return errorData.errorMessages.join(', ')
    }
    if (errorData.errors && !Array.isArray(errorData.errors)) {
      const fieldErrors = Object.entries(errorData.errors)
        .map(([field, msg]) => `${field}: ${msg}`)
        .join(', ')
      if (fieldErrors) return fieldErrors
    }
    if (errorData.message) return errorData.message
  } catch {
    if (errorText) return errorText
  }
  return `${status} ${statusText}`
}

export type JiraSmAssetsRequestResult = { ok: true; data: any } | { ok: false; error: string }

/**
 * Resolve the Assets context and call Atlassian directly.
 *
 * Assets tools run through `directExecution` rather than the declarative `request` config because
 * resolving the `cloudId`/`workspaceId` pair is async and `request.url` is synchronous.
 */
export async function executeAssetsRequest(
  params: JiraSmAssetsBaseParams,
  build: (baseUrl: string) => {
    url: string
    method: HttpMethod
    body?: Record<string, unknown>
  }
): Promise<JiraSmAssetsRequestResult> {
  try {
    const { cloudId, workspaceId } = await resolveAssetsContext(
      params.domain,
      params.accessToken,
      params.cloudId,
      params.workspaceId
    )

    const { url, method, body } = build(getAssetsApiBaseUrl(cloudId, workspaceId))

    const response = await fetch(url, {
      method,
      headers: getJsmHeaders(params.accessToken),
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return {
        ok: false,
        error: parseAssetsErrorMessage(response.status, response.statusText, errorText),
      }
    }

    // DELETE returns 204 with an empty body.
    const responseText = await response.text()
    return { ok: true, data: responseText ? JSON.parse(responseText) : null }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
}
