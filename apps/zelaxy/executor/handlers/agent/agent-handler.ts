import { createLogger } from '@/lib/logs/console/logger'
import { getMCPService, registerMCPToolId } from '@/lib/mcp-service-registry'
import { toonEncodeForLLM, tryParseThenEncode } from '@/lib/toon/encoder'
// ── OCR helpers (pure JS — no Node-only deps) ────────────────────────────────
import { getBaseUrl } from '@/lib/urls/utils'
import { getAllBlocks } from '@/blocks'
import type { BlockOutput } from '@/blocks/types'
import { BlockType } from '@/executor/consts'
import type {
  AgentInputs,
  Message,
  StreamingConfig,
  ToolInput,
} from '@/executor/handlers/agent/types'
import type { BlockHandler, ExecutionContext, StreamingExecution, UserFile } from '@/executor/types'
import { executeProviderRequest } from '@/providers'
import {
  extractAndParseJSON,
  getApiKey,
  getProviderFromModel,
  transformBlockTool,
} from '@/providers/utils'
import type { SerializedBlock } from '@/serializer/types'
import { executeTool } from '@/tools'
import { getTool, getToolAsync } from '@/tools/utils'

const OCR_IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'webp', 'tiff', 'tif', 'bmp', 'gif'])

/** Check if a file is eligible for OCR based on extension (no Node deps). */
function isOCREligible(fileName: string): boolean {
  const dotIdx = fileName.lastIndexOf('.')
  if (dotIdx === -1) return false
  const ext = fileName.slice(dotIdx + 1).toLowerCase()
  return OCR_IMAGE_EXTENSIONS.has(ext) || ext === 'pdf'
}

/**
 * Call the server-side OCR API endpoint.
 *
 * The actual OCR processing (mupdf, tesseract.js, sharp, pdf-parse) runs
 * exclusively on the server inside /api/ocr/process. This function just
 * sends a fetch request so the agent handler works identically whether the
 * executor is running client-side (manual / chat) or server-side (trigger /
 * schedule / API).
 */
interface OCRApiResponse {
  success: boolean
  text?: string
  formattedText?: string
  confidence?: number
  processingTimeMs?: number
  pages?: number
  error?: string
}

async function callOCRApi(
  fileUrl: string,
  fileName: string
): Promise<{
  formattedText: string
  totalText: string
  avgConfidence: number
  processingTimeMs: number
} | null> {
  const baseUrl = getBaseUrl()
  const url = `${baseUrl}/api/ocr/process`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileUrl, fileName }),
  })

  if (!res.ok) {
    const errorBody = await res.text().catch(() => 'unknown error')
    throw new Error(`OCR API returned ${res.status}: ${errorBody}`)
  }

  const data: OCRApiResponse = await res.json()
  if (!data.success || !data.text) return null

  return {
    formattedText: data.formattedText || data.text,
    totalText: data.text,
    avgConfidence: data.confidence ?? 0,
    processingTimeMs: data.processingTimeMs ?? 0,
  }
}

const logger = createLogger('AgentBlockHandler')

const DEFAULT_MODEL = 'gpt-4o'
const DEFAULT_FUNCTION_TIMEOUT = 5000
const REQUEST_TIMEOUT = 120000
const CUSTOM_TOOL_PREFIX = 'custom_'
const MCP_TOOL_PREFIX = 'mcp_'

/**
 * Handler for Agent blocks that process LLM requests with optional tools.
 */
export class AgentBlockHandler implements BlockHandler {
  private tempMcpServerIds: string[] = []

  canHandle(block: SerializedBlock): boolean {
    return block.metadata?.id === BlockType.AGENT
  }

  async execute(
    block: SerializedBlock,
    inputs: AgentInputs,
    context: ExecutionContext
  ): Promise<BlockOutput | StreamingExecution> {
    logger.info(`Executing agent block: ${block.id}`)
    this.tempMcpServerIds = []

    const responseFormat = this.parseResponseFormat(inputs.responseFormat)
    const model = inputs.model || DEFAULT_MODEL
    const providerId = getProviderFromModel(model)
    const formattedTools = await this.formatTools(inputs.tools || [], context)
    const streamingConfig = this.getStreamingConfig(block, context)

    // Extract and parse attached files from context (starter block output)
    const fileResult = await this.extractFileContent(inputs, context)
    if (fileResult) {
      inputs = {
        ...inputs,
        userPrompt: this.appendFileContentToPrompt(
          inputs.userPrompt,
          fileResult.textContent,
          fileResult.visionUrls,
          fileResult.fileDataParts
        ),
      }

      // Store the enriched input (with file content appended to userPrompt) in the context
      // so the executor can update blockLog.input for accurate trace/log display.
      if (!context.enrichedBlockInputs) {
        context.enrichedBlockInputs = new Map()
      }

      // Collect file metadata for trace visibility
      const processedFiles = this.getProcessedFilesSummary(inputs, context)

      context.enrichedBlockInputs.set(block.id, {
        ...inputs,
        _filesProcessed: processedFiles,
      })
    }

    const messages = this.buildMessages(inputs)

    const providerRequest = this.buildProviderRequest({
      providerId,
      model,
      messages,
      inputs,
      formattedTools,
      responseFormat,
      context,
      streaming: streamingConfig.shouldUseStreaming ?? false,
    })

    this.logRequestDetails(providerRequest, messages, streamingConfig)

    try {
      return await this.executeProviderRequest(providerRequest, block, responseFormat, context)
    } finally {
      // Clean up temporary MCP server connections created during this execution
      this.cleanupTempMcpServers()
    }
  }

  /**
   * Disconnect and remove temporary MCP server connections created from raw config.
   * These are in-memory only (no DB rows), so disconnectServer will clean up
   * the connection and the no-op DB update will silently succeed.
   */
  private cleanupTempMcpServers(): void {
    if (this.tempMcpServerIds.length === 0) return

    const MCPService = getMCPService()
    if (!MCPService) return

    for (const serverId of this.tempMcpServerIds) {
      MCPService.disconnectServer(serverId).catch((err: Error) => {
        logger.warn(`Failed to clean up temp MCP server ${serverId}`, {
          error: err.message,
        })
      })
    }
    logger.info(`Cleaned up ${this.tempMcpServerIds.length} temporary MCP server(s)`)
    this.tempMcpServerIds = []
  }

  /**
   * Extract file content from attached files in the execution context.
   * Reads pre-parsed content from UserFile.parsedContent (populated during upload).
   * When parsedContent is empty/missing for images or PDFs, collects their
   * URLs so they can be sent to the LLM as vision (image_url) content parts.
   *
   * Looks for files in:
   * 1. inputs.files (directly passed via resolver)
   * 2. Starter block output (context.blockStates)
   */
  private async extractFileContent(
    inputs: AgentInputs,
    context: ExecutionContext
  ): Promise<{
    textContent: string
    visionUrls: Array<{ url: string; fileName: string }>
    fileDataParts: Array<{ fileName: string; mimeType: string; base64: string }>
  } | null> {
    // Collect files from inputs — check both 'files' and 'attachments' keys.
    // Tools like outlook_read / gmail_read output under 'attachments' (file[]),
    // while the starter-block UI uploads under 'files'.
    let files: UserFile[] | undefined = inputs.files

    if (!files || files.length === 0) {
      // Also check 'attachments' input (outlook_read / gmail_read tools)
      const inputAttachments = (inputs as any).attachments
      if (Array.isArray(inputAttachments) && inputAttachments.length > 0) {
        files = inputAttachments
      }
    }

    if (!files || files.length === 0) {
      // Fallback: scan block states for files or attachments
      for (const [, blockState] of context.blockStates) {
        if (blockState.output?.files && Array.isArray(blockState.output.files)) {
          files = blockState.output.files
          break
        }
        if (blockState.output?.attachments && Array.isArray(blockState.output.attachments)) {
          // Verify at least one entry looks like a UserFile (has 'name' and 'key')
          const candidates = blockState.output.attachments
          if (candidates.length > 0 && candidates[0].name && candidates[0].key) {
            files = candidates
            break
          }
        }
      }
    }

    if (!files || files.length === 0) {
      return null
    }

    logger.info(`Found ${files.length} attached file(s) to process`)

    const parsedContents: string[] = []
    const visionUrls: Array<{ url: string; fileName: string }> = []
    const fileDataParts: Array<{ fileName: string; mimeType: string; base64: string }> = []

    // File extensions that vision-capable LLMs can natively "see" via image_url
    const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp']
    // Extensions eligible for vision fallback when text extraction fails (images only—
    // PDFs are handled separately via the OpenAI `file` content-part type)
    const VISION_FALLBACK_EXTENSIONS = [...IMAGE_EXTENSIONS, 'svg', 'ico', 'tiff', 'tif']
    // Extensions eligible for base64 file upload to the LLM (OpenAI Chat Completions `file` type)
    const FILE_UPLOAD_EXTENSIONS = ['pdf']

    /** Minimum chars of parsedContent to consider "meaningful" */
    const MIN_PARSED_CONTENT_LENGTH = 10

    /**
     * Detect raw PDF internal structure that was mistakenly "extracted" as text.
     * These contain dense markers like `endobj`, `0 R`, `<< /Type`, etc.
     */
    const looksLikePdfStructure = (text: string): boolean => {
      if (!text || text.length < 20) return false
      const sample = text.slice(0, 4000)
      const len = sample.length
      const endObjCount = (sample.match(/\bendobj\b/g) || []).length
      const objRefCount = (sample.match(/\d+\s+\d+\s+R\b/g) || []).length
      const dictStartCount = (sample.match(/<<\s*\//g) || []).length
      const typeTagCount = (sample.match(/\/Type\s*\//g) || []).length
      const markerDensity =
        (endObjCount + objRefCount + dictStartCount + typeTagCount) / (len / 1000)
      return markerDensity > 3
    }

    for (const file of files) {
      const fileName = file.name || 'unknown'
      const extension = fileName.includes('.') ? fileName.split('.').pop()?.toLowerCase() || '' : ''
      const trimmedParsed = (file.parsedContent ?? '').trim()
      const hasMeaningfulContent =
        trimmedParsed.length >= MIN_PARSED_CONTENT_LENGTH && !looksLikePdfStructure(trimmedParsed)

      // ────────────────────────────────────────────────────────────────────
      // OCR PATH: When enableOcr is on and the file is an image or PDF,
      // extract text via Tesseract OCR and send ONLY the text to the LLM.
      // No base64, no vision — just clean extracted text.
      // ────────────────────────────────────────────────────────────────────
      const ocrEnabled = inputs.enableOcr ?? (inputs as any).enableOCR
      if (ocrEnabled && isOCREligible(fileName) && file.url) {
        try {
          logger.info(`[OCR] Processing file via server-side OCR API: ${fileName}`)
          const ocrResult = await callOCRApi(file.url, fileName)

          if (ocrResult && ocrResult.totalText.length > 0) {
            parsedContents.push(`\n${ocrResult.formattedText}`)
            // Update file metadata so _filesProcessed shows OCR content instead of
            // the original failed parse (visible in trace/logs "Attached Files")
            file.parsedContent = `[OCR Extracted — ${ocrResult.totalText.length} chars, ${ocrResult.avgConfidence}% confidence, ${ocrResult.processingTimeMs}ms]\n${ocrResult.totalText}`
            logger.info(
              `[OCR] Successfully extracted ${ocrResult.totalText.length} chars from ${fileName} ` +
                `(confidence: ${ocrResult.avgConfidence}%, ${ocrResult.processingTimeMs}ms)`
            )
          } else {
            // OCR returned nothing — if there was pre-parsed content, use that;
            // otherwise fall back to vision/base64 below
            if (hasMeaningfulContent) {
              const encodedContent = tryParseThenEncode(file.parsedContent!)
              parsedContents.push(
                `\n--- Attached File: ${fileName} ---\n${encodedContent}\n--- End of File ---`
              )
              logger.info(`[OCR] OCR yielded no text, using pre-parsed content for: ${fileName}`)
            } else {
              logger.warn(
                `[OCR] OCR extracted no text from ${fileName} and no pre-parsed content available`
              )
              parsedContents.push(
                `\n--- Attached File: ${fileName} ---\n[OCR processing completed but no text could be extracted from this file]\n--- End of File ---`
              )
            }
          }
        } catch (ocrError) {
          logger.error(`[OCR] OCR processing failed for ${fileName}`, { error: ocrError })
          // Graceful fallback: if OCR fails, use pre-parsed content or notify
          if (hasMeaningfulContent) {
            const encodedContent = tryParseThenEncode(file.parsedContent!)
            parsedContents.push(
              `\n--- Attached File: ${fileName} ---\n${encodedContent}\n--- End of File ---`
            )
            logger.info(`[OCR] Falling back to pre-parsed content for: ${fileName}`)
          } else {
            parsedContents.push(
              `\n--- Attached File: ${fileName} ---\n[File processing failed — OCR error occurred]\n--- End of File ---`
            )
          }
        }
        continue
      }

      // ── Image files: always send via vision ────────────────────────────
      if (IMAGE_EXTENSIONS.includes(extension)) {
        if (file.url) {
          logger.info(`Sending image file to LLM via vision: ${fileName}`)
          visionUrls.push({ url: file.url, fileName })
          parsedContents.push(
            `\n--- Attached File: ${fileName} ---\n[Image file sent to model for visual analysis]\n--- End of File ---`
          )
        } else {
          parsedContents.push(
            `\n--- Attached File: ${fileName} ---\n[Image file attached but no URL available]\n--- End of File ---`
          )
        }
        continue
      }

      // ── Files with meaningful parsed content: use the text ─────────────
      if (hasMeaningfulContent) {
        // If the parsed content is JSON, encode it as TOON for token savings
        const encodedContent = tryParseThenEncode(file.parsedContent!)
        parsedContents.push(
          `\n--- Attached File: ${fileName} ---\n${encodedContent}\n--- End of File ---`
        )
        logger.info(
          `Using pre-parsed content for file: ${fileName} (${file.parsedContent!.length} chars)`
        )
        continue
      }

      // ── PDFs: download via presigned URL and send as base64 file to the LLM ──
      if (FILE_UPLOAD_EXTENSIONS.includes(extension) && file.url) {
        try {
          logger.info(
            `Text extraction yielded only ${trimmedParsed.length} chars for ${fileName}. ` +
              `Downloading PDF to send as base64 file to LLM.`
          )
          const response = await fetch(file.url)
          if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`)
          const arrayBuffer = await response.arrayBuffer()
          const base64 = Buffer.from(arrayBuffer).toString('base64')
          const mimeType = 'application/pdf'
          fileDataParts.push({ fileName, mimeType, base64 })
          parsedContents.push(
            `\n--- Attached File: ${fileName} ---\n[PDF file sent directly to model for analysis — text extraction was not successful]\n--- End of File ---`
          )
          logger.info(
            `Prepared base64 file content for ${fileName} (${arrayBuffer.byteLength} bytes)`
          )
        } catch (downloadError) {
          logger.error(`Failed to download PDF for base64 encoding: ${fileName}`, downloadError)
          parsedContents.push(
            `\n--- Attached File: ${fileName} ---\n[PDF file attached but could not be downloaded for analysis]\n--- End of File ---`
          )
        }
        continue
      }

      // ── Text extraction failed — try vision fallback (images only) ────
      if (VISION_FALLBACK_EXTENSIONS.includes(extension) && file.url) {
        logger.info(
          `Text extraction yielded only ${trimmedParsed.length} chars for ${fileName}. ` +
            `Sending to LLM via vision for visual analysis.`
        )
        visionUrls.push({ url: file.url, fileName })
        parsedContents.push(
          `\n--- Attached File: ${fileName} ---\n[File sent to model for visual analysis — text extraction was not successful]\n--- End of File ---`
        )
        continue
      }

      // ── No text, no vision — notify the LLM ──────────────────────────
      logger.warn(`No parsed content available for file: ${fileName}`)
      parsedContents.push(
        `\n--- Attached File: ${fileName} ---\n[File attached but content could not be extracted]\n--- End of File ---`
      )
    }

    if (parsedContents.length === 0 && visionUrls.length === 0 && fileDataParts.length === 0) {
      return null
    }

    const textContent =
      parsedContents.length > 0 ? `\n\n[ATTACHED FILES]\n${parsedContents.join('\n')}` : ''

    return { textContent, visionUrls, fileDataParts }
  }

  /**
   * Get a summary of processed files for trace/log visibility.
   * Returns metadata about each file including the parsed content
   * so users can see exactly what was extracted in the workflow logs.
   */
  private getProcessedFilesSummary(
    inputs: AgentInputs,
    context: ExecutionContext
  ): Array<{ name: string; size: number; type: string; parsedContent: string }> {
    let files: UserFile[] | undefined = inputs.files

    if (!files || files.length === 0) {
      const inputAttachments = (inputs as any).attachments
      if (Array.isArray(inputAttachments) && inputAttachments.length > 0) {
        files = inputAttachments
      }
    }

    if (!files || files.length === 0) {
      for (const [, blockState] of context.blockStates) {
        if (blockState.output?.files && Array.isArray(blockState.output.files)) {
          files = blockState.output.files
          break
        }
        if (blockState.output?.attachments && Array.isArray(blockState.output.attachments)) {
          const candidates = blockState.output.attachments
          if (candidates.length > 0 && candidates[0].name && candidates[0].key) {
            files = candidates
            break
          }
        }
      }
    }

    if (!files || files.length === 0) return []

    return files.map((file) => ({
      name: file.name || 'unknown',
      size: file.size || 0,
      type: file.type || 'unknown',
      parsedContent: file.parsedContent || '',
    }))
  }

  /**
   * Append extracted file content (and optional vision URLs / file data) to the user prompt.
   * When vision URLs or file data parts are present the prompt is converted to a multimodal
   * content array so the LLM receives both the text and the image/file content.
   */
  private appendFileContentToPrompt(
    userPrompt: string | object | undefined,
    fileContent: string,
    visionUrls: Array<{ url: string; fileName: string }> = [],
    fileDataParts: Array<{ fileName: string; mimeType: string; base64: string }> = []
  ): string | object {
    // Build the combined text first
    let textPart: string
    if (!userPrompt) {
      textPart = fileContent.trim()
    } else if (typeof userPrompt === 'string') {
      textPart = userPrompt + fileContent
    } else if (typeof userPrompt === 'object' && (userPrompt as any).input) {
      textPart = (userPrompt as any).input + fileContent
    } else {
      textPart = JSON.stringify(userPrompt) + fileContent
    }

    const hasVision = visionUrls && visionUrls.length > 0
    const hasFileData = fileDataParts && fileDataParts.length > 0

    // If no vision URLs and no file data, return plain string (behaviour unchanged)
    if (!hasVision && !hasFileData) {
      // Preserve the original object shape when there was an .input wrapper
      if (typeof userPrompt === 'object' && userPrompt !== null && (userPrompt as any).input) {
        return { ...userPrompt, input: textPart }
      }
      return textPart
    }

    // Build a multimodal content array (OpenAI Chat Completions format).
    // The provider layer passes `message.content` through as-is.
    const totalAttachments = (visionUrls?.length || 0) + (fileDataParts?.length || 0)
    logger.info(`Building multimodal prompt with ${totalAttachments} attached file(s)`)

    const parts: Array<any> = []

    // Text part
    if (textPart) {
      parts.push({ type: 'text', text: textPart })
    }

    // Vision parts — image_url works for images (png, jpeg, gif, webp)
    for (const { url, fileName } of visionUrls) {
      logger.info(`Adding image_url content part for: ${fileName}`)
      parts.push({
        type: 'image_url',
        image_url: { url, detail: 'auto' },
      })
    }

    // File data parts — for PDFs and other documents that OpenAI supports
    // via the Chat Completions `file` content-part type (base64-encoded).
    for (const { fileName, mimeType, base64 } of fileDataParts) {
      logger.info(`Adding file content part for: ${fileName} (${mimeType})`)
      parts.push({
        type: 'file',
        file: {
          filename: fileName,
          file_data: `data:${mimeType};base64,${base64}`,
        },
      })
    }

    return parts as any
  }

  private parseResponseFormat(responseFormat?: string | object): any {
    if (!responseFormat || responseFormat === '') return undefined

    // If already an object, process it directly
    if (typeof responseFormat === 'object' && responseFormat !== null) {
      const formatObj = responseFormat as any
      if (!formatObj.schema && !formatObj.name) {
        return {
          name: 'response_schema',
          schema: responseFormat,
          strict: true,
        }
      }
      return responseFormat
    }

    // Handle string values
    if (typeof responseFormat === 'string') {
      const trimmedValue = responseFormat.trim()

      // Check for variable references like {{start.input}}
      if (trimmedValue.startsWith('<') && trimmedValue.includes('>')) {
        logger.info('Response format contains variable reference:', {
          value: trimmedValue,
        })
        // Variable references should have been resolved by the resolver before reaching here
        // If we still have a variable reference, it means it couldn't be resolved
        // Return undefined to use default behavior (no structured response)
        return undefined
      }

      // Try to parse as JSON
      try {
        const parsed = JSON.parse(trimmedValue)

        if (parsed && typeof parsed === 'object' && !parsed.schema && !parsed.name) {
          return {
            name: 'response_schema',
            schema: parsed,
            strict: true,
          }
        }
        return parsed
      } catch (error: any) {
        logger.warn('Failed to parse response format as JSON, using default behavior:', {
          error: error.message,
          value: trimmedValue,
        })
        // Return undefined instead of throwing - this allows execution to continue
        // without structured response format
        return undefined
      }
    }

    // For any other type, return undefined
    logger.warn('Unexpected response format type, using default behavior:', {
      type: typeof responseFormat,
      value: responseFormat,
    })
    return undefined
  }

  private async formatTools(inputTools: ToolInput[], context: ExecutionContext): Promise<any[]> {
    if (!Array.isArray(inputTools)) return []

    const toolArrays = await Promise.all(
      inputTools
        .filter((tool) => {
          const usageControl = tool.usageControl || 'auto'
          return usageControl !== 'none'
        })
        .map(async (tool) => {
          if (tool.type === 'custom-tool' && tool.schema) {
            return [await this.createCustomTool(tool, context)]
          }
          // Handle MCP blocks - discover and expose actual server tools
          if (tool.type === 'mcp') {
            return await this.formatMCPTools(tool, context)
          }
          const blockTool = await this.transformBlockTool(tool, context)
          return blockTool ? [blockTool] : []
        })
    )

    // Flatten the array of arrays and filter out nulls
    return toolArrays
      .flat()
      .filter((tool): tool is NonNullable<typeof tool> => tool !== null && tool !== undefined)
  }

  /**
   * Format MCP tools by discovering available tools from the MCP server
   * and transforming them into provider-compatible format.
   */
  private async formatMCPTools(tool: ToolInput, context: ExecutionContext): Promise<any[]> {
    const params = tool.params || {}
    const usageControl = tool.usageControl || 'auto'

    logger.info('Formatting MCP tools', {
      hasExistingServerId: !!params.existingServerId,
      hasRawConfig: !!params.rawMcpConfig,
      useExistingServer: params.useExistingServer,
    })

    // On client-side, pass MCP tools through as-is so they can be expanded server-side
    if (typeof window !== 'undefined') {
      logger.info('Passing MCP tool through to server for expansion', {
        hasParams: !!params,
        hasRawConfig: !!params.rawMcpConfig,
      })
      // Return the MCP tool config so it can be expanded by the providers API
      return [
        {
          type: 'mcp',
          title: tool.title || 'MCP Integration',
          params: params,
          toolId: tool.toolId,
          operation: tool.operation,
          usageControl,
        },
      ]
    }

    try {
      // Get MCPService from the registry (registered by API routes)
      const MCPService = getMCPService()
      if (!MCPService) {
        logger.error(
          'MCPService is not available – ensure the API route has loaded and registered it'
        )
        return []
      }

      // Determine the server ID to use
      let serverId: string | undefined
      const workspaceId = context.workspaceId

      if (!workspaceId) {
        logger.error('Workspace ID is required for MCP tool integration')
        return []
      }

      // Check if using existing server or raw config
      const isExisting = params.useExistingServer === true || params.useExistingServer === 'true'
      const isRawConfig = params.useRawConfig === true || params.useRawConfig === 'true'

      if (isExisting && params.existingServerId) {
        // Use existing server
        serverId = params.existingServerId
        logger.info(`Using existing MCP server: ${serverId}`)
      } else if (isRawConfig && params.rawMcpConfig) {
        // Parse raw config and create/connect temporary server
        serverId = await this.createMCPServerFromRawConfig(
          params.rawMcpConfig,
          workspaceId,
          context
        )
        if (!serverId) {
          logger.error('Failed to create MCP server from raw config')
          return []
        }
      } else {
        logger.warn('MCP tool configuration incomplete - no server ID or raw config provided')
        return []
      }

      // Ensure server is connected
      const connection = MCPService.getConnection(serverId)
      if (!connection) {
        logger.info(`Connecting to MCP server: ${serverId}`)
        try {
          const userId = context.userId
          if (!userId) {
            logger.error('User ID is required to connect to an existing MCP server')
            return []
          }
          await MCPService.connectServer(userId, workspaceId, serverId)
        } catch (connectError) {
          logger.error('Failed to connect to MCP server', {
            serverId,
            error: connectError instanceof Error ? connectError.message : String(connectError),
          })
          return []
        }
      }

      // Discover tools from the server
      // Use listServerTools for temp servers (no DB record) to avoid UUID errors
      if (!serverId) {
        logger.error('Server ID is undefined after setup')
        return []
      }
      const isTemp = serverId.startsWith('temp_')
      const mcpTools = isTemp
        ? await MCPService.listServerTools(serverId)
        : await MCPService.refreshServerTools(serverId)

      if (!mcpTools || mcpTools.length === 0) {
        logger.warn(`No tools discovered from MCP server: ${serverId}`)
        return []
      }

      logger.info(`Discovered ${mcpTools.length} tools from MCP server: ${serverId}`)

      // Transform MCP tools to provider-compatible format
      return mcpTools.map((mcpTool: any) => {
        const toolId = `${MCP_TOOL_PREFIX}${serverId}_${mcpTool.name}`

        // Register mapping so executeMCPTool can route the call back
        registerMCPToolId(toolId, { serverId, toolName: mcpTool.name })

        return {
          id: toolId,
          name: mcpTool.name,
          description: mcpTool.description || `MCP tool: ${mcpTool.name}`,
          params: {},
          parameters: mcpTool.inputSchema || { type: 'object', properties: {} },
          usageControl,
          // Store MCP metadata for execution routing
          _mcpMetadata: {
            serverId,
            toolName: mcpTool.name,
            workspaceId,
          },
        }
      })
    } catch (error) {
      logger.error('Error formatting MCP tools', {
        error: error instanceof Error ? error.message : String(error),
      })
      return []
    }
  }

  /**
   * Create a temporary MCP server from raw JSON config (Claude Desktop format)
   */
  private async createMCPServerFromRawConfig(
    rawConfig: string | object,
    workspaceId: string,
    context: ExecutionContext
  ): Promise<string | undefined> {
    try {
      const MCPService = getMCPService()
      if (!MCPService) {
        throw new Error('MCPService is not available')
      }

      let parsed: any
      if (typeof rawConfig === 'string') {
        parsed = rawConfig.trim() ? JSON.parse(rawConfig) : {}
      } else {
        parsed = rawConfig
      }

      let serverName: string
      let serverConfig: any

      // Handle { "mcpServers": { "name": { ... } } } wrapper
      if (parsed.mcpServers && typeof parsed.mcpServers === 'object') {
        const serverNames = Object.keys(parsed.mcpServers)
        if (serverNames.length === 0) {
          throw new Error('No server found in mcpServers configuration')
        }
        serverName = serverNames[0]
        serverConfig = parsed.mcpServers[serverName]
      } else if (parsed.command || parsed.endpoint || parsed.baseUrl || parsed.url) {
        serverName = parsed.name || `mcp-temp-${Date.now()}`
        serverConfig = parsed
      } else {
        throw new Error('Invalid MCP config format')
      }

      // Determine server type
      let serverType = 'stdio'
      let config: any = {}

      if (serverConfig.command) {
        serverType = 'stdio'
        config = {
          stdio: {
            command: serverConfig.command,
            args: serverConfig.args || [],
            env: serverConfig.env || {},
          },
        }
      } else if (serverConfig.url) {
        // URL-based server: { "url": "https://...", "transport": "http"|"sse", "headers": {...} }
        const transport = serverConfig.transport || 'http'
        if (transport === 'sse') {
          serverType = 'sse'
          config = {
            sse: {
              endpoint: serverConfig.url,
              headers: serverConfig.headers || {},
            },
          }
        } else {
          serverType = 'streamable-http'
          config = {
            streamableHttp: {
              url: serverConfig.url,
              headers: serverConfig.headers || {},
            },
          }
        }
      } else if (serverConfig.endpoint) {
        serverType = 'sse'
        config = {
          sse: {
            endpoint: serverConfig.endpoint,
            headers: serverConfig.headers || {},
          },
        }
      } else if (serverConfig.baseUrl) {
        serverType = 'http'
        config = {
          http: {
            baseUrl: serverConfig.baseUrl,
            apiKey: serverConfig.apiKey,
            headers: serverConfig.headers || {},
          },
        }
      }

      // Create the server as an in-memory connection (no database insert)
      // This avoids foreign key constraint issues and is appropriate for temporary servers
      // Uses MCPService.createTemporaryServer to avoid importing child_process into client bundles
      const serverId = await MCPService.createTemporaryServer(
        serverName,
        serverType,
        config,
        30_000
      )

      logger.info(`Created temporary in-memory MCP server: ${serverId} (${serverName})`)

      // Track for cleanup after execution
      this.tempMcpServerIds.push(serverId)

      return serverId
    } catch (error) {
      logger.error('Error creating MCP server from raw config', {
        error: error instanceof Error ? error.message : String(error),
      })
      return undefined
    }
  }

  private async createCustomTool(tool: ToolInput, context: ExecutionContext): Promise<any> {
    const userProvidedParams = tool.params || {}

    // Import the utility function
    const { filterSchemaForLLM, mergeToolParameters } = await import('@/tools/params')

    // Create schema excluding user-provided parameters
    const filteredSchema = filterSchemaForLLM(tool.schema.function.parameters, userProvidedParams)

    const toolId = `${CUSTOM_TOOL_PREFIX}${tool.title}`
    const base: any = {
      id: toolId,
      name: tool.schema.function.name,
      description: tool.schema.function.description || '',
      params: userProvidedParams,
      parameters: {
        ...filteredSchema,
        type: tool.schema.function.parameters.type,
      },
      usageControl: tool.usageControl || 'auto',
    }

    if (tool.code) {
      base.executeFunction = async (callParams: Record<string, any>) => {
        // Merge user-provided parameters with LLM-generated parameters
        const mergedParams = mergeToolParameters(userProvidedParams, callParams)

        const result = await executeTool(
          'function_execute',
          {
            code: tool.code,
            ...mergedParams,
            timeout: tool.timeout ?? DEFAULT_FUNCTION_TIMEOUT,
            envVars: context.environmentVariables || {},
            isCustomTool: true,
            _context: {
              workflowId: context.workflowId,
              workspaceId: context.workspaceId,
            },
          },
          false, // skipProxy
          false, // skipPostProcess
          context // execution context for file processing
        )

        if (!result.success) {
          throw new Error(result.error || 'Function execution failed')
        }
        return result.output
      }
    }

    return base
  }

  private async transformBlockTool(tool: ToolInput, context: ExecutionContext) {
    const transformedTool = await transformBlockTool(tool, {
      selectedOperation: tool.operation,
      getAllBlocks,
      getToolAsync: (toolId: string) => getToolAsync(toolId, context.workflowId),
      getTool,
    })

    if (transformedTool) {
      transformedTool.usageControl = tool.usageControl || 'auto'
    }
    return transformedTool
  }

  private getStreamingConfig(block: SerializedBlock, context: ExecutionContext): StreamingConfig {
    const isBlockSelectedForOutput =
      context.selectedOutputIds?.some((outputId) => {
        if (outputId === block.id) return true
        const firstUnderscoreIndex = outputId.indexOf('_')
        return (
          firstUnderscoreIndex !== -1 && outputId.substring(0, firstUnderscoreIndex) === block.id
        )
      }) ?? false

    const hasOutgoingConnections = context.edges?.some((edge) => edge.source === block.id) ?? false
    const shouldUseStreaming = Boolean(context.stream) && isBlockSelectedForOutput

    if (shouldUseStreaming) {
      logger.info(`Block ${block.id} will use streaming response`)
    }

    return { shouldUseStreaming, isBlockSelectedForOutput, hasOutgoingConnections }
  }

  private buildMessages(inputs: AgentInputs): Message[] | undefined {
    if (!inputs.memories && !(inputs.systemPrompt && inputs.userPrompt)) {
      return undefined
    }

    const messages: Message[] = []

    if (inputs.memories) {
      messages.push(...this.processMemories(inputs.memories))
    }

    // Combine system prompt with custom instructions
    let systemPrompt = inputs.systemPrompt
    if (inputs.customInstructions) {
      systemPrompt = systemPrompt
        ? `${systemPrompt}\n\n${inputs.customInstructions}`
        : inputs.customInstructions
    }

    if (systemPrompt) {
      this.addSystemPrompt(messages, systemPrompt)
    }

    if (inputs.userPrompt) {
      this.addUserPrompt(messages, inputs.userPrompt)
    }

    return messages.length > 0 ? messages : undefined
  }

  private processMemories(memories: any): Message[] {
    if (!memories) return []

    let memoryArray: any[] = []
    if (memories?.memories && Array.isArray(memories.memories)) {
      memoryArray = memories.memories
    } else if (Array.isArray(memories)) {
      memoryArray = memories
    }

    const messages: Message[] = []
    memoryArray.forEach((memory: any) => {
      if (memory.data && Array.isArray(memory.data)) {
        memory.data.forEach((msg: any) => {
          if (msg.role && msg.content && ['system', 'user', 'assistant'].includes(msg.role)) {
            messages.push({
              role: msg.role as 'system' | 'user' | 'assistant',
              content: msg.content,
            })
          }
        })
      } else if (
        memory.role &&
        memory.content &&
        ['system', 'user', 'assistant'].includes(memory.role)
      ) {
        messages.push({
          role: memory.role as 'system' | 'user' | 'assistant',
          content: memory.content,
        })
      }
    })

    return messages
  }

  private addSystemPrompt(messages: Message[], systemPrompt: any) {
    let content: string

    if (typeof systemPrompt === 'string') {
      content = systemPrompt
    } else {
      try {
        content = JSON.stringify(systemPrompt, null, 2)
      } catch (error) {
        content = String(systemPrompt)
      }
    }

    const systemMessages = messages.filter((msg) => msg.role === 'system')

    if (systemMessages.length > 0) {
      messages.splice(0, 0, { role: 'system', content })
      for (let i = messages.length - 1; i >= 1; i--) {
        if (messages[i].role === 'system') {
          messages.splice(i, 1)
        }
      }
    } else {
      messages.splice(0, 0, { role: 'system', content })
    }
  }

  private addUserPrompt(messages: Message[], userPrompt: any) {
    // If userPrompt is already a multimodal content array (from appendFileContentToPrompt
    // with vision URLs), pass it through directly.
    if (Array.isArray(userPrompt) && userPrompt.length > 0 && userPrompt[0]?.type) {
      messages.push({ role: 'user', content: userPrompt })
      return
    }

    let content = userPrompt
    if (typeof userPrompt === 'object' && userPrompt.input) {
      content = userPrompt.input
    } else if (typeof userPrompt === 'object') {
      content = JSON.stringify(userPrompt)
    }

    messages.push({ role: 'user', content })
  }

  private buildProviderRequest(config: {
    providerId: string
    model: string
    messages: Message[] | undefined
    inputs: AgentInputs
    formattedTools: any[]
    responseFormat: any
    context: ExecutionContext
    streaming: boolean
  }) {
    const {
      providerId,
      model,
      messages,
      inputs,
      formattedTools,
      responseFormat,
      context,
      streaming,
    } = config

    const validMessages = this.validateMessages(messages)

    return {
      provider: providerId,
      model,
      systemPrompt: validMessages ? undefined : inputs.systemPrompt,
      context: toonEncodeForLLM(messages),
      tools: formattedTools,
      temperature: inputs.temperature,
      maxTokens:
        inputs.maxTokens !== undefined && inputs.maxTokens >= 1 ? inputs.maxTokens : undefined,
      topP: inputs.topP,
      topK: inputs.topK,
      presencePenalty: inputs.presencePenalty,
      frequencyPenalty: inputs.frequencyPenalty,
      timeout: inputs.timeout,
      apiKey: inputs.apiKey,
      azureEndpoint: inputs.azureEndpoint,
      azureApiVersion: inputs.azureApiVersion,
      responseFormat,
      workflowId: context.workflowId,
      workspaceId: context.workspaceId,
      stream: streaming,
      messages,
      environmentVariables: context.environmentVariables || {},
    }
  }

  private validateMessages(messages: Message[] | undefined): boolean {
    return (
      Array.isArray(messages) &&
      messages.length > 0 &&
      messages.every(
        (msg: any) =>
          typeof msg === 'object' &&
          msg !== null &&
          'role' in msg &&
          typeof msg.role === 'string' &&
          ('content' in msg ||
            (msg.role === 'assistant' && ('function_call' in msg || 'tool_calls' in msg)))
      )
    )
  }

  private logRequestDetails(
    providerRequest: any,
    messages: Message[] | undefined,
    streamingConfig: StreamingConfig
  ) {
    logger.info('Provider request prepared', {
      model: providerRequest.model,
      hasMessages: !!messages?.length,
      hasSystemPrompt: !messages?.length && !!providerRequest.systemPrompt,
      hasContext: !messages?.length && !!providerRequest.context,
      hasTools: !!providerRequest.tools,
      hasApiKey: !!providerRequest.apiKey,
      workflowId: providerRequest.workflowId,
      stream: providerRequest.stream,
      messagesCount: messages?.length || 0,
    })
  }

  private async executeProviderRequest(
    providerRequest: any,
    block: SerializedBlock,
    responseFormat: any,
    context: ExecutionContext
  ): Promise<BlockOutput | StreamingExecution> {
    const providerId = providerRequest.provider
    const model = providerRequest.model
    const providerStartTime = Date.now()

    try {
      const isBrowser = typeof window !== 'undefined'

      if (!isBrowser) {
        return this.executeServerSide(
          providerRequest,
          providerId,
          model,
          block,
          responseFormat,
          context,
          providerStartTime
        )
      }
      return this.executeBrowserSide(
        providerRequest,
        block,
        responseFormat,
        context,
        providerStartTime
      )
    } catch (error) {
      this.handleExecutionError(error, providerStartTime, providerId, model, context, block)
      throw error
    }
  }

  private async executeServerSide(
    providerRequest: any,
    providerId: string,
    model: string,
    block: SerializedBlock,
    responseFormat: any,
    context: ExecutionContext,
    providerStartTime: number
  ) {
    logger.info('Using direct provider execution (server environment)')

    const finalApiKey = this.getApiKey(providerId, model, providerRequest.apiKey)

    const response = await executeProviderRequest(providerId, {
      model,
      systemPrompt: 'systemPrompt' in providerRequest ? providerRequest.systemPrompt : undefined,
      context: 'context' in providerRequest ? providerRequest.context : undefined,
      tools: providerRequest.tools,
      temperature: providerRequest.temperature,
      maxTokens: providerRequest.maxTokens,
      topP: providerRequest.topP,
      topK: providerRequest.topK,
      presencePenalty: providerRequest.presencePenalty,
      frequencyPenalty: providerRequest.frequencyPenalty,
      apiKey: finalApiKey,
      azureEndpoint: providerRequest.azureEndpoint,
      azureApiVersion: providerRequest.azureApiVersion,
      responseFormat: providerRequest.responseFormat,
      workflowId: providerRequest.workflowId,
      stream: providerRequest.stream,
      messages: 'messages' in providerRequest ? providerRequest.messages : undefined,
      environmentVariables: context.environmentVariables || {},
    })

    this.logExecutionSuccess(providerId, model, context, block, providerStartTime, response)
    return this.processProviderResponse(response, block, responseFormat)
  }

  private async executeBrowserSide(
    providerRequest: any,
    block: SerializedBlock,
    responseFormat: any,
    context: ExecutionContext,
    providerStartTime: number
  ) {
    logger.info('Using HTTP provider request (browser environment)')

    const response = await fetch('/api/providers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(providerRequest),
      signal: AbortSignal.timeout(
        providerRequest.timeout ? providerRequest.timeout * 1000 : REQUEST_TIMEOUT
      ),
    })

    if (!response.ok) {
      const errorMessage = await this.extractErrorMessage(response)
      throw new Error(errorMessage)
    }

    this.logExecutionSuccess(
      providerRequest.provider,
      providerRequest.model,
      context,
      block,
      providerStartTime,
      'HTTP response'
    )

    // Check if this is a streaming response
    const contentType = response.headers.get('Content-Type')
    if (contentType?.includes('text/event-stream')) {
      // Handle streaming response
      logger.info('Received streaming response')
      return this.handleStreamingResponse(response, block)
    }

    // Handle regular JSON response
    const result = await response.json()
    return this.processProviderResponse(result, block, responseFormat)
  }

  private async handleStreamingResponse(
    response: Response,
    block: SerializedBlock
  ): Promise<StreamingExecution> {
    // Check if we have execution data in headers (from StreamingExecution)
    const executionDataHeader = response.headers.get('X-Execution-Data')

    if (executionDataHeader) {
      // Parse execution data from header
      try {
        const executionData = JSON.parse(executionDataHeader)

        // Create StreamingExecution object
        return {
          stream: response.body!,
          execution: {
            success: executionData.success,
            output: executionData.output || {},
            error: executionData.error,
            logs: [], // Logs are stripped from headers, will be populated by executor
            metadata: executionData.metadata || {
              duration: 0,
              startTime: new Date().toISOString(),
            },
            isStreaming: true,
            blockId: block.id,
            blockName: block.metadata?.name,
            blockType: block.metadata?.id,
          } as any,
        }
      } catch (error) {
        logger.error('Failed to parse execution data from header:', error)
        // Fall back to minimal streaming execution
      }
    }

    // Fallback for plain ReadableStream or when header parsing fails
    return this.createMinimalStreamingExecution(response.body!)
  }

  private getApiKey(providerId: string, model: string, inputApiKey: string): string {
    try {
      return getApiKey(providerId, model, inputApiKey)
    } catch (error) {
      logger.error('Failed to get API key:', {
        provider: providerId,
        model,
        error: error instanceof Error ? error.message : String(error),
        hasProvidedApiKey: !!inputApiKey,
      })
      throw new Error(error instanceof Error ? error.message : 'API key error')
    }
  }

  private async extractErrorMessage(response: Response): Promise<string> {
    let errorMessage = `Provider API request failed with status ${response.status}`
    try {
      const errorData = await response.json()
      if (errorData.error) {
        errorMessage = errorData.error
      }
    } catch (_e) {
      // Use default message if JSON parsing fails
    }
    return errorMessage
  }

  private logExecutionSuccess(
    provider: string,
    model: string,
    context: ExecutionContext,
    block: SerializedBlock,
    startTime: number,
    response: any
  ) {
    const executionTime = Date.now() - startTime
    const responseType =
      response instanceof ReadableStream
        ? 'stream'
        : response && typeof response === 'object' && 'stream' in response
          ? 'streaming-execution'
          : 'json'

    logger.info('Provider request completed successfully', {
      provider,
      model,
      workflowId: context.workflowId,
      blockId: block.id,
      executionTime,
      responseType,
    })
  }

  private handleExecutionError(
    error: any,
    startTime: number,
    provider: string,
    model: string,
    context: ExecutionContext,
    block: SerializedBlock
  ) {
    const executionTime = Date.now() - startTime

    logger.error('Error executing provider request:', {
      error,
      executionTime,
      provider,
      model,
      workflowId: context.workflowId,
      blockId: block.id,
    })

    if (!(error instanceof Error)) return

    logger.error('Provider request error details', {
      workflowId: context.workflowId,
      blockId: block.id,
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack,
      timestamp: new Date().toISOString(),
    })

    if (error.name === 'AbortError') {
      throw new Error('Provider request timed out - the API took too long to respond')
    }
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error(
        'Network error - unable to connect to provider API. Please check your internet connection.'
      )
    }
    if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
      throw new Error('Unable to connect to server - DNS or connection issue')
    }
  }

  private processProviderResponse(
    response: any,
    block: SerializedBlock,
    responseFormat: any
  ): BlockOutput | StreamingExecution {
    if (this.isStreamingExecution(response)) {
      return this.processStreamingExecution(response, block)
    }

    if (response instanceof ReadableStream) {
      return this.createMinimalStreamingExecution(response)
    }

    return this.processRegularResponse(response, responseFormat)
  }

  private isStreamingExecution(response: any): boolean {
    return (
      response && typeof response === 'object' && 'stream' in response && 'execution' in response
    )
  }

  private processStreamingExecution(
    response: StreamingExecution,
    block: SerializedBlock
  ): StreamingExecution {
    const streamingExec = response as StreamingExecution
    logger.info(`Received StreamingExecution for block ${block.id}`)

    if (streamingExec.execution.output) {
      const execution = streamingExec.execution as any
      if (block.metadata?.name) execution.blockName = block.metadata.name
      if (block.metadata?.id) execution.blockType = block.metadata.id
      execution.blockId = block.id
      execution.isStreaming = true
    }

    return streamingExec
  }

  private createMinimalStreamingExecution(stream: ReadableStream): StreamingExecution {
    return {
      stream,
      execution: {
        success: true,
        output: {},
        logs: [],
        metadata: {
          duration: 0,
          startTime: new Date().toISOString(),
        },
      },
    }
  }

  private processRegularResponse(result: any, responseFormat: any): BlockOutput {
    logger.info('Provider response received', {
      contentLength: result.content ? result.content.length : 0,
      model: result.model,
      hasTokens: !!result.tokens,
      hasToolCalls: !!result.toolCalls,
      toolCallsCount: result.toolCalls?.length || 0,
    })

    if (responseFormat) {
      return this.processStructuredResponse(result, responseFormat)
    }

    return this.processStandardResponse(result)
  }

  private processStructuredResponse(result: any, responseFormat: any): BlockOutput {
    const content = result.content

    try {
      const extractedJson = JSON.parse(content.trim())
      logger.info('Successfully parsed structured response content')
      return {
        ...extractedJson,
        ...this.createResponseMetadata(result),
      }
    } catch (_directParseError) {
      // Direct JSON.parse failed — try extracting JSON from surrounding text.
      // This handles models (e.g. Bedrock) that may wrap JSON in explanatory text
      // even when instructed to return only JSON.
      try {
        const extractedJson = extractAndParseJSON(content)
        logger.info('Successfully extracted JSON from structured response content (fallback)')
        return {
          ...extractedJson,
          ...this.createResponseMetadata(result),
        }
      } catch (_extractError) {
        logger.info('JSON extraction also failed', {
          error: _extractError instanceof Error ? _extractError.message : 'Unknown error',
        })
      }

      // LLM did not adhere to structured response format
      logger.error('LLM did not adhere to structured response format:', {
        content: content.substring(0, 200) + (content.length > 200 ? '...' : ''),
        responseFormat: responseFormat,
      })

      const standardResponse = this.processStandardResponse(result)
      return Object.assign(standardResponse, {
        _responseFormatWarning:
          'LLM did not adhere to the specified structured response format. Expected valid JSON but received malformed content. Falling back to standard format.',
      })
    }
  }

  private processStandardResponse(result: any): BlockOutput {
    return {
      content: result.content,
      model: result.model,
      ...this.createResponseMetadata(result),
    }
  }

  private createResponseMetadata(result: any) {
    return {
      tokens: result.tokens || { prompt: 0, completion: 0, total: 0 },
      toolCalls: {
        list: result.toolCalls ? result.toolCalls.map(this.formatToolCall.bind(this)) : [],
        count: result.toolCalls?.length || 0,
      },
      providerTiming: result.timing,
      cost: result.cost,
    }
  }

  private formatToolCall(tc: any) {
    const toolName = this.stripCustomToolPrefix(tc.name)

    return {
      ...tc,
      name: toolName,
      startTime: tc.startTime,
      endTime: tc.endTime,
      duration: tc.duration,
      arguments: tc.arguments || tc.input || {},
      input: tc.arguments || tc.input || {}, // Keep both for backward compatibility
      output: tc.result || tc.output,
    }
  }

  private stripCustomToolPrefix(name: string): string {
    return name.startsWith('custom_') ? name.replace('custom_', '') : name
  }
}
