import { Info } from 'lucide-react'
import {
  Button,
  Input,
  Label,
  Skeleton,
  Switch,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui'
import {
  ConfigField,
  ConfigSection,
  InstructionsSection,
  WebhookConfigField,
  TestResultDisplay as WebhookTestResult,
} from '@/app/arena/[workspaceId]/zelaxy/[workflowId]/components/workflow-block/components/sub-block/components/webhook/components'

interface AirtableConfigProps {
  baseId: string
  setBaseId: (value: string) => void
  tableId: string
  setTableId: (value: string) => void
  includeCellValues: boolean
  setIncludeCellValues: (value: boolean) => void
  isLoadingToken: boolean
  testResult: any // Define a more specific type if possible
  copied: string | null
  copyToClipboard: (text: string, type: string) => void
  testWebhook?: () => void // Optional test function
  webhookId?: string // Webhook ID to enable testing
  webhookUrl: string // Added webhook URL
}

export function AirtableConfig({
  baseId,
  setBaseId,
  tableId,
  setTableId,
  includeCellValues,
  setIncludeCellValues,
  isLoadingToken,
  testResult,
  copied,
  copyToClipboard,
  testWebhook,
  webhookId,
  webhookUrl,
}: AirtableConfigProps) {
  return (
    <div className='space-y-4'>
      <ConfigSection title='Airtable Configuration'>
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

        <ConfigField
          id='airtable-base-id'
          label='Base ID *'
          description='The ID of the Airtable Base this webhook will monitor.'
        >
          {isLoadingToken ? (
            <Skeleton className='h-10 w-full' />
          ) : (
            <Input
              id='airtable-base-id'
              value={baseId}
              onChange={(e) => setBaseId(e.target.value)}
              placeholder='appXXXXXXXXXXXXXX'
              required
            />
          )}
        </ConfigField>

        <ConfigField
          id='airtable-table-id'
          label='Table ID *'
          description='The ID of the table within the Base that the webhook will monitor.'
        >
          {isLoadingToken ? (
            <Skeleton className='h-10 w-full' />
          ) : (
            <Input
              id='airtable-table-id'
              value={tableId}
              onChange={(e) => setTableId(e.target.value)}
              placeholder='tblXXXXXXXXXXXXXX'
              required
            />
          )}
        </ConfigField>

        <div className='flex items-center justify-between rounded-lg border border-border bg-background p-3 shadow-sm'>
          <div className='flex items-center gap-2'>
            <Label htmlFor='include-cell-values' className='font-normal'>
              Include Full Record Data
            </Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-6 w-6 p-1 text-gray-500'
                  aria-label='Learn more about including full record data'
                >
                  <Info className='h-4 w-4' />
                </Button>
              </TooltipTrigger>
              <TooltipContent
                side='right'
                align='center'
                className='z-[100] max-w-[300px] p-3'
                role='tooltip'
              >
                <p className='text-sm'>
                  Enable to receive the complete record data in the payload, not just changes.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          {isLoadingToken ? (
            <Skeleton className='h-5 w-9' />
          ) : (
            <Switch
              id='include-cell-values'
              checked={includeCellValues}
              onCheckedChange={setIncludeCellValues}
              disabled={isLoadingToken}
            />
          )}
        </div>
      </ConfigSection>

      {testResult && (
        <WebhookTestResult
          testResult={testResult}
          copied={copied}
          copyToClipboard={copyToClipboard}
        />
      )}

      <InstructionsSection tip='Find your Base ID and Table ID in the Airtable URL: airtable.com/appXXXX/tblXXXX/...'>
        <ol className='list-inside list-decimal space-y-2'>
          <li>
            Open your Airtable base — the URL will look like{' '}
            <code className='rounded bg-muted px-1.5 py-0.5 text-xs'>
              airtable.com/<strong>appXXXXXX</strong>/<strong>tblXXXXXX</strong>/...
            </code>
          </li>
          <li>
            Copy the <strong>Base ID</strong> (starts with{' '}
            <code className='rounded bg-muted px-1.5 py-0.5 text-xs'>app</code>) and{' '}
            <strong>Table ID</strong> (starts with{' '}
            <code className='rounded bg-muted px-1.5 py-0.5 text-xs'>tbl</code>) from the URL.
          </li>
          <li>Paste them into the fields above.</li>
          <li>
            Click <strong>Save Changes</strong> — Zelaxy will automatically register the webhook
            with Airtable.
          </li>
          <li>
            Any changes to records in the specified table will trigger this workflow. If{' '}
            <strong>Include Full Record Data</strong> is enabled, the entire record is sent;
            otherwise, only changed fields.
          </li>
        </ol>
      </InstructionsSection>
    </div>
  )
}
