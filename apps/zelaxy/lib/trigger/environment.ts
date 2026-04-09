import type { NextRequest } from 'next/server'
import { env } from '@/lib/env'

type TriggerKeyType = 'prod' | 'dev' | 'missing' | 'unknown'

function getTriggerKeyType(secretKey?: string): TriggerKeyType {
  if (!secretKey) return 'missing'
  if (secretKey.startsWith('tr_prod_')) return 'prod'
  if (secretKey.startsWith('tr_dev_')) return 'dev'
  return 'unknown'
}

export function getTriggerEnvironmentDiagnostics(request?: NextRequest) {
  const secretKey = process.env.TRIGGER_SECRET_KEY
  const keyType = getTriggerKeyType(secretKey)

  return {
    keyType,
    vercelEnv: env.VERCEL_ENV || process.env.VERCEL_ENV || 'unknown',
    nodeEnv: env.NODE_ENV || process.env.NODE_ENV || 'unknown',
    deploymentUrl: request?.headers.get('x-vercel-deployment-url') || 'unknown',
    requestHost: request?.headers.get('host') || 'unknown',
  }
}

export function assertValidTriggerEnvironmentForProduction(request?: NextRequest) {
  const diagnostics = getTriggerEnvironmentDiagnostics(request)

  if (diagnostics.vercelEnv === 'production' && diagnostics.keyType !== 'prod') {
    throw new Error(
      `Invalid Trigger.dev configuration for production: expected a tr_prod_ key but found ${diagnostics.keyType}. deployment=${diagnostics.deploymentUrl}`
    )
  }

  return diagnostics
}
