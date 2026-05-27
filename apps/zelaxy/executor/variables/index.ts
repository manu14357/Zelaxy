/**
 * Variable resolution helpers for the workflow executor.
 * Used by the variables block handler and child workflow invocation.
 */

import type { VariableType } from '@/stores/variables/types'

export interface WorkflowVariable {
  id: string
  name: string
  type?: VariableType
  value: unknown
}

/**
 * Resolves the typed value of a workflow variable.
 * Coerces the raw value to the correct JS type based on the variable's declared type.
 *
 * @param variable - The workflow variable to resolve.
 * @returns The resolved value in the correct JS type.
 */
export function resolveVariableValue(variable: WorkflowVariable): unknown {
  const { value, type } = variable

  if (value === null || value === undefined) return value

  switch (type) {
    case 'number': {
      const n = Number(value)
      return Number.isNaN(n) ? value : n
    }
    case 'boolean': {
      if (typeof value === 'boolean') return value
      const s = String(value).trim().toLowerCase()
      return s === 'true'
    }
    case 'object':
    case 'array': {
      if (typeof value === 'string') {
        try {
          return JSON.parse(value)
        } catch {
          return value
        }
      }
      return value
    }
    case 'plain':
    case 'string':
    default:
      return String(value)
  }
}

/**
 * Compacts the workflow variables map into a lightweight key→value record.
 * Resolves each variable to its typed JS value so it can be passed to child
 * workflows or serialised into execution logs without the full variable metadata.
 *
 * @param variables - The `workflowVariables` map from `ExecutionContext`.
 * @returns A `Record<variableId, resolvedValue>` suitable for serialization.
 */
export function compactWorkflowVariableValue(
  variables: Record<string, WorkflowVariable>
): Record<string, unknown> {
  const compacted: Record<string, unknown> = {}

  for (const [id, variable] of Object.entries(variables)) {
    compacted[id] = resolveVariableValue(variable)
  }

  return compacted
}

/**
 * Looks up a variable from the workflow variables map by ID or name.
 *
 * @param variables - The `workflowVariables` map from `ExecutionContext`.
 * @param idOrName  - Variable ID or display name.
 * @returns The matching variable entry, or `undefined` if not found.
 */
export function findWorkflowVariable(
  variables: Record<string, WorkflowVariable>,
  idOrName: string
): [string, WorkflowVariable] | undefined {
  // Try direct ID lookup first
  if (Object.hasOwn(variables, idOrName)) {
    return [idOrName, variables[idOrName]]
  }

  // Fall back to name search
  return Object.entries(variables).find(([, v]) => v.name === idOrName)
}
