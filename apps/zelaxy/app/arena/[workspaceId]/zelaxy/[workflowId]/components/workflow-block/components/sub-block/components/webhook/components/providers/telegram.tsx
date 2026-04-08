import { Input, Skeleton } from '@/components/ui'
import {
  ConfigField,
  ConfigSection,
  InstructionsSection,
  TestResultDisplay as WebhookTestResult,
} from '@/app/arena/[workspaceId]/zelaxy/[workflowId]/components/workflow-block/components/sub-block/components/webhook/components'

interface TelegramConfigProps {
  botToken: string
  setBotToken: (value: string) => void
  isLoadingToken: boolean
  testResult: any
  copied: string | null
  copyToClipboard: (text: string, type: string) => void
  testWebhook?: () => void // Optional test function
  webhookId?: string // Webhook ID to enable testing
  webhookUrl: string // Added webhook URL
}

export function TelegramConfig({
  botToken,
  setBotToken,
  isLoadingToken,
  testResult,
  copied,
  copyToClipboard,
  testWebhook,
  webhookId,
  webhookUrl,
}: TelegramConfigProps) {
  return (
    <div className='space-y-4'>
      <ConfigSection title='Telegram Configuration'>
        <ConfigField
          id='telegram-bot-token'
          label='Bot Token *'
          description='Your Telegram Bot Token from BotFather'
        >
          {isLoadingToken ? (
            <Skeleton className='h-10 w-full' />
          ) : (
            <Input
              id='telegram-bot-token'
              value={botToken}
              onChange={(e) => {
                setBotToken(e.target.value)
              }}
              placeholder='123456789:ABCdefGHIjklMNOpqrsTUVwxyz'
              type='password'
              required
            />
          )}
        </ConfigField>
      </ConfigSection>

      {testResult && (
        <WebhookTestResult
          testResult={testResult}
          copied={copied}
          copyToClipboard={copyToClipboard}
        />
      )}

      <InstructionsSection tip='After saving, send any message to your bot in Telegram to test the webhook trigger.'>
        <ol className='list-inside list-decimal space-y-2'>
          <li>
            Open Telegram and search for{' '}
            <a
              href='https://t.me/BotFather'
              target='_blank'
              rel='noopener noreferrer'
              className='link text-primary underline transition-colors hover:text-primary/80'
              onClick={(e) => {
                e.stopPropagation()
                window.open('https://t.me/BotFather', '_blank', 'noopener,noreferrer')
                e.preventDefault()
              }}
            >
              @BotFather
            </a>
            .
          </li>
          <li>
            Send <code className='rounded bg-muted px-1.5 py-0.5 text-xs'>/newbot</code> and follow
            the prompts to name your bot.
          </li>
          <li>
            BotFather will give you a token like{' '}
            <code className='rounded bg-muted px-1.5 py-0.5 text-xs'>123456789:ABCdefGHI...</code> —
            paste it in the <strong>Bot Token</strong> field above.
          </li>
          <li>
            Click <strong>Save Changes</strong> — Zelaxy automatically registers the webhook with
            Telegram.
          </li>
          <li>Send a message to your bot. The workflow will trigger with the message payload.</li>
        </ol>
      </InstructionsSection>
    </div>
  )
}
