/**
 * Workflow Templates for Agie AI Copilot
 * Pre-built workflow templates that users can quickly deploy
 */

export interface WorkflowTemplate {
  id: string
  name: string
  description: string
  category: 'automation' | 'integration' | 'ai' | 'notification' | 'data'
  complexity: 'simple' | 'medium' | 'advanced'
  estimatedTime: string
  tags: string[]
  blocks: TemplateBlock[]
  connections: TemplateConnection[]
}

export interface TemplateBlock {
  id: string
  type: string
  name: string
  config: Record<string, any>
  position: { x: number; y: number }
}

export interface TemplateConnection {
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
}

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  // Email Automation Templates
  {
    id: 'email-auto-response',
    name: 'Email Auto-Response',
    description: 'Automatically respond to incoming emails based on content analysis using AI',
    category: 'automation',
    complexity: 'medium',
    estimatedTime: '5-10 min',
    tags: ['email', 'ai', 'automation', 'gmail', 'outlook'],
    blocks: [
      {
        id: 'trigger-1',
        type: 'trigger',
        name: 'Email Trigger',
        config: {
          triggerType: 'email',
          provider: 'gmail',
          event: 'new_email',
        },
        position: { x: 100, y: 200 },
      },
      {
        id: 'agent-1',
        type: 'agent',
        name: 'Analyze Email',
        config: {
          systemPrompt:
            'Analyze the incoming email and determine the appropriate response category: inquiry, complaint, support, or other. Extract key information.',
          model: 'claude-3-7-sonnet-latest',
          outputFormat: 'json',
        },
        position: { x: 350, y: 200 },
      },
      {
        id: 'condition-1',
        type: 'condition',
        name: 'Route by Category',
        config: {
          conditions: [
            { name: 'Support', expression: '{{agent-1.category}} === "support"' },
            { name: 'Inquiry', expression: '{{agent-1.category}} === "inquiry"' },
            { name: 'Other', expression: 'true' },
          ],
        },
        position: { x: 600, y: 200 },
      },
      {
        id: 'agent-2',
        type: 'agent',
        name: 'Generate Response',
        config: {
          systemPrompt:
            'Generate a professional and helpful email response based on the analysis. Be polite, clear, and address the specific concerns raised.',
          model: 'claude-3-7-sonnet-latest',
        },
        position: { x: 850, y: 200 },
      },
      {
        id: 'gmail-1',
        type: 'gmail',
        name: 'Send Reply',
        config: {
          operation: 'send',
          to: '{{trigger-1.from}}',
          subject: 'Re: {{trigger-1.subject}}',
          body: '{{agent-2.response}}',
        },
        position: { x: 1100, y: 200 },
      },
    ],
    connections: [
      { source: 'trigger-1', target: 'agent-1' },
      { source: 'agent-1', target: 'condition-1' },
      { source: 'condition-1', target: 'agent-2', sourceHandle: 'support' },
      { source: 'condition-1', target: 'agent-2', sourceHandle: 'inquiry' },
      { source: 'agent-2', target: 'gmail-1' },
    ],
  },

  // Slack Notification Bot
  {
    id: 'slack-daily-summary',
    name: 'Daily Summary Bot',
    description: 'Sends AI-generated daily summaries to Slack channels',
    category: 'notification',
    complexity: 'simple',
    estimatedTime: '3-5 min',
    tags: ['slack', 'ai', 'summary', 'scheduled'],
    blocks: [
      {
        id: 'trigger-1',
        type: 'trigger',
        name: 'Schedule Trigger',
        config: {
          triggerType: 'schedule',
          schedule: '0 9 * * *', // 9 AM daily
        },
        position: { x: 100, y: 200 },
      },
      {
        id: 'api-1',
        type: 'api',
        name: 'Fetch Data',
        config: {
          method: 'GET',
          url: '{{env.DATA_SOURCE_URL}}',
        },
        position: { x: 350, y: 200 },
      },
      {
        id: 'agent-1',
        type: 'agent',
        name: 'Generate Summary',
        config: {
          systemPrompt:
            'Create a concise, bullet-point summary of the provided data. Highlight key metrics, important updates, and action items.',
          model: 'claude-3-7-sonnet-latest',
        },
        position: { x: 600, y: 200 },
      },
      {
        id: 'slack-1',
        type: 'slack',
        name: 'Post to Slack',
        config: {
          operation: 'send_message',
          channel: '{{env.SLACK_CHANNEL}}',
          message: '📊 *Daily Summary*\n\n{{agent-1.summary}}',
        },
        position: { x: 850, y: 200 },
      },
    ],
    connections: [
      { source: 'trigger-1', target: 'api-1' },
      { source: 'api-1', target: 'agent-1' },
      { source: 'agent-1', target: 'slack-1' },
    ],
  },

  // Data Processing Pipeline
  {
    id: 'csv-data-processor',
    name: 'CSV Data Processor',
    description: 'Process CSV files, analyze with AI, and store results',
    category: 'data',
    complexity: 'medium',
    estimatedTime: '5-10 min',
    tags: ['csv', 'data', 'ai', 'analysis'],
    blocks: [
      {
        id: 'trigger-1',
        type: 'trigger',
        name: 'File Upload Trigger',
        config: {
          triggerType: 'webhook',
          event: 'file_uploaded',
        },
        position: { x: 100, y: 200 },
      },
      {
        id: 'function-1',
        type: 'function',
        name: 'Parse CSV',
        config: {
          code: `
const rows = input.csv.split('\\n').map(row => row.split(','));
const headers = rows[0];
const data = rows.slice(1).map(row => {
  const obj = {};
  headers.forEach((h, i) => obj[h.trim()] = row[i]?.trim());
  return obj;
});
return { data, rowCount: data.length, headers };
          `,
        },
        position: { x: 350, y: 200 },
      },
      {
        id: 'agent-1',
        type: 'agent',
        name: 'Analyze Data',
        config: {
          systemPrompt:
            'Analyze this dataset and provide insights: summary statistics, trends, anomalies, and recommendations.',
          model: 'claude-3-7-sonnet-latest',
        },
        position: { x: 600, y: 200 },
      },
      {
        id: 'response-1',
        type: 'response',
        name: 'Return Results',
        config: {
          statusCode: 200,
          body: {
            analysis: '{{agent-1.analysis}}',
            rowCount: '{{function-1.rowCount}}',
          },
        },
        position: { x: 850, y: 200 },
      },
    ],
    connections: [
      { source: 'trigger-1', target: 'function-1' },
      { source: 'function-1', target: 'agent-1' },
      { source: 'agent-1', target: 'response-1' },
    ],
  },

  // GitHub Issue Handler
  {
    id: 'github-issue-triage',
    name: 'GitHub Issue Triage',
    description: 'Automatically label and assign GitHub issues using AI',
    category: 'integration',
    complexity: 'medium',
    estimatedTime: '5-10 min',
    tags: ['github', 'ai', 'automation', 'issues'],
    blocks: [
      {
        id: 'trigger-1',
        type: 'trigger',
        name: 'GitHub Webhook',
        config: {
          triggerType: 'webhook',
          event: 'issues.opened',
        },
        position: { x: 100, y: 200 },
      },
      {
        id: 'agent-1',
        type: 'agent',
        name: 'Classify Issue',
        config: {
          systemPrompt: `Analyze this GitHub issue and classify it:
1. Type: bug, feature, question, documentation
2. Priority: critical, high, medium, low  
3. Component: frontend, backend, api, database, other
4. Suggested assignee based on component
Return as JSON.`,
          model: 'claude-3-7-sonnet-latest',
          outputFormat: 'json',
        },
        position: { x: 350, y: 200 },
      },
      {
        id: 'github-1',
        type: 'github',
        name: 'Add Labels',
        config: {
          operation: 'add_labels',
          owner: '{{trigger-1.repository.owner.login}}',
          repo: '{{trigger-1.repository.name}}',
          issueNumber: '{{trigger-1.issue.number}}',
          labels: ['{{agent-1.type}}', 'priority:{{agent-1.priority}}'],
        },
        position: { x: 600, y: 200 },
      },
      {
        id: 'github-2',
        type: 'github',
        name: 'Post Comment',
        config: {
          operation: 'create_comment',
          owner: '{{trigger-1.repository.owner.login}}',
          repo: '{{trigger-1.repository.name}}',
          issueNumber: '{{trigger-1.issue.number}}',
          body: '🤖 Auto-triage: This issue has been classified as **{{agent-1.type}}** with **{{agent-1.priority}}** priority.',
        },
        position: { x: 850, y: 200 },
      },
    ],
    connections: [
      { source: 'trigger-1', target: 'agent-1' },
      { source: 'agent-1', target: 'github-1' },
      { source: 'github-1', target: 'github-2' },
    ],
  },

  // Simple Chat Bot
  {
    id: 'simple-chatbot',
    name: 'Simple AI Chatbot',
    description: 'A basic conversational AI chatbot endpoint',
    category: 'ai',
    complexity: 'simple',
    estimatedTime: '2-3 min',
    tags: ['chatbot', 'ai', 'api', 'conversation'],
    blocks: [
      {
        id: 'trigger-1',
        type: 'trigger',
        name: 'API Endpoint',
        config: {
          triggerType: 'webhook',
          method: 'POST',
          path: '/chat',
        },
        position: { x: 100, y: 200 },
      },
      {
        id: 'agent-1',
        type: 'agent',
        name: 'AI Assistant',
        config: {
          systemPrompt: 'You are a helpful AI assistant. Be concise, friendly, and informative.',
          model: 'claude-3-7-sonnet-latest',
          temperature: 0.7,
        },
        position: { x: 350, y: 200 },
      },
      {
        id: 'response-1',
        type: 'response',
        name: 'Send Response',
        config: {
          statusCode: 200,
          body: {
            response: '{{agent-1.response}}',
            timestamp: '{{now}}',
          },
        },
        position: { x: 600, y: 200 },
      },
    ],
    connections: [
      { source: 'trigger-1', target: 'agent-1' },
      { source: 'agent-1', target: 'response-1' },
    ],
  },

  // Lead Qualification
  {
    id: 'lead-qualifier',
    name: 'AI Lead Qualifier',
    description: 'Qualify incoming leads using AI and route to appropriate sales rep',
    category: 'automation',
    complexity: 'advanced',
    estimatedTime: '10-15 min',
    tags: ['sales', 'ai', 'crm', 'lead', 'automation'],
    blocks: [
      {
        id: 'trigger-1',
        type: 'trigger',
        name: 'Form Submission',
        config: {
          triggerType: 'webhook',
          event: 'form_submitted',
        },
        position: { x: 100, y: 200 },
      },
      {
        id: 'agent-1',
        type: 'agent',
        name: 'Qualify Lead',
        config: {
          systemPrompt: `Score this lead from 1-100 based on:
- Company size and industry fit
- Budget indicators
- Timeline urgency
- Decision-making authority
Return: score, tier (hot/warm/cold), reasoning, recommended_action`,
          model: 'claude-3-7-sonnet-latest',
          outputFormat: 'json',
        },
        position: { x: 350, y: 200 },
      },
      {
        id: 'condition-1',
        type: 'condition',
        name: 'Route by Score',
        config: {
          conditions: [
            { name: 'Hot Lead', expression: '{{agent-1.score}} >= 80' },
            { name: 'Warm Lead', expression: '{{agent-1.score}} >= 50' },
            { name: 'Cold Lead', expression: 'true' },
          ],
        },
        position: { x: 600, y: 200 },
      },
      {
        id: 'slack-1',
        type: 'slack',
        name: 'Alert Sales (Hot)',
        config: {
          operation: 'send_message',
          channel: '#sales-urgent',
          message: '🔥 Hot lead incoming! Score: {{agent-1.score}}\n{{agent-1.reasoning}}',
        },
        position: { x: 850, y: 100 },
      },
      {
        id: 'gmail-1',
        type: 'gmail',
        name: 'Nurture Email',
        config: {
          operation: 'send',
          to: '{{trigger-1.email}}',
          subject: 'Thanks for your interest!',
          body: 'Auto-generated nurture email',
        },
        position: { x: 850, y: 300 },
      },
    ],
    connections: [
      { source: 'trigger-1', target: 'agent-1' },
      { source: 'agent-1', target: 'condition-1' },
      { source: 'condition-1', target: 'slack-1', sourceHandle: 'hot' },
      { source: 'condition-1', target: 'gmail-1', sourceHandle: 'cold' },
    ],
  },
]

/**
 * Get all available workflow templates
 */
export function getWorkflowTemplates(): WorkflowTemplate[] {
  return WORKFLOW_TEMPLATES
}

/**
 * Get templates filtered by category
 */
export function getTemplatesByCategory(category: WorkflowTemplate['category']): WorkflowTemplate[] {
  return WORKFLOW_TEMPLATES.filter((t) => t.category === category)
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): WorkflowTemplate | undefined {
  return WORKFLOW_TEMPLATES.find((t) => t.id === id)
}

/**
 * Search templates by tags or name
 */
export function searchTemplates(query: string): WorkflowTemplate[] {
  const lowerQuery = query.toLowerCase()
  return WORKFLOW_TEMPLATES.filter(
    (t) =>
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery) ||
      t.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
  )
}

/**
 * Get suggested templates based on user intent
 */
export function suggestTemplates(intent: string): WorkflowTemplate[] {
  const keywords: Record<string, string[]> = {
    email: ['email', 'gmail', 'outlook', 'mail', 'message'],
    notification: ['slack', 'notify', 'alert', 'notification', 'message'],
    data: ['csv', 'data', 'process', 'analyze', 'file'],
    github: ['github', 'issue', 'pr', 'pull request', 'code'],
    chat: ['chat', 'bot', 'chatbot', 'conversation', 'assistant'],
    sales: ['lead', 'sales', 'crm', 'qualify', 'customer'],
  }

  const lowerIntent = intent.toLowerCase()
  const matchedCategories = new Set<string>()

  for (const [category, kws] of Object.entries(keywords)) {
    if (kws.some((kw) => lowerIntent.includes(kw))) {
      matchedCategories.add(category)
    }
  }

  if (matchedCategories.size === 0) {
    // Return popular templates if no match
    return WORKFLOW_TEMPLATES.slice(0, 3)
  }

  return WORKFLOW_TEMPLATES.filter((t) =>
    t.tags.some(
      (tag) =>
        matchedCategories.has(tag) || Array.from(matchedCategories).some((c) => tag.includes(c))
    )
  )
}
