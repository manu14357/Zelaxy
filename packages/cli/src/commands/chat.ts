import { createInterface } from 'readline'
import chalk from 'chalk'
import type { Command } from 'commander'
import { getClient } from '../auth.js'
import { error, handleError } from '../utils.js'

export function registerChatCommands(program: Command): void {
  // ── interactive chat ─────────────────────────────────────────────────────
  program
    .command('chat')
    .description('Start an interactive chat session')
    .argument('[workflow-id]', 'Workflow ID for context')
    .option('--model <model>', 'Override model')
    .action(async (workflowId, opts) => {
      try {
        const client = getClient()

        console.log(chalk.cyan.bold('\n  Zelaxy Chat'))
        console.log(chalk.dim('  Type your message. /exit to quit, /clear to reset.\n'))

        const history: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = []
        const rl = createInterface({ input: process.stdin, output: process.stdout })

        const prompt = (): void => {
          rl.question(chalk.green('you > '), async (input) => {
            const trimmed = input.trim()
            if (!trimmed) {
              prompt()
              return
            }

            // Slash commands
            if (trimmed === '/exit' || trimmed === '/quit') {
              console.log(chalk.dim('\nGoodbye!'))
              rl.close()
              return
            }
            if (trimmed === '/clear') {
              history.length = 0
              console.log(chalk.dim('Chat history cleared.\n'))
              prompt()
              return
            }
            if (trimmed === '/history') {
              for (const msg of history) {
                const prefix = msg.role === 'user' ? chalk.green('you') : chalk.cyan('ai')
                console.log(`${prefix}: ${msg.content}`)
              }
              console.log()
              prompt()
              return
            }

            history.push({ role: 'user', content: trimmed })

            try {
              process.stdout.write(chalk.cyan('ai  > '))

              let fullResponse = ''
              for await (const chunk of client.chat.stream({
                message: trimmed,
                workflowId,
                history,
                model: opts.model,
              })) {
                process.stdout.write(chunk)
                fullResponse += chunk
              }
              console.log('\n')
              history.push({ role: 'assistant', content: fullResponse })
            } catch (err: any) {
              console.log()
              error(err.message || 'Chat error')
            }

            prompt()
          })
        }

        prompt()
      } catch (err) {
        handleError(err)
      }
    })

  // ── one-shot ask ─────────────────────────────────────────────────────────
  program
    .command('ask')
    .description('Ask a one-shot question (non-interactive)')
    .argument('<question...>', 'Your question')
    .option('--model <model>', 'Override model')
    .action(async (questionParts, opts) => {
      try {
        const client = getClient()
        const question = questionParts.join(' ')

        let fullResponse = ''
        for await (const chunk of client.chat.stream({
          message: question,
          model: opts.model,
        })) {
          process.stdout.write(chunk)
          fullResponse += chunk
        }
        console.log()
      } catch (err) {
        handleError(err)
      }
    })
}
