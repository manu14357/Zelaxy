import { getBlock } from '@/blocks/registry'

// SubBlock types that always reference the publisher's own external resources
// (a specific Slack channel, Drive file, knowledge base, etc.) - meaningless and
// potentially sensitive to anyone else, so always cleared regardless of content.
const EXTERNAL_RESOURCE_SUBBLOCK_TYPES = new Set([
  'oauth-input',
  'webhook-config',
  'trigger-config',
  'file-selector',
  'project-selector',
  'channel-selector',
  'folder-selector',
  'knowledge-base-selector',
  'knowledge-tag-filters',
  'document-selector',
  'document-tag-entry',
  'skill-selector',
])

// Field-id patterns that reference a specific external resource even when typed
// as plain text (e.g. an Airtable/Notion table id entered by hand in advanced mode)
const EXTERNAL_RESOURCE_ID_PATTERN =
  /(table|base|sheet|spreadsheet|database|channel|calendar|folder|file|project)[-_]?id$/i

const CREDENTIAL_KEY_PATTERN = /credential|oauth|api[_-]?key|token|secret|password|bearer/i

const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g

function redactEmails(value: string): string {
  return value.replace(EMAIL_PATTERN, '[redacted-email]')
}

// Remove secrets, credentials, workspace-specific resource references, and
// embedded email addresses before a workflow becomes a public template.
//
// Decides what to clear from each block's declared subBlock SCHEMA (its `type`
// and `password` flag from blocks/registry), not by scanning field VALUES for
// keywords - a value-content scan used to wipe out any system/user prompt that
// merely mentioned a word like "token" or "auth" as part of normal instructions.
export function sanitizeWorkflowState(state: any): any {
  const sanitizedState = JSON.parse(JSON.stringify(state)) // Deep clone

  if (sanitizedState.blocks) {
    Object.values(sanitizedState.blocks).forEach((block: any) => {
      const blockConfig = block.type ? getBlock(block.type) : undefined
      const subBlockConfigs = new Map((blockConfig?.subBlocks || []).map((sb: any) => [sb.id, sb]))

      if (block.subBlocks) {
        Object.entries(block.subBlocks).forEach(([key, subBlock]: [string, any]) => {
          if (!subBlock) return

          const config: any = subBlockConfigs.get(key)
          const shouldClear =
            config?.type === 'oauth-input' ||
            config?.password === true ||
            (config && EXTERNAL_RESOURCE_SUBBLOCK_TYPES.has(config.type)) ||
            EXTERNAL_RESOURCE_ID_PATTERN.test(key) ||
            CREDENTIAL_KEY_PATTERN.test(key)

          if (shouldClear) {
            subBlock.value = ''
          } else if (typeof subBlock.value === 'string') {
            subBlock.value = redactEmails(subBlock.value)
          }
        })
      }

      // Legacy free-form data bag: same key-based rules, no schema to consult
      if (block.data) {
        Object.entries(block.data).forEach(([key, value]: [string, any]) => {
          if (CREDENTIAL_KEY_PATTERN.test(key) || EXTERNAL_RESOURCE_ID_PATTERN.test(key)) {
            block.data[key] = ''
          } else if (typeof value === 'string') {
            block.data[key] = redactEmails(value)
          }
        })
      }
    })
  }

  return sanitizedState
}
