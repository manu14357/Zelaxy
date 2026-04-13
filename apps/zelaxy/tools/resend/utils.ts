/**
 * Validation helpers for Resend tool
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateApiKey(apiKey: string | undefined | null): string[] {
  const errors: string[] = []
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
    errors.push('Resend API key is required')
  } else if (!apiKey.startsWith('re_')) {
    errors.push('Invalid Resend API key format (should start with re_)')
  }
  return errors
}

export function validateEmailAddress(email: string): boolean {
  return EMAIL_REGEX.test(email.trim())
}

export function validateEmailList(emails: string): string[] {
  const errors: string[] = []
  const addresses = emails
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean)
  if (addresses.length === 0) {
    errors.push('At least one email address is required')
    return errors
  }
  if (addresses.length > 50) {
    errors.push('Maximum 50 recipients allowed')
    return errors
  }
  for (const addr of addresses) {
    // Strip friendly name format: "Name <email>"
    const match = addr.match(/<([^>]+)>/)
    const emailOnly = match ? match[1] : addr
    if (!validateEmailAddress(emailOnly)) {
      errors.push(`Invalid email address: ${addr}`)
    }
  }
  return errors
}

export function validateSendParams(params: {
  from?: string
  to?: string
  subject?: string
  html?: string
  text?: string
}): string[] {
  const errors: string[] = []

  if (!params.from || typeof params.from !== 'string' || params.from.trim().length === 0) {
    errors.push('From address is required')
  } else {
    const match = params.from.match(/<([^>]+)>/)
    const emailOnly = match ? match[1] : params.from
    if (!validateEmailAddress(emailOnly)) {
      errors.push('Invalid from email address')
    }
  }

  if (!params.to || typeof params.to !== 'string' || params.to.trim().length === 0) {
    errors.push('To address is required')
  } else {
    const toErrors = validateEmailList(params.to)
    errors.push(...toErrors)
  }

  if (!params.subject || typeof params.subject !== 'string' || params.subject.trim().length === 0) {
    errors.push('Subject is required')
  }

  if (
    (!params.html || params.html.trim().length === 0) &&
    (!params.text || params.text.trim().length === 0)
  ) {
    errors.push('Either html or text content is required')
  }

  return errors
}

export function parseJsonSafe(jsonString: string | undefined, fallback: any = undefined): any {
  if (!jsonString || jsonString.trim().length === 0) return fallback
  try {
    return JSON.parse(jsonString)
  } catch {
    return fallback
  }
}
