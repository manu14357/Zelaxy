import { type NextRequest, NextResponse } from 'next/server'
import { executeInIsolate, IsolatedExecutionError } from '@/lib/execution/isolated-vm'
import { createLogger } from '@/lib/logs/console/logger'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

const logger = createLogger('FunctionExecuteAPI')

/**
 * Enhanced error information interface
 */
interface EnhancedError {
  message: string
  line?: number
  column?: number
  stack?: string
  name: string
  originalError: any
  lineContent?: string
}

/**
 * Extract enhanced error information from VM execution errors
 */
function extractEnhancedError(
  error: any,
  userCodeStartLine: number,
  userCode?: string
): EnhancedError {
  const enhanced: EnhancedError = {
    message: error.message || 'Unknown error',
    name: error.name || 'Error',
    originalError: error,
  }

  if (error.stack) {
    enhanced.stack = error.stack

    // Parse stack trace to extract line and column information
    // Handle both compilation errors and runtime errors
    const stackLines: string[] = error.stack.split('\n')

    for (const line of stackLines) {
      // Pattern 1: Compilation errors - "user-function.js:6"
      let match = line.match(/user-function\.js:(\d+)(?::(\d+))?/)

      // Pattern 2: Runtime errors - "at user-function.js:5:12"
      if (!match) {
        match = line.match(/at\s+user-function\.js:(\d+):(\d+)/)
      }

      // Pattern 3: Generic patterns for any line containing our filename
      if (!match) {
        match = line.match(/user-function\.js:(\d+)(?::(\d+))?/)
      }

      if (match) {
        const stackLine = Number.parseInt(match[1], 10)
        const stackColumn = match[2] ? Number.parseInt(match[2], 10) : undefined

        // Adjust line number to account for wrapper code
        // The user code starts at a specific line in our wrapper
        const adjustedLine = stackLine - userCodeStartLine + 1

        // Check if this is a syntax error in wrapper code caused by incomplete user code
        const isWrapperSyntaxError =
          stackLine > userCodeStartLine &&
          error.name === 'SyntaxError' &&
          (error.message.includes('Unexpected token') ||
            error.message.includes('Unexpected end of input'))

        if (isWrapperSyntaxError && userCode) {
          // Map wrapper syntax errors to the last line of user code
          const codeLines = userCode.split('\n')
          const lastUserLine = codeLines.length
          enhanced.line = lastUserLine
          enhanced.column = codeLines[lastUserLine - 1]?.length || 0
          enhanced.lineContent = codeLines[lastUserLine - 1]?.trim()
          break
        }

        if (adjustedLine > 0) {
          enhanced.line = adjustedLine
          enhanced.column = stackColumn

          // Extract the actual line content from user code
          if (userCode) {
            const codeLines = userCode.split('\n')
            if (adjustedLine <= codeLines.length) {
              enhanced.lineContent = codeLines[adjustedLine - 1]?.trim()
            }
          }
          break
        }

        if (stackLine <= userCodeStartLine) {
          // Error is in wrapper code itself
          enhanced.line = stackLine
          enhanced.column = stackColumn
          break
        }
      }
    }

    // Clean up stack trace to show user-relevant information
    const cleanedStackLines: string[] = stackLines
      .filter(
        (line: string) =>
          line.includes('user-function.js') ||
          (!line.includes('vm.js') && !line.includes('internal/'))
      )
      .map((line: string) => line.replace(/\s+at\s+/, '    at '))

    if (cleanedStackLines.length > 0) {
      enhanced.stack = cleanedStackLines.join('\n')
    }
  }

  // Keep original message without adding error type prefix
  // The error type will be added later in createUserFriendlyErrorMessage

  return enhanced
}

/**
 * Create a detailed error message for users
 */
function createUserFriendlyErrorMessage(
  enhanced: EnhancedError,
  requestId: string,
  userCode?: string
): string {
  let errorMessage = enhanced.message

  // Add line and column information if available
  if (enhanced.line !== undefined) {
    let lineInfo = `Line ${enhanced.line}${enhanced.column !== undefined ? `:${enhanced.column}` : ''}`

    // Add the actual line content if available
    if (enhanced.lineContent) {
      lineInfo += `: \`${enhanced.lineContent}\``
    }

    errorMessage = `${lineInfo} - ${errorMessage}`
  } else {
    // If no line number, try to extract it from stack trace for display
    if (enhanced.stack) {
      const stackMatch = enhanced.stack.match(/user-function\.js:(\d+)(?::(\d+))?/)
      if (stackMatch) {
        const line = Number.parseInt(stackMatch[1], 10)
        const column = stackMatch[2] ? Number.parseInt(stackMatch[2], 10) : undefined
        let lineInfo = `Line ${line}${column ? `:${column}` : ''}`

        // Try to get line content if we have userCode
        if (userCode) {
          const codeLines = userCode.split('\n')
          // Note: stackMatch gives us VM line number, need to adjust
          // This is a fallback case, so we might not have perfect line mapping
          if (line <= codeLines.length) {
            const lineContent = codeLines[line - 1]?.trim()
            if (lineContent) {
              lineInfo += `: \`${lineContent}\``
            }
          }
        }

        errorMessage = `${lineInfo} - ${errorMessage}`
      }
    }
  }

  // Add error type prefix with consistent naming
  if (enhanced.name !== 'Error') {
    const errorTypePrefix =
      enhanced.name === 'SyntaxError'
        ? 'Syntax Error'
        : enhanced.name === 'TypeError'
          ? 'Type Error'
          : enhanced.name === 'ReferenceError'
            ? 'Reference Error'
            : enhanced.name

    // Only add prefix if not already present
    if (!errorMessage.toLowerCase().includes(errorTypePrefix.toLowerCase())) {
      errorMessage = `${errorTypePrefix}: ${errorMessage}`
    }
  }

  // For syntax errors, provide additional context
  if (enhanced.name === 'SyntaxError') {
    if (errorMessage.includes('Invalid or unexpected token')) {
      errorMessage += ' (Check for missing quotes, brackets, or semicolons)'
    } else if (errorMessage.includes('Unexpected end of input')) {
      errorMessage += ' (Check for missing closing brackets or braces)'
    } else if (errorMessage.includes('Unexpected token')) {
      // Check if this might be due to incomplete code
      if (
        enhanced.lineContent &&
        ((enhanced.lineContent.includes('(') && !enhanced.lineContent.includes(')')) ||
          (enhanced.lineContent.includes('[') && !enhanced.lineContent.includes(']')) ||
          (enhanced.lineContent.includes('{') && !enhanced.lineContent.includes('}')))
      ) {
        errorMessage += ' (Check for missing closing parentheses, brackets, or braces)'
      } else {
        errorMessage += ' (Check your syntax)'
      }
    }
  }

  return errorMessage
}

/**
 * Resolves environment variables and tags in code
 * @param code - Code with variables
 * @param params - Parameters that may contain variable values
 * @param envVars - Environment variables from the workflow
 * @returns Resolved code
 */

function resolveCodeVariables(
  code: string,
  params: Record<string, any>,
  envVars: Record<string, string> = {},
  blockData: Record<string, any> = {},
  blockNameMapping: Record<string, string> = {}
): { resolvedCode: string; contextVariables: Record<string, any> } {
  let resolvedCode = code
  const contextVariables: Record<string, any> = {}

  // Resolve environment variables with {{var_name}} syntax
  const envVarMatches = resolvedCode.match(/\{\{([^}]+)\}\}/g) || []
  for (const match of envVarMatches) {
    const varName = match.slice(2, -2).trim()
    // Priority: 1. Environment variables from workflow, 2. Params
    const varValue = envVars[varName] || params[varName] || ''

    // Instead of injecting large JSON directly, create a variable reference
    const safeVarName = `__var_${varName.replace(/[^a-zA-Z0-9_]/g, '_')}`
    contextVariables[safeVarName] = varValue

    // Replace the template with a variable reference
    resolvedCode = resolvedCode.replace(new RegExp(escapeRegExp(match), 'g'), safeVarName)
  }

  // Old <tag_name> syntax has been removed - only {{variable}} syntax is supported

  return { resolvedCode, contextVariables }
}

/**
 * Get nested value from object using dot notation path
 */
function getNestedValue(obj: any, path: string): any {
  if (!obj || !path) return undefined

  return path.split('.').reduce((current, key) => {
    return current && typeof current === 'object' ? current[key] : undefined
  }, obj)
}

/**
 * Escape special regex characters in a string
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID().slice(0, 8)
  const startTime = Date.now()
  let stdout = ''
  let result: unknown
  let userCodeStartLine = 3 // Default value for error reporting
  let resolvedCode = '' // Store resolved code for error reporting

  try {
    const body = await req.json()

    const {
      code,
      params = {},
      timeout = 5000,
      envVars = {},
      blockData = {},
      blockNameMapping = {},
      workflowId,
      isCustomTool = false,
    } = body

    // Extract internal parameters that shouldn't be passed to the execution context
    const executionParams = { ...params }
    executionParams._context = undefined

    logger.info(`[${requestId}] Function execution request`, {
      hasCode: !!code,
      paramsCount: Object.keys(executionParams).length,
      timeout,
      workflowId,
      isCustomTool,
    })

    // Resolve variables in the code with workflow environment variables
    const codeResolution = resolveCodeVariables(
      code,
      executionParams,
      envVars,
      blockData,
      blockNameMapping
    )
    resolvedCode = codeResolution.resolvedCode
    const contextVariables = codeResolution.contextVariables

    const executionMethod = 'isolated-vm'

    // Build an `inputs` object so function code can read an UPSTREAM block's output by its block
    // NAME — the reference that survives a build (the YAML block key gets reassigned to an id).
    // Keyed by exact name, normalized name, AND id so `inputs['Analyze & Compare Updates']`,
    // `inputs.analyzecompareupdates`, and `inputs['<id>']` all resolve.
    const blockInputs: Record<string, any> = {}
    for (const [name, id] of Object.entries(blockNameMapping as Record<string, string>)) {
      const output = (blockData as Record<string, any>)[id]
      if (output === undefined) continue
      blockInputs[name] = output
      const normalized = name.toLowerCase().replace(/\s+/g, '')
      if (normalized && blockInputs[normalized] === undefined) blockInputs[normalized] = output
    }
    for (const [id, output] of Object.entries(blockData as Record<string, any>)) {
      if (blockInputs[id] === undefined) blockInputs[id] = output
    }

    // Wrap user code in an async IIFE with try/catch, matching the previous VM contract.
    const wrapperLines = ['(async () => {', '  try {']
    if (isCustomTool) {
      for (const key of Object.keys(executionParams)) {
        wrapperLines.push(`    const ${key} = params.${key};`)
      }
    }
    userCodeStartLine = wrapperLines.length + 1
    const fullScript = [
      ...wrapperLines,
      `    ${resolvedCode.split('\n').join('\n    ')}`,
      '  } catch (error) {',
      '    console.error(error);',
      '    throw error;',
      '  }',
      '})()',
    ].join('\n')

    logger.info(`[${requestId}] Executing user code in an isolate`, {
      hasEnvVars: Object.keys(envVars).length > 0,
    })

    // Execute in a V8 isolate — NOT Node's `vm`, which is not a security boundary. The isolate has
    // no reference to the host realm, so escape primitives resolve to undefined instead of process.
    const isolateResult = await executeInIsolate({
      code: fullScript,
      filename: 'user-function.js',
      timeoutMs: timeout,
      globals: {
        params: executionParams,
        inputs: blockInputs,
        environment: envVars,
        environmentVariables: envVars,
        ...contextVariables,
      },
      // Bridge fetch as a controlled callback so user code keeps working without receiving the
      // host `fetch` object (whose .constructor was the escape primitive on the old path).
      fetchBridge: async (url, init) => {
        const res = await fetch(url, init)
        const body = await res.text()
        const headers: Record<string, string> = {}
        res.headers.forEach((v, k) => {
          headers[k] = v
        })
        return { status: res.status, body, headers }
      },
    })
    result = isolateResult.result
    stdout = isolateResult.stdout
    const executionTime = Date.now() - startTime
    logger.info(`[${requestId}] Function executed successfully using ${executionMethod}`, {
      executionTime,
    })

    const response = {
      success: true,
      output: {
        result,
        stdout,
        executionTime,
      },
    }

    return NextResponse.json(response)
  } catch (error: any) {
    const executionTime = Date.now() - startTime

    // The isolate throws before `stdout` is assigned, so recover any console output it captured
    // before the failure, and turn resource-limit hits into a clear message.
    if (error instanceof IsolatedExecutionError) {
      stdout = error.stdout
      if (error.isTimeout) {
        error.message = 'Execution timed out'
      } else if (error.isMemoryLimit) {
        error.message = 'Execution exceeded the memory limit'
      }
    }

    logger.error(`[${requestId}] Function execution failed`, {
      error: error.message || 'Unknown error',
      stack: error.stack,
      executionTime,
    })

    const enhancedError = extractEnhancedError(error, userCodeStartLine, resolvedCode)
    const userFriendlyErrorMessage = createUserFriendlyErrorMessage(
      enhancedError,
      requestId,
      resolvedCode
    )

    // Log enhanced error details for debugging
    logger.error(`[${requestId}] Enhanced error details`, {
      originalMessage: error.message,
      enhancedMessage: userFriendlyErrorMessage,
      line: enhancedError.line,
      column: enhancedError.column,
      lineContent: enhancedError.lineContent,
      errorType: enhancedError.name,
      userCodeStartLine,
    })

    const errorResponse = {
      success: false,
      error: userFriendlyErrorMessage,
      output: {
        result: null,
        stdout,
        executionTime,
      },
      // Include debug information in development or for debugging
      debug: {
        line: enhancedError.line,
        column: enhancedError.column,
        errorType: enhancedError.name,
        lineContent: enhancedError.lineContent,
        stack: enhancedError.stack,
      },
    }

    return NextResponse.json(errorResponse, { status: 500 })
  }
}
