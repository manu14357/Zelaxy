import { Network } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui'
import {
  ConfigField,
  ConfigSection,
  CopyableField,
  InstructionsSection,
  TestResultDisplay,
} from '@/app/arena/[workspaceId]/zelaxy/[workflowId]/components/workflow-block/components/sub-block/components/webhook/components'

interface WhatsAppConfigProps {
  verificationToken: string
  setVerificationToken: (token: string) => void
  isLoadingToken: boolean
  testResult: {
    success: boolean
    message?: string
    test?: any
  } | null
  copied: string | null
  copyToClipboard: (text: string, type: string) => void
}

export function WhatsAppConfig({
  verificationToken,
  setVerificationToken,
  isLoadingToken,
  testResult,
  copied,
  copyToClipboard,
}: WhatsAppConfigProps) {
  return (
    <div className='space-y-4'>
      <ConfigSection title='WhatsApp Configuration'>
        <ConfigField
          id='whatsapp-verification-token'
          label='Verification Token'
          description="Enter any secure token here. You'll need to provide the same token in your WhatsApp Business Platform dashboard."
        >
          <CopyableField
            id='whatsapp-verification-token'
            value={verificationToken}
            onChange={setVerificationToken}
            placeholder='Generate or enter a verification token'
            isLoading={isLoadingToken}
            copied={copied}
            copyType='whatsapp-token'
            copyToClipboard={copyToClipboard}
            isSecret // Treat as secret
          />
        </ConfigField>
      </ConfigSection>

      <TestResultDisplay
        testResult={testResult}
        copied={copied}
        copyToClipboard={copyToClipboard}
        showCurlCommand={false} // WhatsApp uses GET for verification, not simple POST
      />

      <InstructionsSection tip='After clicking "Verify and save" in Meta, subscribe to the "messages" webhook field to start receiving message events.'>
        <ol className='list-inside list-decimal space-y-2'>
          <li>
            Go to your{' '}
            <a
              href='https://developers.facebook.com/apps/'
              target='_blank'
              rel='noopener noreferrer'
              className='link text-primary underline transition-colors hover:text-primary/80'
              onClick={(e) => {
                e.stopPropagation()
                window.open(
                  'https://developers.facebook.com/apps/',
                  '_blank',
                  'noopener,noreferrer'
                )
                e.preventDefault()
              }}
            >
              Meta for Developers
            </a>{' '}
            dashboard and select your app.
          </li>
          <li>
            Navigate to <strong>WhatsApp</strong> → <strong>Configuration</strong> in the sidebar.
          </li>
          <li>
            In the <strong>Webhooks</strong> section, click <strong>Edit</strong>.
          </li>
          <li>
            Paste the <strong>Webhook URL</strong> (from above) into the{' '}
            <strong>Callback URL</strong> field.
          </li>
          <li>
            Paste the <strong>Verification Token</strong> (from above) into the{' '}
            <strong>Verify Token</strong> field.
          </li>
          <li>
            Click <strong>Verify and Save</strong> — Meta will send a verification request to your
            webhook.
          </li>
          <li>
            Click <strong>Manage</strong> next to Webhook fields and subscribe to{' '}
            <code className='rounded bg-muted px-1.5 py-0.5 text-xs'>messages</code>.
          </li>
        </ol>
      </InstructionsSection>

      <Alert className='rounded-lg border-border/60'>
        <Network className='h-4 w-4' />
        <AlertTitle className='font-semibold text-sm'>Requirements</AlertTitle>
        <AlertDescription>
          <ul className='mt-1.5 list-outside list-disc space-y-1 pl-4'>
            <li>Your Zelaxy webhook URL must use HTTPS and be publicly accessible.</li>
            <li>Self-signed SSL certificates are not supported by WhatsApp.</li>
            <li>For local testing, use a tunneling service like ngrok or Cloudflare Tunnel.</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  )
}
