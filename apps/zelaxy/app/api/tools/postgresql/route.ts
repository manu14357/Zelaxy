import { type NextRequest, NextResponse } from 'next/server'
import { PostgreSQLDatabase } from '@/tools/postgresql/database'
import type { PostgreSQLQueryParams, PostgreSQLResponse } from '@/tools/postgresql/types'
import { validateConnectionParams, validateQuery } from '@/tools/postgresql/utils'

function createConnectionConfig(params: PostgreSQLQueryParams) {
  return {
    host: params.host,
    database: params.database,
    user: params.username,
    password: params.password || '',
    port: params.port ? Number.parseInt(params.port.toString(), 10) : 5432,
    ssl: params.ssl,
  }
}

export async function POST(request: NextRequest) {
  try {
    const params: PostgreSQLQueryParams = await request.json()

    // Validate connection parameters
    const connectionErrors = validateConnectionParams(params)
    if (connectionErrors.length > 0) {
      return NextResponse.json({
        success: true,
        output: {
          data: [
            {
              error: true,
              errorType: 'VALIDATION_ERROR',
              message: `Connection validation failed: ${connectionErrors.join(', ')}`,
              timestamp: new Date().toISOString(),
            },
          ],
        },
      })
    }

    let result: PostgreSQLResponse

    switch (params.action) {
      case 'execute':
        result = await handleExecuteQuery(params)
        break
      case 'insert':
        result = await handleInsert(params)
        break
      case 'update':
        result = await handleUpdate(params)
        break
      case 'delete':
        result = await handleDelete(params)
        break
      default:
        result = {
          success: true,
          output: {
            data: [
              {
                error: true,
                errorType: 'UNSUPPORTED_ACTION_ERROR',
                message: `Unsupported action: ${params.action}`,
                timestamp: new Date().toISOString(),
              },
            ],
          },
        }
    }

    return NextResponse.json(result)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json({
      success: true,
      output: {
        data: [
          {
            error: true,
            errorType: 'UNKNOWN_ERROR',
            message: errorMessage,
            timestamp: new Date().toISOString(),
          },
        ],
      },
    })
  }
}

async function handleExecuteQuery(params: PostgreSQLQueryParams): Promise<PostgreSQLResponse> {
  if (!params.query) {
    return {
      success: true,
      output: {
        data: [
          {
            error: true,
            errorType: 'VALIDATION_ERROR',
            message: 'Query is required for execute action',
            timestamp: new Date().toISOString(),
          },
        ],
      },
    }
  }

  const queryErrors = validateQuery(params.query)
  if (queryErrors.length > 0) {
    return {
      success: true,
      output: {
        data: [
          {
            error: true,
            errorType: 'QUERY_VALIDATION_ERROR',
            message: queryErrors.join(', '),
            timestamp: new Date().toISOString(),
          },
        ],
      },
    }
  }

  const config = createConnectionConfig(params)
  return await PostgreSQLDatabase.executeQuery(config, params.query)
}

async function handleInsert(params: PostgreSQLQueryParams): Promise<PostgreSQLResponse> {
  if (!params.table || !params.data) {
    return {
      success: true,
      output: {
        data: [
          {
            error: true,
            errorType: 'VALIDATION_ERROR',
            message: 'Table and data are required for insert action',
            timestamp: new Date().toISOString(),
          },
        ],
      },
    }
  }

  const config = createConnectionConfig(params)
  return await PostgreSQLDatabase.insertData(config, params.table, params.data)
}

async function handleUpdate(params: PostgreSQLQueryParams): Promise<PostgreSQLResponse> {
  if (!params.table || !params.data || !params.conditions) {
    return {
      success: true,
      output: {
        data: [
          {
            error: true,
            errorType: 'VALIDATION_ERROR',
            message: 'Table, data, and conditions are required for update action',
            timestamp: new Date().toISOString(),
          },
        ],
      },
    }
  }

  const config = createConnectionConfig(params)
  return await PostgreSQLDatabase.updateData(config, params.table, params.data, params.conditions)
}

async function handleDelete(params: PostgreSQLQueryParams): Promise<PostgreSQLResponse> {
  if (!params.table || !params.conditions) {
    return {
      success: true,
      output: {
        data: [
          {
            error: true,
            errorType: 'VALIDATION_ERROR',
            message: 'Table and conditions are required for delete action',
            timestamp: new Date().toISOString(),
          },
        ],
      },
    }
  }

  const config = createConnectionConfig(params)
  return await PostgreSQLDatabase.deleteData(config, params.table, params.conditions)
}
