import { Shield, Terminal } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle, CodeBlock, Input } from '@/components/ui'
import {
  ConfigField,
  ConfigSection,
  InstructionsSection,
  TestResultDisplay,
} from '@/app/arena/[workspaceId]/zelaxy/[workflowId]/components/workflow-block/components/sub-block/components/webhook/components'

interface MicrosoftTeamsConfigProps {
  hmacSecret: string
  setHmacSecret: (secret: string) => void
  isLoadingToken: boolean
  testResult: {
    success: boolean
    message?: string
    test?: any
  } | null
  copied: string | null
  copyToClipboard: (text: string, type: string) => void
  testWebhook: () => Promise<void>
}

const teamsWebhookExample = JSON.stringify(
  {
    type: 'message',
    id: '1234567890',
    timestamp: '2023-01-01T00:00:00.000Z',
    localTimestamp: '2023-01-01T00:00:00.000Z',
    serviceUrl: 'https://smba.trafficmanager.net/amer/',
    channelId: 'msteams',
    from: {
      id: '29:1234567890abcdef',
      name: 'John Doe',
    },
    conversation: {
      id: '19:meeting_abcdef@thread.v2',
    },
    text: 'Hello Zelaxy Bot!',
  },
  null,
  2
)

export function MicrosoftTeamsConfig({
  hmacSecret,
  setHmacSecret,
  isLoadingToken,
  testResult,
  copied,
  copyToClipboard,
  testWebhook,
}: MicrosoftTeamsConfigProps) {
  return (
    <div className='space-y-4'>
      <ConfigSection title='Microsoft Teams Configuration'>
        <ConfigField
          id='teams-hmac-secret'
          label='HMAC Secret'
          description='The security token provided by Teams when creating an outgoing webhook. Used to verify request authenticity.'
        >
          <Input
            id='teams-hmac-secret'
            value={hmacSecret}
            onChange={(e) => setHmacSecret(e.target.value)}
            placeholder='Enter HMAC secret from Teams'
            disabled={isLoadingToken}
            type='password'
          />
        </ConfigField>
      </ConfigSection>

      <TestResultDisplay
        testResult={testResult}
        copied={copied}
        copyToClipboard={copyToClipboard}
        showCurlCommand={true}
      />

      <InstructionsSection
        title='Setting up Outgoing Webhook in Microsoft Teams'
        tip='After creating the webhook, Teams gives you an HMAC token — paste it above to verify request authenticity.'
      >
        <ol className='list-inside list-decimal space-y-2'>
          <li>
            Open <strong>Microsoft Teams</strong> and go to the team where you want to add the
            webhook.
          </li>
          <li>
            Click the three dots (<strong>•••</strong>) next to the team name →{' '}
            <strong>Manage team</strong>.
          </li>
          <li>
            Go to the <strong>Apps</strong> tab → <strong>Create an outgoing webhook</strong>.
          </li>
          <li>Provide a name and description for the webhook.</li>
          <li>
            Set the <strong>Callback URL</strong> to your Zelaxy webhook URL (shown above).
          </li>
          <li>
            Copy the <strong>HMAC security token</strong> that Teams provides and paste it into the{' '}
            <strong>HMAC Secret</strong> field above.
          </li>
          <li>
            Click <strong>Create</strong> to finish setup.
          </li>
        </ol>
      </InstructionsSection>

      <InstructionsSection title='How Messages Are Received'>
        <p className='leading-relaxed'>
          When users <strong>@mention</strong> your webhook in a Teams channel, Teams sends a POST
          request to your Zelaxy webhook URL. The payload looks like this:
        </p>
        <CodeBlock language='json' code={teamsWebhookExample} className='mt-3 text-sm' />
        <ul className='mt-3 list-outside list-disc space-y-1 pl-4'>
          <li>
            Messages are triggered by{' '}
            <code className='rounded bg-muted px-1.5 py-0.5 text-xs'>@mentioning</code> the webhook
            name in Teams.
          </li>
          <li>Requests include HMAC signature for authentication verification.</li>
          <li>
            You have <strong>5 seconds</strong> to respond to the webhook request.
          </li>
        </ul>
      </InstructionsSection>

      <Alert className='rounded-lg border-border/60'>
        <Shield className='h-4 w-4' />
        <AlertTitle className='font-semibold text-sm'>Security</AlertTitle>
        <AlertDescription>
          The HMAC secret verifies that requests are from Microsoft Teams. Keep it secure and never
          share it publicly.
        </AlertDescription>
      </Alert>

      <Alert className='rounded-lg border-border/60'>
        <Terminal className='h-4 w-4' />
        <AlertTitle className='font-semibold text-sm'>Requirements</AlertTitle>
        <AlertDescription>
          <ul className='mt-1.5 list-outside list-disc space-y-1 pl-4'>
            <li>Your Zelaxy webhook URL must use HTTPS and be publicly accessible.</li>
            <li>Self-signed SSL certificates are not supported by Microsoft Teams.</li>
            <li>For local testing, use a tunneling service like ngrok or Cloudflare Tunnel.</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  )
}
