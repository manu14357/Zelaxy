'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

interface MCPServer {
  id: string
  name: string
  type: 'stdio' | 'sse' | 'http'
  status: 'connected' | 'disconnected' | 'error' | 'connecting'
}

export function useMCPServers(enabled = true) {
  const params = useParams()
  const workspaceId = params?.workspaceId as string

  const [servers, setServers] = useState<MCPServer[]>([])
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState<string | null>(null)

  const fetchServers = useCallback(async () => {
    if (!enabled || !workspaceId) {
      setLoading(false)
      return
    }

    // Validate workspaceId format (basic UUID check)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(workspaceId)) {
      setError('Invalid workspace ID format')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(
        `/api/mcp/servers?workspaceId=${encodeURIComponent(workspaceId)}`
      )
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to fetch servers: ${response.status}`)
      }

      const data = await response.json()
      setServers(data.servers || [])
    } catch (err) {
      console.error('Failed to fetch MCP servers:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch servers')
      setServers([])
    } finally {
      setLoading(false)
    }
  }, [workspaceId, enabled])

  useEffect(() => {
    fetchServers()
  }, [fetchServers])

  // Convert servers to dropdown options format
  const serverOptions = servers.map((server) => ({
    id: server.id,
    label: `${server.name} (${server.status})`,
  }))

  return {
    servers,
    serverOptions,
    loading,
    error,
    refresh: fetchServers,
  }
}
