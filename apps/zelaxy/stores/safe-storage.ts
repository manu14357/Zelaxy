import { createJSONStorage, type StateStorage } from 'zustand/middleware'

/**
 * A no-op storage implementation for server-side environments
 * where localStorage is not available (e.g., BullMQ workers, Node.js).
 */
const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
}

/**
 * Returns a safe JSON storage that falls back to a no-op implementation
 * when localStorage is unavailable (server-side environments like BullMQ workers).
 *
 * This prevents the "storage.setItem is not a function" error that occurs when
 * Zustand's persist middleware tries to write to localStorage in non-browser contexts.
 */
export const createSafeStorage = () => {
  return createJSONStorage(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage
    }
    return noopStorage
  })
}
