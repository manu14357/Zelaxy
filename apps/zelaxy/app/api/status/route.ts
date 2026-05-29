import { NextResponse } from 'next/server'
import { createLogger } from '@/lib/logs/console/logger'
import { db } from '@/db'
import type { IncidentIOWidgetResponse, StatusResponse, StatusType } from './types'

export const dynamic = 'force-dynamic'

const logger = createLogger('StatusAPI')

let cachedResponse: { data: StatusResponse; timestamp: number } | null = null
const CACHE_TTL = 2 * 60 * 1000 // 2 minutes

function determineStatus(data: IncidentIOWidgetResponse): { status: StatusType; message: string } {
  if (data.ongoing_incidents?.length > 0) {
    const worstImpact = data.ongoing_incidents[0].current_worst_impact
    if (worstImpact === 'full_outage') return { status: 'outage', message: 'Service Disruption' }
    return { status: 'degraded', message: 'Experiencing Issues' }
  }
  if (data.in_progress_maintenances?.length > 0) {
    return { status: 'maintenance', message: 'Under Maintenance' }
  }
  return { status: 'operational', message: 'All Systems Operational' }
}

async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await db.execute('SELECT 1')
    return true
  } catch {
    return false
  }
}

export async function GET() {
  try {
    const now = Date.now()

    if (cachedResponse && now - cachedResponse.timestamp < CACHE_TTL) {
      return NextResponse.json(cachedResponse.data, {
        headers: {
          'Cache-Control': 'public, max-age=60, s-maxage=60',
          'X-Cache': 'HIT',
        },
      })
    }

    // Check internal database health
    const dbHealthy = await checkDatabaseHealth()

    let statusResponse: StatusResponse

    if (!dbHealthy) {
      statusResponse = {
        status: 'degraded',
        message: 'Database Connectivity Issue',
        url: 'https://zelaxy.com/status',
        lastUpdated: new Date().toISOString(),
      }
    } else {
      statusResponse = {
        status: 'operational',
        message: 'All Systems Operational',
        url: 'https://zelaxy.com/status',
        lastUpdated: new Date().toISOString(),
      }
    }

    cachedResponse = { data: statusResponse, timestamp: now }

    return NextResponse.json(statusResponse, {
      headers: {
        'Cache-Control': 'public, max-age=60, s-maxage=60',
        'X-Cache': 'MISS',
      },
    })
  } catch (error) {
    logger.error('Error checking platform status:', error)
    const errorResponse: StatusResponse = {
      status: 'error',
      message: 'Status Unknown',
      url: 'https://zelaxy.com/status',
      lastUpdated: new Date().toISOString(),
    }
    return NextResponse.json(errorResponse, {
      status: 200,
      headers: { 'Cache-Control': 'public, max-age=30, s-maxage=30' },
    })
  }
}
