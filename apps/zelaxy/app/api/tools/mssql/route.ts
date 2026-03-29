import { type NextRequest, NextResponse } from 'next/server'
import { MSSQLDatabase } from '@/tools/mssql/database'
import type { MSSQLQueryParams, MSSQLResponse } from '@/tools/mssql/types'
import { MSSQLFileSystem, validateConnectionParams, validateQuery } from '@/tools/mssql/utils'

function createConnectionConfig(params: MSSQLQueryParams) {
  return {
    server: params.server,
    database: params.database,
    user: params.username,
    password: params.password,
    port: params.port ? Number.parseInt(params.port.toString(), 10) : 1433,
    options: {
      encrypt: params.encrypt,
      trustServerCertificate: params.trustServerCertificate,
    },
  }
}

export async function POST(request: NextRequest) {
  try {
    const params: MSSQLQueryParams = await request.json()

    // Validate connection parameters
    const connectionErrors = validateConnectionParams(params)
    if (connectionErrors.length > 0) {
      return NextResponse.json({
        success: true, // Changed to true so workflow continues
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

    // Handle different actions
    let result: MSSQLResponse

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
      case 'create_file':
        result = await handleCreateFile(params)
        break
      case 'delete_file':
        result = await handleDeleteFile(params)
        break
      case 'edit_file':
        result = await handleEditFile(params)
        break
      case 'get_file':
        result = await handleGetFile(params)
        break
      case 'list_files':
        result = await handleListFiles(params)
        break
      default:
        result = {
          success: true, // Changed to true so workflow continues
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
      success: true, // Changed to true so workflow continues
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

// Database operation handlers
async function handleExecuteQuery(params: MSSQLQueryParams): Promise<MSSQLResponse> {
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
  return await MSSQLDatabase.executeQuery(config, params.query)
}

async function handleInsert(params: MSSQLQueryParams): Promise<MSSQLResponse> {
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
  return await MSSQLDatabase.insertData(config, params.table, params.data)
}

async function handleUpdate(params: MSSQLQueryParams): Promise<MSSQLResponse> {
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
  return await MSSQLDatabase.updateData(config, params.table, params.data, params.conditions)
}

async function handleDelete(params: MSSQLQueryParams): Promise<MSSQLResponse> {
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
  return await MSSQLDatabase.deleteData(config, params.table, params.conditions)
}

// File operation handlers (mock implementation)
async function handleCreateFile(params: MSSQLQueryParams): Promise<MSSQLResponse> {
  if (!params.filePath || !params.content) {
    return {
      success: true,
      output: {
        data: [
          {
            error: true,
            errorType: 'VALIDATION_ERROR',
            message: 'File path and content are required for create file action',
            timestamp: new Date().toISOString(),
          },
        ],
      },
    }
  }

  const success = MSSQLFileSystem.createFile(params.filePath, params.content)

  if (success) {
    return {
      success: true,
      output: {
        data: [
          {
            success: true,
            operation: 'CREATE_FILE',
            fileName: params.filePath.split('/').pop() || '',
            filePath: params.filePath,
            timestamp: new Date().toISOString(),
          },
        ],
      },
    }
  }
  return {
    success: true,
    output: {
      data: [
        {
          error: true,
          errorType: 'FILE_CREATE_ERROR',
          message: 'Failed to create file',
          timestamp: new Date().toISOString(),
        },
      ],
    },
  }
}

async function handleDeleteFile(params: MSSQLQueryParams): Promise<MSSQLResponse> {
  if (!params.filePath) {
    return {
      success: true,
      output: {
        data: [
          {
            error: true,
            errorType: 'VALIDATION_ERROR',
            message: 'File path is required for delete file action',
            timestamp: new Date().toISOString(),
          },
        ],
      },
    }
  }

  const success = MSSQLFileSystem.deleteFile(params.filePath)

  if (success) {
    return {
      success: true,
      output: {
        data: [
          {
            success: true,
            operation: 'DELETE_FILE',
            fileName: params.filePath.split('/').pop() || '',
            filePath: params.filePath,
            timestamp: new Date().toISOString(),
          },
        ],
      },
    }
  }
  return {
    success: true,
    output: {
      data: [
        {
          error: true,
          errorType: 'FILE_DELETE_ERROR',
          message: 'File not found or failed to delete',
          timestamp: new Date().toISOString(),
        },
      ],
    },
  }
}

async function handleEditFile(params: MSSQLQueryParams): Promise<MSSQLResponse> {
  if (!params.filePath || !params.content) {
    return {
      success: true,
      output: {
        data: [
          {
            error: true,
            errorType: 'VALIDATION_ERROR',
            message: 'File path and content are required for edit file action',
            timestamp: new Date().toISOString(),
          },
        ],
      },
    }
  }

  const success = MSSQLFileSystem.editFile(params.filePath, params.content)

  if (success) {
    return {
      success: true,
      output: {
        data: [
          {
            success: true,
            operation: 'EDIT_FILE',
            fileName: params.filePath.split('/').pop() || '',
            filePath: params.filePath,
            timestamp: new Date().toISOString(),
          },
        ],
      },
    }
  }
  return {
    success: true,
    output: {
      data: [
        {
          error: true,
          errorType: 'FILE_EDIT_ERROR',
          message: 'File not found or failed to edit',
          timestamp: new Date().toISOString(),
        },
      ],
    },
  }
}

async function handleGetFile(params: MSSQLQueryParams): Promise<MSSQLResponse> {
  if (!params.filePath) {
    return {
      success: true,
      output: {
        data: [
          {
            error: true,
            errorType: 'VALIDATION_ERROR',
            message: 'File path is required for get file action',
            timestamp: new Date().toISOString(),
          },
        ],
      },
    }
  }

  const fileData = MSSQLFileSystem.getFile(params.filePath)

  if (fileData) {
    return {
      success: true,
      output: {
        data: [
          {
            success: true,
            operation: 'GET_FILE',
            fileName: params.filePath.split('/').pop() || '',
            filePath: params.filePath,
            content: fileData.content,
            timestamp: new Date().toISOString(),
          },
        ],
      },
    }
  }
  return {
    success: true,
    output: {
      data: [
        {
          error: true,
          errorType: 'FILE_NOT_FOUND_ERROR',
          message: 'File not found',
          timestamp: new Date().toISOString(),
        },
      ],
    },
  }
}

async function handleListFiles(params: MSSQLQueryParams): Promise<MSSQLResponse> {
  const files = MSSQLFileSystem.listFiles(params.folderPath || '')

  return {
    success: true,
    output: {
      data: files.map((file) => ({
        name: file.name,
        path: file.path,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified,
      })),
    },
  }
}
