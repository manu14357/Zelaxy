import { describe, expect, it } from 'vitest'
import { getBlockDocsUrl, getDocsUrl } from '@/lib/docs-url'

describe('getBlockDocsUrl', () => {
  it('uses the raw underscored type for the blocks category (docs pages are filed unhyphenated)', () => {
    expect(getBlockDocsUrl('human_in_the_loop', 'blocks')).toBe(
      'https://docs.zelaxy.in/docs/blocks/human_in_the_loop'
    )
    expect(getBlockDocsUrl('workflow_input', 'blocks')).toBe(
      'https://docs.zelaxy.in/docs/blocks/workflow_input'
    )
  })

  it('hyphenates the type for the tools category', () => {
    expect(getBlockDocsUrl('google_sheets', 'tools')).toBe(
      'https://docs.zelaxy.in/docs/tools/google-sheets'
    )
  })

  it('hyphenates the type for the triggers category', () => {
    expect(getBlockDocsUrl('generic_webhook', 'triggers')).toBe(
      'https://docs.zelaxy.in/docs/triggers/generic-webhook'
    )
  })

  it('applies the explicit slug override for twilio_sms regardless of category', () => {
    expect(getBlockDocsUrl('twilio_sms', 'tools')).toBe('https://docs.zelaxy.in/docs/tools/twilio')
  })

  it('returns null for blocks with no documentation page', () => {
    expect(getBlockDocsUrl('smtp', 'tools')).toBeNull()
  })

  it('leaves single-word types untouched by the hyphenation step', () => {
    expect(getBlockDocsUrl('agent', 'blocks')).toBe('https://docs.zelaxy.in/docs/blocks/agent')
  })
})

describe('getDocsUrl', () => {
  it('returns the docs root URL', () => {
    expect(getDocsUrl()).toBe('https://docs.zelaxy.in/docs')
  })
})
