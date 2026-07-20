import { createLogger } from '@/lib/logs/console/logger'

const logger = createLogger('IsolatedVM')

/**
 * `isolated-vm` is a native module. Importing it at module top level makes Next.js load the native
 * binary during `next build` page-data collection (and makes every test that imports this file crash
 * where no prebuilt binary matches the runtime ABI). Load it lazily instead — only when a Function
 * block actually executes — and surface a clean error if the platform has no compatible binary.
 */
type IvmModule = typeof import('isolated-vm')
let ivmModule: IvmModule | null = null
async function loadIvm(): Promise<IvmModule> {
  if (ivmModule) return ivmModule
  try {
    const mod = await import('isolated-vm')
    // isolated-vm is `export =` (CJS); under esModuleInterop the object may sit on `.default` or be
    // the namespace itself, so fall back across both.
    ivmModule = ((mod as any).default ?? mod) as IvmModule
    return ivmModule
  } catch (err) {
    throw new IsolatedExecutionError(
      `JS sandbox (isolated-vm) is unavailable on this platform: ${
        err instanceof Error ? err.message : String(err)
      }`,
      ''
    )
  }
}

/**
 * Runs user-supplied Function-block code in a real V8 isolate.
 *
 * This replaces Node's `vm` module, which is explicitly not a security boundary. The old path also
 * injected `globalThis.fetch` into the context — a live host-realm function whose `.constructor`
 * reaches `process`, and from there `child_process`. Any saved workflow was a shell on the server.
 *
 * An isolate has its own heap and no reference to the host realm, so escape primitives like
 * `this.constructor.constructor('return process')()` resolve to `undefined` rather than the real
 * `process`. Host capabilities (fetch, console) are handed in explicitly as bridged callbacks, not
 * as host objects, so user code can call them but cannot reach through them.
 */

const DEFAULT_MEMORY_LIMIT_MB = 128

export interface IsolatedExecutionParams {
  /** The already-wrapped script (async IIFE with try/catch) to run. */
  code: string
  /** Values exposed as globals inside the isolate. Must be structured-clone-safe. */
  globals?: Record<string, unknown>
  /** Wall-clock limit in ms. */
  timeoutMs?: number
  memoryLimitMb?: number
  filename?: string
  /**
   * Host fetch bridge. Omit to leave fetch unavailable inside the sandbox. When provided it is
   * exposed as a controlled callback — user code never receives the host `fetch` itself.
   */
  fetchBridge?: (
    url: string,
    init?: any
  ) => Promise<{ status: number; body: string; headers: Record<string, string> }>
}

export interface IsolatedExecutionResult {
  result: unknown
  stdout: string
}

export class IsolatedExecutionError extends Error {
  constructor(
    message: string,
    public readonly stdout: string,
    public readonly isTimeout = false,
    public readonly isMemoryLimit = false,
    /** The original error name from inside the isolate (ReferenceError, TypeError, …) when known. */
    public readonly originalName?: string,
    /**
     * The original error's stack, when available. `super(message)` otherwise captures a fresh stack
     * pointing at this constructor's own call site (inside `executeInIsolate`'s catch block) instead
     * of the user code's location, which silently discarded the `user-function.js:N` reference the
     * route's error formatter parses out to show the user which line failed.
     */
    originalStack?: string
  ) {
    super(message)
    this.name = originalName || 'IsolatedExecutionError'
    if (originalStack) this.stack = originalStack
  }
}

export async function executeInIsolate(
  params: IsolatedExecutionParams
): Promise<IsolatedExecutionResult> {
  const {
    code,
    globals = {},
    timeoutMs = 10000,
    memoryLimitMb = DEFAULT_MEMORY_LIMIT_MB,
    filename = 'user-function.js',
    fetchBridge,
  } = params

  const ivm = await loadIvm()
  const isolate = new ivm.Isolate({ memoryLimit: memoryLimitMb })
  let stdout = ''

  try {
    const context = await isolate.createContext()
    const jail = context.global

    // The isolate's global object is not the host global; expose only what we choose.
    await jail.set('global', jail.derefInto())

    // Structured-clone the caller-provided globals across the isolate boundary. `ExternalCopy`
    // copies by value, so user code cannot mutate host objects or reach back through a reference.
    for (const [key, value] of Object.entries(globals)) {
      try {
        await jail.set(key, new ivm.ExternalCopy(value).copyInto({ release: true }))
      } catch (err) {
        // A non-cloneable global (e.g. a function) is dropped rather than smuggled in as a host ref.
        logger.warn(`Skipping non-cloneable global "${key}"`, {
          error: err instanceof Error ? err.message : String(err),
        })
      }
    }

    // console.log/error → captured stdout. Bridged as a callback: user code can call it, but the
    // host closure it points at is never itself reachable from inside the isolate.
    const logCallback = new ivm.Reference((level: string, message: string) => {
      if (level === 'error') {
        stdout += `ERROR: ${message}\n`
      } else {
        stdout += `${message}\n`
      }
    })
    await jail.set('__hostLog', logCallback)

    // fetch bridge (optional). Returns a plain object, never a host Response.
    if (fetchBridge) {
      const fetchCallback = new ivm.Reference(async (url: string, initJson: string) => {
        const init = initJson ? JSON.parse(initJson) : undefined
        const res = await fetchBridge(url, init)
        return new ivm.ExternalCopy(res).copyInto({ release: true })
      })
      await jail.set('__hostFetch', fetchCallback)
    }

    // Bootstrap: build the console and (optional) fetch shims from the bridged references, using
    // applySyncPromise/applySync so user code sees ordinary async functions.
    const bootstrap = `
      const console = {
        log: (...args) => __hostLog.applySync(undefined, ['log', args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')]),
        error: (...args) => __hostLog.applySync(undefined, ['error', args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')]),
      };
      ${
        fetchBridge
          ? `
      globalThis.fetch = async (url, init) => {
        const raw = await __hostFetch.apply(undefined, [String(url), init ? JSON.stringify(init) : ''], { result: { promise: true, copy: true } });
        return {
          status: raw.status,
          ok: raw.status >= 200 && raw.status < 300,
          headers: raw.headers,
          text: async () => raw.body,
          json: async () => JSON.parse(raw.body),
        };
      };`
          : ''
      }
    `

    const bootstrapScript = await isolate.compileScript(bootstrap)
    await bootstrapScript.run(context)

    const userScript = await isolate.compileScript(code, { filename })
    const result = await userScript.run(context, {
      timeout: timeoutMs,
      promise: true,
      copy: true,
    })

    return { result, stdout }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const isTimeout = /script execution timed out/i.test(message)
    const isMemoryLimit = /memory limit|array buffer allocation failed|reached heap limit/i.test(
      message
    )

    if (isMemoryLimit) {
      logger.warn('User code hit the isolate memory limit')
    }

    // isolated-vm copies the thrown error across the boundary; its name (ReferenceError, TypeError,
    // SyntaxError, …) survives on the copy. Preserve it so the route can classify the error for the
    // user instead of labelling everything 'IsolatedExecutionError'.
    const originalName =
      error instanceof Error && error.name && error.name !== 'Error' ? error.name : undefined
    const originalStack = error instanceof Error ? error.stack : undefined

    throw new IsolatedExecutionError(
      message,
      stdout,
      isTimeout,
      isMemoryLimit,
      originalName,
      originalStack
    )
  } finally {
    if (!isolate.isDisposed) {
      isolate.dispose()
    }
  }
}
