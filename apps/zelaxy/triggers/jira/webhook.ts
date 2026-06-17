import { JiraIcon } from '@/components/icons'
import type { TriggerConfig } from '../types'

export const jiraWebhookTrigger: TriggerConfig = {
  id: 'jira_webhook',
  name: 'Jira Webhook',
  provider: 'jira',
  description: 'Trigger workflow from Jira issue, comment, and project events',
  version: '1.0.0',
  icon: JiraIcon,

  configFields: {
    webhookSecret: {
      type: 'string',
      label: 'Webhook Secret',
      placeholder: 'Enter a secret to validate webhook requests',
      description:
        'Optional secret sent in the X-Hub-Signature header to validate that requests come from Jira.',
      required: false,
      isSecret: true,
    },
  },

  outputs: {
    event: {
      webhookEvent: {
        type: 'string',
        description:
          'Type of Jira event (e.g., jira:issue_created, jira:issue_updated, comment_created)',
      },
      issue: {
        id: {
          type: 'string',
          description: 'Issue ID',
        },
        key: {
          type: 'string',
          description: 'Issue key (e.g., PROJ-123)',
        },
        fields: {
          summary: {
            type: 'string',
            description: 'Issue summary/title',
          },
          status: {
            type: 'string',
            description: 'Current issue status',
          },
          priority: {
            type: 'string',
            description: 'Issue priority',
          },
          assignee: {
            type: 'string',
            description: 'Assignee account ID or display name',
          },
          reporter: {
            type: 'string',
            description: 'Reporter display name',
          },
          issuetype: {
            type: 'string',
            description: 'Issue type name (Bug, Story, Task, etc.)',
          },
          project: {
            type: 'string',
            description: 'Project key',
          },
          issue_description: {
            type: 'string',
            description: 'Issue description',
          },
        },
      },
      user: {
        accountId: {
          type: 'string',
          description: 'Account ID of the user who triggered the event',
        },
        displayName: {
          type: 'string',
          description: 'Display name of the user',
        },
        emailAddress: {
          type: 'string',
          description: 'Email address of the user',
        },
      },
      changelog: {
        id: {
          type: 'string',
          description: 'Changelog ID',
        },
        items: {
          type: 'json',
          description: 'Array of changed fields with from/to values',
        },
      },
      comment: {
        id: {
          type: 'string',
          description: 'Comment ID',
        },
        body: {
          type: 'string',
          description: 'Comment text',
        },
        author: {
          type: 'string',
          description: 'Comment author display name',
        },
        created: {
          type: 'string',
          description: 'Comment creation time (ISO 8601)',
        },
      },
      timestamp: {
        type: 'string',
        description: 'Event timestamp (ISO 8601)',
      },
    },
  },

  instructions: [
    'Go to your Jira instance and navigate to <strong>Settings → System → WebHooks</strong> (requires administrator access).',
    'Click <strong>Create a WebHook</strong>.',
    'Enter a name and paste the Webhook URL (from above) as the URL.',
    'Select the events you want to receive (Issues: created, updated, deleted; Comments; etc.).',
    'Optionally configure JQL filters to only receive events for specific projects or issue types.',
    'Save the webhook. Jira will now send events to your URL.',
  ],

  samplePayload: {
    timestamp: 1705312200000,
    webhookEvent: 'jira:issue_updated',
    issue_event_type_name: 'issue_updated',
    user: {
      self: 'https://example.atlassian.net/rest/api/2/user?accountId=abc123',
      accountId: 'abc123def456',
      displayName: 'John Smith',
      emailAddress: 'john@example.com',
    },
    issue: {
      id: '10001',
      self: 'https://example.atlassian.net/rest/api/2/issue/10001',
      key: 'PROJ-123',
      fields: {
        summary: 'Fix login bug',
        status: { name: 'In Progress' },
        priority: { name: 'High' },
        issuetype: { name: 'Bug' },
        assignee: { displayName: 'Jane Doe', accountId: 'xyz789' },
        reporter: { displayName: 'John Smith' },
        project: { key: 'PROJ', name: 'My Project' },
      },
    },
    changelog: {
      id: '20001',
      items: [
        {
          field: 'status',
          fieldtype: 'jira',
          from: '10000',
          fromString: 'To Do',
          to: '10001',
          toString: 'In Progress',
        },
      ],
    },
  },

  webhook: {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  },
}
