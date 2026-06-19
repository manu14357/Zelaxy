import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

export interface FileAttachmentForApi {
  name: string
  type: string
  url: string
  size?: number
}

export interface ChatContext {
  id: string
  type: string
  name: string
  content?: string
}

export interface DraftPayload {
  text: string
  fileAttachments?: FileAttachmentForApi[]
  contexts?: ChatContext[]
}

interface ZelaxyarenaDraftsState {
  drafts: Record<string, DraftPayload>
  setDraft: (key: string, payload: DraftPayload) => void
  clearDraft: (key: string) => void
}

function isEmpty(payload: DraftPayload): boolean {
  return !payload.text && !payload.fileAttachments?.length && !payload.contexts?.length
}

export const useZelaxyarenaDraftsStore = create<ZelaxyarenaDraftsState>()(
  devtools(
    persist(
      (set) => ({
        drafts: {},
        setDraft: (key, payload) =>
          set((s) => {
            if (isEmpty(payload)) {
              if (!(key in s.drafts)) return s
              const { [key]: _, ...rest } = s.drafts
              return { drafts: rest }
            }
            return { drafts: { ...s.drafts, [key]: payload } }
          }),
        clearDraft: (key) =>
          set((s) => {
            if (!(key in s.drafts)) return s
            const { [key]: _, ...rest } = s.drafts
            return { drafts: rest }
          }),
      }),
      {
        name: 'zelaxyarena-drafts:v1',
        partialize: (state) => ({ drafts: state.drafts }),
      }
    ),
    { name: 'zelaxyarena-drafts-store' }
  )
)
