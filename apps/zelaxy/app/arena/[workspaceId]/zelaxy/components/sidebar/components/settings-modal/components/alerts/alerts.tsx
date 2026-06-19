'use client'

import { useCallback, useEffect, useState } from 'react'
import { Bell, Plus, Send, Trash2 } from 'lucide-react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { createLogger } from '@/lib/logs/console/logger'
import { SettingPageHeader } from '../shared'

const logger = createLogger('AlertsSettings')

interface AlertRow {
  id: string
  name: string
  enabled: boolean
  ruleType: string
  ruleConfig: Record<string, any>
  channelType: string
  channelConfig: Record<string, any>
}

const RULE_TYPES = [
  {
    value: 'consecutive_failures',
    label: 'Consecutive failures',
    field: 'count',
    unit: 'runs',
    def: 3,
  },
  {
    value: 'failure_rate',
    label: 'Failure rate',
    field: 'percent',
    unit: '%',
    def: 50,
    window: true,
  },
  {
    value: 'error_count',
    label: 'Error count',
    field: 'count',
    unit: 'errors',
    def: 5,
    window: true,
  },
  {
    value: 'latency_threshold',
    label: 'Latency threshold',
    field: 'durationMs',
    unit: 'ms',
    def: 30000,
  },
  {
    value: 'latency_spike',
    label: 'Latency spike',
    field: 'percent',
    unit: '% slower',
    def: 100,
    window: true,
  },
  { value: 'cost_threshold', label: 'Cost threshold', field: 'dollars', unit: '$', def: 1 },
  { value: 'no_activity', label: 'No activity', field: 'hours', unit: 'hours', def: 24 },
] as const

interface AlertsProps {
  onOpenChange?: (open: boolean) => void
}

export function Alerts(_props: AlertsProps) {
  const params = useParams()
  const workspaceId = params.workspaceId as string

  const [alerts, setAlerts] = useState<AlertRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  // Create form state
  const [name, setName] = useState('')
  const [ruleType, setRuleType] = useState<string>('consecutive_failures')
  const [threshold, setThreshold] = useState<number>(3)
  const [windowHours, setWindowHours] = useState<number>(24)
  const [channelType, setChannelType] = useState<string>('webhook')
  const [channelUrl, setChannelUrl] = useState('')
  const [channelSecret, setChannelSecret] = useState('')
  const [recipients, setRecipients] = useState('')

  const rule = RULE_TYPES.find((r) => r.value === ruleType) ?? RULE_TYPES[0]

  const fetchAlerts = useCallback(async () => {
    if (!workspaceId) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/notifications`)
      if (!res.ok) throw new Error(`Failed to load alerts (${res.status})`)
      const json = await res.json()
      setAlerts(json.notifications ?? [])
    } catch (err) {
      logger.error('load alerts failed', { err })
      setError(err instanceof Error ? err.message : 'Failed to load alerts')
    } finally {
      setIsLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    fetchAlerts()
  }, [fetchAlerts])

  // Reset threshold default when rule changes
  useEffect(() => {
    setThreshold(rule.def)
  }, [rule.def])

  const createAlert = useCallback(async () => {
    if (!name.trim()) return
    const ruleConfig: Record<string, any> = { [rule.field]: threshold }
    if ((rule as any).window) ruleConfig.windowHours = windowHours

    const channelConfig: Record<string, any> =
      channelType === 'email'
        ? {
            recipients: recipients
              .split(',')
              .map((r) => r.trim())
              .filter(Boolean),
          }
        : {
            url: channelUrl,
            ...(channelType === 'webhook' && channelSecret ? { secret: channelSecret } : {}),
          }

    setCreating(true)
    setError(null)
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          ruleType,
          ruleConfig,
          channelType,
          channelConfig,
        }),
      })
      if (!res.ok) {
        const b = await res.json().catch(() => ({}))
        throw new Error(b.error || `Failed to create (${res.status})`)
      }
      setName('')
      setChannelUrl('')
      setChannelSecret('')
      setRecipients('')
      await fetchAlerts()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create alert')
    } finally {
      setCreating(false)
    }
  }, [
    name,
    rule,
    threshold,
    windowHours,
    channelType,
    channelUrl,
    channelSecret,
    recipients,
    ruleType,
    workspaceId,
    fetchAlerts,
  ])

  const toggleAlert = useCallback(
    async (a: AlertRow) => {
      setBusyId(a.id)
      try {
        await fetch(`/api/workspaces/${workspaceId}/notifications/${a.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enabled: !a.enabled }),
        })
        setAlerts((prev) => prev.map((x) => (x.id === a.id ? { ...x, enabled: !x.enabled } : x)))
      } finally {
        setBusyId(null)
      }
    },
    [workspaceId]
  )

  const deleteAlert = useCallback(
    async (id: string) => {
      setBusyId(id)
      try {
        await fetch(`/api/workspaces/${workspaceId}/notifications/${id}`, { method: 'DELETE' })
        setAlerts((prev) => prev.filter((x) => x.id !== id))
      } finally {
        setBusyId(null)
      }
    },
    [workspaceId]
  )

  const testAlert = useCallback(
    async (id: string) => {
      setBusyId(id)
      setError(null)
      try {
        const res = await fetch(`/api/workspaces/${workspaceId}/notifications/${id}/test`, {
          method: 'POST',
        })
        const b = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(b.error || 'Test delivery failed')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Test failed')
      } finally {
        setBusyId(null)
      }
    },
    [workspaceId]
  )

  return (
    <div className='space-y-6 px-3 py-6'>
      <SettingPageHeader
        title='Alerts'
        description='Get notified when workflows fail repeatedly, run slow, cost too much, or go quiet.'
      />

      {error && (
        <div className='rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-[13px] text-destructive'>
          {error}
        </div>
      )}

      {/* Create form */}
      <div className='space-y-3 rounded-xl border border-border/60 bg-card/50 p-4'>
        <div className='flex items-center gap-2'>
          <Plus className='h-4 w-4 text-muted-foreground' />
          <span className='font-medium text-[13px]'>New alert</span>
        </div>
        <div className='grid gap-3 sm:grid-cols-2'>
          <div className='space-y-1'>
            <Label className='text-xs'>Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='Repeated failures'
              className='h-9'
            />
          </div>
          <div className='space-y-1'>
            <Label className='text-xs'>Rule</Label>
            <Select value={ruleType} onValueChange={setRuleType}>
              <SelectTrigger className='h-9'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RULE_TYPES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='space-y-1'>
            <Label className='text-xs'>Threshold ({rule.unit})</Label>
            <Input
              type='number'
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className='h-9'
            />
          </div>
          {(rule as any).window && (
            <div className='space-y-1'>
              <Label className='text-xs'>Window (hours)</Label>
              <Input
                type='number'
                value={windowHours}
                onChange={(e) => setWindowHours(Number(e.target.value))}
                className='h-9'
              />
            </div>
          )}
          <div className='space-y-1'>
            <Label className='text-xs'>Channel</Label>
            <Select value={channelType} onValueChange={setChannelType}>
              <SelectTrigger className='h-9'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='webhook'>Webhook</SelectItem>
                <SelectItem value='email'>Email</SelectItem>
                <SelectItem value='slack'>Slack (incoming webhook)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {channelType === 'email' ? (
            <div className='space-y-1'>
              <Label className='text-xs'>Recipients (comma-separated)</Label>
              <Input
                value={recipients}
                onChange={(e) => setRecipients(e.target.value)}
                placeholder='ops@example.com'
                className='h-9'
              />
            </div>
          ) : (
            <div className='space-y-1'>
              <Label className='text-xs'>
                {channelType === 'slack' ? 'Slack webhook URL' : 'Webhook URL'}
              </Label>
              <Input
                value={channelUrl}
                onChange={(e) => setChannelUrl(e.target.value)}
                placeholder='https://…'
                className='h-9'
              />
            </div>
          )}
          {channelType === 'webhook' && (
            <div className='space-y-1'>
              <Label className='text-xs'>Signing secret (optional)</Label>
              <Input
                value={channelSecret}
                onChange={(e) => setChannelSecret(e.target.value)}
                placeholder='for zelaxy-signature'
                className='h-9'
              />
            </div>
          )}
        </div>
        <Button size='sm' onClick={createAlert} disabled={creating || !name.trim()}>
          {creating ? 'Creating…' : 'Create alert'}
        </Button>
      </div>

      {/* List */}
      <div className='rounded-xl border border-border/60'>
        {isLoading ? (
          <p className='py-8 text-center text-muted-foreground text-sm'>Loading…</p>
        ) : alerts.length === 0 ? (
          <div className='flex flex-col items-center gap-2 py-10 text-center'>
            <Bell className='h-7 w-7 text-muted-foreground/60' />
            <p className='text-muted-foreground text-sm'>No alerts yet.</p>
          </div>
        ) : (
          alerts.map((a) => {
            const rt = RULE_TYPES.find((r) => r.value === a.ruleType)
            return (
              <div
                key={a.id}
                className='flex items-center gap-3 border-border/30 border-b px-4 py-3 last:border-b-0'
              >
                <Switch
                  checked={a.enabled}
                  onCheckedChange={() => toggleAlert(a)}
                  disabled={busyId === a.id}
                />
                <div className='min-w-0 flex-1'>
                  <div className='truncate font-medium text-sm'>{a.name}</div>
                  <div className='truncate text-[12px] text-muted-foreground'>
                    {rt?.label ?? a.ruleType} · {a.channelType}
                  </div>
                </div>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-8 w-8'
                  title='Send test'
                  onClick={() => testAlert(a.id)}
                  disabled={busyId === a.id}
                >
                  <Send className='h-3.5 w-3.5' />
                </Button>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-8 w-8 text-muted-foreground hover:text-destructive'
                  onClick={() => deleteAlert(a.id)}
                  disabled={busyId === a.id}
                >
                  <Trash2 className='h-3.5 w-3.5' />
                </Button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
