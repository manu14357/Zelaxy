import { DocumentIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'

export const DocusignBlock: BlockConfig = {
  type: 'docusign',
  name: 'DocuSign',
  description: 'Send envelopes and manage signing in DocuSign',
  longDescription:
    'Integrate DocuSign e-signature into your workflows. Create and send envelopes for signing, get envelope status, and list envelopes.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#FFBE0F',
  icon: DocumentIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Create Envelope', id: 'docusign_create_envelope' },
        { label: 'Get Envelope', id: 'docusign_get_envelope' },
        { label: 'List Envelopes', id: 'docusign_list_envelopes' },
        { label: 'Send Envelope', id: 'docusign_send_envelope' },
        { label: 'Get Signing URL', id: 'docusign_get_signing_url' },
        { label: 'Void Envelope', id: 'docusign_void_envelope' },
      ],
      required: true,
    },
    {
      id: 'credential',
      title: 'DocuSign Account',
      type: 'oauth-input',
      layout: 'full',
      provider: 'docusign',
    },
    {
      id: 'accountId',
      title: 'Account ID',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Your DocuSign account ID',
      required: true,
    },
    {
      id: 'emailSubject',
      title: 'Email Subject',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Please sign this document',
      condition: {
        field: 'operation',
        value: ['docusign_create_envelope', 'docusign_send_envelope'],
      },
    },
    {
      id: 'envelopeId',
      title: 'Envelope ID',
      type: 'short-input',
      layout: 'full',
      placeholder: 'envelope-id',
      condition: {
        field: 'operation',
        value: [
          'docusign_get_envelope',
          'docusign_send_envelope',
          'docusign_get_signing_url',
          'docusign_void_envelope',
        ],
      },
    },
  ],
  tools: {
    access: [
      'docusign_create_envelope',
      'docusign_get_envelope',
      'docusign_list_envelopes',
      'docusign_send_envelope',
      'docusign_get_signing_url',
      'docusign_void_envelope',
    ],
    config: {
      tool: (params) => params.operation || 'docusign_list_envelopes',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    oauthCredential: { type: 'string', description: 'OAuth credential' },
    accountId: { type: 'string', description: 'Account ID' },
    emailSubject: { type: 'string', description: 'Email subject' },
    envelopeId: { type: 'string', description: 'Envelope ID' },
  },
  outputs: {
    envelopeId: { type: 'string', description: 'Envelope ID' },
    status: { type: 'string', description: 'Envelope status' },
    signingUrl: { type: 'string', description: 'Signing URL' },
  },
}
