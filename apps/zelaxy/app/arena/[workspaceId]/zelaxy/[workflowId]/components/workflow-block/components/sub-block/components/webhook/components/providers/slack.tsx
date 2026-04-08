import { SlackIcon } from '@/components/icons'
import { Notice } from '@/components/ui'
import { JSONView } from '@/app/arena/[workspaceId]/zelaxy/[workflowId]/components/panel/components/console/components'
import {
  ConfigSection,
  InstructionsSection,
  TestResultDisplay,
  WebhookConfigField,
} from '@/app/arena/[workspaceId]/zelaxy/[workflowId]/components/workflow-block/components/sub-block/components/webhook/components'

interface SlackConfigProps {
  signingSecret: string
  setSigningSecret: (secret: string) => void
  isLoadingToken: boolean
  testResult: {
    success: boolean
    message?: string
    test?: any
  } | null
  copied: string | null
  copyToClipboard: (text: string, type: string) => void
  testWebhook: () => Promise<void>
  webhookUrl: string
}

const exampleEvent = JSON.stringify(
  {
    type: 'event_callback',
    event: {
      type: 'message',
      channel: 'C0123456789',
      user: 'U0123456789',
      text: 'Hello from Slack!',
      ts: '1234567890.123456',
    },
    team_id: 'T0123456789',
    event_id: 'Ev0123456789',
    event_time: 1234567890,
  },
  null,
  2
)

export function SlackConfig({
  signingSecret,
  setSigningSecret,
  isLoadingToken,
  testResult,
  copied,
  copyToClipboard,
  webhookUrl,
}: SlackConfigProps) {
  return (
    <div className='space-y-4'>
      <ConfigSection title='Slack Configuration'>
        <WebhookConfigField
          id='webhook-url'
          label='Webhook URL'
          value={webhookUrl}
          description='This is the URL that will receive webhook requests'
          isLoading={isLoadingToken}
          copied={copied}
          copyType='url'
          copyToClipboard={copyToClipboard}
          readOnly={true}
        />

        <WebhookConfigField
          id='slack-signing-secret'
          label='Signing Secret'
          value={signingSecret}
          onChange={setSigningSecret}
          placeholder='Enter your Slack app signing secret'
          description="Found on your Slack app's Basic Information page. Used to validate requests."
          isLoading={isLoadingToken}
          copied={copied}
          copyType='slack-signing-secret'
          copyToClipboard={copyToClipboard}
          isSecret={true}
        />
      </ConfigSection>

      <TestResultDisplay
        testResult={testResult}
        copied={copied}
        copyToClipboard={copyToClipboard}
        showCurlCommand={true}
      />

      <InstructionsSection tip='After setup, mention your bot with @YourBotName in any channel to test the webhook trigger.'>
        <ol className='list-inside list-decimal space-y-2'>
          <li>
            Go to the{' '}
            <a
              href='https://api.slack.com/apps'
              target='_blank'
              rel='noopener noreferrer'
              className='link text-primary underline transition-colors hover:text-primary/80'
              onClick={(e) => {
                e.stopPropagation()
                window.open('https://api.slack.com/apps', '_blank', 'noopener,noreferrer')
                e.preventDefault()
              }}
            >
              Slack Apps page
            </a>{' '}
            and create a new app (or select an existing one).
          </li>
          <li>
            Navigate to <strong>Basic Information</strong> and copy the{' '}
            <strong>Signing Secret</strong> — paste it above.
          </li>
          <li>
            Go to <strong>OAuth &amp; Permissions</strong> and add these bot token scopes:
            <ul className='mt-1.5 ml-5 list-disc space-y-1'>
              <li>
                <code className='rounded bg-muted px-1.5 py-0.5 text-xs'>app_mentions:read</code> —
                read messages that @mention your bot
              </li>
              <li>
                <code className='rounded bg-muted px-1.5 py-0.5 text-xs'>chat:write</code> — send
                messages to channels
              </li>
            </ul>
          </li>
          <li>
            Go to <strong>Event Subscriptions</strong>, enable events, and paste the{' '}
            <strong>Webhook URL</strong> into the "Request URL" field.
          </li>
          <li>
            Under <strong>Subscribe to Bot Events</strong>, add{' '}
            <code className='rounded bg-muted px-1.5 py-0.5 text-xs'>app_mention</code>.
          </li>
          <li>
            Go to <strong>Install App</strong> and install to your workspace.
          </li>
          <li>
            Click <strong>Save Changes</strong> here and in Slack.
          </li>
        </ol>
      </InstructionsSection>

      <Notice
        variant='default'
        className='border-slate-200 bg-white dark:border-border dark:bg-background'
        icon={
          <SlackIcon className='mt-0.5 mr-3.5 h-5 w-5 flex-shrink-0 text-[#611f69] dark:text-[#e01e5a]' />
        }
        title='Slack Event Payload Example'
      >
        Your workflow will receive a payload similar to this when a subscribed event occurs:
        <div className='overflow-wrap-anywhere mt-2 whitespace-normal break-normal font-mono text-sm'>
          <JSONView data={JSON.parse(exampleEvent)} />
        </div>
      </Notice>
    </div>
  )
}
