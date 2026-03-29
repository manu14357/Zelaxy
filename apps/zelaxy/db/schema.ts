import { type SQL, sql } from 'drizzle-orm'
import {
  boolean,
  check,
  customType,
  decimal,
  index,
  integer,
  json,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  vector,
} from 'drizzle-orm/pg-core'
import { DEFAULT_FREE_CREDITS } from '@/lib/billing/constants'
import { TAG_SLOTS } from '@/lib/constants/knowledge'

// Custom tsvector type for full-text search
export const tsvector = customType<{
  data: string
}>({
  dataType() {
    return `tsvector`
  },
})

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull(),
  image: text('image'),
  bio: text('bio'),
  company: text('company'),
  location: text('location'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  stripeCustomerId: text('stripe_customer_id'),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  activeOrganizationId: text('active_organization_id').references(() => organization.id, {
    onDelete: 'set null',
  }),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
})

export const workflowFolder = pgTable(
  'workflow_folder',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspace.id, { onDelete: 'cascade' }),
    parentId: text('parent_id'), // Self-reference will be handled by foreign key constraint
    color: text('color').default('#6B7280'),
    isExpanded: boolean('is_expanded').notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index('workflow_folder_user_idx').on(table.userId),
    workspaceParentIdx: index('workflow_folder_workspace_parent_idx').on(
      table.workspaceId,
      table.parentId
    ),
    parentSortIdx: index('workflow_folder_parent_sort_idx').on(table.parentId, table.sortOrder),
  })
)

export const workflow = pgTable(
  'workflow',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    workspaceId: text('workspace_id').references(() => workspace.id, { onDelete: 'cascade' }),
    folderId: text('folder_id').references(() => workflowFolder.id, { onDelete: 'set null' }),
    name: text('name').notNull(),
    description: text('description'),
    // DEPRECATED: Use normalized tables (workflow_blocks, workflow_edges, workflow_subflows) instead
    state: json('state').notNull(),
    color: text('color').notNull().default('#3972F6'),
    lastSynced: timestamp('last_synced').notNull(),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
    isDeployed: boolean('is_deployed').notNull().default(false),
    deployedState: json('deployed_state'),
    deployedAt: timestamp('deployed_at'),
    // When set, only this API key is authorized for execution
    pinnedApiKey: text('pinned_api_key'),
    collaborators: json('collaborators').notNull().default('[]'),
    runCount: integer('run_count').notNull().default(0),
    lastRunAt: timestamp('last_run_at'),
    variables: json('variables').default('{}'),
    isPublished: boolean('is_published').notNull().default(false),
    marketplaceData: json('marketplace_data'),
  },
  (table) => ({
    userIdIdx: index('workflow_user_id_idx').on(table.userId),
    workspaceIdIdx: index('workflow_workspace_id_idx').on(table.workspaceId),
    userWorkspaceIdx: index('workflow_user_workspace_idx').on(table.userId, table.workspaceId),
  })
)

export const workflowBlocks = pgTable(
  'workflow_blocks',
  {
    id: text('id').primaryKey(),
    workflowId: text('workflow_id')
      .notNull()
      .references(() => workflow.id, { onDelete: 'cascade' }),

    type: text('type').notNull(), // 'starter', 'agent', 'api', 'function'
    name: text('name').notNull(),

    positionX: decimal('position_x').notNull(),
    positionY: decimal('position_y').notNull(),

    enabled: boolean('enabled').notNull().default(true),
    horizontalHandles: boolean('horizontal_handles').notNull().default(true),
    isWide: boolean('is_wide').notNull().default(false),
    advancedMode: boolean('advanced_mode').notNull().default(false),
    triggerMode: boolean('trigger_mode').notNull().default(false),
    height: decimal('height').notNull().default('0'),

    subBlocks: jsonb('sub_blocks').notNull().default('{}'),
    outputs: jsonb('outputs').notNull().default('{}'),
    data: jsonb('data').default('{}'),

    parentId: text('parent_id'),
    extent: text('extent'), // 'parent' or null or 'subflow'

    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    workflowIdIdx: index('workflow_blocks_workflow_id_idx').on(table.workflowId),
    parentIdIdx: index('workflow_blocks_parent_id_idx').on(table.parentId),
    workflowParentIdx: index('workflow_blocks_workflow_parent_idx').on(
      table.workflowId,
      table.parentId
    ),
    workflowTypeIdx: index('workflow_blocks_workflow_type_idx').on(table.workflowId, table.type),
  })
)

export const workflowEdges = pgTable(
  'workflow_edges',
  {
    id: text('id').primaryKey(),
    workflowId: text('workflow_id')
      .notNull()
      .references(() => workflow.id, { onDelete: 'cascade' }),

    sourceBlockId: text('source_block_id')
      .notNull()
      .references(() => workflowBlocks.id, { onDelete: 'cascade' }),
    targetBlockId: text('target_block_id')
      .notNull()
      .references(() => workflowBlocks.id, { onDelete: 'cascade' }),
    sourceHandle: text('source_handle'),
    targetHandle: text('target_handle'),

    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    workflowIdIdx: index('workflow_edges_workflow_id_idx').on(table.workflowId),
    sourceBlockIdx: index('workflow_edges_source_block_idx').on(table.sourceBlockId),
    targetBlockIdx: index('workflow_edges_target_block_idx').on(table.targetBlockId),
    workflowSourceIdx: index('workflow_edges_workflow_source_idx').on(
      table.workflowId,
      table.sourceBlockId
    ),
    workflowTargetIdx: index('workflow_edges_workflow_target_idx').on(
      table.workflowId,
      table.targetBlockId
    ),
  })
)

export const workflowSubflows = pgTable(
  'workflow_subflows',
  {
    id: text('id').primaryKey(),
    workflowId: text('workflow_id')
      .notNull()
      .references(() => workflow.id, { onDelete: 'cascade' }),

    type: text('type').notNull(), // 'loop' or 'parallel'
    config: jsonb('config').notNull().default('{}'),

    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    workflowIdIdx: index('workflow_subflows_workflow_id_idx').on(table.workflowId),
    workflowTypeIdx: index('workflow_subflows_workflow_type_idx').on(table.workflowId, table.type),
  })
)

export const waitlist = pgTable('waitlist', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  status: text('status').notNull().default('pending'), // pending, approved, rejected
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const workflowExecutionSnapshots = pgTable(
  'workflow_execution_snapshots',
  {
    id: text('id').primaryKey(),
    workflowId: text('workflow_id')
      .notNull()
      .references(() => workflow.id, { onDelete: 'cascade' }),
    stateHash: text('state_hash').notNull(),
    stateData: jsonb('state_data').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    workflowIdIdx: index('workflow_snapshots_workflow_id_idx').on(table.workflowId),
    stateHashIdx: index('workflow_snapshots_hash_idx').on(table.stateHash),
    workflowHashUnique: uniqueIndex('workflow_snapshots_workflow_hash_idx').on(
      table.workflowId,
      table.stateHash
    ),
    createdAtIdx: index('workflow_snapshots_created_at_idx').on(table.createdAt),
  })
)

export const workflowExecutionLogs = pgTable(
  'workflow_execution_logs',
  {
    id: text('id').primaryKey(),
    workflowId: text('workflow_id')
      .notNull()
      .references(() => workflow.id, { onDelete: 'cascade' }),
    executionId: text('execution_id').notNull(),
    stateSnapshotId: text('state_snapshot_id')
      .notNull()
      .references(() => workflowExecutionSnapshots.id),

    level: text('level').notNull(), // 'info', 'error'
    message: text('message').notNull(),
    trigger: text('trigger').notNull(), // 'api', 'webhook', 'schedule', 'manual', 'chat'

    startedAt: timestamp('started_at').notNull(),
    endedAt: timestamp('ended_at'),
    totalDurationMs: integer('total_duration_ms'),

    blockCount: integer('block_count').notNull().default(0),
    successCount: integer('success_count').notNull().default(0),
    errorCount: integer('error_count').notNull().default(0),
    skippedCount: integer('skipped_count').notNull().default(0),

    totalCost: decimal('total_cost', { precision: 10, scale: 6 }),
    totalInputCost: decimal('total_input_cost', { precision: 10, scale: 6 }),
    totalOutputCost: decimal('total_output_cost', { precision: 10, scale: 6 }),
    totalTokens: integer('total_tokens'),

    metadata: jsonb('metadata').notNull().default('{}'),
    files: jsonb('files'), // File metadata for execution files
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    workflowIdIdx: index('workflow_execution_logs_workflow_id_idx').on(table.workflowId),
    executionIdIdx: index('workflow_execution_logs_execution_id_idx').on(table.executionId),
    triggerIdx: index('workflow_execution_logs_trigger_idx').on(table.trigger),
    levelIdx: index('workflow_execution_logs_level_idx').on(table.level),
    startedAtIdx: index('workflow_execution_logs_started_at_idx').on(table.startedAt),
    executionIdUnique: uniqueIndex('workflow_execution_logs_execution_id_unique').on(
      table.executionId
    ),
    // Composite index for the new join-based query pattern
    workflowStartedAtIdx: index('workflow_execution_logs_workflow_started_at_idx').on(
      table.workflowId,
      table.startedAt
    ),
  })
)

export const environment = pgTable('environment', {
  id: text('id').primaryKey(), // Use the user id as the key
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' })
    .unique(), // One environment per user
  variables: json('variables').notNull(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const settings = pgTable('settings', {
  id: text('id').primaryKey(), // Use the user id as the key
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' })
    .unique(), // One settings record per user

  // General settings
  theme: text('theme').notNull().default('system'),
  autoConnect: boolean('auto_connect').notNull().default(true),
  autoFillEnvVars: boolean('auto_fill_env_vars').notNull().default(true), // DEPRECATED: autofill feature removed
  autoPan: boolean('auto_pan').notNull().default(true),
  consoleExpandedByDefault: boolean('console_expanded_by_default').notNull().default(true),

  // Privacy settings
  telemetryEnabled: boolean('telemetry_enabled').notNull().default(false),
  telemetryNotifiedUser: boolean('telemetry_notified_user').notNull().default(true),

  // Email preferences
  emailPreferences: json('email_preferences').notNull().default('{}'),

  // Keep general for future flexible settings
  general: json('general').notNull().default('{}'),

  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const workflowSchedule = pgTable(
  'workflow_schedule',
  {
    id: text('id').primaryKey(),
    workflowId: text('workflow_id')
      .notNull()
      .references(() => workflow.id, { onDelete: 'cascade' }),
    blockId: text('block_id').references(() => workflowBlocks.id, { onDelete: 'cascade' }),
    cronExpression: text('cron_expression'),
    nextRunAt: timestamp('next_run_at'),
    lastRanAt: timestamp('last_ran_at'),
    triggerType: text('trigger_type').notNull(), // "manual", "webhook", "schedule"
    timezone: text('timezone').notNull().default('UTC'),
    failedCount: integer('failed_count').notNull().default(0), // Track consecutive failures
    status: text('status').notNull().default('active'), // 'active' or 'disabled'
    lastFailedAt: timestamp('last_failed_at'), // When the schedule last failed
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => {
    return {
      workflowBlockUnique: uniqueIndex('workflow_schedule_workflow_block_unique').on(
        table.workflowId,
        table.blockId
      ),
    }
  }
)

export const webhook = pgTable(
  'webhook',
  {
    id: text('id').primaryKey(),
    workflowId: text('workflow_id')
      .notNull()
      .references(() => workflow.id, { onDelete: 'cascade' }),
    blockId: text('block_id').references(() => workflowBlocks.id, { onDelete: 'cascade' }), // ID of the webhook trigger block (nullable for legacy starter block webhooks)
    path: text('path').notNull(),
    provider: text('provider'), // e.g., "whatsapp", "github", etc.
    providerConfig: json('provider_config'), // Store provider-specific configuration
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => {
    return {
      // Ensure webhook paths are unique
      pathIdx: uniqueIndex('path_idx').on(table.path),
    }
  }
)

export const apiKey = pgTable(
  'api_key',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    organizationId: text('organization_id').references(() => organization.id, {
      onDelete: 'set null',
    }),
    name: text('name').notNull(),
    key: text('key').notNull().unique(),
    lastUsed: timestamp('last_used'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    expiresAt: timestamp('expires_at'),
  },
  (table) => ({
    userIdIdx: index('api_key_user_id_idx').on(table.userId),
    organizationIdIdx: index('api_key_organization_id_idx').on(table.organizationId),
  })
)

export const marketplace = pgTable('marketplace', {
  id: text('id').primaryKey(),
  workflowId: text('workflow_id')
    .notNull()
    .references(() => workflow.id, { onDelete: 'cascade' }),
  state: json('state').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  authorId: text('author_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  authorName: text('author_name').notNull(),
  views: integer('views').notNull().default(0),
  category: text('category'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const userStats = pgTable('user_stats', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' })
    .unique(), // One record per user
  totalManualExecutions: integer('total_manual_executions').notNull().default(0),
  totalApiCalls: integer('total_api_calls').notNull().default(0),
  totalWebhookTriggers: integer('total_webhook_triggers').notNull().default(0),
  totalScheduledExecutions: integer('total_scheduled_executions').notNull().default(0),
  totalChatExecutions: integer('total_chat_executions').notNull().default(0),
  totalTokensUsed: integer('total_tokens_used').notNull().default(0),
  totalCost: decimal('total_cost').notNull().default('0'),
  currentUsageLimit: decimal('current_usage_limit')
    .notNull()
    .default(DEFAULT_FREE_CREDITS.toString()), // Default $10 for free plan
  usageLimitSetBy: text('usage_limit_set_by'), // User ID who set the limit (for team admin tracking)
  usageLimitUpdatedAt: timestamp('usage_limit_updated_at').defaultNow(),
  // Billing period tracking
  currentPeriodCost: decimal('current_period_cost').notNull().default('0'), // Usage in current billing period
  billingPeriodStart: timestamp('billing_period_start').defaultNow(), // When current billing period started
  billingPeriodEnd: timestamp('billing_period_end'), // When current billing period ends
  lastPeriodCost: decimal('last_period_cost').default('0'), // Usage from previous billing period
  lastActive: timestamp('last_active').notNull().defaultNow(),
})

export const customTools = pgTable('custom_tools', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  schema: json('schema').notNull(),
  code: text('code').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const subscription = pgTable(
  'subscription',
  {
    id: text('id').primaryKey(),
    plan: text('plan').notNull(),
    referenceId: text('reference_id').notNull(),
    stripeCustomerId: text('stripe_customer_id'),
    stripeSubscriptionId: text('stripe_subscription_id'),
    status: text('status'),
    periodStart: timestamp('period_start'),
    periodEnd: timestamp('period_end'),
    cancelAtPeriodEnd: boolean('cancel_at_period_end'),
    seats: integer('seats'),
    trialStart: timestamp('trial_start'),
    trialEnd: timestamp('trial_end'),
    metadata: json('metadata'),
  },
  (table) => ({
    referenceStatusIdx: index('subscription_reference_status_idx').on(
      table.referenceId,
      table.status
    ),
    enterpriseMetadataCheck: check(
      'check_enterprise_metadata',
      sql`plan != 'enterprise' OR (metadata IS NOT NULL AND (metadata->>'perSeatAllowance' IS NOT NULL OR metadata->>'totalAllowance' IS NOT NULL))`
    ),
  })
)

export const userRateLimits = pgTable('user_rate_limits', {
  userId: text('user_id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  syncApiRequests: integer('sync_api_requests').notNull().default(0), // Sync API requests counter
  asyncApiRequests: integer('async_api_requests').notNull().default(0), // Async API requests counter
  windowStart: timestamp('window_start').notNull().defaultNow(),
  lastRequestAt: timestamp('last_request_at').notNull().defaultNow(),
  isRateLimited: boolean('is_rate_limited').notNull().default(false),
  rateLimitResetAt: timestamp('rate_limit_reset_at'),
})

export const chat = pgTable(
  'chat',
  {
    id: text('id').primaryKey(),
    workflowId: text('workflow_id')
      .notNull()
      .references(() => workflow.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    subdomain: text('subdomain').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    isActive: boolean('is_active').notNull().default(true),
    customizations: json('customizations').default('{}'), // For UI customization options

    // Authentication options
    authType: text('auth_type').notNull().default('public'), // 'public', 'password', 'email'
    password: text('password'), // Stored hashed, populated when authType is 'password'
    allowedEmails: json('allowed_emails').default('[]'), // Array of allowed emails or domains when authType is 'email'

    // Output configuration
    outputConfigs: json('output_configs').default('[]'), // Array of {blockId, path} objects

    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => {
    return {
      // Ensure subdomains are unique
      subdomainIdx: uniqueIndex('subdomain_idx').on(table.subdomain),
    }
  }
)

export const organization = pgTable('organization', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  logo: text('logo'),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const member = pgTable('member', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organization.id, { onDelete: 'cascade' }),
  role: text('role').notNull(), // 'admin' or 'member' - team-level permissions only
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const invitation = pgTable('invitation', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  inviterId: text('inviter_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organization.id, { onDelete: 'cascade' }),
  role: text('role').notNull(),
  status: text('status').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const workspace = pgTable(
  'workspace',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    ownerId: text('owner_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    organizationId: text('organization_id').references(() => organization.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    ownerIdIdx: index('workspace_owner_id_idx').on(table.ownerId),
    organizationIdIdx: index('workspace_organization_id_idx').on(table.organizationId),
  })
)

// Define the permission enum
export const permissionTypeEnum = pgEnum('permission_type', ['admin', 'write', 'read'])

export const workspaceInvitation = pgTable('workspace_invitation', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id')
    .notNull()
    .references(() => workspace.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  inviterId: text('inviter_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  role: text('role').notNull().default('member'),
  status: text('status').notNull().default('pending'),
  token: text('token').notNull().unique(),
  permissions: permissionTypeEnum('permissions').notNull().default('admin'),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const permissions = pgTable(
  'permissions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    entityType: text('entity_type').notNull(), // 'workspace', 'workflow', 'organization', etc.
    entityId: text('entity_id').notNull(), // ID of the workspace, workflow, etc.
    permissionType: permissionTypeEnum('permission_type').notNull(), // Use enum instead of text
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    // Primary access pattern - get all permissions for a user
    userIdIdx: index('permissions_user_id_idx').on(table.userId),

    // Entity-based queries - get all users with permissions on an entity
    entityIdx: index('permissions_entity_idx').on(table.entityType, table.entityId),

    // User + entity type queries - get user's permissions for all workspaces
    userEntityTypeIdx: index('permissions_user_entity_type_idx').on(table.userId, table.entityType),

    // Specific permission checks - does user have specific permission on entity
    userEntityPermissionIdx: index('permissions_user_entity_permission_idx').on(
      table.userId,
      table.entityType,
      table.permissionType
    ),

    // User + specific entity queries - get user's permissions for specific entity
    userEntityIdx: index('permissions_user_entity_idx').on(
      table.userId,
      table.entityType,
      table.entityId
    ),

    // Uniqueness constraint - prevent duplicate permission rows (one permission per user/entity)
    uniquePermissionConstraint: uniqueIndex('permissions_unique_constraint').on(
      table.userId,
      table.entityType,
      table.entityId
    ),
  })
)

export const memory = pgTable(
  'memory',
  {
    id: text('id').primaryKey(),
    workflowId: text('workflow_id').references(() => workflow.id, { onDelete: 'cascade' }),
    key: text('key').notNull(), // Identifier for the memory within its context
    type: text('type').notNull(), // 'agent' or 'raw'
    data: json('data').notNull(), // Stores either agent message data or raw data
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => {
    return {
      // Add index on key for faster lookups
      keyIdx: index('memory_key_idx').on(table.key),

      // Add index on workflowId for faster filtering
      workflowIdx: index('memory_workflow_idx').on(table.workflowId),

      // Compound unique index to ensure keys are unique per workflow
      uniqueKeyPerWorkflowIdx: uniqueIndex('memory_workflow_key_idx').on(
        table.workflowId,
        table.key
      ),
    }
  }
)

export const knowledgeBase = pgTable(
  'knowledge_base',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    workspaceId: text('workspace_id').references(() => workspace.id),
    name: text('name').notNull(),
    description: text('description'),

    // Token tracking for usage
    tokenCount: integer('token_count').notNull().default(0),

    // Embedding configuration
    embeddingModel: text('embedding_model').notNull().default('text-embedding-3-small'),
    embeddingDimension: integer('embedding_dimension').notNull().default(1536),

    // Chunking configuration stored as JSON for flexibility
    chunkingConfig: json('chunking_config')
      .notNull()
      .default('{"maxSize": 1024, "minSize": 1, "overlap": 200}'),

    // Soft delete support
    deletedAt: timestamp('deleted_at'),

    // Metadata and timestamps
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    // Primary access patterns
    userIdIdx: index('kb_user_id_idx').on(table.userId),
    workspaceIdIdx: index('kb_workspace_id_idx').on(table.workspaceId),
    // Composite index for user's workspaces
    userWorkspaceIdx: index('kb_user_workspace_idx').on(table.userId, table.workspaceId),
    // Index for soft delete filtering
    deletedAtIdx: index('kb_deleted_at_idx').on(table.deletedAt),
  })
)

export const document = pgTable(
  'document',
  {
    id: text('id').primaryKey(),
    knowledgeBaseId: text('knowledge_base_id')
      .notNull()
      .references(() => knowledgeBase.id, { onDelete: 'cascade' }),

    // File information
    filename: text('filename').notNull(),
    fileUrl: text('file_url').notNull(),
    fileSize: integer('file_size').notNull(), // Size in bytes
    mimeType: text('mime_type').notNull(), // e.g., 'application/pdf', 'text/plain'

    // Content statistics
    chunkCount: integer('chunk_count').notNull().default(0),
    tokenCount: integer('token_count').notNull().default(0),
    characterCount: integer('character_count').notNull().default(0),

    // Processing status
    processingStatus: text('processing_status').notNull().default('pending'), // 'pending', 'processing', 'completed', 'failed'
    processingStartedAt: timestamp('processing_started_at'),
    processingCompletedAt: timestamp('processing_completed_at'),
    processingError: text('processing_error'),

    // Document state
    enabled: boolean('enabled').notNull().default(true), // Enable/disable from knowledge base
    deletedAt: timestamp('deleted_at'), // Soft delete

    // Document tags for filtering (inherited by all chunks)
    tag1: text('tag1'),
    tag2: text('tag2'),
    tag3: text('tag3'),
    tag4: text('tag4'),
    tag5: text('tag5'),
    tag6: text('tag6'),
    tag7: text('tag7'),

    // Timestamps
    uploadedAt: timestamp('uploaded_at').notNull().defaultNow(),
  },
  (table) => ({
    // Primary access pattern - documents by knowledge base
    knowledgeBaseIdIdx: index('doc_kb_id_idx').on(table.knowledgeBaseId),
    // Search by filename (for search functionality)
    filenameIdx: index('doc_filename_idx').on(table.filename),
    // Order by upload date (for listing documents)
    kbUploadedAtIdx: index('doc_kb_uploaded_at_idx').on(table.knowledgeBaseId, table.uploadedAt),
    // Processing status filtering
    processingStatusIdx: index('doc_processing_status_idx').on(
      table.knowledgeBaseId,
      table.processingStatus
    ),
    // Tag indexes for filtering
    tag1Idx: index('doc_tag1_idx').on(table.tag1),
    tag2Idx: index('doc_tag2_idx').on(table.tag2),
    tag3Idx: index('doc_tag3_idx').on(table.tag3),
    tag4Idx: index('doc_tag4_idx').on(table.tag4),
    tag5Idx: index('doc_tag5_idx').on(table.tag5),
    tag6Idx: index('doc_tag6_idx').on(table.tag6),
    tag7Idx: index('doc_tag7_idx').on(table.tag7),
  })
)

export const knowledgeBaseTagDefinitions = pgTable(
  'knowledge_base_tag_definitions',
  {
    id: text('id').primaryKey(),
    knowledgeBaseId: text('knowledge_base_id')
      .notNull()
      .references(() => knowledgeBase.id, { onDelete: 'cascade' }),
    tagSlot: text('tag_slot', {
      enum: TAG_SLOTS,
    }).notNull(),
    displayName: text('display_name').notNull(),
    fieldType: text('field_type').notNull().default('text'), // 'text', future: 'date', 'number', 'range'
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    // Ensure unique tag slot per knowledge base
    kbTagSlotIdx: uniqueIndex('kb_tag_definitions_kb_slot_idx').on(
      table.knowledgeBaseId,
      table.tagSlot
    ),
    // Ensure unique display name per knowledge base
    kbDisplayNameIdx: uniqueIndex('kb_tag_definitions_kb_display_name_idx').on(
      table.knowledgeBaseId,
      table.displayName
    ),
    // Index for querying by knowledge base
    kbIdIdx: index('kb_tag_definitions_kb_id_idx').on(table.knowledgeBaseId),
  })
)

export const embedding = pgTable(
  'embedding',
  {
    id: text('id').primaryKey(),
    knowledgeBaseId: text('knowledge_base_id')
      .notNull()
      .references(() => knowledgeBase.id, { onDelete: 'cascade' }),
    documentId: text('document_id')
      .notNull()
      .references(() => document.id, { onDelete: 'cascade' }),

    // Chunk information
    chunkIndex: integer('chunk_index').notNull(),
    chunkHash: text('chunk_hash').notNull(),
    content: text('content').notNull(),
    contentLength: integer('content_length').notNull(),
    tokenCount: integer('token_count').notNull(),

    // Vector embeddings - supports multiple models and dimensions (max 2000 for HNSW)
    embedding: vector('embedding', { dimensions: 2000 }), // Support for most embedding models, max 2000 for HNSW index
    embeddingModel: text('embedding_model').notNull().default('nomic-embed-text'),

    // Chunk boundaries and overlap
    startOffset: integer('start_offset').notNull(),
    endOffset: integer('end_offset').notNull(),

    // Tag columns inherited from document for efficient filtering
    tag1: text('tag1'),
    tag2: text('tag2'),
    tag3: text('tag3'),
    tag4: text('tag4'),
    tag5: text('tag5'),
    tag6: text('tag6'),
    tag7: text('tag7'),

    // Chunk state - enable/disable from knowledge base
    enabled: boolean('enabled').notNull().default(true),

    // Full-text search support - generated tsvector column
    contentTsv: tsvector('content_tsv').generatedAlwaysAs(
      (): SQL => sql`to_tsvector('english', ${embedding.content})`
    ),

    // Timestamps
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    // Primary vector search pattern
    kbIdIdx: index('emb_kb_id_idx').on(table.knowledgeBaseId),

    // Document-level access
    docIdIdx: index('emb_doc_id_idx').on(table.documentId),

    // Chunk ordering within documents
    docChunkIdx: uniqueIndex('emb_doc_chunk_idx').on(table.documentId, table.chunkIndex),

    // Model-specific queries for A/B testing or migrations
    kbModelIdx: index('emb_kb_model_idx').on(table.knowledgeBaseId, table.embeddingModel),

    // Enabled state filtering indexes (for chunk enable/disable functionality)
    kbEnabledIdx: index('emb_kb_enabled_idx').on(table.knowledgeBaseId, table.enabled),
    docEnabledIdx: index('emb_doc_enabled_idx').on(table.documentId, table.enabled),

    // Vector similarity search indexes (HNSW) - optimized for small embeddings
    embeddingVectorHnswIdx: index('embedding_vector_hnsw_idx')
      .using('hnsw', table.embedding.op('vector_cosine_ops'))
      .with({
        m: 16,
        ef_construction: 64,
      }),

    // Tag indexes for efficient filtering
    tag1Idx: index('emb_tag1_idx').on(table.tag1),
    tag2Idx: index('emb_tag2_idx').on(table.tag2),
    tag3Idx: index('emb_tag3_idx').on(table.tag3),
    tag4Idx: index('emb_tag4_idx').on(table.tag4),
    tag5Idx: index('emb_tag5_idx').on(table.tag5),
    tag6Idx: index('emb_tag6_idx').on(table.tag6),
    tag7Idx: index('emb_tag7_idx').on(table.tag7),

    // Full-text search index
    contentFtsIdx: index('emb_content_fts_idx').using('gin', table.contentTsv),

    // Ensure embedding exists (simplified since we only support one model)
    embeddingNotNullCheck: check('embedding_not_null_check', sql`"embedding" IS NOT NULL`),
  })
)

export const docsEmbeddings = pgTable(
  'docs_embeddings',
  {
    chunkId: uuid('chunk_id').primaryKey().defaultRandom(),
    chunkText: text('chunk_text').notNull(),
    sourceDocument: text('source_document').notNull(),
    sourceLink: text('source_link').notNull(),
    headerText: text('header_text').notNull(),
    headerLevel: integer('header_level').notNull(),
    tokenCount: integer('token_count').notNull(),

    // Vector embedding - optimized for text-embedding-3-small with HNSW support
    embedding: vector('embedding', { dimensions: 1536 }).notNull(),
    embeddingModel: text('embedding_model').notNull().default('text-embedding-3-small'),

    // Metadata for flexible filtering
    metadata: jsonb('metadata').notNull().default('{}'),

    // Full-text search support - generated tsvector column
    chunkTextTsv: tsvector('chunk_text_tsv').generatedAlwaysAs(
      (): SQL => sql`to_tsvector('english', ${docsEmbeddings.chunkText})`
    ),

    // Timestamps
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    // Source document queries
    sourceDocumentIdx: index('docs_emb_source_document_idx').on(table.sourceDocument),

    // Header level filtering
    headerLevelIdx: index('docs_emb_header_level_idx').on(table.headerLevel),

    // Combined source and header queries
    sourceHeaderIdx: index('docs_emb_source_header_idx').on(
      table.sourceDocument,
      table.headerLevel
    ),

    // Model-specific queries
    modelIdx: index('docs_emb_model_idx').on(table.embeddingModel),

    // Timestamp queries
    createdAtIdx: index('docs_emb_created_at_idx').on(table.createdAt),

    // Vector similarity search indexes (HNSW) - optimized for documentation embeddings
    embeddingVectorHnswIdx: index('docs_embedding_vector_hnsw_idx')
      .using('hnsw', table.embedding.op('vector_cosine_ops'))
      .with({
        m: 16,
        ef_construction: 64,
      }),

    // GIN index for JSONB metadata queries
    metadataGinIdx: index('docs_emb_metadata_gin_idx').using('gin', table.metadata),

    // Full-text search index
    chunkTextFtsIdx: index('docs_emb_chunk_text_fts_idx').using('gin', table.chunkTextTsv),

    // Constraints
    embeddingNotNullCheck: check('docs_embedding_not_null_check', sql`"embedding" IS NOT NULL`),
    headerLevelCheck: check(
      'docs_header_level_check',
      sql`"header_level" >= 1 AND "header_level" <= 6`
    ),
  })
)

export const copilotChats = pgTable(
  'copilot_chats',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    workflowId: text('workflow_id')
      .notNull()
      .references(() => workflow.id, { onDelete: 'cascade' }),
    title: text('title'),
    messages: jsonb('messages').notNull().default('[]'),
    model: text('model').notNull().default('claude-3-7-sonnet-latest'),
    previewYaml: text('preview_yaml'), // YAML content for pending workflow preview
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    // Primary access patterns
    userIdIdx: index('copilot_chats_user_id_idx').on(table.userId),
    workflowIdIdx: index('copilot_chats_workflow_id_idx').on(table.workflowId),
    userWorkflowIdx: index('copilot_chats_user_workflow_idx').on(table.userId, table.workflowId),

    // Ordering indexes
    createdAtIdx: index('copilot_chats_created_at_idx').on(table.createdAt),
    updatedAtIdx: index('copilot_chats_updated_at_idx').on(table.updatedAt),
  })
)

export const workflowCheckpoints = pgTable(
  'workflow_checkpoints',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    workflowId: text('workflow_id')
      .notNull()
      .references(() => workflow.id, { onDelete: 'cascade' }),
    chatId: uuid('chat_id')
      .notNull()
      .references(() => copilotChats.id, { onDelete: 'cascade' }),
    messageId: text('message_id'), // ID of the user message that triggered this checkpoint
    workflowState: json('workflow_state').notNull(), // JSON workflow state
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    // Primary access patterns
    userIdIdx: index('workflow_checkpoints_user_id_idx').on(table.userId),
    workflowIdIdx: index('workflow_checkpoints_workflow_id_idx').on(table.workflowId),
    chatIdIdx: index('workflow_checkpoints_chat_id_idx').on(table.chatId),
    messageIdIdx: index('workflow_checkpoints_message_id_idx').on(table.messageId),

    // Combined indexes for common queries
    userWorkflowIdx: index('workflow_checkpoints_user_workflow_idx').on(
      table.userId,
      table.workflowId
    ),
    workflowChatIdx: index('workflow_checkpoints_workflow_chat_idx').on(
      table.workflowId,
      table.chatId
    ),

    // Ordering indexes
    createdAtIdx: index('workflow_checkpoints_created_at_idx').on(table.createdAt),
    chatCreatedAtIdx: index('workflow_checkpoints_chat_created_at_idx').on(
      table.chatId,
      table.createdAt
    ),
  })
)

export const templates = pgTable(
  'templates',
  {
    id: text('id').primaryKey(),
    workflowId: text('workflow_id')
      .notNull()
      .references(() => workflow.id),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    author: text('author').notNull(),
    views: integer('views').notNull().default(0),
    stars: integer('stars').notNull().default(0),
    color: text('color').notNull().default('#3972F6'),
    icon: text('icon').notNull().default('FileText'), // Lucide icon name as string
    category: text('category').notNull(),
    state: jsonb('state').notNull(), // Using jsonb for better performance
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    // Primary access patterns
    workflowIdIdx: index('templates_workflow_id_idx').on(table.workflowId),
    userIdIdx: index('templates_user_id_idx').on(table.userId),
    categoryIdx: index('templates_category_idx').on(table.category),

    // Sorting indexes for popular/trending templates
    viewsIdx: index('templates_views_idx').on(table.views),
    starsIdx: index('templates_stars_idx').on(table.stars),

    // Composite indexes for common queries
    categoryViewsIdx: index('templates_category_views_idx').on(table.category, table.views),
    categoryStarsIdx: index('templates_category_stars_idx').on(table.category, table.stars),
    userCategoryIdx: index('templates_user_category_idx').on(table.userId, table.category),

    // Temporal indexes
    createdAtIdx: index('templates_created_at_idx').on(table.createdAt),
    updatedAtIdx: index('templates_updated_at_idx').on(table.updatedAt),
  })
)

export const templateStars = pgTable(
  'template_stars',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    templateId: text('template_id')
      .notNull()
      .references(() => templates.id, { onDelete: 'cascade' }),
    starredAt: timestamp('starred_at').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    // Primary access patterns
    userIdIdx: index('template_stars_user_id_idx').on(table.userId),
    templateIdIdx: index('template_stars_template_id_idx').on(table.templateId),

    // Composite indexes for common queries
    userTemplateIdx: index('template_stars_user_template_idx').on(table.userId, table.templateId),
    templateUserIdx: index('template_stars_template_user_idx').on(table.templateId, table.userId),

    // Temporal indexes for analytics
    starredAtIdx: index('template_stars_starred_at_idx').on(table.starredAt),
    templateStarredAtIdx: index('template_stars_template_starred_at_idx').on(
      table.templateId,
      table.starredAt
    ),

    // Uniqueness constraint - prevent duplicate stars
    uniqueUserTemplateConstraint: uniqueIndex('template_stars_user_template_unique').on(
      table.userId,
      table.templateId
    ),
  })
)

export const copilotFeedback = pgTable(
  'copilot_feedback',
  {
    feedbackId: uuid('feedback_id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    chatId: uuid('chat_id')
      .notNull()
      .references(() => copilotChats.id, { onDelete: 'cascade' }),
    userQuery: text('user_query').notNull(),
    agentResponse: text('agent_response').notNull(),
    isPositive: boolean('is_positive').notNull(),
    feedback: text('feedback'), // Optional feedback text
    workflowYaml: text('workflow_yaml'), // Optional workflow YAML if edit/build workflow was triggered
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    // Access patterns
    userIdIdx: index('copilot_feedback_user_id_idx').on(table.userId),
    chatIdIdx: index('copilot_feedback_chat_id_idx').on(table.chatId),
    userChatIdx: index('copilot_feedback_user_chat_idx').on(table.userId, table.chatId),

    // Query patterns
    isPositiveIdx: index('copilot_feedback_is_positive_idx').on(table.isPositive),

    // Ordering indexes
    createdAtIdx: index('copilot_feedback_created_at_idx').on(table.createdAt),
  })
)

// ==========================================
// Image Search / CAD Drawing Search Tables
// ==========================================

export const imageCatalogStatusEnum = pgEnum('image_catalog_status', [
  'active',
  'indexing',
  'paused',
  'error',
])

export const imageProcessingModeEnum = pgEnum('image_processing_mode', ['batch', 'realtime'])

export const imageDataSourceEnum = pgEnum('image_data_source', [
  'upload',
  'network',
  's3',
  'azure_blob',
  'google_drive',
  'postgresql',
  'mssql',
  'url',
])

export const imageExtractionMethodEnum = pgEnum('image_extraction_method', [
  'auto',
  'oda',
  'autodesk_aps',
  'ai_vision',
  'ocr',
])

export const imageDocProcessingStatusEnum = pgEnum('image_doc_processing_status', [
  'pending',
  'processing',
  'completed',
  'failed',
])

export const imageEmbeddingTypeEnum = pgEnum('image_embedding_type', ['text', 'visual', 'combined'])

export const imageCatalog = pgTable(
  'image_catalog',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    workspaceId: text('workspace_id').references(() => workspace.id),
    name: text('name').notNull(),
    description: text('description'),

    // Catalog statistics
    fileCount: integer('file_count').notNull().default(0),
    totalSizeBytes: integer('total_size_bytes').notNull().default(0),

    // Embedding configuration
    embeddingModel: text('embedding_model').notNull().default('text-embedding-3-small'),
    embeddingDimension: integer('embedding_dimension').notNull().default(1536),

    // Data source configuration
    dataSource: imageDataSourceEnum('data_source').notNull().default('upload'),
    connectionConfig: jsonb('connection_config').default('{}'), // DB creds, network path, S3 config, etc.

    // Processing configuration
    processingMode: imageProcessingModeEnum('processing_mode').notNull().default('batch'),
    extractionMethod: imageExtractionMethodEnum('extraction_method').notNull().default('auto'),

    // Status
    status: imageCatalogStatusEnum('status').notNull().default('active'),
    lastIndexedAt: timestamp('last_indexed_at'),
    indexingProgress: integer('indexing_progress').default(0), // 0-100 percentage
    indexingError: text('indexing_error'),

    // Soft delete
    deletedAt: timestamp('deleted_at'),

    // Timestamps
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('img_catalog_user_id_idx').on(table.userId),
    workspaceIdIdx: index('img_catalog_workspace_id_idx').on(table.workspaceId),
    userWorkspaceIdx: index('img_catalog_user_workspace_idx').on(table.userId, table.workspaceId),
    statusIdx: index('img_catalog_status_idx').on(table.status),
    deletedAtIdx: index('img_catalog_deleted_at_idx').on(table.deletedAt),
    dataSourceIdx: index('img_catalog_data_source_idx').on(table.dataSource),
  })
)

export const imageDocument = pgTable(
  'image_document',
  {
    id: text('id').primaryKey(),
    catalogId: text('catalog_id')
      .notNull()
      .references(() => imageCatalog.id, { onDelete: 'cascade' }),

    // File information
    filename: text('filename').notNull(),
    filePath: text('file_path'), // Original path (network/local)
    fileUrl: text('file_url'), // Cloud/accessible URL
    fileSize: integer('file_size').notNull().default(0),
    mimeType: text('mime_type').notNull(),
    fileType: text('file_type').notNull(), // 'image', 'dwg', 'dxf', 'pdf', 'svg'

    // Thumbnail
    thumbnailUrl: text('thumbnail_url'),

    // Processing
    processingStatus: imageDocProcessingStatusEnum('processing_status')
      .notNull()
      .default('pending'),
    processingStartedAt: timestamp('processing_started_at'),
    processingCompletedAt: timestamp('processing_completed_at'),
    processingError: text('processing_error'),
    extractionMethod: imageExtractionMethodEnum('extraction_method').notNull().default('auto'),

    // Extracted content
    extractedText: text('extracted_text'), // All text extracted from the file
    extractedTextLength: integer('extracted_text_length').default(0),

    // Metadata (JSONB for flexible schema)
    metadata: jsonb('metadata').default('{}'), // author, creation date, project, drawing title, sheet #, etc.

    // Spatial data for DWG/DXF files
    spatialData: jsonb('spatial_data').default('{}'), // layers, blocks, dimensions, coordinates, bounding boxes

    // Document tags for filtering (inherited by embeddings)
    tag1: text('tag1'),
    tag2: text('tag2'),
    tag3: text('tag3'),
    tag4: text('tag4'),
    tag5: text('tag5'),
    tag6: text('tag6'),
    tag7: text('tag7'),

    // State
    enabled: boolean('enabled').notNull().default(true),
    deletedAt: timestamp('deleted_at'),

    // Timestamps
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    catalogIdIdx: index('img_doc_catalog_id_idx').on(table.catalogId),
    filenameIdx: index('img_doc_filename_idx').on(table.filename),
    fileTypeIdx: index('img_doc_file_type_idx').on(table.fileType),
    processingStatusIdx: index('img_doc_processing_status_idx').on(
      table.catalogId,
      table.processingStatus
    ),
    catalogCreatedAtIdx: index('img_doc_catalog_created_at_idx').on(
      table.catalogId,
      table.createdAt
    ),
    tag1Idx: index('img_doc_tag1_idx').on(table.tag1),
    tag2Idx: index('img_doc_tag2_idx').on(table.tag2),
    tag3Idx: index('img_doc_tag3_idx').on(table.tag3),
    tag4Idx: index('img_doc_tag4_idx').on(table.tag4),
    tag5Idx: index('img_doc_tag5_idx').on(table.tag5),
    tag6Idx: index('img_doc_tag6_idx').on(table.tag6),
    tag7Idx: index('img_doc_tag7_idx').on(table.tag7),
    // GIN index on metadata for JSONB queries
    metadataGinIdx: index('img_doc_metadata_gin_idx').using('gin', table.metadata),
    // GIN index on spatialData for spatial queries
    spatialDataGinIdx: index('img_doc_spatial_data_gin_idx').using('gin', table.spatialData),
  })
)

export const imageCatalogTagDefinitions = pgTable(
  'image_catalog_tag_definitions',
  {
    id: text('id').primaryKey(),
    catalogId: text('catalog_id')
      .notNull()
      .references(() => imageCatalog.id, { onDelete: 'cascade' }),
    tagSlot: text('tag_slot', { enum: TAG_SLOTS }).notNull(),
    displayName: text('display_name').notNull(),
    fieldType: text('field_type').notNull().default('text'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    catalogTagSlotIdx: uniqueIndex('img_cat_tag_def_catalog_slot_idx').on(
      table.catalogId,
      table.tagSlot
    ),
    catalogDisplayNameIdx: uniqueIndex('img_cat_tag_def_catalog_display_name_idx').on(
      table.catalogId,
      table.displayName
    ),
    catalogIdIdx: index('img_cat_tag_def_catalog_id_idx').on(table.catalogId),
  })
)

export const imageEmbedding = pgTable(
  'image_embedding',
  {
    id: text('id').primaryKey(),
    catalogId: text('catalog_id')
      .notNull()
      .references(() => imageCatalog.id, { onDelete: 'cascade' }),
    documentId: text('document_id')
      .notNull()
      .references(() => imageDocument.id, { onDelete: 'cascade' }),

    // Embedding type: text (from extracted content), visual (from CLIP), combined
    embeddingType: imageEmbeddingTypeEnum('embedding_type').notNull().default('text'),

    // Chunk information (for text embeddings with long content)
    chunkIndex: integer('chunk_index').notNull().default(0),
    chunkHash: text('chunk_hash'),
    content: text('content').notNull(), // Chunk text or image description
    contentLength: integer('content_length').notNull(),
    tokenCount: integer('token_count').notNull().default(0),

    // Vector embedding - matches existing schema (2000d max for HNSW)
    embedding: vector('embedding', { dimensions: 2000 }),
    embeddingModel: text('embedding_model').notNull().default('text-embedding-3-small'),

    // Chunk boundaries
    startOffset: integer('start_offset').notNull().default(0),
    endOffset: integer('end_offset').notNull().default(0),

    // Tag columns inherited from document for efficient filtering
    tag1: text('tag1'),
    tag2: text('tag2'),
    tag3: text('tag3'),
    tag4: text('tag4'),
    tag5: text('tag5'),
    tag6: text('tag6'),
    tag7: text('tag7'),

    // State
    enabled: boolean('enabled').notNull().default(true),

    // Full-text search support
    contentTsv: tsvector('content_tsv').generatedAlwaysAs(
      (): SQL => sql`to_tsvector('english', ${imageEmbedding.content})`
    ),

    // Timestamps
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    catalogIdIdx: index('img_emb_catalog_id_idx').on(table.catalogId),
    docIdIdx: index('img_emb_doc_id_idx').on(table.documentId),
    docChunkIdx: uniqueIndex('img_emb_doc_chunk_idx').on(
      table.documentId,
      table.embeddingType,
      table.chunkIndex
    ),
    embeddingTypeIdx: index('img_emb_type_idx').on(table.catalogId, table.embeddingType),
    catalogModelIdx: index('img_emb_catalog_model_idx').on(table.catalogId, table.embeddingModel),
    catalogEnabledIdx: index('img_emb_catalog_enabled_idx').on(table.catalogId, table.enabled),

    // HNSW index for vector similarity search
    embeddingVectorHnswIdx: index('img_embedding_vector_hnsw_idx')
      .using('hnsw', table.embedding.op('vector_cosine_ops'))
      .with({ m: 16, ef_construction: 64 }),

    // Tag indexes
    tag1Idx: index('img_emb_tag1_idx').on(table.tag1),
    tag2Idx: index('img_emb_tag2_idx').on(table.tag2),
    tag3Idx: index('img_emb_tag3_idx').on(table.tag3),
    tag4Idx: index('img_emb_tag4_idx').on(table.tag4),
    tag5Idx: index('img_emb_tag5_idx').on(table.tag5),
    tag6Idx: index('img_emb_tag6_idx').on(table.tag6),
    tag7Idx: index('img_emb_tag7_idx').on(table.tag7),

    // Full-text search index
    contentFtsIdx: index('img_emb_content_fts_idx').using('gin', table.contentTsv),

    // Embedding not null check
    embeddingNotNullCheck: check('img_embedding_not_null_check', sql`"embedding" IS NOT NULL`),
  })
)

// MCP (Model Context Protocol) Servers
export const mcpServerTypeEnum = pgEnum('mcp_server_type', [
  'stdio',
  'sse',
  'http',
  'streamable-http',
])
export const mcpServerStatusEnum = pgEnum('mcp_server_status', [
  'connected',
  'disconnected',
  'error',
  'connecting',
])

export const mcpServers = pgTable(
  'mcp_servers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspace.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    type: mcpServerTypeEnum('type').notNull(),
    status: mcpServerStatusEnum('status').notNull().default('disconnected'),
    config: jsonb('config').notNull(), // Server-specific configuration (stdio: {command, args, env}, sse: {endpoint, headers}, http: {baseUrl, apiKey, headers})
    settings: jsonb('settings').notNull().default({
      autoReconnect: true,
      timeout: 30,
      retryAttempts: 3,
      rateLimit: 60,
      logging: 'errors',
      validateSSL: true,
    }),
    toolConfig: jsonb('tool_config').notNull().default({
      autoDiscover: true,
      refreshInterval: 15,
      categories: [],
    }),
    metadata: jsonb('metadata').notNull().default({
      lastConnected: null,
      toolCount: 0,
      avgLatency: 0,
      version: null,
    }),
    tags: text('tags').array().default([]), // Tags for categorization
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    // Access patterns
    userIdIdx: index('mcp_servers_user_id_idx').on(table.userId),
    workspaceIdIdx: index('mcp_servers_workspace_id_idx').on(table.workspaceId),
    userWorkspaceIdx: index('mcp_servers_user_workspace_idx').on(table.userId, table.workspaceId),

    // Query patterns
    nameIdx: index('mcp_servers_name_idx').on(table.name),
    typeIdx: index('mcp_servers_type_idx').on(table.type),
    statusIdx: index('mcp_servers_status_idx').on(table.status),
    isActiveIdx: index('mcp_servers_is_active_idx').on(table.isActive),

    // Ordering indexes
    createdAtIdx: index('mcp_servers_created_at_idx').on(table.createdAt),
    updatedAtIdx: index('mcp_servers_updated_at_idx').on(table.updatedAt),

    // Unique constraint on name per user workspace
    userWorkspaceNameUnique: uniqueIndex('mcp_servers_user_workspace_name_unique').on(
      table.userId,
      table.workspaceId,
      table.name
    ),
  })
)

// MCP Server Tools (cached tool definitions from discovered servers)
export const mcpServerTools = pgTable(
  'mcp_server_tools',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    serverId: uuid('server_id')
      .notNull()
      .references(() => mcpServers.id, { onDelete: 'cascade' }),
    toolId: text('tool_id').notNull(), // Tool identifier from the MCP server
    name: text('name').notNull(),
    description: text('description'),
    category: text('category').array().default([]), // Tool categories
    inputSchema: jsonb('input_schema'), // JSON schema for tool inputs
    outputSchema: jsonb('output_schema'), // JSON schema for tool outputs
    isEnabled: boolean('is_enabled').notNull().default(true),
    lastDiscovered: timestamp('last_discovered').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    // Access patterns
    serverIdIdx: index('mcp_server_tools_server_id_idx').on(table.serverId),
    toolIdIdx: index('mcp_server_tools_tool_id_idx').on(table.toolId),

    // Query patterns
    nameIdx: index('mcp_server_tools_name_idx').on(table.name),
    isEnabledIdx: index('mcp_server_tools_is_enabled_idx').on(table.isEnabled),

    // Ordering indexes
    lastDiscoveredIdx: index('mcp_server_tools_last_discovered_idx').on(table.lastDiscovered),

    // Unique constraint on tool_id per server
    serverToolIdUnique: uniqueIndex('mcp_server_tools_server_tool_id_unique').on(
      table.serverId,
      table.toolId
    ),
  })
)

// MCP Tool Execution History (for monitoring and debugging)
export const mcpToolExecutions = pgTable(
  'mcp_tool_executions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    serverId: uuid('server_id')
      .notNull()
      .references(() => mcpServers.id, { onDelete: 'cascade' }),
    toolId: text('tool_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    workflowId: text('workflow_id').references(() => workflow.id, { onDelete: 'set null' }), // Optional workflow context
    parameters: jsonb('parameters'), // Input parameters passed to the tool
    result: jsonb('result'), // Tool execution result
    success: boolean('success').notNull(),
    latency: integer('latency'), // Execution time in milliseconds
    error: text('error'), // Error message if execution failed
    executedAt: timestamp('executed_at').notNull().defaultNow(),
  },
  (table) => ({
    // Access patterns
    serverIdIdx: index('mcp_tool_executions_server_id_idx').on(table.serverId),
    userIdIdx: index('mcp_tool_executions_user_id_idx').on(table.userId),
    workflowIdIdx: index('mcp_tool_executions_workflow_id_idx').on(table.workflowId),

    // Query patterns
    toolIdIdx: index('mcp_tool_executions_tool_id_idx').on(table.toolId),
    successIdx: index('mcp_tool_executions_success_idx').on(table.success),

    // Ordering and analytics indexes
    executedAtIdx: index('mcp_tool_executions_executed_at_idx').on(table.executedAt),
    latencyIdx: index('mcp_tool_executions_latency_idx').on(table.latency),

    // Composite indexes for analytics
    serverSuccessIdx: index('mcp_tool_executions_server_success_idx').on(
      table.serverId,
      table.success
    ),
    userServerIdx: index('mcp_tool_executions_user_server_idx').on(table.userId, table.serverId),
  })
)

// Custom OAuth providers for user-configured OAuth connections (e.g., custom Outlook tenants)
export const customOAuthProvider = pgTable(
  'custom_oauth_provider',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    serviceType: text('service_type').notNull(), // e.g., 'outlook'
    tenantId: text('tenant_id').notNull(),
    clientId: text('client_id').notNull(),
    clientSecret: text('client_secret').notNull(),
    linkedAccountId: text('linked_account_id'),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
  },
  (table) => ({
    userIdIdx: index('custom_oauth_provider_user_id_idx').on(table.userId),
    serviceTypeIdx: index('custom_oauth_provider_service_type_idx').on(table.serviceType),
  })
)

// ============================================================================
// Audit Log — tracks all significant actions for compliance (SOC2, GDPR)
// ============================================================================
export const auditLog = pgTable(
  'audit_log',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
    organizationId: text('organization_id').references(() => organization.id, {
      onDelete: 'set null',
    }),
    action: text('action').notNull(), // e.g., 'member.invited', 'workspace.created', 'workflow.deleted', 'org.settings_updated'
    entityType: text('entity_type').notNull(), // 'organization', 'workspace', 'workflow', 'member', 'invitation', 'api_key', 'environment'
    entityId: text('entity_id'), // ID of the affected entity
    metadata: json('metadata'), // Additional context (old/new values, IP, user agent, etc.)
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('audit_log_user_id_idx').on(table.userId),
    organizationIdIdx: index('audit_log_organization_id_idx').on(table.organizationId),
    actionIdx: index('audit_log_action_idx').on(table.action),
    entityIdx: index('audit_log_entity_idx').on(table.entityType, table.entityId),
    createdAtIdx: index('audit_log_created_at_idx').on(table.createdAt),
    // Composite for querying org audit history
    orgCreatedAtIdx: index('audit_log_org_created_at_idx').on(
      table.organizationId,
      table.createdAt
    ),
  })
)

// ============================================================================
// Platform Settings — admin-configurable platform-wide settings
// ============================================================================
export const platformSettings = pgTable('platform_settings', {
  id: text('id').primaryKey().default('default'),
  allowedSignupDomains: text('allowed_signup_domains'), // Comma-separated domains (e.g. "company.com,partner.org")
  disableRegistration: boolean('disable_registration').default(false),
  requireEmailVerification: boolean('require_email_verification').default(true),
  defaultUserRole: text('default_user_role').default('member'), // 'member' | 'admin'
  maxWorkspacesPerUser: integer('max_workspaces_per_user').default(10),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  updatedBy: text('updated_by').references(() => user.id, { onDelete: 'set null' }),
})

// ============================================================================
// Organization Environment Variables — shared secrets/config across org members
// ============================================================================
export const orgEnvironment = pgTable(
  'org_environment',
  {
    id: text('id').primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    variables: json('variables').notNull(), // Encrypted key-value pairs
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    updatedBy: text('updated_by').references(() => user.id, { onDelete: 'set null' }),
  },
  (table) => ({
    orgIdIdx: uniqueIndex('org_environment_org_id_idx').on(table.organizationId),
  })
)
