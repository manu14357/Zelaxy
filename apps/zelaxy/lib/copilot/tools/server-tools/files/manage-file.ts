import { appendWorkspaceFile, writeWorkspaceFile } from '@/lib/files/workspace-files'
import { createLogger } from '@/lib/logs/console/logger'
import { BaseCopilotTool } from '../base'

/**
 * Files & documents tools for the workspace agent: create a document/file from text content, or
 * append to one. Files land in the workspace's Files area and surface as a resource card in the
 * ZelaxyArena live panel.
 */

const logger = createLogger('ManageFile')

interface CreateFileParams {
  workspaceId: string
  userId?: string | null
  name: string
  content: string
  contentType?: string
}

interface CreateFileResult {
  id: string
  name: string
  url: string
  size: number
  type: string
  /** The file's text content, echoed back so the live panel can render the document. */
  content: string
}

class CreateFileTool extends BaseCopilotTool<CreateFileParams, CreateFileResult> {
  readonly id = 'create_file'
  readonly displayName = 'Creating file'

  protected async executeImpl(params: CreateFileParams): Promise<CreateFileResult> {
    const { workspaceId, userId, name, content, contentType } = params
    if (!workspaceId) throw new Error('workspaceId is required')
    if (!name?.trim()) throw new Error('A file name is required')
    if (typeof content !== 'string') throw new Error('content must be a string')

    logger.info('Creating workspace file', { workspaceId, name })
    const file = await writeWorkspaceFile({ workspaceId, userId, name, content, contentType })
    return {
      id: file.id,
      name: file.name,
      url: file.url,
      size: file.size,
      type: file.type,
      content,
    }
  }
}
export const createFileTool = new CreateFileTool()

interface AppendFileParams {
  workspaceId: string
  userId?: string | null
  name: string
  content: string
}

class AppendFileTool extends BaseCopilotTool<AppendFileParams, CreateFileResult> {
  readonly id = 'append_file'
  readonly displayName = 'Updating file'

  protected async executeImpl(params: AppendFileParams): Promise<CreateFileResult> {
    const { workspaceId, userId, name, content } = params
    if (!workspaceId) throw new Error('workspaceId is required')
    if (!name?.trim()) throw new Error('A file name is required')

    logger.info('Appending to workspace file', { workspaceId, name })
    const file = await appendWorkspaceFile({ workspaceId, userId, name, content })
    return {
      id: file.id,
      name: file.name,
      url: file.url,
      size: file.size,
      type: file.type,
      content,
    }
  }
}
export const appendFileTool = new AppendFileTool()
