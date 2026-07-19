import { createLogger } from '@/lib/logs/console/logger'
import { BlockType, isTriggerBlockType } from '@/executor/consts'
import type { BlockHandler, ExecutionContext } from '@/executor/types'
import type { SerializedBlock } from '@/serializer/types'

const logger = createLogger('TriggerBlockHandler')

/**
 * Handler for trigger blocks (Starter, Gmail, Webhook, Schedule, etc.)
 * These blocks don't execute tools - they provide input data to workflows.
 *
 * The manual **starter** is handled here too (its category is `blocks`, not `triggers`): it runs
 * through this handler like every other block so it produces a block log and drives its downstream
 * edges through the normal completion path — matching Sim's TriggerBlockHandler. (The executor seeds
 * the starter's output during context creation; we return that seeded output here.)
 */
export class TriggerBlockHandler implements BlockHandler {
  canHandle(block: SerializedBlock): boolean {
    const type = block.metadata?.id

    // The manual starter and every trigger-type block (starter/schedule/webhook) are ours, plus any
    // block flagged as a trigger by category or by triggerMode (e.g. Gmail/Outlook in trigger mode).
    const isTriggerType = isTriggerBlockType(type)
    const isTriggerCategory = block.metadata?.category === 'triggers'
    const hasTriggerMode = block.config?.params?.triggerMode === true

    return isTriggerType || isTriggerCategory || hasTriggerMode
  }

  async execute(
    block: SerializedBlock,
    inputs: Record<string, any>,
    context: ExecutionContext
  ): Promise<any> {
    logger.info(`Executing trigger block: ${block.id} (Type: ${block.metadata?.id})`)

    // The starter carries the workflow input, seeded onto its own block state before the run. Return
    // that seeded output so `{{start.*}}` resolves; fall back to the resolved input shape otherwise.
    if (block.metadata?.id === BlockType.STARTER) {
      const seeded = context.blockStates.get(block.id)?.output
      if (seeded && Object.keys(seeded).length > 0) {
        return seeded
      }
      return { input: inputs?.input ?? '' }
    }

    // For trigger blocks, return the starter block's output which contains the workflow input
    // This ensures webhook data like message, sender, chat, etc. are accessible
    const starterBlock = context.workflow?.blocks?.find((b) => b.metadata?.id === 'starter')
    if (starterBlock) {
      const starterState = context.blockStates.get(starterBlock.id)
      if (starterState?.output && Object.keys(starterState.output).length > 0) {
        const starterOutput = starterState.output

        // Generic handling for webhook triggers - extract provider-specific data
        // Check if this is a webhook execution with nested structure
        if (starterOutput.webhook?.data) {
          const webhookData = starterOutput.webhook.data
          const provider = webhookData.provider

          logger.debug(`Processing webhook trigger for block ${block.id}`, {
            provider,
            blockType: block.metadata?.id,
          })

          // Extract the flattened properties that should be at root level
          const result: any = {
            // Always keep the input at root level
            input: starterOutput.input,
          }

          // FIRST: Copy all existing top-level properties (like 'event', 'message', etc.)
          // This ensures that properties already flattened in webhook utils are preserved
          for (const [key, value] of Object.entries(starterOutput)) {
            if (key !== 'webhook' && key !== provider) {
              result[key] = value
            }
          }

          // SECOND: Generic extraction logic based on common webhook patterns
          // Pattern 1: Provider-specific nested object (telegram, microsoftteams, etc.)
          if (provider && starterOutput[provider]) {
            // Copy all properties from provider object to root level for direct access
            const providerData = starterOutput[provider]

            for (const [key, value] of Object.entries(providerData)) {
              // Special handling for GitHub provider - copy all properties
              if (provider === 'github') {
                // For GitHub, copy all properties (objects and primitives) to root level
                if (!result[key]) {
                  // Special handling for complex objects that might have enumeration issues
                  if (typeof value === 'object' && value !== null) {
                    try {
                      // Deep clone complex objects to avoid reference issues
                      result[key] = JSON.parse(JSON.stringify(value))
                    } catch (error) {
                      // If JSON serialization fails, try direct assignment
                      result[key] = value
                    }
                  } else {
                    result[key] = value
                  }
                }
              } else {
                // For other providers, keep existing logic (only copy objects)
                if (typeof value === 'object' && value !== null) {
                  // Don't overwrite existing top-level properties
                  if (!result[key]) {
                    result[key] = value
                  }
                }
              }
            }

            // Keep nested structure for backwards compatibility
            result[provider] = providerData

            // Special handling for GitHub complex objects that might not be copied by the main loop
            if (provider === 'github') {
              // Comprehensive GitHub object extraction from multiple possible sources
              const githubObjects = ['repository', 'sender', 'pusher', 'commits', 'head_commit']

              for (const objName of githubObjects) {
                // ALWAYS try to get the object, even if something exists (fix for conflicts)
                let objectValue = null

                // Source 1: Direct from provider data
                if (providerData[objName]) {
                  objectValue = providerData[objName]
                }
                // Source 2: From webhook payload (raw GitHub webhook)
                else if (starterOutput.webhook?.data?.payload?.[objName]) {
                  objectValue = starterOutput.webhook.data.payload[objName]
                }
                // Source 3: For commits, try parsing JSON string version if no object found
                else if (objName === 'commits' && typeof result.commits === 'string') {
                  try {
                    objectValue = JSON.parse(result.commits)
                  } catch (e) {
                    // Keep as string if parsing fails
                    objectValue = result.commits
                  }
                }

                // FORCE the object to root level (removed the !result[objName] condition)
                if (objectValue !== null && objectValue !== undefined) {
                  result[objName] = objectValue
                }
              }
            }
          }

          // Pattern 2: Provider data directly in webhook.data (based on actual structure)
          else if (provider && webhookData[provider]) {
            const providerData = webhookData[provider]

            // Extract all provider properties to root level
            for (const [key, value] of Object.entries(providerData)) {
              if (typeof value === 'object' && value !== null) {
                // Don't overwrite existing top-level properties
                if (!result[key]) {
                  result[key] = value
                }
              }
            }

            // Keep nested structure for backwards compatibility
            result[provider] = providerData
          }

          // Pattern 3: Email providers with data in webhook.data.payload.email (Gmail, Outlook)
          else if (
            provider &&
            (provider === 'gmail' || provider === 'outlook') &&
            webhookData.payload?.email
          ) {
            const emailData = webhookData.payload.email

            // Flatten email fields to root level for direct access
            for (const [key, value] of Object.entries(emailData)) {
              if (!result[key]) {
                result[key] = value
              }
            }

            // Keep the email object for backwards compatibility
            result.email = emailData

            // Also keep timestamp if present in payload
            if (webhookData.payload.timestamp) {
              result.timestamp = webhookData.payload.timestamp
            }
          }

          // Always keep webhook metadata
          if (starterOutput.webhook) result.webhook = starterOutput.webhook

          return result
        }

        logger.debug(`Returning starter block output for trigger block ${block.id}`, {
          starterOutputKeys: Object.keys(starterOutput),
        })
        return starterOutput
      }
    }

    // Fallback to resolved inputs if no starter block output
    if (inputs && Object.keys(inputs).length > 0) {
      logger.debug(`Returning trigger inputs for block ${block.id}`, {
        inputKeys: Object.keys(inputs),
      })
      return inputs
    }

    // Fallback - return empty object for trigger blocks with no inputs
    logger.debug(`No inputs provided for trigger block ${block.id}, returning empty object`)
    return {}
  }
}
