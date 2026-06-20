import { TextractIcon } from '@/components/icons/textract-icon'
import type { BlockConfig } from '@/blocks/types'
import type { TextractResponse } from '@/tools/textract/types'

export const TextractBlock: BlockConfig<TextractResponse> = {
  type: 'textract',
  name: 'Amazon Textract',
  description: 'Extract text, tables, and forms from documents with Amazon Textract',
  longDescription:
    'Use Amazon Textract to detect text or analyze tables and forms in documents stored in Amazon S3. Authenticate with AWS access key credentials (SigV4 signed).',
  docsLink: '#',
  category: 'tools',
  bgColor: '#FF9900',
  icon: TextractIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Detect document text', id: 'textract_detect_document_text' },
        { label: 'Analyze document', id: 'textract_analyze_document' },
      ],
      value: () => 'textract_detect_document_text',
    },
    {
      id: 's3Bucket',
      title: 'S3 Bucket',
      type: 'short-input',
      layout: 'half',
      placeholder: 'my-bucket',
      condition: {
        field: 'operation',
        value: ['textract_detect_document_text', 'textract_analyze_document'],
      },
    },
    {
      id: 's3Name',
      title: 'S3 Object Name',
      type: 'short-input',
      layout: 'half',
      placeholder: 'path/to/document.pdf',
      condition: {
        field: 'operation',
        value: ['textract_detect_document_text', 'textract_analyze_document'],
      },
    },
    {
      id: 'featureTypes',
      title: 'Feature Types',
      type: 'long-input',
      layout: 'full',
      placeholder: '["TABLES","FORMS"]',
      condition: { field: 'operation', value: 'textract_analyze_document' },
    },
    {
      id: 'awsRegion',
      title: 'AWS Region',
      type: 'short-input',
      layout: 'half',
      placeholder: 'us-east-1',
      required: true,
    },
    {
      id: 'awsAccessKeyId',
      title: 'AWS Access Key ID',
      type: 'short-input',
      layout: 'half',
      password: true,
      required: true,
    },
    {
      id: 'awsSecretAccessKey',
      title: 'AWS Secret Access Key',
      type: 'short-input',
      layout: 'full',
      password: true,
      required: true,
    },
  ],
  tools: {
    access: ['textract_detect_document_text', 'textract_analyze_document'],
    config: {
      tool: (params) => params.operation || 'textract_detect_document_text',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    awsRegion: { type: 'string', description: 'AWS region' },
    awsAccessKeyId: { type: 'string', description: 'AWS access key ID' },
    awsSecretAccessKey: { type: 'string', description: 'AWS secret access key' },
    s3Bucket: { type: 'string', description: 'S3 bucket name' },
    s3Name: { type: 'string', description: 'S3 object name' },
    featureTypes: { type: 'json', description: 'Feature types to analyze' },
  },
  outputs: {
    data: { type: 'json', description: 'Textract API response' },
  },
}
