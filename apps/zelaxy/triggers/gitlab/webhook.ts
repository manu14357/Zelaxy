import { GitlabIcon } from '@/components/icons'
import type { TriggerConfig } from '../types'

export const gitlabWebhookTrigger: TriggerConfig = {
  id: 'gitlab_webhook',
  name: 'GitLab Webhook',
  provider: 'gitlab',
  description:
    'Trigger workflow from GitLab events like pushes, merge requests, issues, pipelines, and comments',
  version: '1.0.0',
  icon: GitlabIcon,

  configFields: {
    secretToken: {
      type: 'string',
      label: 'Secret Token (Recommended)',
      placeholder: 'Generate or enter a strong token',
      description:
        'GitLab sends this verbatim in the X-Gitlab-Token header. Deliveries that do not match are rejected.',
      required: false,
      isSecret: true,
    },
    sslVerification: {
      type: 'select',
      label: 'SSL Verification',
      options: ['enabled', 'disabled'],
      defaultValue: 'enabled',
      description: 'Whether GitLab verifies SSL certificates when delivering webhooks.',
      required: true,
    },
  },

  outputs: {
    // GitLab webhook payload — maps 1:1 to the actual GitLab webhook body
    object_kind: {
      type: 'string',
      description: 'Event kind (push, merge_request, issue, pipeline, note, tag_push)',
    },
    event_name: {
      type: 'string',
      description: 'Event name, generally matching object_kind (e.g., push)',
    },
    before: {
      type: 'string',
      description: 'SHA of the commit before the push',
    },
    after: {
      type: 'string',
      description: 'SHA of the commit after the push',
    },
    ref: {
      type: 'string',
      description: 'Git reference (e.g., refs/heads/main)',
    },
    checkout_sha: {
      type: 'string',
      description: 'SHA of the most recent commit on ref',
    },
    user_id: {
      type: 'number',
      description: 'ID of the user who triggered the event',
    },
    user_name: {
      type: 'string',
      description: 'Display name of the user who triggered the event',
    },
    user_username: {
      type: 'string',
      description: 'Username of the user who triggered the event',
    },
    user_email: {
      type: 'string',
      description: 'Email of the user who triggered the event',
    },
    user_avatar: {
      type: 'string',
      description: 'Avatar URL of the user who triggered the event',
    },
    project_id: {
      type: 'number',
      description: 'ID of the project the event belongs to',
    },
    project: {
      type: 'object',
      description: 'Project the event originated from',
      id: {
        type: 'number',
        description: 'Project ID',
      },
      name: {
        type: 'string',
        description: 'Project name',
      },
      web_url: {
        type: 'string',
        description: 'Project web URL',
      },
      avatar_url: {
        type: 'string',
        description: 'Project avatar URL',
      },
      git_ssh_url: {
        type: 'string',
        description: 'Project SSH clone URL',
      },
      git_http_url: {
        type: 'string',
        description: 'Project HTTP clone URL',
      },
      namespace: {
        type: 'string',
        description: 'Project namespace',
      },
      path_with_namespace: {
        type: 'string',
        description: 'Full project path (namespace/project)',
      },
      default_branch: {
        type: 'string',
        description: 'Default branch name',
      },
      visibility_level: {
        type: 'number',
        description: 'Visibility level (0 private, 10 internal, 20 public)',
      },
    },
    repository: {
      type: 'object',
      description: 'Repository information',
      name: {
        type: 'string',
        description: 'Repository name',
      },
      url: {
        type: 'string',
        description: 'Repository URL',
      },
      homepage: {
        type: 'string',
        description: 'Repository homepage',
      },
    },
    commits: {
      type: 'array',
      description: 'Commits included in the push',
      id: {
        type: 'string',
        description: 'Commit SHA',
      },
      message: {
        type: 'string',
        description: 'Commit message',
      },
      title: {
        type: 'string',
        description: 'Commit title',
      },
      timestamp: {
        type: 'string',
        description: 'Commit timestamp',
      },
      url: {
        type: 'string',
        description: 'Commit URL',
      },
      author: {
        type: 'object',
        description: 'Commit author',
        name: {
          type: 'string',
          description: 'Author name',
        },
        email: {
          type: 'string',
          description: 'Author email',
        },
      },
      added: {
        type: 'array',
        description: 'Files added in the commit',
      },
      modified: {
        type: 'array',
        description: 'Files modified in the commit',
      },
      removed: {
        type: 'array',
        description: 'Files removed in the commit',
      },
    },
    total_commits_count: {
      type: 'number',
      description: 'Total number of commits in the push',
    },
    object_attributes: {
      type: 'object',
      description:
        'Details of the changed object for merge request, issue, pipeline, and note events',
      id: {
        type: 'number',
        description: 'Object ID',
      },
      iid: {
        type: 'number',
        description: 'Project-scoped object ID (e.g., MR or issue number)',
      },
      title: {
        type: 'string',
        description: 'Object title',
      },
      state: {
        type: 'string',
        description: 'Object state (e.g., opened, closed, merged)',
      },
      action: {
        type: 'string',
        description: 'Action performed (e.g., open, update, merge, close)',
      },
      url: {
        type: 'string',
        description: 'Object URL',
      },
      source_branch: {
        type: 'string',
        description: 'Source branch (merge request events)',
      },
      target_branch: {
        type: 'string',
        description: 'Target branch (merge request events)',
      },
      note: {
        type: 'string',
        description: 'Comment body (note events)',
      },
      status: {
        type: 'string',
        description: 'Pipeline status (pipeline events)',
      },
    },
    user: {
      type: 'object',
      description: 'User associated with merge request, issue, and note events',
      id: {
        type: 'number',
        description: 'User ID',
      },
      name: {
        type: 'string',
        description: 'User display name',
      },
      username: {
        type: 'string',
        description: 'Username',
      },
      avatar_url: {
        type: 'string',
        description: 'User avatar URL',
      },
    },

    // Convenient flat fields for easy access
    event_type: {
      type: 'string',
      description: 'Value of the X-Gitlab-Event header (e.g., Push Hook)',
    },
    action: {
      type: 'string',
      description: 'Action from object_attributes (e.g., open, merge, close)',
    },
    branch: {
      type: 'string',
      description: 'Branch name extracted from ref',
    },
  },

  instructions: [
    'Go to your GitLab Project > Settings > Webhooks.',
    'Click "Add new webhook".',
    'Paste the <strong>Webhook URL</strong> (from above) into the "URL" field.',
    'Enter the <strong>Secret Token</strong> (from above) into the "Secret token" field if you\'ve configured one.',
    'Under "Trigger", select the events you want to receive (e.g., Push events, Merge request events, Issues events).',
    'Set "Enable SSL verification" according to your selection above.',
    'Click "Add webhook", then use "Test" to send a sample delivery.',
  ],

  samplePayload: {
    object_kind: 'push',
    event_name: 'push',
    before: '95790bf891e76fee5e1747ab589903a6a1f80f22',
    after: 'da1560886d4f094c3e6c9ef40349f7d38b5d27d7',
    ref: 'refs/heads/main',
    checkout_sha: 'da1560886d4f094c3e6c9ef40349f7d38b5d27d7',
    user_id: 4,
    user_name: 'John Smith',
    user_username: 'jsmith',
    user_email: 'john@example.com',
    project_id: 15,
    project: {
      id: 15,
      name: 'Diaspora',
      web_url: 'http://example.com/mike/diaspora',
      namespace: 'Mike',
      path_with_namespace: 'mike/diaspora',
      default_branch: 'main',
      visibility_level: 0,
    },
    repository: {
      name: 'Diaspora',
      url: 'git@example.com:mike/diaspora.git',
      description: '',
      homepage: 'http://example.com/mike/diaspora',
    },
    commits: [
      {
        id: 'da1560886d4f094c3e6c9ef40349f7d38b5d27d7',
        message: 'fix: correct minor typos in readme\n',
        title: 'fix: correct minor typos in readme',
        timestamp: '2024-01-15T13:14:15+01:00',
        url: 'http://example.com/mike/diaspora/-/commit/da1560886d4f094c3e6c9ef40349f7d38b5d27d7',
        author: {
          name: 'John Smith',
          email: 'john@example.com',
        },
        added: [],
        modified: ['README.md'],
        removed: [],
      },
    ],
    total_commits_count: 1,
  },

  webhook: {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Gitlab-Event': 'Push Hook',
      'X-Gitlab-Token': 'your-secret-token',
    },
  },
}
