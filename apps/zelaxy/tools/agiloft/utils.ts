import type { ToolResponse } from '@/tools/types'

interface AgiloftBaseParams {
  instanceUrl: string
  knowledgeBase: string
  login: string
  password: string
  table: string
}

interface AgiloftRequestConfig {
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  body?: BodyInit
}

async function agiloftLogin(params: AgiloftBaseParams): Promise<string> {
  const base = params.instanceUrl.replace(/\/$/, '')
  const kb = encodeURIComponent(params.knowledgeBase)
  const login = encodeURIComponent(params.login)
  const password = encodeURIComponent(params.password)

  const url = `${base}/ewws/EWLogin?$KB=${kb}&$login=${login}&$password=${password}`
  const response = await fetch(url, { method: 'POST' })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Agiloft login failed: ${response.status} - ${errorText}`)
  }

  const data = (await response.json()) as { access_token?: string }
  const token = data.access_token
  if (!token) {
    throw new Error('Agiloft login did not return an access token')
  }
  return token
}

async function agiloftLogout(
  instanceUrl: string,
  knowledgeBase: string,
  token: string
): Promise<void> {
  try {
    const base = instanceUrl.replace(/\/$/, '')
    const kb = encodeURIComponent(knowledgeBase)
    await fetch(`${base}/ewws/EWLogout?$KB=${kb}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
  } catch {
    // best-effort
  }
}

export async function executeAgiloftRequest<R extends ToolResponse>(
  params: AgiloftBaseParams,
  buildRequest: (base: string) => AgiloftRequestConfig,
  transformResponse: (response: Response) => Promise<R>
): Promise<R> {
  const token = await agiloftLogin(params)
  const base = params.instanceUrl.replace(/\/$/, '')

  try {
    const req = buildRequest(base)
    const response = await fetch(req.url, {
      method: req.method,
      headers: {
        ...req.headers,
        Authorization: `Bearer ${token}`,
      },
      body: req.body,
    })
    return await transformResponse(response)
  } finally {
    await agiloftLogout(params.instanceUrl, params.knowledgeBase, token)
  }
}

function encodeTable(params: AgiloftBaseParams) {
  return {
    kb: encodeURIComponent(params.knowledgeBase),
    table: encodeURIComponent(params.table),
  }
}

export function buildCreateRecordUrl(base: string, params: AgiloftBaseParams): string {
  const { kb, table } = encodeTable(params)
  return `${base}/ewws/REST/${kb}/${table}?$lang=en`
}

export function buildReadRecordUrl(
  base: string,
  params: AgiloftBaseParams & { recordId: string; fields?: string }
): string {
  const { kb, table } = encodeTable(params)
  const id = encodeURIComponent(params.recordId.trim())
  let url = `${base}/ewws/REST/${kb}/${table}/${id}?$lang=en`
  if (params.fields) {
    const fieldList = params.fields
      .split(',')
      .map((f) => f.trim())
      .filter(Boolean)
    for (const field of fieldList) {
      url += `&$fields=${encodeURIComponent(field)}`
    }
  }
  return url
}

export function buildUpdateRecordUrl(
  base: string,
  params: AgiloftBaseParams & { recordId: string }
): string {
  const { kb, table } = encodeTable(params)
  const id = encodeURIComponent(params.recordId.trim())
  return `${base}/ewws/REST/${kb}/${table}/${id}?$lang=en`
}

export function buildDeleteRecordUrl(
  base: string,
  params: AgiloftBaseParams & { recordId: string }
): string {
  const { kb, table } = encodeTable(params)
  const id = encodeURIComponent(params.recordId.trim())
  return `${base}/ewws/REST/${kb}/${table}/${id}?$lang=en`
}

export function buildQueryRecordsUrl(
  base: string,
  params: AgiloftBaseParams & { query: string; fields?: string; page?: string; limit?: string }
): string {
  const kb = encodeURIComponent(params.knowledgeBase)
  const table = encodeURIComponent(params.table)
  const query = encodeURIComponent(params.query)
  let url = `${base}/ewws/EWSearch/.json?$KB=${kb}&$table=${table}&$lang=en&query=${query}`

  if (params.fields) {
    const fieldList = params.fields
      .split(',')
      .map((f) => f.trim())
      .filter(Boolean)
    for (const field of fieldList) {
      url += `&field=${encodeURIComponent(field)}`
    }
  }
  if (params.page) url += `&page=${encodeURIComponent(params.page)}`
  if (params.limit) url += `&limit=${encodeURIComponent(params.limit)}`

  return url
}
