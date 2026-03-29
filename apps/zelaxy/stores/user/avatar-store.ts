import { create } from 'zustand'

interface AvatarStore {
  /** Override avatar URL — set when user changes avatar in settings */
  avatarUrl: string | null
  setAvatarUrl: (url: string) => void
  clearAvatarUrl: () => void
}

export const useAvatarStore = create<AvatarStore>((set) => ({
  avatarUrl: null,
  setAvatarUrl: (url) => set({ avatarUrl: url }),
  clearAvatarUrl: () => set({ avatarUrl: null }),
}))
