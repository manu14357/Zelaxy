import { Sandbox } from '@e2b/code-interpreter'
import { getEnv } from '@/lib/env'
import { createLogger } from '@/lib/logs/console/logger'

const logger = createLogger('E2BExecution')

/**
 * Runs user-supplied Function-block code in an E2B cloud sandbox for languages that cannot run in
 * the local V8 isolate (Python, Bash/shell). The JavaScript path is unaffected — it stays on the
 * `isolated-vm` runner in the execute route.
 *
 * E2B is an ephemeral, network-isolated microVM: each execution gets a fresh sandbox that is killed
 * in `finally`, so user code never touches the host. Requires an `E2B_API_KEY`; when it is absent
 * the caller should surface a clear "not configured" error rather than attempting a run.
 */

const DEFAULT_TIMEOUT_MS = 10000

/** Languages dispatched to E2B. JavaScript is intentionally excluded (handled by isolated-vm). */
export type E2BLanguage = 'python' | 'bash'

export interface E2BExecutionParams {
  /** The user code to run. */
  code: string
  /** Which E2B runtime to use. */
  language: E2BLanguage
  /** Wall-clock limit in ms for the code run. */
  timeoutMs?: number
}

export interface E2BExecutionResult {
  result: unknown
  stdout: string
}

export class E2BExecutionError extends Error {
  constructor(
    message: string,
    public readonly stdout = '',
    /** The original error name from inside the sandbox (e.g. NameError, SyntaxError) when known. */
    public readonly originalName?: string
  ) {
    super(message)
    this.name = originalName || 'E2BExecutionError'
  }
}

/**
 * Normalize the language selected in the Function block to an E2B runtime id, or `null` when the
 * language is not one E2B handles here (i.e. JavaScript/TypeScript, which stays local).
 */
export function toE2BLanguage(language: string | undefined | null): E2BLanguage | null {
  switch ((language || '').toLowerCase()) {
    case 'python':
    case 'python3':
    case 'py':
      return 'python'
    case 'bash':
    case 'shell':
    case 'sh':
      return 'bash'
    default:
      return null
  }
}

/** True when an E2B_API_KEY is configured and E2B execution can be attempted. */
export function isE2BConfigured(): boolean {
  return Boolean(getEnv('E2B_API_KEY'))
}

export async function executeInE2B(params: E2BExecutionParams): Promise<E2BExecutionResult> {
  const { code, language, timeoutMs = DEFAULT_TIMEOUT_MS } = params

  const apiKey = getEnv('E2B_API_KEY')
  if (!apiKey) {
    throw new E2BExecutionError('E2B not configured')
  }

  // Give the sandbox lifetime a small buffer over the run timeout so the sandbox is not reaped
  // out from under a run that is still within its own limit.
  const sandbox = await Sandbox.create({ apiKey, timeoutMs: timeoutMs + 5000 })

  try {
    const execution = await sandbox.runCode(code, {
      language,
      timeoutMs,
    })

    const stdout = (execution.logs?.stdout ?? []).join('')
    const stderr = (execution.logs?.stderr ?? []).join('')
    const combinedStdout = stderr ? `${stdout}${stderr}` : stdout

    // A runtime error inside the sandbox is reported on `execution.error`, not thrown.
    if (execution.error) {
      const errName = execution.error.name || 'Error'
      const errValue = execution.error.value || execution.error.name || 'Execution failed'
      throw new E2BExecutionError(errValue, combinedStdout, errName)
    }

    // `text` is the string representation of the last evaluated expression (mainly meaningful for
    // Python). For bash the useful output is stdout, so fall back to it.
    const result: unknown = execution.text ?? (combinedStdout || null)

    return { result, stdout: combinedStdout }
  } catch (error) {
    if (error instanceof E2BExecutionError) throw error
    const message = error instanceof Error ? error.message : String(error)
    logger.error('E2B execution failed', { error: message, language })
    throw new E2BExecutionError(message)
  } finally {
    try {
      await sandbox.kill()
    } catch (killError) {
      logger.warn('Failed to kill E2B sandbox', {
        error: killError instanceof Error ? killError.message : String(killError),
      })
    }
  }
}
