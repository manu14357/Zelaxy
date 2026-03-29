import { type NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import type { SMTPResponse, SMTPSendParams } from '@/tools/smtp/types'

function validateParams(params: SMTPSendParams): string[] {
  const errors: string[] = []

  if (!params.host || typeof params.host !== 'string') {
    errors.push('SMTP host is required')
  }
  if (!params.username || typeof params.username !== 'string') {
    errors.push('SMTP username is required')
  }
  if (!params.password || typeof params.password !== 'string') {
    errors.push('SMTP password is required')
  }
  if (!params.to || typeof params.to !== 'string') {
    errors.push('Recipient (to) is required')
  }
  if (!params.subject || typeof params.subject !== 'string') {
    errors.push('Subject is required')
  }
  if (!params.body || typeof params.body !== 'string') {
    errors.push('Body is required')
  }

  return errors
}

export async function POST(request: NextRequest) {
  try {
    const params: SMTPSendParams = await request.json()

    // Validate required parameters
    const validationErrors = validateParams(params)
    if (validationErrors.length > 0) {
      return NextResponse.json({
        success: true, // Keep true so workflow continues
        output: {
          error: `Validation failed: ${validationErrors.join(', ')}`,
          status: 'validation_error',
        },
      } satisfies SMTPResponse)
    }

    // Build SMTP transport configuration
    const port = params.port ? Number(params.port) : 587
    const secure = params.secure ?? port === 465

    const transporter = nodemailer.createTransport({
      host: params.host,
      port,
      secure,
      auth: {
        user: params.username,
        pass: params.password,
      },
      // Connection timeout settings
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000,
      socketTimeout: 15000,
    })

    // Build sender address
    const fromAddress = params.from || params.username
    const from = params.fromName ? `"${params.fromName}" <${fromAddress}>` : fromAddress

    // Build email message
    const mailOptions: nodemailer.SendMailOptions = {
      from,
      to: params.to,
      subject: params.subject,
      replyTo: params.replyTo || undefined,
    }

    // Set body as HTML or plain text
    if (params.isHtml) {
      mailOptions.html = params.body
    } else {
      mailOptions.text = params.body
    }

    // Add CC and BCC if provided
    if (params.cc) {
      mailOptions.cc = params.cc
    }
    if (params.bcc) {
      mailOptions.bcc = params.bcc
    }

    // Send the email
    const info = await transporter.sendMail(mailOptions)

    const result: SMTPResponse = {
      success: true,
      output: {
        messageId: info.messageId || '',
        accepted: Array.isArray(info.accepted) ? info.accepted.map(String) : [],
        rejected: Array.isArray(info.rejected) ? info.rejected.map(String) : [],
        status: info.response || 'sent',
      },
    }

    return NextResponse.json(result)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

    // Provide helpful hints for common SMTP errors
    let hint = ''
    if (errorMessage.includes('ECONNREFUSED')) {
      hint = ' (Check your SMTP host and port settings)'
    } else if (errorMessage.includes('Invalid login') || errorMessage.includes('authentication')) {
      hint =
        ' (Check your username/password. For Gmail, use an App Password instead of your account password)'
    } else if (errorMessage.includes('ETIMEDOUT')) {
      hint =
        ' (Connection timed out. Check your SMTP host and port, and ensure the server is reachable)'
    } else if (
      errorMessage.includes('self-signed certificate') ||
      errorMessage.includes('certificate')
    ) {
      hint = ' (SSL/TLS certificate issue. Try toggling the Secure option or check your SMTP port)'
    }

    return NextResponse.json({
      success: true, // Keep true so workflow continues
      output: {
        error: `SMTP Error: ${errorMessage}${hint}`,
        status: 'error',
      },
    } satisfies SMTPResponse)
  }
}
