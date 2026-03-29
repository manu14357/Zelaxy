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
    port: params.port,
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
        success: false,
        output: {},
        error: `Connection validation failed: ${connectionErrors.join(', ')}`,
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
          success: false,
          output: {},
          error: `Unsupported action: ${params.action}`,
        }
    }

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({
      success: false,
      output: {},
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    })
  }
}

// Database operation handlers
async function handleExecuteQuery(params: MSSQLQueryParams): Promise<MSSQLResponse> {
  if (!params.query) {
    return { success: false, output: {}, error: 'Query is required for execute action' }
  }

  const queryErrors = validateQuery(params.query)
  if (queryErrors.length > 0) {
    return { success: false, output: {}, error: queryErrors.join(', ') }
  }

  const config = createConnectionConfig(params)
  return await MSSQLDatabase.executeQuery(config, params.query)
}

async function handleInsert(params: MSSQLQueryParams): Promise<MSSQLResponse> {
  if (!params.table || !params.data) {
    return {
      success: false,
      output: {},
      error: 'Table and data are required for insert action',
    }
  }

  const config = createConnectionConfig(params)
  return await MSSQLDatabase.insertData(config, params.table, params.data)
}

async function handleUpdate(params: MSSQLQueryParams): Promise<MSSQLResponse> {
  if (!params.table || !params.data || !params.conditions) {
    return {
      success: false,
      output: {},
      error: 'Table, data, and conditions are required for update action',
    }
  }

  const config = createConnectionConfig(params)
  return await MSSQLDatabase.updateData(config, params.table, params.data, params.conditions)
}

async function handleDelete(params: MSSQLQueryParams): Promise<MSSQLResponse> {
  if (!params.table || !params.conditions) {
    return {
      success: false,
      output: {},
      error: 'Table and conditions are required for delete action',
    }
  }

  const config = createConnectionConfig(params)
  return await MSSQLDatabase.deleteData(config, params.table, params.conditions)
}

// File operation handlers (mock implementation)
async function handleCreateFile(params: MSSQLQueryParams): Promise<MSSQLResponse> {
  if (!params.filePath || !params.content) {
    return {
      success: false,
      output: {},
      error: 'File path and content are required for create file action',
    }
  }

  const success = MSSQLFileSystem.createFile(params.filePath, params.content)

  if (success) {
    return {
      success: true,
      output: {
        fileName: params.filePath.split('/').pop() || '',
        filePath: params.filePath,
      },
    }
  }
  return {
    success: false,
    output: {},
    error: 'Failed to create file',
  }
}

async function handleDeleteFile(params: MSSQLQueryParams): Promise<MSSQLResponse> {
  if (!params.filePath) {
    return {
      success: false,
      output: {},
      error: 'File path is required for delete file action',
    }
  }

  const success = MSSQLFileSystem.deleteFile(params.filePath)

  if (success) {
    return {
      success: true,
      output: {
        fileName: params.filePath.split('/').pop() || '',
        filePath: params.filePath,
      },
    }
  }
  return {
    success: false,
    output: {},
    error: 'File not found or failed to delete',
  }
}

async function handleEditFile(params: MSSQLQueryParams): Promise<MSSQLResponse> {
  if (!params.filePath || !params.content) {
    return {
      success: false,
      output: {},
      error: 'File path and content are required for edit file action',
    }
  }

  const success = MSSQLFileSystem.editFile(params.filePath, params.content)

  if (success) {
    return {
      success: true,
      output: {
        fileName: params.filePath.split('/').pop() || '',
        filePath: params.filePath,
      },
    }
  }
  return {
    success: false,
    output: {},
    error: 'File not found or failed to edit',
  }
}

async function handleGetFile(params: MSSQLQueryParams): Promise<MSSQLResponse> {
  if (!params.filePath) {
    return {
      success: false,
      output: {},
      error: 'File path is required for get file action',
    }
  }

  const fileData = MSSQLFileSystem.getFile(params.filePath)

  if (fileData) {
    return {
      success: true,
      output: {
        fileName: params.filePath.split('/').pop() || '',
        filePath: params.filePath,
        content: fileData.content,
      },
    }
  }
  return {
    success: false,
    output: {},
    error: 'File not found',
  }
}

async function handleListFiles(params: MSSQLQueryParams): Promise<MSSQLResponse> {
  const files = MSSQLFileSystem.listFiles(params.folderPath || '')

  return {
    success: true,
    output: {
      files,
    },
  }
}
