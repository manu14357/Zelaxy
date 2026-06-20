/**
 * Multimodal attachment helpers.
 *
 * Converts the provider-agnostic `ProviderAttachment[]` (images) into each provider's native
 * message-content shape, and injects them into the latest user message so vision-capable models
 * actually receive the image bytes (rather than just a filename reference).
 */

import type { ProviderAttachment } from '@/providers/types'

const isHttpUrl = (data: string) => /^https?:\/\//i.test(data)

/** OpenAI / OpenAI-compatible chat format: `{ type:'image_url', image_url:{ url } }` parts. */
export function toOpenAIImageParts(attachments: ProviderAttachment[]): any[] {
  return attachments
    .filter((a) => a.type === 'image')
    .map((a) => ({
      type: 'image_url',
      image_url: {
        url: isHttpUrl(a.data) ? a.data : `data:${a.mediaType};base64,${a.data}`,
      },
    }))
}

/** Anthropic format: `{ type:'image', source:{ type:'base64'|'url', ... } }` blocks. */
export function toAnthropicImageBlocks(attachments: ProviderAttachment[]): any[] {
  return attachments
    .filter((a) => a.type === 'image')
    .map((a) =>
      isHttpUrl(a.data)
        ? { type: 'image', source: { type: 'url', url: a.data } }
        : { type: 'image', source: { type: 'base64', media_type: a.mediaType, data: a.data } }
    )
}

/** Google Gemini format: `{ inline_data:{ mime_type, data } }` (base64) parts. */
export function toGoogleImageParts(attachments: ProviderAttachment[]): any[] {
  return attachments
    .filter((a) => a.type === 'image' && !isHttpUrl(a.data))
    .map((a) => ({ inline_data: { mime_type: a.mediaType, data: a.data } }))
}

/**
 * Append image parts to the LAST user message in an OpenAI-style message array, converting its
 * string content to a parts array. No-op when there are no image attachments.
 */
export function attachImagesToOpenAIMessages(
  messages: any[],
  attachments?: ProviderAttachment[]
): void {
  const parts = attachments?.length ? toOpenAIImageParts(attachments) : []
  if (parts.length === 0) return
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]?.role === 'user') {
      const text = typeof messages[i].content === 'string' ? messages[i].content : ''
      messages[i] = {
        ...messages[i],
        content: [...(text ? [{ type: 'text', text }] : []), ...parts],
      }
      return
    }
  }
}
