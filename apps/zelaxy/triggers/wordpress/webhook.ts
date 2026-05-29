import { WebhookIcon } from '@/components/icons'
import type { TriggerConfig } from '../types'

export const wordpressWebhookTrigger: TriggerConfig = {
  id: 'wordpress_webhook',
  name: 'WordPress Webhook',
  provider: 'wordpress',
  description:
    'Trigger workflow from WordPress post, comment, and user events via WP Webhooks plugin',
  version: '1.0.0',
  icon: WebhookIcon,

  configFields: {
    secretKey: {
      type: 'string',
      label: 'Secret Key',
      placeholder: 'Enter a secret key to validate requests',
      description:
        'Optional secret key to verify that webhook requests originate from your WordPress site.',
      required: false,
      isSecret: true,
    },
  },

  outputs: {
    event: {
      action: {
        type: 'string',
        description:
          'WordPress action that fired (e.g., post_published, post_updated, comment_post, user_register)',
      },
      post: {
        ID: {
          type: 'number',
          description: 'Post ID',
        },
        post_title: {
          type: 'string',
          description: 'Post title',
        },
        post_content: {
          type: 'string',
          description: 'Post content (HTML)',
        },
        post_excerpt: {
          type: 'string',
          description: 'Post excerpt',
        },
        post_status: {
          type: 'string',
          description: 'Post status (publish, draft, pending, etc.)',
        },
        post_type: {
          type: 'string',
          description: 'Post type (post, page, custom post type)',
        },
        post_author: {
          type: 'string',
          description: 'Post author user ID',
        },
        post_date: {
          type: 'string',
          description: 'Post publish date',
        },
        permalink: {
          type: 'string',
          description: 'Full URL to the post',
        },
        categories: {
          type: 'json',
          description: 'Array of category names',
        },
        tags: {
          type: 'json',
          description: 'Array of tag names',
        },
      },
      comment: {
        comment_ID: {
          type: 'string',
          description: 'Comment ID',
        },
        comment_author: {
          type: 'string',
          description: 'Comment author name',
        },
        comment_author_email: {
          type: 'string',
          description: 'Comment author email',
        },
        comment_content: {
          type: 'string',
          description: 'Comment text',
        },
        comment_post_ID: {
          type: 'string',
          description: 'ID of the post the comment belongs to',
        },
        comment_date: {
          type: 'string',
          description: 'Comment date',
        },
      },
      user: {
        ID: {
          type: 'number',
          description: 'User ID',
        },
        user_login: {
          type: 'string',
          description: 'Username',
        },
        user_email: {
          type: 'string',
          description: 'User email address',
        },
        display_name: {
          type: 'string',
          description: 'User display name',
        },
        roles: {
          type: 'json',
          description: 'Array of user roles',
        },
      },
    },
  },

  instructions: [
    'Install the <a href="https://wordpress.org/plugins/wp-webhooks/" target="_blank" rel="noopener noreferrer" class="text-primary underline transition-colors hover:text-primary/80">WP Webhooks</a> plugin on your WordPress site.',
    'Activate the plugin and go to <strong>Settings → WP Webhooks → Send Data</strong>.',
    'Select the WordPress action you want to trigger on (e.g., Post Published, Comment Posted).',
    'Click <strong>Add Webhook URL</strong> and enter the Webhook URL (from above).',
    'Configure any filters or mappings you need.',
    'Save the settings. WordPress will now POST event data to your webhook.',
  ],

  samplePayload: {
    action: 'post_published',
    post: {
      ID: 42,
      post_title: 'My New Blog Post',
      post_content: '<p>This is the post content.</p>',
      post_excerpt: 'A short excerpt',
      post_status: 'publish',
      post_type: 'post',
      post_author: '1',
      post_date: '2024-01-15 10:30:00',
      permalink: 'https://example.com/my-new-blog-post/',
      categories: ['News', 'Technology'],
      tags: ['web', 'development'],
    },
  },

  webhook: {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  },
}
