/**
 * @vitest-environment node
 */
import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'
import { executeInIsolate, IsolatedExecutionError } from './isolated-vm'

// isolated-vm is a native module with no prebuilt binary for every runtime ABI (e.g. CI's Node 22).
// These tests exercise the real isolate, so skip them where the native binary can't load rather than
// crashing the run; they run wherever isolated-vm is compiled/available.
let ivmAvailable = false
try {
  createRequire(import.meta.url)('isolated-vm')
  ivmAvailable = true
} catch {
  ivmAvailable = false
}
const describeIvm = ivmAvailable ? describe : describe.skip

const wrap = (body: string) =>
  `(async () => { try { ${body} } catch (e) { console.error(e); throw e } })()`

describeIvm('executeInIsolate', () => {
  it('evaluates normal code and returns its value', async () => {
    const { result } = await executeInIsolate({
      code: wrap('return params.a + inputs.x'),
      globals: { params: { a: 10 }, inputs: { x: 5 } },
    })
    expect(result).toBe(15)
  })

  it('captures console output into stdout', async () => {
    const { stdout } = await executeInIsolate({
      code: wrap('console.log("hello", 42); return 1'),
    })
    expect(stdout).toContain('hello 42')
  })

  // --- security: the whole reason this module exists ---

  it('cannot reach process through the constructor escape', async () => {
    await expect(
      executeInIsolate({
        code: wrap('return this.constructor.constructor("return process")().env'),
      })
    ).rejects.toThrow(/process is not defined/i)
  })

  it('cannot reach process via function constructor', async () => {
    await expect(
      executeInIsolate({ code: wrap('return (function(){}).constructor("return process")()') })
    ).rejects.toThrow(/process is not defined/i)
  })

  it('has no require', async () => {
    await expect(
      executeInIsolate({ code: wrap('return require("child_process")') })
    ).rejects.toThrow(/require is not defined/i)
  })

  it('does not expose the host global object', async () => {
    // globalThis inside the isolate must not be the Node global (no process, no Buffer)
    const { result } = await executeInIsolate({
      code: wrap('return typeof process + "," + typeof Buffer + "," + typeof globalThis.process'),
    })
    expect(result).toBe('undefined,undefined,undefined')
  })

  it('kills an infinite loop at the timeout', async () => {
    await expect(
      executeInIsolate({ code: wrap('while (true) {}'), timeoutMs: 300 })
    ).rejects.toMatchObject({ isTimeout: true })
  })

  it('stops a memory bomb at the limit instead of taking down the host', async () => {
    await expect(
      executeInIsolate({
        code: wrap('const a = []; while (true) { a.push(new Array(1_000_000).fill(1)) }'),
        memoryLimitMb: 32,
        timeoutMs: 5000,
      })
    ).rejects.toBeInstanceOf(IsolatedExecutionError)
  })

  it('preserves captured stdout on the thrown error', async () => {
    try {
      await executeInIsolate({ code: wrap('console.log("before error"); throw new Error("boom")') })
      throw new Error('should have thrown')
    } catch (e) {
      expect(e).toBeInstanceOf(IsolatedExecutionError)
      expect((e as IsolatedExecutionError).stdout).toContain('before error')
    }
  })

  it('preserves the original error name and a stack referencing the user script', async () => {
    try {
      await executeInIsolate({
        code: wrap('const obj = null; return obj.someMethod()'),
        filename: 'user-function.js',
      })
      throw new Error('should have thrown')
    } catch (e) {
      expect(e).toBeInstanceOf(IsolatedExecutionError)
      const err = e as IsolatedExecutionError
      // `super(message)` alone would capture a stack pointing at executeInIsolate's own throw site
      // instead of the user code's location — the route's error formatter parses `user-function.js:N`
      // out of the stack to tell the user which line failed, so losing this silently degrades every
      // Function block error to "no line number available".
      expect(err.name).toBe('TypeError')
      expect(err.stack).toContain('user-function.js')
    }
  })

  it('bridges fetch as a callback rather than the host function', async () => {
    let calledWith = ''
    const { result } = await executeInIsolate({
      code: wrap('const r = await fetch("https://example.com/x"); return await r.json()'),
      fetchBridge: async (url) => {
        calledWith = url
        return { status: 200, body: JSON.stringify({ ok: true }), headers: {} }
      },
    })
    expect(calledWith).toBe('https://example.com/x')
    expect(result).toEqual({ ok: true })
  })

  it('leaves fetch undefined when no bridge is supplied', async () => {
    await expect(
      executeInIsolate({
        code: wrap('return typeof fetch === "function" ? await fetch("x") : "no-fetch"'),
      })
    ).resolves.toMatchObject({ result: 'no-fetch' })
  })
})
