import { useCallback, useMemo, useState } from 'react'
import { Check, Copy, FileText } from 'lucide-react'
import CopilotMarkdownRenderer from '@/app/arena/[workspaceId]/zelaxy/[workflowId]/components/panel/components/copilot/components/copilot-message/components/markdown-renderer'

interface ChatMessageProps {
  message: {
    id: string
    content: any
    timestamp: string | Date
    type: 'user' | 'workflow'
    isStreaming?: boolean
    files?: { name: string; size: number; type: string }[]
  }
}

// Hook to handle copy-to-clipboard with feedback
function useCopyToClipboard(timeout = 2000) {
  const [copied, setCopied] = useState(false)

  const copy = useCallback(
    (text: string) => {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), timeout)
      })
    },
    [timeout]
  )

  return { copied, copy }
}

// Extract plain text from any content for copying
function getPlainTextContent(content: any): string {
  if (typeof content === 'string') return content
  if (typeof content === 'object' && content !== null) {
    if ('content' in content && typeof content.content === 'string') return content.content
    return JSON.stringify(content, null, 2)
  }
  return String(content || '')
}

// Copy button component
function CopyButton({ text, className = '' }: { text: string; className?: string }) {
  const { copied, copy } = useCopyToClipboard()

  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        copy(text)
      }}
      className={`rounded-md p-1 transition-all duration-150 ${
        copied
          ? 'bg-green-500/10 text-green-600 dark:text-green-400'
          : 'text-muted-foreground/0 hover:bg-accent/60 hover:text-muted-foreground group-hover/msg:text-muted-foreground/50'
      } ${className}`}
      aria-label={copied ? 'Copied!' : 'Copy message'}
      title={copied ? 'Copied!' : 'Copy'}
    >
      {copied ? <Check className='h-3 w-3' /> : <Copy className='h-3 w-3' />}
    </button>
  )
}

// Enhanced component to render structured data with better formatting
const StructuredDataDisplay = ({ data, title }: { data: any; title?: string }) => {
  if (typeof data === 'string') {
    return (
      <div className='mb-3 min-w-0'>
        {title && (
          <div className='mb-1 font-semibold text-[10px] text-muted-foreground/60 uppercase tracking-wider'>
            {title}
          </div>
        )}
        <div className='min-w-0 overflow-hidden break-words text-foreground [overflow-wrap:anywhere]'>
          <CopilotMarkdownRenderer content={data} />
        </div>
      </div>
    )
  }

  if (typeof data === 'object' && data !== null) {
    return (
      <div className='mb-3 min-w-0 overflow-hidden'>
        {title && (
          <div className='mb-1 font-semibold text-[10px] text-muted-foreground/60 uppercase tracking-wider'>
            {title}
          </div>
        )}
        <div className='min-w-0 overflow-hidden rounded-lg border border-border/40 bg-muted/20 p-2.5'>
          <pre className='min-w-0 overflow-x-auto whitespace-pre-wrap break-words font-mono text-[11px] text-foreground/80 leading-relaxed [overflow-wrap:anywhere] [word-break:break-word]'>
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      </div>
    )
  }

  return (
    <div className='mb-3 min-w-0'>
      {title && (
        <div className='mb-1 font-semibold text-[10px] text-muted-foreground/60 uppercase tracking-wider'>
          {title}
        </div>
      )}
      <div className='min-w-0 break-words text-foreground'>{String(data)}</div>
    </div>
  )
}

export function ChatMessage({ message }: ChatMessageProps) {
  // Enhanced content processing for better display
  const processedContent = useMemo(() => {
    // Handle already formatted JSON strings (from existing chat logic)
    if (typeof message.content === 'string' && message.content.startsWith('```json\n')) {
      try {
        const jsonMatch = message.content.match(/```json\n([\s\S]*?)\n```/)
        if (jsonMatch) {
          const parsedData = JSON.parse(jsonMatch[1])
          return { type: 'structured', data: parsedData }
        }
      } catch {
        // Fall back to string if parsing fails
      }
      return { type: 'text', data: message.content }
    }

    // Handle agent output objects directly
    if (typeof message.content === 'object' && message.content !== null) {
      // Check if this looks like agent output structure
      if (
        'content' in message.content ||
        'model' in message.content ||
        'tokens' in message.content
      ) {
        return { type: 'agent_output', data: message.content }
      }
      return { type: 'structured', data: message.content }
    }

    return { type: 'text', data: String(message.content || '') }
  }, [message.content])

  // Render human messages as chat bubbles
  if (message.type === 'user') {
    return (
      <div className='group/msg w-full min-w-0 py-2'>
        <div className='flex items-start justify-end gap-1'>
          <CopyButton
            text={getPlainTextContent(message.content)}
            className='mt-1 opacity-0 group-hover/msg:opacity-100'
          />
          <div className='min-w-0 max-w-[85%]'>
            {message.files && message.files.length > 0 && (
              <div className='mb-1.5 flex flex-wrap justify-end gap-1.5'>
                {message.files.map((file, idx) => (
                  <div
                    key={idx}
                    className='flex items-center gap-1.5 rounded-lg border border-border/50 bg-muted/30 px-2.5 py-1.5'
                  >
                    <FileText className='h-3.5 w-3.5 shrink-0 text-muted-foreground/70' />
                    <span className='max-w-[140px] truncate text-[11px] text-foreground'>
                      {file.name}
                    </span>
                    <span className='text-[10px] text-muted-foreground/50 tabular-nums'>
                      {file.size < 1024
                        ? `${file.size}B`
                        : file.size < 1024 * 1024
                          ? `${Math.round(file.size / 1024)}KB`
                          : `${(file.size / (1024 * 1024)).toFixed(1)}MB`}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div className='rounded-2xl rounded-br-md bg-primary/100 px-3 py-2'>
              <div className='min-w-0 whitespace-pre-wrap break-words font-normal text-[13px] text-white leading-relaxed'>
                {processedContent.data}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Render agent/workflow messages with enhanced markdown formatting
  return (
    <div className='group/msg w-full min-w-0 py-2 pl-[2px]'>
      <div className='relative min-w-0 overflow-hidden break-words font-normal text-[13px] leading-relaxed [overflow-wrap:anywhere] [word-break:break-word]'>
        {/* Copy button for workflow messages */}
        <div className='absolute top-0 right-0 z-10 opacity-0 transition-opacity duration-150 group-hover/msg:opacity-100'>
          <CopyButton text={getPlainTextContent(message.content)} />
        </div>
        {processedContent.type === 'agent_output' ? (
          <div className='space-y-2'>
            {processedContent.data.content && (
              <StructuredDataDisplay data={processedContent.data.content} />
            )}
            {processedContent.data.model && (
              <StructuredDataDisplay data={processedContent.data.model} title='Model' />
            )}
            {processedContent.data.tokens && (
              <StructuredDataDisplay data={processedContent.data.tokens} title='Token Usage' />
            )}
            {processedContent.data.toolCalls && (
              <StructuredDataDisplay data={processedContent.data.toolCalls} title='Tool Calls' />
            )}
            {processedContent.data.context && (
              <StructuredDataDisplay data={processedContent.data.context} title='Context' />
            )}
            {/* Show any other properties that weren't specifically handled */}
            {Object.keys(processedContent.data)
              .filter(
                (key) => !['content', 'model', 'tokens', 'toolCalls', 'context'].includes(key)
              )
              .map((key) => (
                <StructuredDataDisplay
                  key={key}
                  data={processedContent.data[key]}
                  title={key.charAt(0).toUpperCase() + key.slice(1)}
                />
              ))}
          </div>
        ) : processedContent.type === 'structured' ? (
          <StructuredDataDisplay data={processedContent.data} />
        ) : (
          <div className='break-words text-foreground'>
            <CopilotMarkdownRenderer content={processedContent.data} />
            {message.isStreaming && (
              <span className='ml-1 inline-block h-4 w-2 animate-pulse bg-primary' />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
