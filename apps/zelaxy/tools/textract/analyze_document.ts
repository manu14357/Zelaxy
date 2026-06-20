import { awsJsonHeaders } from '@/lib/aws/sigv4'
import type { TextractAnalyzeDocumentParams, TextractResponse } from '@/tools/textract/types'
import type { ToolConfig } from '@/tools/types'

const buildPayload = (p: TextractAnalyzeDocumentParams) => ({
  Document: { S3Object: { Bucket: p.s3Bucket, Name: p.s3Name } },
  FeatureTypes: p.featureTypes ?? ['TABLES', 'FORMS'],
})

export const analyzeDocumentTool: ToolConfig<TextractAnalyzeDocumentParams, TextractResponse> = {
  id: 'textract_analyze_document',
  name: 'Textract Analyze Document',
  description: 'Analyze a document in S3 for tables, forms, and other features',
  version: '1.0.0',

  params: {
    awsRegion: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'AWS region (e.g. us-east-1)',
    },
    awsAccessKeyId: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'AWS access key ID',
    },
    awsSecretAccessKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'AWS secret access key',
    },
    s3Bucket: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'S3 bucket containing the document',
    },
    s3Name: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'S3 object key (name) of the document',
    },
    featureTypes: {
      type: 'json',
      required: false,
      visibility: 'user-or-llm',
      description: 'Feature types to analyze (e.g. ["TABLES","FORMS"])',
    },
  },

  request: {
    url: (p) => `https://textract.${p.awsRegion}.amazonaws.com/`,
    method: 'POST',
    headers: (p) =>
      awsJsonHeaders({
        region: p.awsRegion,
        service: 'textract',
        target: 'Textract.AnalyzeDocument',
        accessKeyId: p.awsAccessKeyId,
        secretAccessKey: p.awsSecretAccessKey,
        jsonVersion: '1.1',
        body: JSON.stringify(buildPayload(p)),
      }),
    body: (p) => buildPayload(p),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return { success: true, output: { data } }
  },

  outputs: {
    data: { type: 'json', description: 'Textract AnalyzeDocument result (Blocks, …)' },
  },
}
