#!/usr/bin/env node

import { Command } from 'commander'
import { registerAgentCommands } from './commands/agents.js'
import { registerAuthCommands } from './commands/auth.js'
import { registerChatCommands } from './commands/chat.js'
import { registerKeyCommands } from './commands/keys.js'
import { registerKnowledgeCommands } from './commands/knowledge.js'
import { registerMcpCommands } from './commands/mcp.js'
import { registerOrgCommands } from './commands/orgs.js'
import { registerScheduleCommands } from './commands/schedules.js'
import { registerSponsorCommands } from './commands/sponsors.js'
import { registerStatusCommand } from './commands/status.js'
import { registerTemplateCommands } from './commands/templates.js'
import { registerToolsCommands } from './commands/tools.js'
import { registerWebhookCommands } from './commands/webhooks.js'
import { registerWorkflowCommands } from './commands/workflows.js'

const program = new Command()

program
  .name('zelaxy')
  .description('Zelaxy CLI — Manage workflows, agents, chat, knowledge, tools, and more')
  .version('0.2.0')

registerAuthCommands(program)
registerWorkflowCommands(program)
registerAgentCommands(program)
registerChatCommands(program)
registerKnowledgeCommands(program)
registerToolsCommands(program)
registerMcpCommands(program)
registerWebhookCommands(program)
registerScheduleCommands(program)
registerOrgCommands(program)
registerKeyCommands(program)
registerTemplateCommands(program)
registerStatusCommand(program)
registerSponsorCommands(program)

program.parse()
