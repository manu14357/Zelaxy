import crypto from 'crypto'

/**
 * AWS Signature Version 4 signer.
 *
 * Produces the headers (Authorization, X-Amz-Date, …) for a single AWS API request so a plain
 * `fetch` can call AWS directly — no AWS SDK and no server-side proxy route required. This lets AWS
 * service tools follow the same declarative `ToolConfig` shape as every other integration: the
 * tool's `request.headers(params)` calls `signAwsV4(...)` over the exact body the executor will
 * send.
 *
 * Correctness is pinned by `sigv4.test.ts` against AWS's official "get-vanilla" test-suite vector.
 *
 * Note on the Host header: `host` is included in the signed headers but NOT returned — `fetch` sets
 * Host automatically from the URL, and AWS verifies against that value. The signed payload hash
 * covers body integrity, so `x-amz-content-sha256` is returned but left unsigned (fine for the JSON
 * and query protocol services here; S3 is handled separately by tools/s3).
 */

function getSignatureKey(key: string, dateStamp: string, region: string, service: string): Buffer {
  const kDate = crypto.createHmac('sha256', `AWS4${key}`).update(dateStamp).digest()
  const kRegion = crypto.createHmac('sha256', kDate).update(region).digest()
  const kService = crypto.createHmac('sha256', kRegion).update(service).digest()
  return crypto.createHmac('sha256', kService).update('aws4_request').digest()
}

/** RFC 3986 percent-encoding (AWS requires `!'()*` encoded, which encodeURIComponent leaves alone). */
function encodeRfc3986(str: string): string {
  return encodeURIComponent(str).replace(
    /[!'()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`
  )
}

export interface AwsSignParams {
  method: string
  /** Full request URL including any query string. */
  url: string
  region: string
  /** AWS service name used in the credential scope (e.g. 'sqs', 'ses', 'textract'). */
  service: string
  accessKeyId: string
  secretAccessKey: string
  sessionToken?: string
  /** Exact request body bytes that will be sent (string). Empty for GET. */
  body?: string
  /** Extra headers to sign + send (e.g. Content-Type, X-Amz-Target). */
  headers?: Record<string, string>
  /** Override the request timestamp (YYYYMMDDTHHMMSSZ) — for deterministic tests only. */
  amzDate?: string
}

/** Returns the headers to attach to the request (Authorization + the x-amz-* headers). */
export function signAwsV4(p: AwsSignParams): Record<string, string> {
  const url = new URL(p.url)
  const body = p.body ?? ''
  const amzDate = p.amzDate ?? new Date().toISOString().replace(/[:-]|\.\d{3}/g, '')
  const dateStamp = amzDate.slice(0, 8)

  const payloadHash = crypto.createHash('sha256').update(body, 'utf8').digest('hex')

  // Headers that participate in the signature: host + x-amz-date + caller-supplied extras.
  const signedHeaderMap: Record<string, string> = { host: url.host, 'x-amz-date': amzDate }
  for (const [k, v] of Object.entries(p.headers ?? {})) {
    signedHeaderMap[k.toLowerCase()] = String(v).trim().replace(/\s+/g, ' ')
  }
  if (p.sessionToken) signedHeaderMap['x-amz-security-token'] = p.sessionToken

  const sortedNames = Object.keys(signedHeaderMap).sort()
  const canonicalHeaders = sortedNames.map((n) => `${n}:${signedHeaderMap[n]}\n`).join('')
  const signedHeaders = sortedNames.join(';')

  const canonicalQueryString = [...url.searchParams.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : a[1] < b[1] ? -1 : 1))
    .map(([k, v]) => `${encodeRfc3986(k)}=${encodeRfc3986(v)}`)
    .join('&')

  const canonicalUri = url.pathname || '/'

  const canonicalRequest = [
    p.method.toUpperCase(),
    canonicalUri,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n')

  const algorithm = 'AWS4-HMAC-SHA256'
  const credentialScope = `${dateStamp}/${p.region}/${p.service}/aws4_request`
  const stringToSign = [
    algorithm,
    amzDate,
    credentialScope,
    crypto.createHash('sha256').update(canonicalRequest).digest('hex'),
  ].join('\n')

  const signingKey = getSignatureKey(p.secretAccessKey, dateStamp, p.region, p.service)
  const signature = crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex')

  const authorization = `${algorithm} Credential=${p.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

  return {
    ...(p.headers ?? {}),
    'X-Amz-Date': amzDate,
    'X-Amz-Content-Sha256': payloadHash,
    ...(p.sessionToken ? { 'X-Amz-Security-Token': p.sessionToken } : {}),
    Authorization: authorization,
  }
}

/**
 * Signed headers for an AWS JSON-protocol (AWS_JSON_1.0/1.1) request — SQS, Textract, Secrets
 * Manager, AppConfig Data, etc. The default host is `{service}.{region}.amazonaws.com`. Pass the
 * SAME `body` string here that the tool's `request.body` will serialize, so the signature matches.
 */
export function awsJsonHeaders(opts: {
  region: string
  service: string
  target: string
  accessKeyId: string
  secretAccessKey: string
  sessionToken?: string
  body: string
  jsonVersion?: '1.0' | '1.1'
  host?: string
}): Record<string, string> {
  const host = opts.host ?? `${opts.service}.${opts.region}.amazonaws.com`
  return signAwsV4({
    method: 'POST',
    url: `https://${host}/`,
    region: opts.region,
    service: opts.service,
    accessKeyId: opts.accessKeyId,
    secretAccessKey: opts.secretAccessKey,
    sessionToken: opts.sessionToken,
    headers: {
      'Content-Type': `application/x-amz-json-${opts.jsonVersion ?? '1.0'}`,
      'X-Amz-Target': opts.target,
    },
    body: opts.body,
  })
}

/**
 * Signed headers for an AWS "query protocol" request (IAM, STS, classic SES, SQS query API): the
 * params go in a form-urlencoded body with `Action`/`Version`. Pass the SAME form string the tool
 * sends as `body`.
 */
export function awsQueryHeaders(opts: {
  region: string
  service: string
  accessKeyId: string
  secretAccessKey: string
  sessionToken?: string
  body: string
  host?: string
}): Record<string, string> {
  const host = opts.host ?? `${opts.service}.${opts.region}.amazonaws.com`
  return signAwsV4({
    method: 'POST',
    url: `https://${host}/`,
    region: opts.region,
    service: opts.service,
    accessKeyId: opts.accessKeyId,
    secretAccessKey: opts.secretAccessKey,
    sessionToken: opts.sessionToken,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: opts.body,
  })
}
