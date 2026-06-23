/**
 * Human-readable, present/past-tense status labels for ZelaxyArena tool calls — the "Researching…",
 * "Creating table…", "Searching the web…" lines shown in the chat + console while the agent works.
 *
 * Mirrors the reference mothership's approach: a static label map (running / done verbs) plus a
 * dynamic resolver that derives a contextual title from the tool's arguments (e.g.
 * "Searching the web for <query>", "Creating table <name>").
 */

type ToolStatus = 'running' | 'done' | 'error'

interface ToolLabel {
  /** Present-tense verb shown while the tool runs (e.g. "Searching the web"). */
  running: string
  /** Past-tense verb shown once it finishes (e.g. "Searched the web"). */
  done: string
}

const TOOL_LABELS: Record<string, ToolLabel> = {
  // Workflow
  build_workflow: { running: 'Building workflow', done: 'Built workflow' },
  edit_workflow: { running: 'Editing workflow', done: 'Edited workflow' },
  get_user_workflow: { running: 'Reading workflow', done: 'Read workflow' },
  get_blocks_and_tools: { running: 'Loading blocks', done: 'Loaded blocks' },
  get_blocks_metadata: { running: 'Reading block details', done: 'Read block details' },
  run_workflow: { running: 'Running workflow', done: 'Ran workflow' },
  run_deployed_workflow: { running: 'Running workflow', done: 'Ran workflow' },
  rename_workflow: { running: 'Renaming workflow', done: 'Renamed workflow' },
  delete_workflow: { running: 'Deleting workflow', done: 'Deleted workflow' },
  get_workflow_console: { running: 'Checking logs', done: 'Checked logs' },

  // Research
  search_online: { running: 'Searching online', done: 'Searched online' },
  search_documentation: { running: 'Searching docs', done: 'Searched docs' },
  scrape_page: { running: 'Getting page contents', done: 'Got page contents' },
  get_page_contents: { running: 'Getting page contents', done: 'Got page contents' },
  crawl_website: { running: 'Crawling site', done: 'Crawled site' },
  deep_research: { running: 'Researching', done: 'Researched' },

  // Tables
  list_tables: { running: 'Listing tables', done: 'Listed tables' },
  query_table: { running: 'Querying table', done: 'Queried table' },
  create_table: { running: 'Creating table', done: 'Created table' },
  insert_table_row: { running: 'Adding row', done: 'Added row' },
  update_table_row: { running: 'Updating row', done: 'Updated row' },
  delete_table_rows: { running: 'Deleting rows', done: 'Deleted rows' },
  export_table: { running: 'Exporting table', done: 'Exported table' },

  // Knowledge bases
  create_knowledge_base: { running: 'Creating knowledge base', done: 'Created knowledge base' },
  list_knowledge_bases: { running: 'Listing knowledge bases', done: 'Listed knowledge bases' },

  // Files & documents
  create_file: { running: 'Creating file', done: 'Created file' },
  append_file: { running: 'Updating file', done: 'Updated file' },
  write_file: { running: 'Writing file', done: 'Wrote file' },

  // Automation & configuration
  list_scheduled_jobs: { running: 'Listing scheduled tasks', done: 'Listed scheduled tasks' },
  get_environment_variables: { running: 'Reading variables', done: 'Read variables' },
  set_environment_variables: { running: 'Saving variables', done: 'Saved variables' },

  // Integrations / actions
  http_request: { running: 'Calling API', done: 'Called API' },
  send_slack_message: { running: 'Sending Slack message', done: 'Sent Slack message' },
  send_email: { running: 'Sending email', done: 'Sent email' },
}

/** Parse args that may arrive as an object or a JSON string. */
function asObject(args: unknown): Record<string, any> {
  if (!args) return {}
  if (typeof args === 'object') return args as Record<string, any>
  if (typeof args === 'string') {
    try {
      const parsed = JSON.parse(args)
      return parsed && typeof parsed === 'object' ? parsed : {}
    } catch {
      return {}
    }
  }
  return {}
}

function firstString(obj: Record<string, any>, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = obj[k]
    if (typeof v === 'string' && v.trim()) return v.trim()
  }
  return undefined
}

/** Append a short contextual suffix (truncated) when the args carry a useful subject. */
function contextSuffix(name: string, obj: Record<string, any>): string {
  const truncate = (s: string, n = 48) => (s.length > n ? `${s.slice(0, n)}…` : s)
  switch (name) {
    case 'search_online':
    case 'search_documentation':
    case 'deep_research': {
      const q = firstString(obj, ['query', 'q', 'toolTitle', 'search'])
      return q ? ` for "${truncate(q)}"` : ''
    }
    case 'scrape_page':
    case 'get_page_contents':
    case 'crawl_website': {
      const url = firstString(obj, ['url', 'website', 'link'])
      return url ? ` ${truncate(url, 60)}` : ''
    }
    case 'create_table':
    case 'query_table':
    case 'insert_table_row':
    case 'update_table_row':
    case 'delete_table_rows':
    case 'export_table': {
      const t = firstString(obj, ['name', 'tableName', 'table', 'table_name'])
      return t ? ` ${truncate(t)}` : ''
    }
    case 'create_knowledge_base': {
      const t = firstString(obj, ['name', 'title'])
      return t ? ` ${truncate(t)}` : ''
    }
    case 'create_file':
    case 'write_file': {
      const t = firstString(obj, ['title', 'name', 'fileName', 'filename'])
      return t ? ` ${truncate(t)}` : ''
    }
    case 'run_workflow':
    case 'run_deployed_workflow':
    case 'rename_workflow':
    case 'delete_workflow': {
      const t = firstString(obj, ['workflowName', 'name', 'workflow'])
      return t ? ` "${truncate(t)}"` : ''
    }
    case 'send_slack_message': {
      const c = firstString(obj, ['channel'])
      return c ? ` to ${truncate(c, 24)}` : ''
    }
    case 'send_email': {
      const to = firstString(obj, ['to', 'recipient'])
      return to ? ` to ${truncate(to, 32)}` : ''
    }
    case 'http_request': {
      const u = firstString(obj, ['url'])
      return u ? ` ${truncate(u, 48)}` : ''
    }
    default:
      return ''
  }
}

/** Convert an unknown tool id into a readable fallback ("get_x" → "Get x"). */
function humanizeFallback(name: string): string {
  const spaced = name.replace(/_/g, ' ')
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

/**
 * Resolve the display title for a tool call given its status and (optional) arguments.
 * Running tools read present-tense ("Searching the web for …"); finished tools read past-tense.
 */
export function resolveToolStatusTitle(name: string, status: ToolStatus, args?: unknown): string {
  const label = TOOL_LABELS[name]
  const obj = asObject(args)
  const suffix = contextSuffix(name, obj)
  if (label) {
    const verb = status === 'running' ? label.running : label.done
    return `${verb}${suffix}`
  }
  return `${humanizeFallback(name)}${suffix}`
}
