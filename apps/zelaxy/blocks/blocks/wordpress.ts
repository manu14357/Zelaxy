import { WordpressIcon } from '@/components/icons/wordpress-icon'
import type { BlockConfig } from '@/blocks/types'
import type { WordpressResponse } from '@/tools/wordpress/types'

export const WordpressBlock: BlockConfig<WordpressResponse> = {
  type: 'wordpress',
  name: 'WordPress',
  description: 'Manage posts on a self-hosted WordPress site',
  longDescription:
    'Create, list, retrieve, and update posts on a self-hosted WordPress site through the WordPress REST API. Authenticate with your site URL, username, and an application password.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#21759B',
  icon: WordpressIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Create post', id: 'wordpress_create_post' },
        { label: 'List posts', id: 'wordpress_list_posts' },
        { label: 'Get post', id: 'wordpress_get_post' },
        { label: 'Update post', id: 'wordpress_update_post' },
      ],
      value: () => 'wordpress_create_post',
    },
    // Get / update post
    {
      id: 'postId',
      title: 'Post ID',
      type: 'short-input',
      layout: 'half',
      placeholder: '123',
      condition: {
        field: 'operation',
        value: ['wordpress_get_post', 'wordpress_update_post'],
      },
    },
    // Create / update post
    {
      id: 'title',
      title: 'Title',
      type: 'short-input',
      layout: 'full',
      placeholder: 'My Post Title',
      condition: {
        field: 'operation',
        value: ['wordpress_create_post', 'wordpress_update_post'],
      },
    },
    {
      id: 'content',
      title: 'Content',
      type: 'long-input',
      layout: 'full',
      placeholder: '<p>Post content</p>',
      condition: {
        field: 'operation',
        value: ['wordpress_create_post', 'wordpress_update_post'],
      },
    },
    {
      id: 'status',
      title: 'Status',
      type: 'short-input',
      layout: 'half',
      placeholder: 'publish',
      condition: {
        field: 'operation',
        value: ['wordpress_create_post', 'wordpress_update_post'],
      },
    },
    // List posts
    {
      id: 'perPage',
      title: 'Per Page',
      type: 'short-input',
      layout: 'half',
      placeholder: '10',
      condition: { field: 'operation', value: 'wordpress_list_posts' },
    },
    {
      id: 'siteUrl',
      title: 'Site URL',
      type: 'short-input',
      layout: 'full',
      placeholder: 'https://example.com',
      required: true,
    },
    {
      id: 'username',
      title: 'Username',
      type: 'short-input',
      layout: 'half',
      placeholder: 'admin',
      required: true,
    },
    {
      id: 'appPassword',
      title: 'Application Password',
      type: 'short-input',
      layout: 'half',
      placeholder: 'xxxx xxxx xxxx xxxx xxxx xxxx',
      password: true,
      required: true,
    },
  ],
  tools: {
    access: [
      'wordpress_create_post',
      'wordpress_list_posts',
      'wordpress_get_post',
      'wordpress_update_post',
    ],
    config: {
      tool: (params) => params.operation || 'wordpress_create_post',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    siteUrl: { type: 'string', description: 'WordPress site URL' },
    username: { type: 'string', description: 'WordPress username' },
    appPassword: { type: 'string', description: 'WordPress application password' },
    postId: { type: 'string', description: 'Post ID' },
    title: { type: 'string', description: 'Post title' },
    content: { type: 'string', description: 'Post content' },
    status: { type: 'string', description: 'Post status' },
    perPage: { type: 'number', description: 'Number of posts per page' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object or array from WordPress' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
