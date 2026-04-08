import { ShieldCheck } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  InstructionsSection,
  TestResultDisplay,
} from '@/app/arena/[workspaceId]/zelaxy/[workflowId]/components/workflow-block/components/sub-block/components/webhook/components'

interface StripeConfigProps {
  isLoadingToken: boolean
  testResult: {
    success: boolean
    message?: string
    test?: any
  } | null
  copied: string | null
  copyToClipboard: (text: string, type: string) => void
}

export function StripeConfig({ testResult, copied, copyToClipboard }: StripeConfigProps) {
  return (
    <div className='space-y-4'>
      {/* No specific config fields for Stripe, just instructions */}

      <TestResultDisplay
        testResult={testResult}
        copied={copied}
        copyToClipboard={copyToClipboard}
        showCurlCommand={false} // Stripe requires signed requests, curl test not applicable here
      />

      <InstructionsSection tip='After adding the endpoint, Stripe sends a test event — check your webhook test results to confirm.'>
        <ol className='list-inside list-decimal space-y-2'>
          <li>
            Go to your{' '}
            <a
              href='https://dashboard.stripe.com/webhooks'
              target='_blank'
              rel='noopener noreferrer'
              className='link text-primary underline transition-colors hover:text-primary/80'
              onClick={(e) => {
                e.stopPropagation()
                window.open(
                  'https://dashboard.stripe.com/webhooks',
                  '_blank',
                  'noopener,noreferrer'
                )
                e.preventDefault()
              }}
            >
              Stripe Webhooks Dashboard
            </a>
            .
          </li>
          <li>
            Click <strong>Add endpoint</strong>.
          </li>
          <li>
            Paste the <strong>Webhook URL</strong> (from above) into the{' '}
            <strong>Endpoint URL</strong> field.
          </li>
          <li>
            Select the events you want to listen to, for example:
            <ul className='mt-1.5 ml-5 list-disc space-y-1'>
              <li>
                <code className='rounded bg-muted px-1.5 py-0.5 text-xs'>charge.succeeded</code> —
                when a payment succeeds
              </li>
              <li>
                <code className='rounded bg-muted px-1.5 py-0.5 text-xs'>invoice.paid</code> — when
                an invoice is paid
              </li>
              <li>
                <code className='rounded bg-muted px-1.5 py-0.5 text-xs'>
                  customer.subscription.created
                </code>{' '}
                — new subscription
              </li>
            </ul>
          </li>
          <li>
            Click <strong>Add endpoint</strong> to save.
          </li>
        </ol>
      </InstructionsSection>

      <Alert className='rounded-lg border-border/60'>
        <ShieldCheck className='h-4 w-4' />
        <AlertTitle className='font-semibold text-sm'>Webhook Signing</AlertTitle>
        <AlertDescription>
          For production use, verify Stripe webhook signatures to ensure requests are genuinely from
          Stripe. Zelaxy handles this automatically if you provide the signing secret during setup
          (coming soon).
        </AlertDescription>
      </Alert>
    </div>
  )
}
