import { and, eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { addWebhookJob } from '@/lib/bullmq/producer'
import { createLogger } from '@/lib/logs/console/logger'
import {
  getExternalRequestUrl,
  handleSlackChallenge,
  handleWhatsAppVerification,
  handleZoomUrlValidation,
  validateAshbySignature,
  validateCalcomSignature,
  validateCalendlySignature,
  validateGitLabToken,
  validateGreenhouseSignature,
  validateMicrosoftTeamsSignature,
  validatePagerDutySignature,
  validateRootlySignature,
  validateSentrySignature,
  validateSharedSecretHeader,
  validateSvixSignature,
  validateTwilioSignature,
  validateTypeformSignature,
  validateVercelSignature,
  validateZoomSignature,
  verifyProviderWebhook,
} from '@/lib/webhooks/utils'
import { db } from '@/db'
import { subscription, webhook, workflow } from '@/db/schema'
import { RateLimiter } from '@/services/queue'
import type { SubscriptionPlan } from '@/services/queue/types'

const logger = createLogger('WebhookTriggerAPI')

export const dynamic = 'force-dynamic'
export const maxDuration = 300

/**
 * Webhook Verification Handler (GET)
 *
 * Handles verification requests from webhook providers and confirms endpoint exists.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string }> }) {
  const requestId = crypto.randomUUID().slice(0, 8)

  try {
    const path = (await params).path
    const url = new URL(request.url)

    // Handle WhatsApp specific verification challenge
    const mode = url.searchParams.get('hub.mode')
    const token = url.searchParams.get('hub.verify_token')
    const challenge = url.searchParams.get('hub.challenge')

    const whatsAppResponse = await handleWhatsAppVerification(
      requestId,
      path,
      mode,
      token,
      challenge
    )
    if (whatsAppResponse) {
      return whatsAppResponse
    }

    // Verify webhook exists in database
    const webhooks = await db
      .select({
        webhook: webhook,
      })
      .from(webhook)
      .where(and(eq(webhook.path, path), eq(webhook.isActive, true)))
      .limit(1)

    if (webhooks.length === 0) {
      logger.warn(`[${requestId}] No active webhook found for path: ${path}`)
      return new NextResponse('Webhook not found', { status: 404 })
    }

    logger.info(`[${requestId}] Webhook verification successful for path: ${path}`)
    return new NextResponse('OK', { status: 200 })
  } catch (error: any) {
    logger.error(`[${requestId}] Error processing webhook verification`, error)
    return new NextResponse(`Internal Server Error: ${error.message}`, {
      status: 500,
    })
  }
}

/**
 * Webhook Payload Handler (POST)
 *
 * Processes incoming webhook payloads from all supported providers.
 * Fast acknowledgment with async processing for most providers except Airtable.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string }> }
) {
  const requestId = crypto.randomUUID().slice(0, 8)
  let foundWorkflow: any = null
  let foundWebhook: any = null

  // --- PHASE 1: Request validation and parsing ---
  let rawBody: string | null = null
  try {
    const requestClone = request.clone()
    rawBody = await requestClone.text()

    if (!rawBody || rawBody.length === 0) {
      logger.warn(`[${requestId}] Rejecting request with empty body`)
      return new NextResponse('Empty request body', { status: 400 })
    }
  } catch (bodyError) {
    logger.error(`[${requestId}] Failed to read request body`, {
      error: bodyError instanceof Error ? bodyError.message : String(bodyError),
    })
    return new NextResponse('Failed to read request body', { status: 400 })
  }

  // Parse the body - handle both JSON and form-encoded payloads
  let body: any
  try {
    // Check content type to handle both JSON and form-encoded payloads
    const contentType = request.headers.get('content-type') || ''

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = new URLSearchParams(rawBody)
      const payloadString = formData.get('payload')

      if (payloadString) {
        // GitHub nests JSON inside a 'payload' field
        body = JSON.parse(payloadString)
        logger.debug(`[${requestId}] Parsed form-encoded GitHub webhook payload`)
      } else {
        // Twilio and others send the fields directly rather than nesting JSON. Treating a missing
        // 'payload' field as an error would reject those webhooks outright.
        body = Object.fromEntries(formData.entries())
        logger.debug(`[${requestId}] Parsed form-encoded webhook fields`)
      }
    } else {
      // Default to JSON parsing
      body = JSON.parse(rawBody)
      logger.debug(`[${requestId}] Parsed JSON webhook payload`)
    }

    if (Object.keys(body).length === 0) {
      logger.warn(`[${requestId}] Rejecting empty JSON object`)
      return new NextResponse('Empty JSON payload', { status: 400 })
    }
  } catch (parseError) {
    logger.error(`[${requestId}] Failed to parse webhook body`, {
      error: parseError instanceof Error ? parseError.message : String(parseError),
      contentType: request.headers.get('content-type'),
      bodyPreview: `${rawBody?.slice(0, 100)}...`,
    })
    return new NextResponse('Invalid payload format', { status: 400 })
  }

  // Handle Slack challenge
  const slackResponse = handleSlackChallenge(body)
  if (slackResponse) {
    return slackResponse
  }

  // --- PHASE 2: Webhook identification ---
  const path = (await params).path
  logger.info(`[${requestId}] Processing webhook request for path: ${path}`)

  // Find webhook and associated workflow
  const webhooks = await db
    .select({
      webhook: webhook,
      workflow: workflow,
    })
    .from(webhook)
    .innerJoin(workflow, eq(webhook.workflowId, workflow.id))
    .where(and(eq(webhook.path, path), eq(webhook.isActive, true)))
    .limit(1)

  if (webhooks.length === 0) {
    logger.warn(`[${requestId}] No active webhook found for path: ${path}`)
    return new NextResponse('Webhook not found', { status: 404 })
  }

  foundWebhook = webhooks[0].webhook
  foundWorkflow = webhooks[0].workflow

  // Handle Microsoft Teams signature verification if needed
  if (foundWebhook.provider === 'microsoftteams') {
    const providerConfig = (foundWebhook.providerConfig as Record<string, any>) || {}

    if (providerConfig.hmacSecret) {
      const authHeader = request.headers.get('authorization')

      if (!authHeader || !authHeader.startsWith('HMAC ')) {
        logger.warn(
          `[${requestId}] Microsoft Teams outgoing webhook missing HMAC authorization header`
        )
        return new NextResponse('Unauthorized - Missing HMAC signature', { status: 401 })
      }

      const isValidSignature = validateMicrosoftTeamsSignature(
        providerConfig.hmacSecret,
        authHeader,
        rawBody
      )

      if (!isValidSignature) {
        logger.warn(`[${requestId}] Microsoft Teams HMAC signature verification failed`)
        return new NextResponse('Unauthorized - Invalid HMAC signature', { status: 401 })
      }

      logger.debug(`[${requestId}] Microsoft Teams HMAC signature verified successfully`)
    }
  }

  // Handle GitLab secret token verification if needed
  if (foundWebhook.provider === 'gitlab') {
    const providerConfig = (foundWebhook.providerConfig as Record<string, any>) || {}

    if (providerConfig.secretToken) {
      const isValidToken = validateGitLabToken(
        providerConfig.secretToken,
        request.headers.get('x-gitlab-token')
      )

      if (!isValidToken) {
        logger.warn(`[${requestId}] GitLab webhook token verification failed`)
        return new NextResponse('Unauthorized - Invalid secret token', { status: 401 })
      }

      logger.debug(`[${requestId}] GitLab secret token verified successfully`)
    }
  }

  // Handle Typeform signature verification if needed
  if (foundWebhook.provider === 'typeform') {
    const providerConfig = (foundWebhook.providerConfig as Record<string, any>) || {}

    if (providerConfig.webhookSecret) {
      const isValidSignature = validateTypeformSignature(
        providerConfig.webhookSecret,
        request.headers.get('typeform-signature'),
        rawBody
      )

      if (!isValidSignature) {
        logger.warn(`[${requestId}] Typeform signature verification failed`)
        return new NextResponse('Unauthorized - Invalid signature', { status: 401 })
      }

      logger.debug(`[${requestId}] Typeform signature verified successfully`)
    }
  }

  // Zoom validates the endpoint by POSTing a challenge before it will enable the webhook, so this
  // must answer before any signature check (the challenge is not signed the same way).
  if (foundWebhook.provider === 'zoom') {
    const providerConfig = (foundWebhook.providerConfig as Record<string, any>) || {}
    const zoomValidation = handleZoomUrlValidation(body, providerConfig.secretToken)

    if (zoomValidation) {
      logger.info(`[${requestId}] Answered Zoom endpoint URL validation challenge`)
      return zoomValidation
    }
  }

  // Signature verification for providers that sign the raw body. Each entry maps the configured
  // secret to the header the provider signs with; a configured secret that fails to match is a 401.
  const signatureChecks: Record<
    string,
    { secretKey: string; header: string; validate: (s: string, sig: string | null) => boolean }
  > = {
    sentry: {
      secretKey: 'clientSecret',
      header: 'sentry-hook-signature',
      validate: (s, sig) => validateSentrySignature(s, sig, rawBody as string),
    },
    calendly: {
      secretKey: 'signingKey',
      header: 'calendly-webhook-signature',
      validate: (s, sig) => validateCalendlySignature(s, sig, rawBody as string),
    },
    pagerduty: {
      secretKey: 'webhookSecret',
      header: 'x-pagerduty-signature',
      validate: (s, sig) => validatePagerDutySignature(s, sig, rawBody as string),
    },
    vercel: {
      secretKey: 'webhookSecret',
      header: 'x-vercel-signature',
      validate: (s, sig) => validateVercelSignature(s, sig, rawBody as string),
    },
    twilio: {
      secretKey: 'authToken',
      header: 'x-twilio-signature',
      validate: (s, sig) =>
        validateTwilioSignature(
          s,
          sig,
          getExternalRequestUrl(request),
          body as Record<string, string>
        ),
    },
    twilio_voice: {
      secretKey: 'authToken',
      header: 'x-twilio-signature',
      validate: (s, sig) =>
        validateTwilioSignature(
          s,
          sig,
          getExternalRequestUrl(request),
          body as Record<string, string>
        ),
    },
    greenhouse: {
      secretKey: 'secretKey',
      header: 'signature',
      validate: (s, sig) => validateGreenhouseSignature(s, sig, rawBody as string),
    },
    ashby: {
      secretKey: 'secretToken',
      header: 'ashby-signature',
      validate: (s, sig) => validateAshbySignature(s, sig, rawBody as string),
    },
    rootly: {
      secretKey: 'signingSecret',
      header: 'x-rootly-signature',
      validate: (s, sig) => validateRootlySignature(s, sig, rawBody as string),
    },
    // incident.io signs with Svix, same as Clerk and Resend
    incidentio: {
      secretKey: 'signingSecret',
      header: 'svix-signature',
      validate: (s, sig) =>
        validateSvixSignature(
          s,
          request.headers.get('svix-id'),
          request.headers.get('svix-timestamp'),
          sig,
          rawBody as string
        ),
    },
    // These providers do not sign the body — they echo back a value configured on their side
    gong: {
      secretKey: 'authToken',
      header: 'authorization',
      validate: (s, sig) => validateSharedSecretHeader(s, sig),
    },
    revenuecat: {
      secretKey: 'authHeader',
      header: 'authorization',
      validate: (s, sig) => validateSharedSecretHeader(s, sig),
    },
    circleback: {
      secretKey: 'webhookSecret',
      header: 'authorization',
      validate: (s, sig) => validateSharedSecretHeader(s, sig),
    },
    emailbison: {
      secretKey: 'webhookToken',
      header: 'authorization',
      validate: (s, sig) => validateSharedSecretHeader(s, sig),
    },
    calcom: {
      secretKey: 'webhookSecret',
      header: 'x-cal-signature-256',
      validate: (s, sig) => validateCalcomSignature(s, sig, rawBody as string),
    },
    zoom: {
      secretKey: 'secretToken',
      header: 'x-zm-signature',
      validate: (s, sig) =>
        validateZoomSignature(
          s,
          sig,
          request.headers.get('x-zm-request-timestamp'),
          rawBody as string
        ),
    },
    // Clerk and Resend are both Svix-signed, so they share one validator
    clerk: {
      secretKey: 'signingSecret',
      header: 'svix-signature',
      validate: (s, sig) =>
        validateSvixSignature(
          s,
          request.headers.get('svix-id'),
          request.headers.get('svix-timestamp'),
          sig,
          rawBody as string
        ),
    },
    resend: {
      secretKey: 'signingSecret',
      header: 'svix-signature',
      validate: (s, sig) =>
        validateSvixSignature(
          s,
          request.headers.get('svix-id'),
          request.headers.get('svix-timestamp'),
          sig,
          rawBody as string
        ),
    },
  }

  const signatureCheck = signatureChecks[foundWebhook.provider as string]
  if (signatureCheck) {
    const providerConfig = (foundWebhook.providerConfig as Record<string, any>) || {}
    const secret = providerConfig[signatureCheck.secretKey]

    if (secret) {
      if (!signatureCheck.validate(secret, request.headers.get(signatureCheck.header))) {
        logger.warn(`[${requestId}] ${foundWebhook.provider} signature verification failed`)
        return new NextResponse('Unauthorized - Invalid signature', { status: 401 })
      }

      logger.debug(`[${requestId}] ${foundWebhook.provider} signature verified successfully`)
    }
  }

  // Provider-specific authentication (generic bearer token / custom header / IP allowlist,
  // Gmail secret header). This must run before the payload is queued for execution — without
  // it, a caller who knows the webhook path can trigger the workflow unauthenticated.
  const providerAuthError = verifyProviderWebhook(foundWebhook, request, requestId)
  if (providerAuthError) {
    return providerAuthError
  }

  // --- PHASE 3: Rate limiting for webhook execution ---
  try {
    // Get user subscription for rate limiting
    const [subscriptionRecord] = await db
      .select({ plan: subscription.plan })
      .from(subscription)
      .where(eq(subscription.referenceId, foundWorkflow.userId))
      .limit(1)

    const subscriptionPlan = (subscriptionRecord?.plan || 'free') as SubscriptionPlan

    // Check async rate limits (webhooks are processed asynchronously)
    const rateLimiter = new RateLimiter()
    const rateLimitCheck = await rateLimiter.checkRateLimit(
      foundWorkflow.userId,
      subscriptionPlan,
      'webhook',
      true // isAsync = true for webhook execution
    )

    if (!rateLimitCheck.allowed) {
      logger.warn(`[${requestId}] Rate limit exceeded for webhook user ${foundWorkflow.userId}`, {
        provider: foundWebhook.provider,
        remaining: rateLimitCheck.remaining,
        resetAt: rateLimitCheck.resetAt,
      })

      // Return 200 to prevent webhook provider retries, but indicate rate limit
      if (foundWebhook.provider === 'microsoftteams') {
        // Microsoft Teams requires specific response format
        return NextResponse.json({
          type: 'message',
          text: 'Rate limit exceeded. Please try again later.',
        })
      }

      // Simple error response for other providers (return 200 to prevent retries)
      return NextResponse.json({ message: 'Rate limit exceeded' }, { status: 200 })
    }

    logger.debug(`[${requestId}] Rate limit check passed for webhook`, {
      provider: foundWebhook.provider,
      remaining: rateLimitCheck.remaining,
      resetAt: rateLimitCheck.resetAt,
    })
  } catch (rateLimitError) {
    logger.error(`[${requestId}] Error checking webhook rate limits:`, rateLimitError)
    // Continue processing - better to risk rate limit bypass than fail webhook
  }

  // --- PHASE 4: Queue webhook execution via BullMQ ---
  try {
    const { jobId } = await addWebhookJob({
      webhookId: foundWebhook.id,
      workflowId: foundWorkflow.id,
      userId: foundWorkflow.userId,
      provider: foundWebhook.provider,
      body,
      headers: Object.fromEntries(request.headers.entries()),
      path,
      blockId: foundWebhook.blockId,
    })

    logger.info(`[${requestId}] Queued webhook job ${jobId} for ${foundWebhook.provider} webhook`)

    // Return immediate acknowledgment with provider-specific format
    if (foundWebhook.provider === 'microsoftteams') {
      // Microsoft Teams requires specific response format
      return NextResponse.json({
        type: 'message',
        text: 'Zelaxy',
      })
    }

    return NextResponse.json({ message: 'Webhook processed' })
  } catch (error: any) {
    logger.error(`[${requestId}] Failed to queue webhook execution:`, error)

    // Still return 200 to prevent webhook provider retries
    if (foundWebhook.provider === 'microsoftteams') {
      // Microsoft Teams requires specific response format
      return NextResponse.json({
        type: 'message',
        text: 'Webhook processing failed',
      })
    }

    return NextResponse.json({ message: 'Internal server error' }, { status: 200 })
  }
}
