import { CheckCheck, Copy, Globe, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface WebhookUrlFieldProps {
  webhookUrl: string
  isLoadingToken: boolean
  copied: string | null
  copyToClipboard: (text: string, type: string) => void
}

export function WebhookUrlField({
  webhookUrl,
  isLoadingToken,
  copied,
  copyToClipboard,
}: WebhookUrlFieldProps) {
  return (
    <div className='mb-5 space-y-2 rounded-lg border border-border/60 bg-card/80 p-4 shadow-sm backdrop-blur-sm'>
      <div className='flex items-center gap-2'>
        <Globe className='h-4 w-4 text-primary' />
        <Label htmlFor='webhook-url' className='font-semibold text-sm tracking-tight'>
          Webhook URL
        </Label>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='ghost'
              size='sm'
              className='h-5 w-5 p-0.5 text-muted-foreground hover:text-foreground'
              aria-label='Learn more about webhook URL'
            >
              <Info className='h-3.5 w-3.5' />
            </Button>
          </TooltipTrigger>
          <TooltipContent
            side='right'
            align='center'
            className='z-[100] max-w-[300px] p-3'
            role='tooltip'
          >
            <p className='text-sm'>
              Copy this URL and paste it into your external service&apos;s webhook configuration.
            </p>
          </TooltipContent>
        </Tooltip>
      </div>
      <div className='flex gap-2'>
        <Input
          id='webhook-url'
          readOnly
          value={webhookUrl}
          className={cn(
            'h-10 flex-1 cursor-text rounded-md border-border/50 bg-muted/50 font-mono text-xs',
            'focus-visible:ring-2 focus-visible:ring-primary/20'
          )}
          onClick={(e) => (e.target as HTMLInputElement).select()}
          disabled={isLoadingToken}
        />
        <Button
          type='button'
          size='icon'
          variant='outline'
          className={cn(
            'h-10 w-10 shrink-0 transition-all',
            copied === 'url'
              ? 'border-green-500/30 bg-green-500/10 text-green-500'
              : 'hover:border-primary/30 hover:bg-primary/5'
          )}
          onClick={() => copyToClipboard(webhookUrl, 'url')}
          disabled={isLoadingToken}
        >
          {copied === 'url' ? <CheckCheck className='h-4 w-4' /> : <Copy className='h-4 w-4' />}
        </Button>
      </div>
    </div>
  )
}
