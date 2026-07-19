import type { TemporalPayload, TemporalPayloads } from '@/tools/temporal/types'

/**
 * Temporal HTTP API helpers.
 *
 * These tools call the Temporal server's REST HTTP API directly at
 * `{serverUrl}/api/v1/...`. This is the JSON-over-HTTP (grpc-gateway) mapping of
 * `temporal.api.workflowservice.v1.WorkflowService`. It is NOT the official
 * Temporal client SDK and NOT a proxy.
 *
 * Notes on the wire format:
 * - `bytes` protobuf fields are represented as base64 strings in JSON. Temporal
 *   `Payload` messages therefore carry base64 `metadata` values and base64 `data`.
 * - Workflow/activity/signal/query arguments are encoded as `Payloads` where each
 *   argument is a JSON-serialized value tagged with the `json/plain` encoding.
 */

/** Strip trailing slashes so we can safely append `/api/v1/...`. */
export function normalizeServerUrl(serverUrl: string): string {
  return (serverUrl || '').trim().replace(/\/+$/, '')
}

/** Build a full Temporal HTTP API URL: `{serverUrl}/api/v1{path}`. */
export function buildTemporalUrl(serverUrl: string, path: string): string {
  const base = normalizeServerUrl(serverUrl)
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${base}/api/v1${cleanPath}`
}

/**
 * Standard request headers. Temporal Cloud authenticates with an API key sent as
 * a Bearer token; self-hosted clusters may require no auth at all.
 */
export function buildTemporalHeaders(params: { apiKey?: string }): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (params.apiKey) {
    headers.Authorization = `Bearer ${params.apiKey}`
  }
  return headers
}

function base64Encode(value: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(value, 'utf-8').toString('base64')
  }
  // Browser fallback (unicode-safe)
  return btoa(unescape(encodeURIComponent(value)))
}

function base64Decode(value: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(value, 'base64').toString('utf-8')
  }
  return decodeURIComponent(escape(atob(value)))
}

/**
 * Accepts a raw param value that may already be a parsed object/array or a JSON
 * string. Returns the parsed value, or the original string if it is not valid
 * JSON, or undefined when empty.
 */
export function parseMaybeJson(value: unknown): unknown {
  if (value === undefined || value === null) return undefined
  if (typeof value !== 'string') return value
  const trimmed = value.trim()
  if (!trimmed) return undefined
  try {
    return JSON.parse(trimmed)
  } catch {
    return value
  }
}

/**
 * Encode a value into a Temporal `Payloads` message. Arrays are treated as a
 * list of positional arguments (one payload each); any other value becomes a
 * single payload. Returns undefined for empty input so callers can omit the
 * field entirely.
 */
export function encodePayloads(value: unknown): TemporalPayloads | undefined {
  const parsed = parseMaybeJson(value)
  if (parsed === undefined) return undefined
  const args = Array.isArray(parsed) ? parsed : [parsed]
  const payloads: TemporalPayload[] = args.map((arg) => ({
    metadata: { encoding: base64Encode('json/plain') },
    data: base64Encode(JSON.stringify(arg)),
  }))
  return { payloads }
}

/** Decode a Temporal `Payloads` message back into an array of JS values. */
export function decodePayloads(payloads?: TemporalPayloads | null): unknown[] {
  if (!payloads?.payloads?.length) return []
  return payloads.payloads.map((payload) => {
    if (!payload?.data) return null
    const decoded = base64Decode(payload.data)
    try {
      return JSON.parse(decoded)
    } catch {
      return decoded
    }
  })
}

/**
 * Read a Temporal HTTP API response, throwing a useful error on non-2xx.
 * grpc-gateway error bodies look like `{ code, message, details }`.
 */
export async function readTemporalResponse(response: Response): Promise<any> {
  const text = await response.text()
  let data: any = {}
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = { raw: text }
    }
  }
  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      data?.raw ||
      `Temporal request failed with HTTP ${response.status}`
    throw new Error(typeof message === 'string' ? message : JSON.stringify(message))
  }
  return data
}

/** Generate a request id for idempotent workflow starts. */
export function newRequestId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID()
    }
  } catch {
    // fall through
  }
  return `req-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}
