'use client'

import { useCallback, useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { createLogger } from '@/lib/logs/console/logger'
import { cn } from '@/lib/utils'

const logger = createLogger('NotificationBell')

interface NotificationItem {
  id: string
  type: string
  title: string
  message: string
  level: string
  read: boolean
  createdAt: string
}

const LEVEL_DOT: Record<string, string> = {
  info: 'bg-blue-500',
  warning: 'bg-amber-500',
  error: 'bg-red-500',
}

/**
 * In-app notifications indicator. Polls /api/notifications, shows an unread
 * count, and marks everything read when opened. Fully self-guarded - a fetch
 * failure never throws into the render tree.
 */
export function NotificationBell({ className }: { className?: string }) {
  const [items, setItems] = useState<NotificationItem[]>([])
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?limit=20')
      if (!res.ok) return
      const body = await res.json()
      setItems(Array.isArray(body.notifications) ? body.notifications : [])
      setUnread(typeof body.unreadCount === 'number' ? body.unreadCount : 0)
    } catch (error) {
      logger.error('Failed to load notifications', { error })
    }
  }, [])

  useEffect(() => {
    load()
    const timer = setInterval(load, 60_000)
    return () => clearInterval(timer)
  }, [load])

  const markAllRead = useCallback(async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      })
      setItems((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnread(0)
    } catch (error) {
      logger.error('Failed to mark notifications read', { error })
    }
  }, [])

  const onOpenChange = useCallback(
    (next: boolean) => {
      setOpen(next)
      if (next && unread > 0) void markAllRead()
    },
    [unread, markAllRead]
  )

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant='ghost'
          size='icon'
          className={cn('relative', className)}
          aria-label='Notifications'
        >
          <Bell className='h-4 w-4' />
          {unread > 0 && (
            <Badge className='-right-1 -top-1 absolute flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px]'>
              {unread > 9 ? '9+' : unread}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align='end' className='w-80 p-0'>
        <div className='flex items-center justify-between border-b px-3 py-2'>
          <span className='font-medium text-sm'>Notifications</span>
          {items.some((n) => !n.read) && (
            <button
              type='button'
              onClick={() => void markAllRead()}
              className='text-muted-foreground text-xs hover:text-foreground'
            >
              Mark all read
            </button>
          )}
        </div>
        <ScrollArea className='max-h-80'>
          {items.length === 0 ? (
            <div className='px-3 py-8 text-center text-muted-foreground text-xs'>
              No notifications
            </div>
          ) : (
            <ul className='divide-y'>
              {items.map((n) => (
                <li key={n.id} className={cn('flex gap-2 px-3 py-2.5', !n.read && 'bg-muted/40')}>
                  <span
                    className={cn(
                      'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                      LEVEL_DOT[n.level] ?? 'bg-muted-foreground'
                    )}
                  />
                  <div className='min-w-0'>
                    <p className='font-medium text-[13px]'>{n.title}</p>
                    <p className='text-[12px] text-muted-foreground'>{n.message}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}

export default NotificationBell
