'use client'

import { useCallback, useEffect, useState } from 'react'

interface MCPTool {
  id: string
  toolId: string
  name: string
  description: string
  category: string[]
  inputSchema: Record<string, any>
  outputSchema: Record<string, any>
}

export function useMCPTools(serverId: string | undefined, enabled = true) {
  const [tools, setTools] = useState<MCPTool[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTools = useCallback(async () => {
    if (!enabled || !serverId) {
      setTools([])
      setLoading(false)
      setError(null)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/mcp/servers/${encodeURIComponent(serverId)}/tools`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        // Don't log 404s as errors — they happen when servers are deleted
        if (response.status !== 404) {
          console.warn('MCP tools fetch failed:', errorData.error || response.status)
        }
        setTools([])
        return
      }

      const data = await response.json()
      setTools(data.tools || [])
    } catch (err) {
      // Suppress network errors for stale server IDs — not actionable
      setError(null)
      setTools([])
    } finally {
      setLoading(false)
    }
  }, [serverId, enabled])

  useEffect(() => {
    fetchTools()
  }, [fetchTools])

  // Convert tools to dropdown options format
  const toolOptions = tools.map((tool) => ({
    id: tool.toolId || tool.name,
    label: `${tool.name}${tool.description ? ` - ${tool.description.substring(0, 60)}${tool.description.length > 60 ? '...' : ''}` : ''}`,
  }))

  return {
    tools,
    toolOptions,
    loading,
    error,
    refresh: fetchTools,
  }
}
