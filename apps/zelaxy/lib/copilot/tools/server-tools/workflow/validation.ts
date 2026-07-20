/**
 * Sub-block value validation for AI-built/edited workflows.
 *
 * The copilot stamps whatever values the model emits into a block's sub-blocks. Without validation,
 * invalid dropdown ids (e.g. a schedule frequency of "every-2-hour"), out-of-range sliders, and
 * non-boolean switches ship verbatim and silently break the block at runtime. This module validates
 * and (where safe) normalizes those values in place, and returns human-readable errors that the
 * tool surfaces back to the model so it can self-correct.
 */

import type { BlockConfig, SubBlockConfig } from '@/blocks/types'
import { collectBlockFieldIssues } from '@/serializer/validation'

export interface InputValidationError {
  block: string
  field: string
  message: string
}

interface WrittenSubBlock {
  id: string
  type: string
  value: any
}

/**
 * An `agent` block's real output shape depends on its `responseFormat`: with none set, it's the
 * static `{content, model, tokens, toolCalls, context}`; with one set and the model returning valid
 * JSON, `content` doesn't exist at all — the parsed schema's top-level fields replace it directly on
 * the output (see AgentBlockHandler.processStructuredResponse). Mirrors the wrapping
 * AgentBlockHandler.parseResponseFormat applies (a bare JSON Schema object gets normalized to
 * `{schema: <that object>}`) so this stays in sync with what actually runs.
 */
function getAgentResponseFormatFields(block: any): string[] | null {
  const raw = block?.subBlocks?.responseFormat?.value
  if (!raw) return null
  let parsed: any
  try {
    parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
  } catch {
    return null
  }
  if (!parsed || typeof parsed !== 'object') return null
  const schema = parsed.schema && typeof parsed.schema === 'object' ? parsed.schema : parsed
  const properties = schema?.properties
  if (!properties || typeof properties !== 'object') return null
  const fields = Object.keys(properties)
  return fields.length > 0 ? fields : null
}

function resolveOptionIds(config: SubBlockConfig): string[] | null {
  if (!config.options) return null
  const opts = typeof config.options === 'function' ? config.options() : config.options
  if (!Array.isArray(opts)) return null
  return opts.map((o) => o.id)
}

/**
 * Validates / normalizes a single value against its sub-block config.
 * Returns the value to store plus an optional error message to report to the model.
 */
export function validateValueForSubBlock(
  config: SubBlockConfig,
  value: any
): { value: any; error?: string } {
  if (value === null || value === undefined) return { value }

  switch (config.type) {
    case 'dropdown':
    case 'combobox': {
      const ids = resolveOptionIds(config)
      if (!ids || ids.length === 0) return { value }
      if (config.multiSelect && Array.isArray(value)) {
        const bad = value.filter((v) => !ids.includes(v))
        if (bad.length === 0) return { value }
        return {
          value,
          error: `invalid value(s) ${JSON.stringify(bad)} for "${config.id}" — allowed: ${ids.join(', ')}`,
        }
      }
      if (!ids.includes(value)) {
        return {
          value,
          error: `invalid value "${value}" for "${config.id}" — allowed: ${ids.join(', ')}`,
        }
      }
      return { value }
    }

    case 'switch': {
      if (typeof value === 'boolean') return { value }
      if (value === 'true' || value === 1 || value === '1') return { value: true }
      if (value === 'false' || value === 0 || value === '0' || value === '') return { value: false }
      return { value: Boolean(value), error: `"${config.id}" expects a boolean (true/false)` }
    }

    case 'slider': {
      const num = typeof value === 'number' ? value : Number(value)
      if (Number.isNaN(num)) return { value, error: `"${config.id}" expects a number` }
      let result = num
      const notes: string[] = []
      if (config.integer && !Number.isInteger(result)) result = Math.round(result)
      if (typeof config.min === 'number' && result < config.min) {
        result = config.min
        notes.push(`min ${config.min}`)
      }
      if (typeof config.max === 'number' && result > config.max) {
        result = config.max
        notes.push(`max ${config.max}`)
      }
      return {
        value: result,
        error: notes.length
          ? `"${config.id}" out of range, clamped to ${result} (${notes.join('/')})`
          : undefined,
      }
    }

    default:
      return { value }
  }
}

export interface WorkflowLintIssue {
  severity: 'error' | 'warning'
  message: string
}

/**
 * Lints a built/edited workflow state for structural problems the model should fix: edges to
 * missing blocks, disconnected (orphan) non-trigger blocks, missing always-required fields, and
 * multiple entry points. Returned to the model so it can issue a corrective follow-up edit.
 */
export function lintWorkflowState(
  blocks: Record<string, any>,
  edges: Array<{ source: string; target: string }>,
  blockRegistry: Map<string, BlockConfig>
): WorkflowLintIssue[] {
  const issues: WorkflowLintIssue[] = []
  const blockIds = new Set(Object.keys(blocks))

  // Edges referencing blocks that don't exist.
  for (const e of edges) {
    if (!blockIds.has(e.source)) {
      issues.push({
        severity: 'error',
        message: `Edge references missing source block "${e.source}"`,
      })
    }
    if (!blockIds.has(e.target)) {
      issues.push({
        severity: 'error',
        message: `Edge references missing target block "${e.target}"`,
      })
    }
  }

  const hasIncoming = new Set<string>()
  const hasOutgoing = new Set<string>()
  for (const e of edges) {
    hasOutgoing.add(e.source)
    hasIncoming.add(e.target)
  }

  let triggerCount = 0
  for (const [id, block] of Object.entries(blocks)) {
    const cfg = blockRegistry.get(block.type)
    const isTrigger = cfg?.category === 'triggers' || block.type === 'starter'
    if (isTrigger) triggerCount++

    // Orphan: a non-trigger block wired to nothing (only meaningful with >1 block).
    if (blockIds.size > 1 && !isTrigger && !hasIncoming.has(id) && !hasOutgoing.has(id)) {
      issues.push({
        severity: 'warning',
        message: `Block "${block.name || id}" (${block.type}) is not connected to anything`,
      })
    }

    // Missing required fields — evaluated through the shared visibility filter so it mirrors the
    // editor exactly: conditionally-hidden, wrong-mode, and trigger-only fields are not flagged,
    // while conditionally-VISIBLE required fields now are (the old check skipped all conditionals).
    const fieldValues: Record<string, any> = {}
    for (const [sid, sb] of Object.entries(block.subBlocks || {})) {
      fieldValues[sid] = (sb as any)?.value
    }
    const fieldIssues = collectBlockFieldIssues(cfg, fieldValues, {
      isAdvancedMode: Boolean(block.advancedMode),
      isTriggerMode: Boolean(block.triggerMode),
      isTriggerBlock: Boolean(cfg?.triggers?.enabled && cfg?.category === 'triggers'),
    })
    for (const fi of fieldIssues) {
      issues.push({
        severity: 'warning',
        message: `Block "${block.name || id}" is missing required field "${fi.fieldId}"`,
      })
    }
  }

  if (triggerCount > 1) {
    issues.push({
      severity: 'warning',
      message: `Workflow has ${triggerCount} trigger/start blocks — there should usually be exactly one entry point`,
    })
  }

  // Dangling block references: a `{{ref.field}}` input that points at a block which doesn't exist.
  // The executor resolves refs by block id OR normalized name (lowercase, spaces stripped) — mirror
  // that here so the model learns its reference doesn't match any block it created (the #1 cause of
  // workflows that "build" but produce empty values at runtime).
  const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, '')
  const SYSTEM_REFS = new Set(['start', 'loop', 'parallel', 'variable', 'env'])
  const validRefs = new Set<string>(SYSTEM_REFS)
  const blockByRef = new Map<string, any>()
  for (const [id, block] of Object.entries(blocks)) {
    validRefs.add(normalize(id))
    blockByRef.set(normalize(id), block)
    if (block.name) {
      validRefs.add(normalize(block.name))
      blockByRef.set(normalize(block.name), block)
    }
  }
  const reportedRefs = new Set<string>()
  for (const [id, block] of Object.entries(blocks)) {
    for (const sub of Object.values(block.subBlocks || {})) {
      const val = (sub as any)?.value
      if (typeof val !== 'string') continue
      const refs = val.match(/\{\{\s*([^}]+?)\s*\}\}/g)
      if (!refs) continue
      for (const raw of refs) {
        const inner = raw.slice(2, -2).trim()
        if (!inner.includes('.')) continue // bare `{{VAR}}` is an env var, not a block ref
        const parts = inner.split('.')
        const ref = parts[0].trim()
        const field = (parts[1] || '').trim()
        const nRef = normalize(ref)

        // (1) The referenced BLOCK must exist.
        if (!validRefs.has(nRef)) {
          const key = `${id}:${ref}`
          if (!reportedRefs.has(key)) {
            reportedRefs.add(key)
            issues.push({
              severity: 'warning',
              message: `Block "${block.name || id}" references {{${inner}}}, but no block has id/name "${ref}". Reference the EXACT id or name of a block you created (names match case-insensitively with spaces removed), or add that block.`,
            })
          }
          continue
        }

        // (2) The FIELD must be a real output of that block. Skip system refs and `function` (whose
        // output shape is whatever its code returns), and only validate when the block declares a
        // non-empty outputs schema (so we never false-flag a dynamic block).
        if (SYSTEM_REFS.has(nRef) || !field) continue
        const target = blockByRef.get(nRef)
        if (!target || target.type === 'function') continue
        let outputs = blockRegistry.get(target.type)?.outputs
        // An agent with responseFormat set replaces `content`/`context` with the schema's own
        // top-level fields at runtime (see getAgentResponseFormatFields) — validate against those
        // instead of the static registry shape, or every correct schema-field reference gets flagged
        // as invalid and every incorrect `.content` reference gets waved through.
        if (target.type === 'agent') {
          const schemaFields = getAgentResponseFormatFields(target)
          if (schemaFields) {
            outputs = Object.fromEntries(
              [...schemaFields, 'model', 'tokens', 'toolCalls'].map((f) => [f, {}])
            ) as any
          }
        }
        if (outputs && Object.keys(outputs).length > 0 && !(field in outputs)) {
          const fkey = `${id}:${ref}.${field}`
          if (!reportedRefs.has(fkey)) {
            reportedRefs.add(fkey)
            issues.push({
              severity: 'warning',
              message: `Block "${block.name || id}" references {{${ref}.${field}}}, but "${field}" is not an output of "${ref}" (a ${target.type} block). Valid outputs: ${Object.keys(outputs).join(', ')}.`,
            })
          }
        }
      }
    }
  }

  return issues
}

/**
 * Validates & normalizes every written sub-block value for a block IN PLACE.
 * `subBlocks` is the `{ id, type, value }` map that build/edit produce.
 */
export function validateBlockSubBlocks(
  blockType: string,
  blockConfig: BlockConfig | undefined,
  subBlocks: Record<string, WrittenSubBlock>
): InputValidationError[] {
  if (!blockConfig) return []
  const errors: InputValidationError[] = []
  const configMap = new Map<string, SubBlockConfig>()
  for (const c of blockConfig.subBlocks || []) configMap.set(c.id, c)

  for (const [key, sb] of Object.entries(subBlocks)) {
    const config = configMap.get(key)
    if (!config) continue
    const { value, error } = validateValueForSubBlock(config, sb.value)
    sb.value = value
    if (error) errors.push({ block: blockType, field: key, message: error })
  }
  return errors
}
