/**
 * Cross-execution workflow call-chain guard.
 *
 * The in-process guards in the workflow *block* handler (a `_sub_` depth counter and a per-process
 * `executionStack`) only see workflows nested *inside a single execution*. They cannot see a cycle
 * that crosses the API boundary: workflow A runs, an API/tool/MCP call it makes triggers a fresh
 * execution of workflow B, whose own API call triggers A again — every hop is a new top-level run
 * with the depth counter reset to zero, so nothing stops it looping forever.
 *
 * This module carries the chain of workflow ids across those boundaries in an HTTP header
 * (`X-Zelaxy-Via`, Via-style). Each hop appends the current workflow id; on ingress the chain depth
 * is checked. Any outbound HTTP request an execution makes (tool proxy, nested-workflow fetch, MCP
 * call) re-attaches the extended header, so the guard survives the round trip.
 */

export const ZELAXY_VIA_HEADER = 'X-Zelaxy-Via'
export const MAX_CALL_CHAIN_DEPTH = 25

/**
 * Parses the `X-Zelaxy-Via` header value into an ordered list of workflow ids.
 * Returns an empty array when the header is absent or empty.
 */
export function parseCallChain(headerValue: string | null | undefined): string[] {
  if (!headerValue || !headerValue.trim()) {
    return []
  }
  return headerValue
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
}

/**
 * Serializes a call chain array back into the header value format.
 */
export function serializeCallChain(chain: string[]): string {
  return chain.join(',')
}

/**
 * Validates that the call chain has not exceeded the maximum depth.
 * Returns an error message string if invalid, or `null` if the chain is safe to extend.
 */
export function validateCallChain(chain: string[]): string | null {
  if (chain.length >= MAX_CALL_CHAIN_DEPTH) {
    return `Maximum workflow call chain depth (${MAX_CALL_CHAIN_DEPTH}) exceeded.`
  }

  return null
}

/**
 * Builds the next call chain by appending the current workflow id.
 */
export function buildNextCallChain(chain: string[], workflowId: string): string[] {
  return [...chain, workflowId]
}
