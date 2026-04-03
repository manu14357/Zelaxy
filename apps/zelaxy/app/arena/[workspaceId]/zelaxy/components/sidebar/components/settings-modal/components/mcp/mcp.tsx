'use client'

import { useEffect, useState } from 'react'
import {
  CheckCircle,
  Circle,
  Download,
  Edit3,
  Eye,
  Loader2,
  Plus,
  Power,
  PowerOff,
  RefreshCw,
  Search,
  Server,
  Trash2,
  Upload,
  Wrench,
  XCircle,
  Zap,
} from 'lucide-react'
import { McpIcon } from '@/components/icons'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  ScrollArea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Textarea,
} from '@/components/ui'
import { cn } from '@/lib/utils'
import { SettingPageHeader } from '../shared'

interface MCPServer {
  id: string
  name: string
  type: 'stdio' | 'sse' | 'http'
  status: 'connected' | 'disconnected' | 'error' | 'connecting'
  config: any
  tools: Array<{
    id: string
    name: string
    description: string
    category: string[]
  }>
  metadata: {
    lastConnected?: string
    toolCount: number
    avgLatency: number
    version?: string
  }
  settings: {
    autoReconnect: boolean
    timeout: number
    retryAttempts: number
  }
}

export function MCPServers() {
  const [servers, setServers] = useState<MCPServer[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalServers: 0,
    connectedServers: 0,
    totalTools: 0,
    avgLatency: 0,
  })
  const [isAddServerOpen, setIsAddServerOpen] = useState(false)
  const [selectedServer, setSelectedServer] = useState<MCPServer | null>(null)
  const [isEditServerOpen, setIsEditServerOpen] = useState(false)
  const [isToolsViewOpen, setIsToolsViewOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Simple notification state for status messages
  const [notifications, setNotifications] = useState<
    Array<{
      id: string
      type: 'success' | 'info' | 'error'
      message: string
    }>
  >([])

  const showNotification = (type: 'success' | 'info' | 'error', message: string) => {
    const id = Date.now().toString()
    setNotifications((prev) => [...prev, { id, type, message }])
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    }, 3000)
  }

  // Get workspace ID from URL
  const getWorkspaceId = () => {
    if (typeof window !== 'undefined') {
      const pathParts = window.location.pathname.split('/')
      const arenaIndex = pathParts.findIndex((part) => part === 'arena')
      if (arenaIndex !== -1 && pathParts[arenaIndex + 1]) {
        return pathParts[arenaIndex + 1]
      }
    }
    return null
  }

  // Load servers from API
  const loadServers = async () => {
    try {
      const workspaceId = getWorkspaceId()
      if (!workspaceId) return

      const response = await fetch(`/api/mcp/servers?workspaceId=${workspaceId}`)
      if (!response.ok) throw new Error('Failed to fetch servers')

      const data = await response.json()

      // Transform API response to match UI interface
      const transformedServers = data.servers.map((server: any) => ({
        id: server.id,
        name: server.name,
        type: server.type,
        status: server.status,
        config: server.config,
        tools: [], // Will be loaded separately
        metadata: {
          lastConnected: server.metadata?.lastConnected,
          toolCount: server.metadata?.toolCount || 0,
          avgLatency: server.metadata?.avgLatency || 0,
          version: server.metadata?.version,
        },
        settings: server.settings,
      }))

      setServers(transformedServers)
      setStats(
        data.stats || {
          totalServers: 0,
          connectedServers: 0,
          totalTools: 0,
          avgLatency: 0,
        }
      )
    } catch (error) {
      console.error('Failed to load servers:', error)
      showNotification('error', 'Failed to load MCP servers')
    } finally {
      setLoading(false)
    }
  }

  // Load tools for a specific server
  const loadServerTools = async (serverId: string) => {
    try {
      const response = await fetch(`/api/mcp/servers/${serverId}/tools`)
      if (!response.ok) throw new Error('Failed to fetch server tools')

      const data = await response.json()

      // Update the server tools in the local state
      setServers((prev) =>
        prev.map((s) =>
          s.id === serverId
            ? {
                ...s,
                tools: data.tools.map((tool: any) => ({
                  id: tool.toolId,
                  name: tool.name,
                  description: tool.description || '',
                  category: tool.category || [],
                })),
              }
            : s
        )
      )
    } catch (error) {
      console.error('Failed to load server tools:', error)
    }
  }

  // Load tools for all connected servers
  const loadAllServerTools = async () => {
    const connectedServers = servers.filter((s) => s.status === 'connected')
    for (const server of connectedServers) {
      await loadServerTools(server.id)
    }
  }

  // Load servers on component mount
  useEffect(() => {
    loadServers()
  }, [])

  // Load tools when servers change (when a server becomes connected)
  useEffect(() => {
    loadAllServerTools()
  }, [servers.map((s) => s.status).join(',')])

  // Add server
  const handleAddServer = async (serverData: any) => {
    try {
      const workspaceId = getWorkspaceId()
      if (!workspaceId) return

      const response = await fetch('/api/mcp/servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...serverData,
          workspaceId,
        }),
      })

      if (!response.ok) throw new Error('Failed to create server')

      showNotification('success', 'Server added successfully')
      loadServers() // Reload servers
    } catch (error) {
      console.error('Failed to add server:', error)
      showNotification('error', 'Failed to add server')
    }
  }

  // Delete server
  const handleDeleteServer = async (serverId: string) => {
    try {
      const response = await fetch(`/api/mcp/servers/${serverId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete server')

      showNotification('success', 'Server deleted successfully')
      loadServers() // Reload servers
    } catch (error) {
      console.error('Failed to delete server:', error)
      showNotification('error', 'Failed to delete server')
    }
  }

  const getStatusIcon = (status: MCPServer['status']) => {
    switch (status) {
      case 'connected':
        return (
          <span className='relative flex h-3 w-3'>
            <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75' />
            <span className='relative inline-flex h-3 w-3 rounded-full bg-emerald-500' />
          </span>
        )
      case 'disconnected':
        return <span className='inline-flex h-3 w-3 rounded-full bg-gray-300 dark:bg-gray-600' />
      case 'error':
        return (
          <span className='relative flex h-3 w-3'>
            <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75' />
            <span className='relative inline-flex h-3 w-3 rounded-full bg-red-500' />
          </span>
        )
      case 'connecting':
        return (
          <span className='relative flex h-3 w-3'>
            <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75' />
            <span className='relative inline-flex h-3 w-3 rounded-full bg-amber-500' />
          </span>
        )
      default:
        return <span className='inline-flex h-3 w-3 rounded-full bg-gray-300 dark:bg-gray-600' />
    }
  }

  const getStatusColor = (status: MCPServer['status']) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'disconnected':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'connecting':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const handleConnect = async (serverId: string) => {
    setServers((prev) =>
      prev.map((s) => (s.id === serverId ? { ...s, status: 'connecting' as const } : s))
    )

    try {
      const workspaceId = getWorkspaceId()
      const response = await fetch(`/api/mcp/servers/${serverId}/connection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId }),
      })

      if (!response.ok) throw new Error('Failed to connect server')

      // Reload servers to get updated status
      await loadServers()

      // Load tools for the connected server
      await loadServerTools(serverId)

      showNotification('success', 'Server connected successfully')
    } catch (error) {
      console.error('Failed to connect server:', error)
      setServers((prev) =>
        prev.map((s) => (s.id === serverId ? { ...s, status: 'error' as const } : s))
      )
      showNotification('error', 'Failed to connect server')
    }
  }

  const handleDisconnect = async (serverId: string) => {
    try {
      const response = await fetch(`/api/mcp/servers/${serverId}/connection`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to disconnect server')

      loadServers() // Reload to get updated status
      showNotification('info', 'Server disconnected')
    } catch (error) {
      console.error('Failed to disconnect server:', error)
      showNotification('error', 'Failed to disconnect server')
    }
  }

  const handleDelete = (serverId: string) => {
    handleDeleteServer(serverId)
  }

  const handleRefreshTools = async (serverId: string) => {
    try {
      showNotification('info', 'Refreshing tools...')

      const response = await fetch(`/api/mcp/servers/${serverId}/tools`, {
        method: 'POST',
      })

      if (!response.ok) throw new Error('Failed to refresh tools')

      const data = await response.json()

      // Update the server tools in the local state
      setServers((prev) =>
        prev.map((s) =>
          s.id === serverId
            ? {
                ...s,
                tools: data.tools.map((tool: any) => ({
                  id: tool.toolId,
                  name: tool.name,
                  description: tool.description || '',
                  category: tool.category || [],
                })),
                metadata: {
                  ...s.metadata,
                  toolCount: data.tools.length,
                },
              }
            : s
        )
      )

      showNotification('success', 'Tools refreshed successfully')
    } catch (error) {
      console.error('Failed to refresh tools:', error)
      showNotification('error', 'Failed to refresh tools')
    }
  }

  return (
    <div className='flex h-full flex-col'>
      {/* Header */}
      <div className='flex-shrink-0 border-border/50 border-b px-3 py-5'>
        <SettingPageHeader
          title='MCP Servers'
          description='Manage Model Context Protocol server connections.'
          action={
            <div className='flex flex-wrap items-center gap-2'>
              <Button
                variant='outline'
                size='sm'
                className='h-8 rounded-lg text-[13px]'
                onClick={() => showNotification('info', 'Import functionality coming soon')}
              >
                <Upload className='mr-1.5 h-3.5 w-3.5' />
                Import
              </Button>
              <Button
                variant='outline'
                size='sm'
                className='h-8 rounded-lg text-[13px]'
                onClick={() => showNotification('info', 'Export functionality coming soon')}
              >
                <Download className='mr-1.5 h-3.5 w-3.5' />
                Export
              </Button>
              <Dialog open={isAddServerOpen} onOpenChange={setIsAddServerOpen}>
                <DialogTrigger asChild>
                  <Button size='sm' className='h-8 rounded-lg text-[13px]'>
                    <Plus className='mr-1.5 h-3.5 w-3.5' />
                    Add Server
                  </Button>
                </DialogTrigger>
                <DialogContent className='max-w-2xl rounded-xl'>
                  <DialogHeader>
                    <DialogTitle className='font-semibold text-[15px]'>Add MCP Server</DialogTitle>
                    <DialogDescription className='text-[13px]'>
                      Configure a new Model Context Protocol server connection.
                    </DialogDescription>
                  </DialogHeader>
                  <AddServerForm
                    onSuccess={() => setIsAddServerOpen(false)}
                    onSubmit={handleAddServer}
                  />
                </DialogContent>
              </Dialog>
            </div>
          }
        />
      </div>

      {/* Content */}
      <ScrollArea className='flex-1'>
        <div className='space-y-6 px-3 py-6'>
          {/* Statistics */}
          <div className='grid grid-cols-2 gap-3 md:grid-cols-4'>
            <StatCard
              label='Total Servers'
              value={loading ? '…' : String(stats.totalServers)}
              icon={<Server className='h-4 w-4 text-muted-foreground' />}
            />
            <StatCard
              label='Connected'
              value={loading ? '…' : String(stats.connectedServers)}
              icon={<CheckCircle className='h-4 w-4 text-emerald-500' />}
              valueClassName='text-emerald-600 dark:text-emerald-400'
            />
            <StatCard
              label='Total Tools'
              value={loading ? '…' : String(stats.totalTools)}
              icon={<Wrench className='h-4 w-4 text-muted-foreground' />}
            />
            <StatCard
              label='Avg Latency'
              value={loading ? '…' : `${Math.round(stats.avgLatency)}ms`}
              icon={<Zap className='h-4 w-4 text-muted-foreground' />}
            />
          </div>

          {/* Server List */}
          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <h3 className='font-semibold text-[13px] text-foreground'>Connected Servers</h3>
              <span className='text-[12px] text-muted-foreground'>
                {servers.filter((s) => s.status === 'connected').length} of {servers.length}{' '}
                connected
              </span>
            </div>

            {servers.length > 0 && (
              <div className='relative'>
                <Search className='-translate-y-1/2 absolute top-1/2 left-3 h-3.5 w-3.5 text-muted-foreground' />
                <Input
                  placeholder='Search servers...'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className='h-8 rounded-lg pl-9 text-[13px]'
                />
              </div>
            )}

            {loading ? (
              <div className='space-y-3'>
                {[1, 2, 3].map((i) => (
                  <div key={i} className='rounded-xl border border-border/60 bg-card/50 p-4'>
                    <div className='flex items-start gap-3'>
                      <div className='mt-1 h-3 w-3 animate-pulse rounded-full bg-muted' />
                      <div className='flex-1 space-y-2'>
                        <div className='flex items-center gap-2'>
                          <div className='h-4 w-32 animate-pulse rounded-md bg-muted' />
                          <div className='h-4 w-12 animate-pulse rounded-md bg-muted' />
                        </div>
                        <div className='h-3 w-48 animate-pulse rounded-md bg-muted' />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {servers
                  .filter((s) =>
                    searchQuery
                      ? s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        s.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        s.tools.some((t) =>
                          t.name.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                      : true
                  )
                  .map((server) => (
                    <div
                      key={server.id}
                      className='group rounded-xl border border-border/60 bg-card/50 p-4 transition-colors hover:bg-accent/30'
                    >
                      <div className='flex items-start justify-between gap-3'>
                        <div className='flex min-w-0 flex-1 items-start gap-3'>
                          <div className='mt-1.5'>{getStatusIcon(server.status)}</div>
                          <div className='min-w-0 flex-1'>
                            <div className='flex flex-wrap items-center gap-2'>
                              <h4 className='font-semibold text-[13px] text-foreground'>
                                {server.name}
                              </h4>
                              <Badge
                                variant='outline'
                                className='rounded-md text-[10px] uppercase tracking-wider'
                              >
                                {server.type}
                              </Badge>
                              <Badge
                                className={cn(
                                  'rounded-md text-[10px]',
                                  getStatusColor(server.status)
                                )}
                              >
                                {server.status.charAt(0).toUpperCase() + server.status.slice(1)}
                              </Badge>
                            </div>
                            <div className='mt-1.5 flex flex-wrap items-center gap-3 text-[12px] text-muted-foreground'>
                              <span>{server.metadata.toolCount} tools</span>
                              {server.metadata.avgLatency > 0 && (
                                <span>{server.metadata.avgLatency}ms avg</span>
                              )}
                              {server.metadata.lastConnected && (
                                <span>
                                  Last: {new Date(server.metadata.lastConnected).toLocaleString()}
                                </span>
                              )}
                            </div>
                            {server.tools.length > 0 && (
                              <div className='mt-2 flex flex-wrap gap-1'>
                                {server.tools.slice(0, 5).map((tool) => (
                                  <Badge
                                    key={tool.id}
                                    variant='secondary'
                                    className='rounded-md text-[10px]'
                                  >
                                    {tool.name}
                                  </Badge>
                                ))}
                                {server.tools.length > 5 && (
                                  <Badge variant='secondary' className='rounded-md text-[10px]'>
                                    +{server.tools.length - 5} more
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className='flex shrink-0 items-center gap-1 opacity-60 transition-opacity group-hover:opacity-100'>
                          {server.status === 'connected' && (
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => handleRefreshTools(server.id)}
                              className='h-7 w-7 rounded-lg p-0'
                            >
                              <RefreshCw className='h-3.5 w-3.5' />
                            </Button>
                          )}
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => {
                              setSelectedServer(server)
                              setIsToolsViewOpen(true)
                            }}
                            className='h-7 w-7 rounded-lg p-0'
                          >
                            <Eye className='h-3.5 w-3.5' />
                          </Button>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => {
                              setSelectedServer(server)
                              setIsEditServerOpen(true)
                            }}
                            className='h-7 w-7 rounded-lg p-0'
                          >
                            <Edit3 className='h-3.5 w-3.5' />
                          </Button>
                          {server.status === 'connected' ? (
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => handleDisconnect(server.id)}
                              className='h-7 w-7 rounded-lg p-0 text-orange-600 hover:text-orange-700'
                            >
                              <PowerOff className='h-3.5 w-3.5' />
                            </Button>
                          ) : (
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => handleConnect(server.id)}
                              disabled={server.status === 'connecting'}
                              className='h-7 w-7 rounded-lg p-0 text-emerald-600 hover:text-emerald-700'
                            >
                              {server.status === 'connecting' ? (
                                <Loader2 className='h-3.5 w-3.5 animate-spin' />
                              ) : (
                                <Power className='h-3.5 w-3.5' />
                              )}
                            </Button>
                          )}
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => handleDelete(server.id)}
                            className='h-7 w-7 rounded-lg p-0 text-destructive hover:text-destructive'
                          >
                            <Trash2 className='h-3.5 w-3.5' />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}

                {servers.length === 0 && !loading && (
                  <div className='flex flex-col items-center gap-4 rounded-xl border border-border/60 border-dashed p-12 text-center'>
                    <div className='flex h-12 w-12 items-center justify-center rounded-full bg-muted/70'>
                      <McpIcon className='h-6 w-6 text-muted-foreground' />
                    </div>
                    <div>
                      <h3 className='font-medium text-[14px] text-foreground'>
                        No MCP servers configured
                      </h3>
                      <p className='mt-1 text-[13px] text-muted-foreground'>
                        Add your first MCP server to start using external tools.
                      </p>
                    </div>
                    <Button
                      onClick={() => setIsAddServerOpen(true)}
                      className='h-8 rounded-lg text-[13px]'
                    >
                      <Plus className='mr-1.5 h-3.5 w-3.5' />
                      Add Your First Server
                    </Button>
                  </div>
                )}

                {!loading &&
                  servers.length > 0 &&
                  servers.filter((s) =>
                    searchQuery
                      ? s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        s.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        s.tools.some((t) =>
                          t.name.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                      : true
                  ).length === 0 && (
                    <div className='py-8 text-center'>
                      <p className='text-[13px] text-muted-foreground'>
                        No servers match &ldquo;{searchQuery}&rdquo;
                      </p>
                    </div>
                  )}
              </>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* Edit Server Dialog */}
      <Dialog open={isEditServerOpen} onOpenChange={setIsEditServerOpen}>
        <DialogContent className='max-w-2xl rounded-xl'>
          <DialogHeader>
            <DialogTitle className='font-semibold text-[15px]'>Edit MCP Server</DialogTitle>
            <DialogDescription className='text-[13px]'>
              Modify the configuration for {selectedServer?.name}.
            </DialogDescription>
          </DialogHeader>
          {selectedServer && (
            <EditServerForm
              server={selectedServer}
              onSuccess={() => {
                setIsEditServerOpen(false)
                loadServers()
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Tools View Dialog */}
      <Dialog open={isToolsViewOpen} onOpenChange={setIsToolsViewOpen}>
        <DialogContent className='max-h-[80vh] max-w-4xl rounded-xl'>
          <DialogHeader>
            <DialogTitle className='font-semibold text-[15px]'>
              Tools — {selectedServer?.name}
            </DialogTitle>
            <DialogDescription className='text-[13px]'>
              Available tools from this MCP server.
            </DialogDescription>
          </DialogHeader>
          {selectedServer && <ToolsView server={selectedServer} />}
        </DialogContent>
      </Dialog>

      {/* Notifications */}
      <div className='fixed right-4 bottom-4 z-50 flex flex-col gap-2'>
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={cn(
              'slide-in-from-right-5 fade-in flex animate-in items-center gap-2 rounded-xl border px-4 py-3 font-medium text-[13px] shadow-lg backdrop-blur-sm duration-300',
              notification.type === 'success' &&
                'border-emerald-200/60 bg-emerald-50/90 text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-950/80 dark:text-emerald-300',
              notification.type === 'info' &&
                'border-primary/20 bg-primary/10/90 text-primary dark:border-primary/25 dark:bg-primary/10/80 dark:text-primary/70',
              notification.type === 'error' &&
                'border-red-200/60 bg-red-50/90 text-red-800 dark:border-red-800/40 dark:bg-red-950/80 dark:text-red-300'
            )}
          >
            {notification.type === 'success' && <CheckCircle className='h-4 w-4 shrink-0' />}
            {notification.type === 'info' && <Circle className='h-4 w-4 shrink-0' />}
            {notification.type === 'error' && <XCircle className='h-4 w-4 shrink-0' />}
            {notification.message}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  valueClassName,
}: {
  label: string
  value: string
  icon: React.ReactNode
  valueClassName?: string
}) {
  return (
    <div className='group rounded-xl border border-border/60 bg-card/50 p-3.5 transition-colors hover:bg-accent/30'>
      <div className='flex items-center justify-between'>
        <p className='font-semibold text-[11px] text-muted-foreground uppercase tracking-wider'>
          {label}
        </p>
        <div className='flex h-7 w-7 items-center justify-center rounded-lg bg-muted/50 transition-colors group-hover:bg-muted/80'>
          {icon}
        </div>
      </div>
      <p className={cn('mt-1.5 font-bold text-xl tabular-nums tracking-tight', valueClassName)}>
        {value}
      </p>
    </div>
  )
}

// Add Server Form Component
function AddServerForm({
  onSuccess,
  onSubmit,
}: {
  onSuccess: () => void
  onSubmit: (data: any) => Promise<void>
}) {
  const [serverType, setServerType] = useState<'stdio' | 'sse' | 'http'>('stdio')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      const name = formData.get('name') as string
      const description = (formData.get('description') as string) || ''

      let config: any = {}

      if (serverType === 'stdio') {
        const command = formData.get('command') as string
        const argsText = (formData.get('args') as string) || ''
        const args = argsText.split('\n').filter(Boolean)
        config = { stdio: { command, args, env: {} } }
      } else if (serverType === 'sse') {
        const endpoint = formData.get('endpoint') as string
        config = { sse: { endpoint, headers: {} } }
      } else if (serverType === 'http') {
        const baseUrl = formData.get('baseUrl') as string
        const apiKey = formData.get('apiKey') as string
        config = { http: { baseUrl, apiKey, headers: {} } }
      }

      await onSubmit({
        name,
        description,
        type: serverType,
        config,
      })

      onSuccess()
    } catch (error) {
      console.error('Error submitting form:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      <div className='grid grid-cols-2 gap-4'>
        <div className='space-y-1.5'>
          <Label htmlFor='name' className='font-medium text-[12px]'>
            Server Name
          </Label>
          <Input
            name='name'
            placeholder='e.g., Filesystem Server'
            required
            className='h-9 rounded-lg text-[13px]'
          />
        </div>
        <div className='space-y-1.5'>
          <Label htmlFor='type' className='font-medium text-[12px]'>
            Connection Type
          </Label>
          <Select value={serverType} onValueChange={(value: any) => setServerType(value)}>
            <SelectTrigger className='h-9 rounded-lg text-[13px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className='rounded-lg'>
              <SelectItem value='stdio' className='text-[13px]'>
                Stdio (Command Line)
              </SelectItem>
              <SelectItem value='sse' className='text-[13px]'>
                SSE (Server-Sent Events)
              </SelectItem>
              <SelectItem value='http' className='text-[13px]'>
                HTTP (REST API)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className='space-y-1.5'>
        <Label htmlFor='description' className='font-medium text-[12px]'>
          Description (optional)
        </Label>
        <Input
          name='description'
          placeholder='Optional description…'
          className='h-9 rounded-lg text-[13px]'
        />
      </div>

      {serverType === 'stdio' && (
        <div className='space-y-4'>
          <div className='space-y-1.5'>
            <Label htmlFor='command' className='font-medium text-[12px]'>
              Command Path
            </Label>
            <Input
              name='command'
              placeholder='npx @modelcontextprotocol/server-example'
              required
              className='h-9 rounded-lg text-[13px]'
            />
          </div>
          <div className='space-y-1.5'>
            <Label htmlFor='args' className='font-medium text-[12px]'>
              Arguments (one per line)
            </Label>
            <Textarea
              name='args'
              placeholder='/path/to/data'
              rows={3}
              className='rounded-lg text-[13px]'
            />
          </div>
        </div>
      )}

      {serverType === 'sse' && (
        <div className='space-y-4'>
          <div className='space-y-1.5'>
            <Label htmlFor='endpoint' className='font-medium text-[12px]'>
              SSE Endpoint URL
            </Label>
            <Input
              name='endpoint'
              type='url'
              placeholder='https://api.example.com/mcp/sse'
              required
              className='h-9 rounded-lg text-[13px]'
            />
          </div>
        </div>
      )}

      {serverType === 'http' && (
        <div className='space-y-4'>
          <div className='space-y-1.5'>
            <Label htmlFor='baseUrl' className='font-medium text-[12px]'>
              Base URL
            </Label>
            <Input
              name='baseUrl'
              type='url'
              placeholder='https://api.example.com'
              required
              className='h-9 rounded-lg text-[13px]'
            />
          </div>
          <div className='space-y-1.5'>
            <Label htmlFor='apiKey' className='font-medium text-[12px]'>
              API Key (optional)
            </Label>
            <Input
              name='apiKey'
              type='password'
              placeholder='Your API key'
              className='h-9 rounded-lg text-[13px]'
            />
          </div>
        </div>
      )}

      <div className='flex items-center space-x-2'>
        <Switch id='autoReconnect' defaultChecked />
        <Label htmlFor='autoReconnect' className='text-[13px]'>
          Auto-reconnect on connection loss
        </Label>
      </div>

      <DialogFooter>
        <Button
          type='button'
          variant='outline'
          onClick={onSuccess}
          disabled={loading}
          className='h-8 rounded-lg text-[13px]'
        >
          Cancel
        </Button>
        <Button type='submit' disabled={loading} className='h-8 rounded-lg text-[13px]'>
          {loading ? 'Adding…' : 'Add Server'}
        </Button>
      </DialogFooter>
    </form>
  )
}

// Edit Server Form Component
function EditServerForm({ server, onSuccess }: { server: MCPServer; onSuccess: () => void }) {
  const [name, setName] = useState(server.name)
  const [autoReconnect, setAutoReconnect] = useState(server.settings.autoReconnect)
  const [timeout, setTimeout_] = useState(server.settings.timeout)
  const [retryAttempts, setRetryAttempts] = useState(server.settings.retryAttempts)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/mcp/servers/${server.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          settings: {
            autoReconnect,
            timeout: timeout,
            retryAttempts: retryAttempts,
          },
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update server')
      }

      onSuccess()
    } catch (err) {
      console.error('Failed to save server:', err)
      setError(err instanceof Error ? err.message : 'Failed to save server')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className='space-y-4'>
      {error && (
        <Alert className='rounded-xl'>
          <AlertTitle className='font-semibold text-[13px]'>Error</AlertTitle>
          <AlertDescription className='text-[13px]'>{error}</AlertDescription>
        </Alert>
      )}
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
        <div className='space-y-1.5'>
          <Label htmlFor='edit-name' className='font-medium text-[12px]'>
            Server Name
          </Label>
          <Input
            id='edit-name'
            value={name}
            onChange={(e) => setName(e.target.value)}
            className='h-9 rounded-lg text-[13px]'
          />
        </div>
        <div className='space-y-1.5'>
          <Label htmlFor='edit-type' className='font-medium text-[12px]'>
            Connection Type
          </Label>
          <Select defaultValue={server.type} disabled>
            <SelectTrigger className='h-9 rounded-lg text-[13px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className='rounded-lg'>
              <SelectItem value='stdio' className='text-[13px]'>
                Stdio
              </SelectItem>
              <SelectItem value='sse' className='text-[13px]'>
                SSE
              </SelectItem>
              <SelectItem value='http' className='text-[13px]'>
                HTTP
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className='flex items-center space-x-2'>
        <Switch
          id='edit-autoReconnect'
          checked={autoReconnect}
          onCheckedChange={setAutoReconnect}
        />
        <Label htmlFor='edit-autoReconnect' className='text-[13px]'>
          Auto-reconnect on connection loss
        </Label>
      </div>

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
        <div className='space-y-1.5'>
          <Label htmlFor='edit-timeout' className='font-medium text-[12px]'>
            Timeout (seconds)
          </Label>
          <Input
            id='edit-timeout'
            type='number'
            value={timeout}
            onChange={(e) => setTimeout_(Number(e.target.value))}
            className='h-9 rounded-lg text-[13px]'
          />
        </div>
        <div className='space-y-1.5'>
          <Label htmlFor='edit-retries' className='font-medium text-[12px]'>
            Retry Attempts
          </Label>
          <Input
            id='edit-retries'
            type='number'
            value={retryAttempts}
            onChange={(e) => setRetryAttempts(Number(e.target.value))}
            className='h-9 rounded-lg text-[13px]'
          />
        </div>
      </div>

      <DialogFooter>
        <Button
          variant='outline'
          onClick={onSuccess}
          disabled={saving}
          className='h-8 rounded-lg text-[13px]'
        >
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving} className='h-8 rounded-lg text-[13px]'>
          {saving ? 'Saving…' : 'Save Changes'}
        </Button>
      </DialogFooter>
    </div>
  )
}

// Tools View Component
function ToolsView({ server }: { server: MCPServer }) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [toolSearch, setToolSearch] = useState('')

  const categories = ['all', ...new Set(server.tools.flatMap((tool) => tool.category))]
  const filteredTools = server.tools
    .filter((tool) => selectedCategory === 'all' || tool.category.includes(selectedCategory))
    .filter((tool) =>
      toolSearch
        ? tool.name.toLowerCase().includes(toolSearch.toLowerCase()) ||
          tool.description.toLowerCase().includes(toolSearch.toLowerCase())
        : true
    )

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap items-center gap-3'>
        <div className='relative min-w-0 flex-1'>
          <Search className='-translate-y-1/2 absolute top-1/2 left-3 h-3.5 w-3.5 text-muted-foreground' />
          <Input
            placeholder='Search tools...'
            value={toolSearch}
            onChange={(e) => setToolSearch(e.target.value)}
            className='h-8 rounded-lg pl-9 text-[13px]'
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className='h-8 w-full rounded-lg text-[13px] sm:w-40'>
            <SelectValue placeholder='Category' />
          </SelectTrigger>
          <SelectContent className='rounded-lg'>
            {categories.map((category) => (
              <SelectItem key={category} value={category} className='text-[13px]'>
                {category.charAt(0).toUpperCase() + category.slice(1)}
                {category !== 'all' &&
                  ` (${server.tools.filter((t) => t.category.includes(category)).length})`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className='shrink-0 text-[12px] text-muted-foreground tabular-nums'>
          {filteredTools.length} tools
        </span>
      </div>

      <ScrollArea className='h-96'>
        <div className='space-y-2'>
          {filteredTools.map((tool) => (
            <div
              key={tool.id}
              className='rounded-xl border border-border/60 bg-card/50 p-4 transition-colors hover:bg-accent/30'
            >
              <div className='flex items-start justify-between gap-3'>
                <div className='min-w-0 flex-1'>
                  <h4 className='font-semibold text-[13px] text-foreground'>{tool.name}</h4>
                  <p className='mt-0.5 text-[12px] text-muted-foreground'>{tool.description}</p>
                  <div className='mt-2 flex flex-wrap gap-1'>
                    {tool.category.map((cat) => (
                      <Badge key={cat} variant='secondary' className='rounded-md text-[10px]'>
                        {cat}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button variant='outline' size='sm' className='h-7 shrink-0 rounded-lg text-[12px]'>
                  Test Tool
                </Button>
              </div>
            </div>
          ))}

          {filteredTools.length === 0 && (
            <div className='py-8 text-center'>
              <p className='text-[13px] text-muted-foreground'>No tools found in this category.</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
