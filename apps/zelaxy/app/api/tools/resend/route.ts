import { type NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import type { ResendResponse } from '@/tools/resend/types'
import { parseJsonSafe, validateApiKey, validateSendParams } from '@/tools/resend/utils'

export async function POST(request: NextRequest) {
  try {
    const params = await request.json()
    const { action, apiKey, ...rest } = params

    // Validate API key
    const apiKeyErrors = validateApiKey(apiKey)
    if (apiKeyErrors.length > 0) {
      return NextResponse.json({
        success: true,
        output: {
          error: `API key validation failed: ${apiKeyErrors.join(', ')}`,
          status: 'validation_error',
        },
      } satisfies ResendResponse)
    }

    const resend = new Resend(apiKey)

    switch (action) {
      case 'send':
        return await handleSend(resend, rest)
      case 'batch':
        return await handleBatch(resend, rest)
      case 'get':
        return await handleGet(resend, rest)
      case 'cancel':
        return await handleCancel(resend, rest)
      default:
        return NextResponse.json({
          success: true,
          output: {
            error: `Unsupported action: ${action}`,
            status: 'error',
          },
        } satisfies ResendResponse)
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json({
      success: true,
      output: {
        error: errorMessage,
        status: 'error',
      },
    } satisfies ResendResponse)
  }
}

async function handleSend(
  resend: InstanceType<typeof Resend>,
  params: Record<string, any>
): Promise<NextResponse> {
  // Validate send params
  const validationErrors = validateSendParams({
    from: params.from,
    to: params.to,
    subject: params.subject,
    html: params.html,
    text: params.text,
  })
  if (validationErrors.length > 0) {
    return NextResponse.json({
      success: true,
      output: {
        error: `Validation failed: ${validationErrors.join(', ')}`,
        status: 'validation_error',
      },
    } satisfies ResendResponse)
  }

  // Build send options
  const toAddresses = params.to
    .split(',')
    .map((e: string) => e.trim())
    .filter(Boolean)

  const sendOptions: any = {
    from: params.from,
    to: toAddresses,
    subject: params.subject,
  }

  // Content — html or text (at least one required, validated above)
  if (params.html) sendOptions.html = params.html
  if (params.text) sendOptions.text = params.text

  // Optional fields
  if (params.cc) {
    sendOptions.cc = params.cc
      .split(',')
      .map((e: string) => e.trim())
      .filter(Boolean)
  }
  if (params.bcc) {
    sendOptions.bcc = params.bcc
      .split(',')
      .map((e: string) => e.trim())
      .filter(Boolean)
  }
  if (params.replyTo) {
    const replyTos = params.replyTo
      .split(',')
      .map((e: string) => e.trim())
      .filter(Boolean)
    sendOptions.replyTo = replyTos.length === 1 ? replyTos[0] : replyTos
  }
  if (params.scheduledAt) {
    sendOptions.scheduledAt = params.scheduledAt
  }

  // JSON-based optional fields
  const headers = parseJsonSafe(params.headers)
  if (headers) sendOptions.headers = headers

  const tags = parseJsonSafe(params.tags)
  if (tags && Array.isArray(tags)) sendOptions.tags = tags

  const attachments = parseJsonSafe(params.attachments)
  if (attachments && Array.isArray(attachments)) sendOptions.attachments = attachments

  const { data, error } = await resend.emails.send(sendOptions as any)

  if (error) {
    return NextResponse.json({
      success: true,
      output: {
        error: `${error.name}: ${error.message}`,
        status: 'send_error',
      },
    } satisfies ResendResponse)
  }

  return NextResponse.json({
    success: true,
    output: {
      id: data?.id || '',
      status: 'sent',
    },
  } satisfies ResendResponse)
}

async function handleBatch(
  resend: InstanceType<typeof Resend>,
  params: Record<string, any>
): Promise<NextResponse> {
  const emails = parseJsonSafe(params.emails)
  if (!emails || !Array.isArray(emails) || emails.length === 0) {
    return NextResponse.json({
      success: true,
      output: {
        error: 'Emails parameter must be a valid JSON array of email objects',
        status: 'validation_error',
      },
    } satisfies ResendResponse)
  }

  // Transform to arrays
  const emailsFormatted = emails.map((email: any) => ({
    ...email,
    to: Array.isArray(email.to)
      ? email.to
      : email.to
          .split(',')
          .map((e: string) => e.trim())
          .filter(Boolean),
  }))

  const { data, error } = await resend.batch.send(emailsFormatted)

  if (error) {
    return NextResponse.json({
      success: true,
      output: {
        error: `${error.name}: ${error.message}`,
        status: 'batch_error',
      },
    } satisfies ResendResponse)
  }

  return NextResponse.json({
    success: true,
    output: {
      ids: data?.data?.map((d: any) => d.id) || [],
      status: 'batch_sent',
    },
  } satisfies ResendResponse)
}

async function handleGet(
  resend: InstanceType<typeof Resend>,
  params: Record<string, any>
): Promise<NextResponse> {
  if (!params.emailId || typeof params.emailId !== 'string') {
    return NextResponse.json({
      success: true,
      output: {
        error: 'Email ID is required',
        status: 'validation_error',
      },
    } satisfies ResendResponse)
  }

  const { data, error } = await resend.emails.get(params.emailId)

  if (error) {
    return NextResponse.json({
      success: true,
      output: {
        error: `${error.name}: ${error.message}`,
        status: 'get_error',
      },
    } satisfies ResendResponse)
  }

  return NextResponse.json({
    success: true,
    output: {
      email: data || {},
      status: 'retrieved',
    },
  } satisfies ResendResponse)
}

async function handleCancel(
  resend: InstanceType<typeof Resend>,
  params: Record<string, any>
): Promise<NextResponse> {
  if (!params.emailId || typeof params.emailId !== 'string') {
    return NextResponse.json({
      success: true,
      output: {
        error: 'Email ID is required for cancellation',
        status: 'validation_error',
      },
    } satisfies ResendResponse)
  }

  const { data, error } = await resend.emails.cancel(params.emailId)

  if (error) {
    return NextResponse.json({
      success: true,
      output: {
        error: `${error.name}: ${error.message}`,
        status: 'cancel_error',
      },
    } satisfies ResendResponse)
  }

  return NextResponse.json({
    success: true,
    output: {
      id: params.emailId,
      status: 'cancelled',
    },
  } satisfies ResendResponse)
}
