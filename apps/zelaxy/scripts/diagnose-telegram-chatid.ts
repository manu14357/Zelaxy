#!/usr/bin/env bun
/**
 * Diagnostic: show what chatId value is stored for every Telegram block
 * across workflowBlocks (live) and workflow.deployedState (snapshot).
 *
 * Usage:
 *   bun run apps/zelaxy/scripts/diagnose-telegram-chatid.ts
 *
 * Optional — fix the stored chatId to a dynamic reference so it always
 * uses the incoming webhook chat ID:
 *   bun run apps/zelaxy/scripts/diagnose-telegram-chatid.ts --fix
 *
 * Optional — fix to a specific static value (e.g. 5550198060):
 *   bun run apps/zelaxy/scripts/diagnose-telegram-chatid.ts --fix --value 5550198060
 */

import { and, eq, like } from 'drizzle-orm'
import { db } from '@/db'
import { workflow, workflowBlocks } from '@/db/schema'

const FIX = process.argv.includes('--fix')
const valueArgIdx = process.argv.indexOf('--value')
const FIXED_VALUE = valueArgIdx !== -1 ? process.argv[valueArgIdx + 1] : '{{webhook1.chatId}}'
const workflowArgIdx = process.argv.indexOf('--workflow-id')
const TARGET_WORKFLOW = workflowArgIdx !== -1 ? process.argv[workflowArgIdx + 1] : null

async function main() {
  console.log('🔍  Searching for Telegram blocks in workflowBlocks...\n')

  // Find all blocks whose type includes 'telegram' (covers 'telegram' tool blocks)
  const telegramBlocks = await db
    .select({
      id: workflowBlocks.id,
      workflowId: workflowBlocks.workflowId,
      name: workflowBlocks.name,
      type: workflowBlocks.type,
      subBlocks: workflowBlocks.subBlocks,
    })
    .from(workflowBlocks)
    .where(like(workflowBlocks.type, '%telegram%'))

  if (telegramBlocks.length === 0) {
    console.log('No Telegram blocks found.')
    return
  }

  for (const block of telegramBlocks) {
    if (TARGET_WORKFLOW && block.workflowId !== TARGET_WORKFLOW) continue
    const subs = (block.subBlocks as Record<string, any>) || {}
    const chatIdSub = subs.chatId || subs.chat_id
    const liveValue = chatIdSub?.value ?? '(not set)'

    console.log(`Block: ${block.name} (${block.id})`)
    console.log(`  Workflow: ${block.workflowId}`)
    console.log(`  Type:     ${block.type}`)
    console.log(`  Live chatId in workflowBlocks.subBlocks: ${JSON.stringify(liveValue)}`)

    // Also pull the deployedState for this workflow
    const [wf] = await db
      .select({ deployedState: workflow.deployedState, isDeployed: workflow.isDeployed })
      .from(workflow)
      .where(eq(workflow.id, block.workflowId))
      .limit(1)

    if (wf?.deployedState) {
      const ds = wf.deployedState as Record<string, any>
      const deployedBlock = ds?.blocks?.[block.id]
      const deployedChatId =
        deployedBlock?.subBlocks?.chatId?.value ??
        deployedBlock?.subBlocks?.chat_id?.value ??
        '(not in snapshot)'
      console.log(`  Deployed chatId in workflow.deployedState:  ${JSON.stringify(deployedChatId)}`)
      console.log(`  isDeployed: ${wf.isDeployed}`)
    } else {
      console.log('  No deployedState found (workflow not deployed yet)')
    }

    if (FIX) {
      console.log(`\n  ✏️  Applying fix: setting chatId → ${JSON.stringify(FIXED_VALUE)}`)

      const subBlockKey =
        Object.keys(subs).find((k) => k === 'chatId' || k === 'chat_id') ?? 'chatId'
      const updated = {
        ...subs,
        [subBlockKey]: {
          ...(subs[subBlockKey] || { id: subBlockKey, type: 'short-input' }),
          value: FIXED_VALUE,
        },
      }

      await db
        .update(workflowBlocks)
        .set({ subBlocks: updated, updatedAt: new Date() })
        .where(
          and(eq(workflowBlocks.id, block.id), eq(workflowBlocks.workflowId, block.workflowId))
        )

      console.log(`  ✅  workflowBlocks.subBlocks updated.`)
      console.log(
        `  ⚠️   You must REDEPLOY the workflow in the UI to capture this change in deployedState.`
      )
    }

    console.log()
  }

  if (!FIX) {
    console.log(
      'ℹ️   To fix chatId to "{{webhook1.chatId}}" (dynamic), run with --fix\n' +
        '     To fix to a static value (e.g. 5550198060), run with --fix --value 5550198060'
    )
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
