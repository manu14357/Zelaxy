import { RedditIcon } from '@/components/icons'
import type { TriggerConfig } from '../types'

export const redditWebhookTrigger: TriggerConfig = {
  id: 'reddit_webhook',
  name: 'Reddit Webhook',
  provider: 'reddit',
  description: 'Trigger workflow from Reddit posts and comments via webhook forwarding',
  version: '1.0.0',
  icon: RedditIcon,

  configFields: {
    subreddit: {
      type: 'string',
      label: 'Subreddit',
      placeholder: 'e.g., programming (without /r/)',
      description: 'The subreddit to monitor for new posts or comments.',
      required: false,
    },
    eventType: {
      type: 'select',
      label: 'Event Type',
      options: ['post', 'comment', 'both'],
      defaultValue: 'post',
      description: 'Type of Reddit events to trigger on.',
      required: false,
    },
  },

  outputs: {
    post: {
      id: {
        type: 'string',
        description: 'Reddit post ID (without t3_ prefix)',
      },
      fullname: {
        type: 'string',
        description: 'Reddit post fullname (with t3_ prefix)',
      },
      title: {
        type: 'string',
        description: 'Post title',
      },
      selftext: {
        type: 'string',
        description: 'Post body text (for self/text posts)',
      },
      url: {
        type: 'string',
        description: 'URL of the post or linked content',
      },
      permalink: {
        type: 'string',
        description: 'Reddit permalink to the post',
      },
      author: {
        type: 'string',
        description: 'Post author username',
      },
      subreddit: {
        type: 'string',
        description: 'Subreddit name',
      },
      score: {
        type: 'number',
        description: 'Post score (upvotes minus downvotes)',
      },
      num_comments: {
        type: 'number',
        description: 'Number of comments on the post',
      },
      is_self: {
        type: 'boolean',
        description: 'Whether this is a self/text post',
      },
      created_utc: {
        type: 'number',
        description: 'Post creation time (Unix timestamp UTC)',
      },
      flair: {
        type: 'string',
        description: 'Post flair text (if any)',
      },
    },
  },

  instructions: [
    'Reddit does not natively support outbound webhooks. Use a service such as <a href="https://pushshift.io" target="_blank" rel="noopener noreferrer" class="text-primary underline transition-colors hover:text-primary/80">Pushshift</a>, <a href="https://zapier.com" target="_blank" rel="noopener noreferrer" class="text-primary underline transition-colors hover:text-primary/80">Zapier</a>, or <a href="https://ifttt.com" target="_blank" rel="noopener noreferrer" class="text-primary underline transition-colors hover:text-primary/80">IFTTT</a> to forward Reddit events.',
    'Alternatively, use the Reddit API directly with a scheduled poller script that sends data to the Webhook URL (from above).',
    'In Zapier: create a Zap with <strong>Reddit → New Post in Subreddit</strong> as the trigger, then use <strong>Webhooks by Zapier → POST</strong> as the action, pointing to the Webhook URL above.',
    'In IFTTT: use the Reddit trigger with the Webhooks (Make a web request) action pointing to this Webhook URL.',
  ],

  samplePayload: {
    kind: 't3',
    data: {
      id: 'abc123',
      name: 't3_abc123',
      title: 'Interesting post title',
      selftext: 'This is the body of the post.',
      url: 'https://www.reddit.com/r/programming/comments/abc123/interesting_post/',
      permalink: '/r/programming/comments/abc123/interesting_post/',
      author: 'example_user',
      subreddit: 'programming',
      subreddit_id: 't5_2fwo',
      score: 1024,
      num_comments: 42,
      is_self: true,
      created_utc: 1705312200,
      link_flair_text: 'Discussion',
    },
  },

  webhook: {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  },
}
