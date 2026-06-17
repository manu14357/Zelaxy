'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Check,
  Copy,
  ExternalLink,
  Globe,
  Lock,
  Mail,
  MessageSquare,
  MoreHorizontal,
  RefreshCw,
  Trash2,
  Webhook as WebhookIcon,
} from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createLogger } from '@/lib/logs/console/logger'
import { getBaseUrl, getEmailDomain } from '@/lib/urls/utils'
import { useUserPermissionsContext } from '@/app/arena/[workspaceId]/providers/workspace-permissions-provider'

const logger = createLogger('Deployments')

interface WebhookRow {
  webhook: {
    id: string
    workflowId: string
    blockId: string | null
    path: string
    provider: string | null
    isActive: boolean
    createdAt: string
  }
  workflow: { id: string; name: string }
}

interface ChatRow {
  id: string
  workflowId: string
  subdomain: string
  title: string
  description: string | null
  isActive: boolean
  authType: 'public' | 'password' | 'email'
}

type DeploymentTab = 'webhooks' | 'chats'

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <Button
      variant='ghost'
      size='icon'
      className='h-7 w-7'
      onClick={(e) => {
        e.stopPropagation()
        navigator.clipboard.writeText(value)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }}
    >
      {copied ? (
        <Check className='h-3.5 w-3.5 text-emerald-500' />
      ) : (
        <Copy className='h-3.5 w-3.5' />
      )}
    </Button>
  )
}

export function Deployments() {
  const params = useParams()
  const router = useRouter()
  const workspaceId = params.workspaceId as string
  const userPermissions = useUserPermissionsContext()
  const canEdit = userPermissions.canEdit === true

  const [tab, setTab] = useState<DeploymentTab>('webhooks')
  const [webhooks, setWebhooks] = useState<WebhookRow[]>([])
  const [chats, setChats] = useState<ChatRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!workspaceId) return
    setIsLoading(true)
    setError(null)
    try {
      const [webhookRes, chatRes] = await Promise.all([
        fetch(`/api/webhooks?workspaceId=${encodeURIComponent(workspaceId)}`),
        fetch(`/api/chat?workspaceId=${encodeURIComponent(workspaceId)}`),
      ])
      if (!webhookRes.ok) throw new Error(`Failed to load webhooks (${webhookRes.status})`)
      if (!chatRes.ok) throw new Error(`Failed to load chats (${chatRes.status})`)
      const webhookJson = await webhookRes.json()
      const chatJson = await chatRes.json()
      setWebhooks(webhookJson.webhooks ?? [])
      setChats(chatJson.data?.deployments ?? [])
    } catch (err) {
      logger.error('Error loading deployments:', err)
      setError(err instanceof Error ? err.message : 'Failed to load deployments')
    } finally {
      setIsLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const deleteWebhook = useCallback(async (id: string) => {
    setBusyId(id)
    try {
      const res = await fetch(`/api/webhooks/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(`Failed to delete webhook (${res.status})`)
      setWebhooks((prev) => prev.filter((w) => w.webhook.id !== id))
    } catch (err) {
      logger.error('Error deleting webhook:', err)
    } finally {
      setBusyId(null)
    }
  }, [])

  const deleteChat = useCallback(async (id: string) => {
    setBusyId(id)
    try {
      const res = await fetch(`/api/chat/edit/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(`Failed to delete chat (${res.status})`)
      setChats((prev) => prev.filter((c) => c.id !== id))
    } catch (err) {
      logger.error('Error deleting chat:', err)
    } finally {
      setBusyId(null)
    }
  }, [])

  const count = tab === 'webhooks' ? webhooks.length : chats.length

  return (
    <div className='flex h-full min-w-0 flex-col bg-background'>
      {/* Header */}
      <div className='flex-shrink-0 border-border/40 border-b bg-card/30 px-4 py-4 sm:px-6'>
        <div className='flex items-center justify-between gap-2'>
          <div className='flex items-center gap-3'>
            <div className='flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10'>
              <Globe className='h-4 w-4 text-primary' />
            </div>
            <div>
              <h1 className='font-semibold text-[15px] text-foreground leading-none'>
                Deployments
              </h1>
              <p className='mt-1 hidden text-[12px] text-muted-foreground sm:block'>
                Webhook triggers and published chat interfaces in this workspace
              </p>
            </div>
          </div>
          <Button variant='ghost' size='sm' onClick={fetchData} disabled={isLoading}>
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className='ml-1.5 hidden sm:inline'>Refresh</span>
          </Button>
        </div>
        <Tabs value={tab} onValueChange={(v) => setTab(v as DeploymentTab)} className='mt-3'>
          <TabsList>
            <TabsTrigger value='webhooks' className='gap-1.5'>
              <WebhookIcon className='h-3.5 w-3.5' />
              Webhooks
              <Badge variant='secondary' className='ml-1 h-4 px-1.5 text-[10px]'>
                {webhooks.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value='chats' className='gap-1.5'>
              <MessageSquare className='h-3.5 w-3.5' />
              Chats
              <Badge variant='secondary' className='ml-1 h-4 px-1.5 text-[10px]'>
                {chats.length}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      <div className='flex-1 overflow-auto px-4 py-4 sm:px-6'>
        {isLoading ? (
          <div className='space-y-2'>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className='h-14 w-full rounded-lg' />
            ))}
          </div>
        ) : error ? (
          <div className='flex flex-col items-center justify-center gap-2 py-16 text-center'>
            <p className='text-muted-foreground text-sm'>{error}</p>
            <Button variant='outline' size='sm' onClick={fetchData}>
              Try again
            </Button>
          </div>
        ) : count === 0 ? (
          <div className='flex flex-col items-center justify-center gap-2 py-16 text-center'>
            <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/50'>
              {tab === 'webhooks' ? (
                <WebhookIcon className='h-6 w-6 text-muted-foreground' />
              ) : (
                <MessageSquare className='h-6 w-6 text-muted-foreground' />
              )}
            </div>
            <p className='font-medium text-foreground text-sm'>
              No {tab === 'webhooks' ? 'webhooks' : 'published chats'} yet
            </p>
            <p className='max-w-sm text-muted-foreground text-xs'>
              {tab === 'webhooks'
                ? 'Add a webhook trigger to a workflow to receive external events.'
                : 'Publish a workflow as a chat from the workflow editor to make it available here.'}
            </p>
          </div>
        ) : tab === 'webhooks' ? (
          <div className='overflow-hidden rounded-xl border border-border/50'>
            {webhooks.map(({ webhook, workflow }) => {
              const triggerUrl = `${getBaseUrl()}/api/webhooks/trigger/${webhook.path}`
              return (
                <div
                  key={webhook.id}
                  className='flex items-center gap-3 border-border/30 border-b px-4 py-3 last:border-b-0 hover:bg-muted/20'
                >
                  <div className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-muted/50'>
                    <WebhookIcon className='h-4 w-4 text-muted-foreground' />
                  </div>
                  <div className='min-w-0 flex-1'>
                    <div className='flex items-center gap-2'>
                      <span className='truncate font-medium text-foreground text-sm'>
                        {workflow?.name || 'Untitled workflow'}
                      </span>
                      {webhook.provider && (
                        <Badge variant='outline' className='text-[10px] capitalize'>
                          {webhook.provider}
                        </Badge>
                      )}
                      {!webhook.isActive && (
                        <Badge variant='secondary' className='text-[10px]'>
                          Inactive
                        </Badge>
                      )}
                    </div>
                    <span className='block truncate font-mono text-[11px] text-muted-foreground'>
                      {triggerUrl}
                    </span>
                  </div>
                  <CopyButton value={triggerUrl} />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='h-7 w-7'
                        disabled={busyId === webhook.id}
                      >
                        <MoreHorizontal className='h-4 w-4' />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                      <DropdownMenuItem
                        onClick={() =>
                          router.push(`/arena/${workspaceId}/zelaxy/${webhook.workflowId}`)
                        }
                      >
                        <ExternalLink className='mr-2 h-3.5 w-3.5' />
                        Open workflow
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={!canEdit}
                        className='text-destructive focus:text-destructive'
                        onClick={() => deleteWebhook(webhook.id)}
                      >
                        <Trash2 className='mr-2 h-3.5 w-3.5' />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )
            })}
          </div>
        ) : (
          <div className='overflow-hidden rounded-xl border border-border/50'>
            {chats.map((chat) => {
              const chatUrl = `https://${chat.subdomain}.${getEmailDomain()}`
              const AuthIcon =
                chat.authType === 'password' ? Lock : chat.authType === 'email' ? Mail : Globe
              return (
                <div
                  key={chat.id}
                  className='flex items-center gap-3 border-border/30 border-b px-4 py-3 last:border-b-0 hover:bg-muted/20'
                >
                  <div className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-muted/50'>
                    <MessageSquare className='h-4 w-4 text-muted-foreground' />
                  </div>
                  <div className='min-w-0 flex-1'>
                    <div className='flex items-center gap-2'>
                      <span className='truncate font-medium text-foreground text-sm'>
                        {chat.title}
                      </span>
                      <Badge variant='outline' className='gap-1 text-[10px] capitalize'>
                        <AuthIcon className='h-2.5 w-2.5' />
                        {chat.authType}
                      </Badge>
                      {!chat.isActive && (
                        <Badge variant='secondary' className='text-[10px]'>
                          Inactive
                        </Badge>
                      )}
                    </div>
                    <a
                      href={chatUrl}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='block truncate text-[11px] text-muted-foreground hover:text-primary'
                      onClick={(e) => e.stopPropagation()}
                    >
                      {chat.subdomain}.{getEmailDomain()}
                    </a>
                  </div>
                  <CopyButton value={chatUrl} />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='h-7 w-7'
                        disabled={busyId === chat.id}
                      >
                        <MoreHorizontal className='h-4 w-4' />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                      <DropdownMenuItem
                        onClick={() => window.open(chatUrl, '_blank', 'noopener,noreferrer')}
                      >
                        <ExternalLink className='mr-2 h-3.5 w-3.5' />
                        Open chat
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          router.push(`/arena/${workspaceId}/zelaxy/${chat.workflowId}`)
                        }
                      >
                        <ExternalLink className='mr-2 h-3.5 w-3.5' />
                        Open workflow
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={!canEdit}
                        className='text-destructive focus:text-destructive'
                        onClick={() => deleteChat(chat.id)}
                      >
                        <Trash2 className='mr-2 h-3.5 w-3.5' />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default Deployments
