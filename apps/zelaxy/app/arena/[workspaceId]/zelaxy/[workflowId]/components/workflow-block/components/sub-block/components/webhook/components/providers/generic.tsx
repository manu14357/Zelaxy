import { Checkbox, Input, Label } from '@/components/ui'
import {
  ConfigField,
  ConfigSection,
  CopyableField,
  InstructionsSection,
  TestResultDisplay,
} from '@/app/arena/[workspaceId]/zelaxy/[workflowId]/components/workflow-block/components/sub-block/components/webhook/components'

interface GenericConfigProps {
  requireAuth: boolean
  setRequireAuth: (requireAuth: boolean) => void
  generalToken: string
  setGeneralToken: (token: string) => void
  secretHeaderName: string
  setSecretHeaderName: (headerName: string) => void
  allowedIps: string
  setAllowedIps: (ips: string) => void
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

export function GenericConfig({
  requireAuth,
  setRequireAuth,
  generalToken,
  setGeneralToken,
  secretHeaderName,
  setSecretHeaderName,
  allowedIps,
  setAllowedIps,
  isLoadingToken,
  testResult,
  copied,
  copyToClipboard,
}: GenericConfigProps) {
  return (
    <div className='space-y-4'>
      <ConfigSection title='Authentication'>
        <div className='flex items-center space-x-2'>
          <Checkbox
            id='require-auth'
            checked={requireAuth}
            onCheckedChange={(checked) => setRequireAuth(checked as boolean)}
            className='translate-y-[1px]' // Align checkbox better with label
          />
          <Label htmlFor='require-auth' className='cursor-pointer font-medium text-sm'>
            Require Authentication
          </Label>
        </div>

        {requireAuth && (
          <div className='ml-5 space-y-4 border-border border-l-2 pl-4 dark:border-border/50'>
            <ConfigField id='auth-token' label='Authentication Token'>
              <CopyableField
                id='auth-token'
                value={generalToken}
                onChange={setGeneralToken}
                placeholder='Enter an auth token'
                description='Used to authenticate requests via Bearer token or custom header.'
                isLoading={isLoadingToken}
                copied={copied}
                copyType='general-token'
                copyToClipboard={copyToClipboard}
              />
            </ConfigField>

            <ConfigField
              id='header-name'
              label='Secret Header Name (Optional)'
              description="Custom HTTP header name for the auth token (e.g., X-Secret-Key). If blank, use 'Authorization: Bearer TOKEN'."
            >
              <Input
                id='header-name'
                value={secretHeaderName}
                onChange={(e) => setSecretHeaderName(e.target.value)}
                placeholder='X-Secret-Key'
              />
            </ConfigField>
          </div>
        )}
      </ConfigSection>

      <ConfigSection title='Network'>
        <ConfigField
          id='allowed-ips'
          label='Allowed IP Addresses (Optional)'
          description='Comma-separated list of IP addresses allowed to access this webhook.'
        >
          <Input
            id='allowed-ips'
            value={allowedIps}
            onChange={(e) => setAllowedIps(e.target.value)}
            placeholder='192.168.1.1, 10.0.0.1'
          />
        </ConfigField>
      </ConfigSection>

      <TestResultDisplay
        testResult={testResult}
        copied={copied}
        copyToClipboard={copyToClipboard}
        showCurlCommand={true}
      />

      <InstructionsSection tip='Send an HTTP POST request with a JSON body to your webhook URL to trigger the workflow.'>
        <ol className='list-inside list-decimal space-y-2'>
          <li>
            Copy the <strong>Webhook URL</strong> shown above.
          </li>
          <li>
            Configure your external service to send{' '}
            <code className='rounded bg-muted px-1.5 py-0.5 text-xs'>HTTP POST</code> requests to
            this URL with a JSON body.
          </li>
          {requireAuth && (
            <li>
              Include your authentication token in the{' '}
              {secretHeaderName ? (
                <code className='rounded bg-muted px-1.5 py-0.5 text-xs'>
                  {secretHeaderName}: YOUR_TOKEN
                </code>
              ) : (
                <code className='rounded bg-muted px-1.5 py-0.5 text-xs'>
                  Authorization: Bearer YOUR_TOKEN
                </code>
              )}{' '}
              header.
            </li>
          )}
          <li>
            Example using curl:
            <pre className='mt-2 overflow-x-auto rounded-md bg-muted/50 p-3 font-mono text-xs leading-relaxed'>
              {`curl -X POST ${requireAuth ? `\\\n  -H "${secretHeaderName || 'Authorization'}: ${secretHeaderName ? 'YOUR_TOKEN' : 'Bearer YOUR_TOKEN'}" \\\n  ` : '\\'}
  -H "Content-Type: application/json" \\
  -d '{"message": "Hello from webhook!"}' \\
  YOUR_WEBHOOK_URL`}
            </pre>
          </li>
        </ol>
      </InstructionsSection>
    </div>
  )
}
