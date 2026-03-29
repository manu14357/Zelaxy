'use client'

import { type KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowDown, ArrowUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { createLogger } from '@/lib/logs/console/logger'
import {
  extractBlockIdFromOutputId,
  extractPathFromOutputId,
  parseOutputContentSafely,
} from '@/lib/response-format'
import { ChatMessage } from '@/app/arena/[workspaceId]/zelaxy/[workflowId]/components/panel/components/chat/components/chat-message/chat-message'
import { OutputSelect } from '@/app/arena/[workspaceId]/zelaxy/[workflowId]/components/panel/components/chat/components/output-select/output-select'
import { useWorkflowExecution } from '@/app/arena/[workspaceId]/zelaxy/[workflowId]/hooks/use-workflow-execution'
import type { BlockLog, ExecutionResult } from '@/executor/types'
import { useExecutionStore } from '@/stores/execution/store'
import { useChatStore } from '@/stores/panel/chat/store'
import { useConsoleStore } from '@/stores/panel/console/store'
import { useWorkflowRegistry } from '@/stores/workflows/registry/store'
import { ChatFileUpload } from './components/chat-file-upload'

const logger = createLogger('ChatPanel')

interface ChatFile {
  id: string
  name: string
  size: number
  type: string
  file: File
}

interface ChatProps {
  panelWidth: number
  chatMessage: string
  setChatMessage: (message: string) => void
}

export function Chat({ panelWidth, chatMessage, setChatMessage }: ChatProps) {
  const { activeWorkflowId } = useWorkflowRegistry()

  const {
    messages,
    addMessage,
    removeMessage,
    selectedWorkflowOutputs,
    setSelectedWorkflowOutput,
    appendMessageContent,
    finalizeMessageStream,
    getConversationId,
  } = useChatStore()
  const { entries } = useConsoleStore()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Prompt history state
  const [promptHistory, setPromptHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  // File upload state
  const [chatFiles, setChatFiles] = useState<ChatFile[]>([])
  const [isUploadingFiles, setIsUploadingFiles] = useState(false)
  const [dragCounter, setDragCounter] = useState(0)
  const isDragOver = dragCounter > 0
  // Keep a ref to chatFiles so useCallback always sees the latest value
  const chatFilesRef = useRef<ChatFile[]>(chatFiles)
  chatFilesRef.current = chatFiles
  // Scroll state
  const [isNearBottom, setIsNearBottom] = useState(true)
  const [showScrollButton, setShowScrollButton] = useState(false)

  // Use the execution store state to track if a workflow is executing
  const { isExecuting } = useExecutionStore()

  // Get workflow execution functionality
  const { handleRunWorkflow } = useWorkflowExecution()

  // Get output entries from console for the dropdown
  const outputEntries = useMemo(() => {
    if (!activeWorkflowId) return []
    return entries.filter((entry) => entry.workflowId === activeWorkflowId && entry.output)
  }, [entries, activeWorkflowId])

  // Get filtered messages for current workflow
  const workflowMessages = useMemo(() => {
    if (!activeWorkflowId) return []
    return messages
      .filter((msg) => msg.workflowId === activeWorkflowId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  }, [messages, activeWorkflowId])

  // Memoize user messages for performance
  const userMessages = useMemo(() => {
    return workflowMessages
      .filter((msg) => msg.type === 'user')
      .map((msg) => msg.content)
      .filter((content): content is string => typeof content === 'string')
  }, [workflowMessages])

  // Update prompt history when workflow changes
  useEffect(() => {
    if (!activeWorkflowId) {
      setPromptHistory([])
      setHistoryIndex(-1)
      return
    }

    setPromptHistory(userMessages)
    setHistoryIndex(-1)
  }, [activeWorkflowId, userMessages])

  // Get selected workflow outputs
  const selectedOutputs = useMemo(() => {
    if (!activeWorkflowId) return []
    const selected = selectedWorkflowOutputs[activeWorkflowId]

    if (!selected || selected.length === 0) {
      // Return empty array when nothing is explicitly selected
      return []
    }

    // Ensure we have no duplicates in the selection
    const dedupedSelection = [...new Set(selected)]

    // If deduplication removed items, update the store
    if (dedupedSelection.length !== selected.length) {
      setSelectedWorkflowOutput(activeWorkflowId, dedupedSelection)
      return dedupedSelection
    }

    return selected
  }, [selectedWorkflowOutputs, activeWorkflowId, setSelectedWorkflowOutput])

  // Focus input helper with proper cleanup
  const focusInput = useCallback((delay = 0) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      if (inputRef.current && document.contains(inputRef.current)) {
        inputRef.current.focus({ preventScroll: true })
      }
    }, delay)
  }, [])

  // Scroll to bottom function
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [])

  // Handle scroll events to track user position
  const handleScroll = useCallback(() => {
    const scrollArea = scrollAreaRef.current
    if (!scrollArea) return

    // Find the viewport element inside the ScrollArea
    const viewport = scrollArea.querySelector('[data-radix-scroll-area-viewport]')
    if (!viewport) return

    const { scrollTop, scrollHeight, clientHeight } = viewport
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight

    // Consider "near bottom" if within 100px of bottom
    const nearBottom = distanceFromBottom <= 100
    setIsNearBottom(nearBottom)
    setShowScrollButton(!nearBottom)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // Attach scroll listener
  useEffect(() => {
    const scrollArea = scrollAreaRef.current
    if (!scrollArea) return

    // Find the viewport element inside the ScrollArea
    const viewport = scrollArea.querySelector('[data-radix-scroll-area-viewport]')
    if (!viewport) return

    viewport.addEventListener('scroll', handleScroll, { passive: true })

    // Also listen for scrollend event if available (for smooth scrolling)
    if ('onscrollend' in viewport) {
      viewport.addEventListener('scrollend', handleScroll, { passive: true })
    }

    // Initial scroll state check with small delay to ensure DOM is ready
    setTimeout(handleScroll, 100)

    return () => {
      viewport.removeEventListener('scroll', handleScroll)
      if ('onscrollend' in viewport) {
        viewport.removeEventListener('scrollend', handleScroll)
      }
    }
  }, [handleScroll])

  // Auto-scroll to bottom when new messages are added, but only if user is near bottom
  // Exception: Always scroll when sending a new message
  useEffect(() => {
    if (workflowMessages.length === 0) return

    const lastMessage = workflowMessages[workflowMessages.length - 1]
    const isNewUserMessage = lastMessage?.type === 'user'

    // Always scroll for new user messages, or only if near bottom for assistant messages
    if ((isNewUserMessage || isNearBottom) && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
      // Let the scroll event handler update the state naturally after animation completes
    }
  }, [workflowMessages, isNearBottom])

  // Handle send message
  const handleSendMessage = useCallback(async () => {
    if (
      (!chatMessage.trim() && chatFilesRef.current.length === 0) ||
      !activeWorkflowId ||
      isExecuting ||
      isUploadingFiles
    )
      return

    // Store the message being sent for reference
    const sentMessage = chatMessage.trim()

    // Add to prompt history if it's not already the most recent
    if (
      sentMessage &&
      (promptHistory.length === 0 || promptHistory[promptHistory.length - 1] !== sentMessage)
    ) {
      setPromptHistory((prev) => [...prev, sentMessage])
    }

    // Reset history index
    setHistoryIndex(-1)

    // Cancel any existing operations
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    // Get the conversationId for this workflow before adding the message
    const conversationId = getConversationId(activeWorkflowId)
    let result: any = null

    // Debug: Log selected outputs before execution

    try {
      // Use ref to guarantee latest files (avoids stale closure in useCallback)
      const currentFiles = chatFilesRef.current

      // Debug: Log chatFiles state before addMessage

      // Build files metadata for the message
      const filesMeta =
        currentFiles.length > 0
          ? currentFiles.map((f) => ({ name: f.name, size: f.size, type: f.type }))
          : undefined

      // Add user message
      addMessage({
        content:
          sentMessage || (currentFiles.length > 0 ? `Uploaded ${currentFiles.length} file(s)` : ''),
        workflowId: activeWorkflowId,
        type: 'user',
        ...(filesMeta && { files: filesMeta }),
      })

      // Prepare workflow input
      const workflowInput: any = {
        input: sentMessage,
        conversationId: conversationId,
      }

      // Add files if any (pass the File objects directly)
      if (currentFiles.length > 0) {
        workflowInput.files = currentFiles.map((chatFile) => ({
          name: chatFile.name,
          size: chatFile.size,
          type: chatFile.type,
          file: chatFile.file, // Pass the actual File object
        }))
      }

      // Clear input and files, refocus immediately
      setChatMessage('')
      setChatFiles([])
      focusInput(10)

      // Auto-open console panel when sending a chat message
      const openConsoleEvent = new CustomEvent('open-console-panel')
      window.dispatchEvent(openConsoleEvent)

      // Execute the workflow to generate a response
      result = await handleRunWorkflow(workflowInput)
    } catch (error) {
      logger.error('Error in handleSendMessage:', error)
      setIsUploadingFiles(false)
      // You might want to show an error message to the user here
      return
    }

    // Check if we got a streaming response
    if (result && 'stream' in result && result.stream instanceof ReadableStream) {
      const messageIdMap = new Map<string, string>()

      const reader = result.stream.getReader()
      const decoder = new TextDecoder()

      const processStream = async () => {
        while (true) {
          const { done, value } = await reader.read()
          if (done) {
            // Check if we have selected outputs that haven't been processed yet
            if (selectedOutputs.length > 0) {
              // CRITICAL: If we have selected outputs but didn't process them in the final event,
              // we need to process them here from the last known execution result
            }

            // Finalize all streaming messages
            messageIdMap.forEach((id) => finalizeMessageStream(id))
            break
          }

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const json = JSON.parse(line.substring(6))
                const { blockId, chunk: contentChunk, event, data } = json

                if (event === 'final' && data) {
                  const result = data as ExecutionResult

                  const nonStreamingLogs =
                    result.logs?.filter((log) => !messageIdMap.has(log.blockId)) || []

                  // IMPORTANT: For agent blocks, we might need to process them even if they were streaming
                  // because the selected outputs (like model, tokens, etc.) are not part of the streaming content
                  const agentLogsWithSelectedOutputs =
                    result.logs?.filter((log) => {
                      const isAgent = log.blockType === 'agent'
                      const hasSelectedOutputsForThisBlock = selectedOutputs.some(
                        (outputId) => extractBlockIdFromOutputId(outputId) === log.blockId
                      )
                      return isAgent && hasSelectedOutputsForThisBlock
                    }) || []

                  // Always process agent blocks with selected outputs, regardless of streaming status
                  const logsToProcess =
                    agentLogsWithSelectedOutputs.length > 0
                      ? agentLogsWithSelectedOutputs
                      : nonStreamingLogs

                  if (logsToProcess.length > 0) {
                    const outputsToRender = selectedOutputs.filter((outputId) => {
                      const blockIdForOutput = extractBlockIdFromOutputId(outputId)
                      return logsToProcess.some((log) => log.blockId === blockIdForOutput)
                    })

                    // Group selected outputs by block ID to handle agent outputs properly
                    const outputsByBlock = new Map<
                      string,
                      { log: any; outputs: Array<{ path: string; value: any }> }
                    >()

                    for (const outputId of outputsToRender) {
                      const blockIdForOutput = extractBlockIdFromOutputId(outputId)
                      const path = extractPathFromOutputId(outputId, blockIdForOutput)
                      const log = logsToProcess.find((l) => l.blockId === blockIdForOutput)

                      if (log) {
                        let outputValue: any = log.output

                        if (path) {
                          // Parse JSON content safely
                          outputValue = parseOutputContentSafely(outputValue)

                          const pathParts = path.split('.')
                          for (const part of pathParts) {
                            if (
                              outputValue &&
                              typeof outputValue === 'object' &&
                              part in outputValue
                            ) {
                              outputValue = outputValue[part]
                            } else {
                              outputValue = undefined
                              break
                            }
                          }
                        }

                        if (outputValue !== undefined) {
                          if (!outputsByBlock.has(blockIdForOutput)) {
                            outputsByBlock.set(blockIdForOutput, { log, outputs: [] })
                          }
                          outputsByBlock.get(blockIdForOutput)!.outputs.push({
                            path: path || 'output',
                            value: outputValue,
                          })
                        }
                      }
                    }

                    // Process each block's outputs
                    outputsByBlock.forEach(({ log, outputs }, blockId) => {
                      // Debug logging to see what we're working with

                      // Check if this block was already handled by streaming
                      const existingStreamingMessageId = messageIdMap.get(blockId)

                      // Check if this is an agent block (try multiple ways to detect it)
                      const isAgentBlock =
                        log.blockType === 'agent' ||
                        blockId.toLowerCase().includes('agent') ||
                        outputs.some(({ path }) =>
                          ['content', 'model', 'tokens', 'toolCalls', 'context'].includes(path)
                        )

                      if (isAgentBlock && outputs.length > 1) {
                        // For agent blocks with multiple selected outputs, combine them into a structured object
                        const agentOutput: any = {}

                        outputs.forEach(({ path, value }) => {
                          if (path === 'output') {
                            // If the whole output was selected, merge its properties
                            if (typeof value === 'object' && value !== null) {
                              Object.assign(agentOutput, value)
                            } else {
                              agentOutput.content = value
                            }
                          } else {
                            // Use the path as the key (e.g., 'content', 'model', 'tokens')
                            agentOutput[path] = value
                          }
                        })

                        // Clean up duplicate content: if content and context are the same, remove context
                        if (
                          agentOutput.content &&
                          agentOutput.context &&
                          typeof agentOutput.content === 'string' &&
                          typeof agentOutput.context === 'string' &&
                          agentOutput.content === agentOutput.context
                        ) {
                          agentOutput.context = undefined
                        }

                        // If this agent block was streaming, get the streamed content and replace the message
                        if (existingStreamingMessageId) {
                          // Find the current streaming content from our local messages state
                          const streamingMessage = workflowMessages.find(
                            (m) => m.id === existingStreamingMessageId
                          )
                          if (streamingMessage && typeof streamingMessage.content === 'string') {
                            // If we don't already have content from the output, use the streaming content
                            if (!agentOutput.content) {
                              agentOutput.content = streamingMessage.content
                            }
                          }
                          // Remove the old streaming message to avoid duplication
                          removeMessage(existingStreamingMessageId)
                        }

                        // Add the structured agent output as a single message
                        addMessage({
                          content: agentOutput,
                          workflowId: activeWorkflowId,
                          type: 'workflow',
                        })
                      } else {
                        // For non-agent blocks or single outputs:
                        // If this block was already streaming, the content is already displayed — skip to avoid duplication
                        if (existingStreamingMessageId) {
                          return
                        }

                        // Only add messages for blocks that weren't streamed
                        outputs.forEach(({ value }) => {
                          let messageContent = value

                          // If this is from an agent block and we have structured output, preserve it
                          if (isAgentBlock && typeof value === 'object') {
                            messageContent = value
                          } else if (typeof value === 'string') {
                            messageContent = value
                          } else {
                            // For other complex objects, format as JSON
                            messageContent = `\`\`\`json\n${JSON.stringify(value, null, 2)}\n\`\`\``
                          }

                          addMessage({
                            content: messageContent,
                            workflowId: activeWorkflowId,
                            type: 'workflow',
                          })
                        })
                      }
                    })
                  }
                } else if (blockId && contentChunk) {
                  if (!messageIdMap.has(blockId)) {
                    const newMessageId = crypto.randomUUID()
                    messageIdMap.set(blockId, newMessageId)
                    addMessage({
                      id: newMessageId,
                      content: contentChunk,
                      workflowId: activeWorkflowId,
                      type: 'workflow',
                      isStreaming: true,
                    })
                  } else {
                    const existingMessageId = messageIdMap.get(blockId)
                    if (existingMessageId) {
                      appendMessageContent(existingMessageId, contentChunk)
                    }
                  }
                } else if (blockId && event === 'end') {
                  const existingMessageId = messageIdMap.get(blockId)
                  if (existingMessageId) {
                    finalizeMessageStream(existingMessageId)
                  }
                }
              } catch (e) {
                logger.error('Error parsing stream data:', e)
              }
            }
          }
        }
      }

      processStream()
        .catch((e) => logger.error('Error processing stream:', e))
        .finally(() => {
          // Restore focus after streaming completes
          focusInput(100)
        })
    } else if (result && 'success' in result && result.success && 'logs' in result) {
      if (selectedOutputs?.length > 0) {
        // Group selected outputs by block ID to handle agent outputs properly
        const outputsByBlock = new Map<
          string,
          { log: BlockLog; outputs: Array<{ path: string; value: any }> }
        >()

        for (const outputId of selectedOutputs) {
          const blockIdForOutput = extractBlockIdFromOutputId(outputId)
          const path = extractPathFromOutputId(outputId, blockIdForOutput)
          const log = result.logs?.find((l: BlockLog) => l.blockId === blockIdForOutput)

          if (log) {
            let output = log.output

            if (path) {
              // Parse JSON content safely
              output = parseOutputContentSafely(output)

              const pathParts = path.split('.')
              let current = output
              for (const part of pathParts) {
                if (current && typeof current === 'object' && part in current) {
                  current = current[part]
                } else {
                  current = undefined
                  break
                }
              }
              output = current
            }

            if (output !== undefined) {
              if (!outputsByBlock.has(blockIdForOutput)) {
                outputsByBlock.set(blockIdForOutput, { log, outputs: [] })
              }
              outputsByBlock.get(blockIdForOutput)!.outputs.push({
                path: path || 'output',
                value: output,
              })
            }
          }
        }

        // Process each block's outputs
        outputsByBlock.forEach(({ log, outputs }, blockId) => {
          // Debug logging to see what we're working with

          // Check if this is an agent block (try multiple ways to detect it)
          const isAgentBlock =
            log.blockType === 'agent' ||
            blockId.toLowerCase().includes('agent') ||
            outputs.some(({ path }) =>
              ['content', 'model', 'tokens', 'toolCalls', 'context'].includes(path)
            )

          if (isAgentBlock && outputs.length > 1) {
            // For agent blocks with multiple selected outputs, combine them into a structured object
            const agentOutput: any = {}

            outputs.forEach(({ path, value }) => {
              if (path === 'output') {
                // If the whole output was selected, merge its properties
                if (typeof value === 'object' && value !== null) {
                  Object.assign(agentOutput, value)
                } else {
                  agentOutput.output = value
                }
              } else {
                // Use the path as the key (e.g., 'content', 'model', 'tokens')
                agentOutput[path] = value
              }
            })

            // Clean up duplicate content: if content and context are the same, remove context
            if (
              agentOutput.content &&
              agentOutput.context &&
              typeof agentOutput.content === 'string' &&
              typeof agentOutput.context === 'string' &&
              agentOutput.content === agentOutput.context
            ) {
              agentOutput.context = undefined
            }

            // Add the structured agent output as a single message
            addMessage({
              content: agentOutput,
              workflowId: activeWorkflowId,
              type: 'workflow',
            })
          } else {
            // For non-agent blocks or single outputs, add each output separately
            outputs.forEach(({ value }) => {
              let content: any = ''

              if (typeof value === 'string') {
                content = value
              } else if (value && typeof value === 'object') {
                // Check if this looks like agent output with known fields
                const isAgentOutput = ['content', 'model', 'tokens', 'toolCalls', 'context'].some(
                  (field) => field in value
                )

                if (isAgentOutput || isAgentBlock) {
                  // For agent outputs, preserve the structured object so it can be rendered properly
                  content = value
                } else {
                  // For other structured responses, pretty print the JSON
                  content = `\`\`\`json\n${JSON.stringify(value, null, 2)}\n\`\`\``
                }
              }

              if (content !== '' && content != null) {
                addMessage({
                  content,
                  workflowId: activeWorkflowId,
                  type: 'workflow',
                })
              }
            })
          }
        })
      }
    } else if (result && 'success' in result && !result.success) {
      addMessage({
        content: `Error: ${'error' in result ? result.error : 'Workflow execution failed.'}`,
        workflowId: activeWorkflowId,
        type: 'workflow',
      })
    }

    // Restore focus after workflow execution completes
    focusInput(100)
  }, [
    chatMessage,
    chatFiles,
    activeWorkflowId,
    isExecuting,
    isUploadingFiles,
    promptHistory,
    getConversationId,
    addMessage,
    removeMessage,
    handleRunWorkflow,
    selectedOutputs,
    setSelectedWorkflowOutput,
    appendMessageContent,
    finalizeMessageStream,
    focusInput,
  ])

  // Auto-resize textarea
  const autoResize = useCallback(() => {
    const textarea = inputRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      const maxHeight = 120 // ~5 lines
      textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`
      textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden'
    }
  }, [])

  // Handle key press
  const handleKeyPress = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSendMessage()
      } else if (e.key === 'ArrowUp' && !chatMessage) {
        e.preventDefault()
        if (promptHistory.length > 0) {
          const newIndex =
            historyIndex === -1 ? promptHistory.length - 1 : Math.max(0, historyIndex - 1)
          setHistoryIndex(newIndex)
          setChatMessage(promptHistory[newIndex])
        }
      } else if (e.key === 'ArrowDown' && !chatMessage) {
        e.preventDefault()
        if (historyIndex >= 0) {
          const newIndex = historyIndex + 1
          if (newIndex >= promptHistory.length) {
            setHistoryIndex(-1)
            setChatMessage('')
          } else {
            setHistoryIndex(newIndex)
            setChatMessage(promptHistory[newIndex])
          }
        }
      }
    },
    [handleSendMessage, promptHistory, historyIndex, setChatMessage, chatMessage]
  )

  // Handle output selection
  const handleOutputSelection = useCallback(
    (values: string[]) => {
      // Ensure no duplicates in selection
      const dedupedValues = [...new Set(values)]

      if (activeWorkflowId) {
        // If array is empty, explicitly set to empty array to ensure complete reset
        if (dedupedValues.length === 0) {
          setSelectedWorkflowOutput(activeWorkflowId, [])
        } else {
          setSelectedWorkflowOutput(activeWorkflowId, dedupedValues)
        }
      }
    },
    [activeWorkflowId, setSelectedWorkflowOutput]
  )

  return (
    <div className='flex h-full min-w-0 flex-col'>
      {/* Output Source Dropdown */}
      <div className='flex-none py-2'>
        <OutputSelect
          workflowId={activeWorkflowId}
          selectedOutputs={selectedOutputs}
          onOutputSelect={handleOutputSelection}
          disabled={!activeWorkflowId}
          placeholder='Select output sources'
        />
      </div>

      {/* Main layout with fixed heights to ensure input stays visible */}
      <div className='flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden'>
        {/* Chat messages section - Scrollable area */}
        <div className='relative min-h-0 min-w-0 flex-1 overflow-hidden'>
          {workflowMessages.length === 0 ? (
            <div className='flex h-full items-center justify-center text-[13px] text-muted-foreground/60'>
              No messages yet
            </div>
          ) : (
            <ScrollArea ref={scrollAreaRef} className='h-full pb-2' hideScrollbar={true}>
              <div className='w-full min-w-0 overflow-hidden'>
                {workflowMessages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          )}

          {/* Scroll to bottom button */}
          {showScrollButton && (
            <div className='-translate-x-1/2 absolute bottom-4 left-1/2 z-10'>
              <Button
                onClick={scrollToBottom}
                size='sm'
                variant='outline'
                className='flex items-center gap-1 rounded-full border border-border/60 bg-background/95 px-3 py-1 shadow-lg backdrop-blur-sm transition-all hover:bg-accent/60'
              >
                <ArrowDown className='h-3.5 w-3.5' />
                <span className='sr-only'>Scroll to bottom</span>
              </Button>
            </div>
          )}
        </div>

        {/* Input section - Fixed height */}
        <div
          className='relative flex-none border-border/30 border-t pt-2.5 pb-3'
          onDragEnter={(e) => {
            e.preventDefault()
            e.stopPropagation()
            if (!(!activeWorkflowId || isExecuting || isUploadingFiles)) {
              setDragCounter((prev) => prev + 1)
            }
          }}
          onDragOver={(e) => {
            e.preventDefault()
            e.stopPropagation()
            if (!(!activeWorkflowId || isExecuting || isUploadingFiles)) {
              e.dataTransfer.dropEffect = 'copy'
            }
          }}
          onDragLeave={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setDragCounter((prev) => Math.max(0, prev - 1))
          }}
          onDrop={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setDragCounter(0)
            if (!(!activeWorkflowId || isExecuting || isUploadingFiles)) {
              const droppedFiles = Array.from(e.dataTransfer.files)
              if (droppedFiles.length > 0) {
                const newFiles = droppedFiles.slice(0, 5 - chatFiles.length).map((file) => ({
                  id: crypto.randomUUID(),
                  name: file.name,
                  size: file.size,
                  type: file.type,
                  file,
                }))
                setChatFiles([...chatFiles, ...newFiles])
              }
            }
          }}
        >
          {/* File upload section */}
          <div className='mb-1.5'>
            <ChatFileUpload
              files={chatFiles}
              onFilesChange={setChatFiles}
              maxFiles={5}
              maxSize={10}
              disabled={!activeWorkflowId || isExecuting || isUploadingFiles}
            />
          </div>

          <div className='flex items-end gap-2'>
            <textarea
              ref={inputRef}
              value={chatMessage}
              onChange={(e) => {
                setChatMessage(e.target.value)
                setHistoryIndex(-1)
                autoResize()
              }}
              onKeyDown={handleKeyPress}
              placeholder={isDragOver ? 'Drop files here...' : 'Type a message...'}
              rows={1}
              className={`min-h-[36px] min-w-0 flex-1 resize-none rounded-lg border border-border/50 bg-background px-3 py-2 text-[13px] text-foreground leading-[1.4] shadow-xs outline-none placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-primary/30 focus:ring-offset-0 ${
                isDragOver
                  ? 'border-primary/60 bg-primary/10/30 dark:border-primary/60 dark:bg-primary/10'
                  : ''
              }`}
              style={{ overflowY: 'hidden' }}
              disabled={!activeWorkflowId || isExecuting || isUploadingFiles}
            />
            <Button
              onClick={handleSendMessage}
              size='icon'
              disabled={
                (!chatMessage.trim() && chatFiles.length === 0) ||
                !activeWorkflowId ||
                isExecuting ||
                isUploadingFiles
              }
              className='h-9 w-9 flex-shrink-0 rounded-lg bg-primary/100 text-white shadow-sm transition-all duration-200 hover:bg-primary disabled:opacity-40'
            >
              <ArrowUp className='h-4 w-4' />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
