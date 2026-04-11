#!/usr/bin/env bun
/**
 * One-shot: patch deployedState chatId for a specific block.
 * Run: bun run apps/zelaxy/scripts/patch-deployed-chatid.ts
 */
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { workflow } from '@/db/schema'

const WORKFLOW_ID = 'abf31179-8d1e-44fa-b9ee-5c6e8c6cf745'
const BLOCK_ID = '973b785d-24f2-4652-9f0b-a2eed9d52231'
const NEW_VALUE = '{{webhook1.chatId}}'

const [wf] = await db
  .select({ deployedState: workflow.deployedState })
  .from(workflow)
  .where(eq(workflow.id, WORKFLOW_ID))
  .limit(1)

if (!wf?.deployedState) {
  console.error('Workflow not found or has no deployedState')
  process.exit(1)
}

const ds = wf.deployedState as Record<string, any>
const block = ds?.blocks?.[BLOCK_ID]

if (!block) {
  console.error('Block not found in deployedState')
  process.exit(1)
}

const before = block.subBlocks?.chatId?.value ?? block.subBlocks?.chat_id?.value ?? '(none)'
console.log(`Before: chatId = ${JSON.stringify(before)}`)

if (block.subBlocks?.chatId) {
  block.subBlocks.chatId = { ...block.subBlocks.chatId, value: NEW_VALUE }
} else if (block.subBlocks?.chat_id) {
  block.subBlocks.chat_id = { ...block.subBlocks.chat_id, value: NEW_VALUE }
} else {
  block.subBlocks = block.subBlocks || {}
  block.subBlocks.chatId = { id: 'chatId', type: 'short-input', value: NEW_VALUE }
}

await db.update(workflow).set({ deployedState: ds }).where(eq(workflow.id, WORKFLOW_ID))

const [check] = await db
  .select({ deployedState: workflow.deployedState })
  .from(workflow)
  .where(eq(workflow.id, WORKFLOW_ID))
  .limit(1)

const after = (check.deployedState as any)?.blocks?.[BLOCK_ID]?.subBlocks?.chatId?.value ?? '(none)'

console.log(`After:  chatId = ${JSON.stringify(after)}`)
console.log('✅  deployedState patched. The fix is live immediately — no redeploy needed.')
