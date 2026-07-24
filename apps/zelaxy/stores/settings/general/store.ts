import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { createLogger } from '@/lib/logs/console/logger'
import { createSafeStorage } from '@/stores/safe-storage'
import type { General, GeneralStore, UserSettings } from '@/stores/settings/general/types'

const logger = createLogger('GeneralStore')

const CACHE_TIMEOUT = 5000
const MAX_ERROR_RETRIES = 2

export const useGeneralStore = create<GeneralStore>()(
  devtools(
    persist(
      (set, get) => {
        let lastLoadTime = 0
        let errorRetryCount = 0

        const store: General = {
          isAutoConnectEnabled: true,
          isAutoPanEnabled: true,
          isConsoleExpandedByDefault: true,
          isDebugModeEnabled: false,
          theme: 'system' as const,
          telemetryEnabled: false,
          telemetryNotifiedUser: true,
          emailPreferences: {},
          timezone: 'UTC',
          autoSave: true,
          confirmations: true,
          isLoading: false,
          error: null,
          // Individual loading states
          isAutoConnectLoading: false,
          isAutoPanLoading: false,
          isConsoleExpandedByDefaultLoading: false,
          isThemeLoading: false,
          isTelemetryLoading: false,
        }

        // Optimistic update helper
        const updateSettingOptimistic = async <K extends keyof UserSettings>(
          key: K,
          value: UserSettings[K],
          loadingKey: keyof General,
          stateKey: keyof General
        ) => {
          // Prevent multiple simultaneous updates
          if ((get() as any)[loadingKey]) return

          const originalValue = (get() as any)[stateKey]

          // Optimistic update
          set({ [stateKey]: value, [loadingKey]: true } as any)

          try {
            await get().updateSetting(key, value)
            set({ [loadingKey]: false } as any)
          } catch (error) {
            // Rollback on error
            set({ [stateKey]: originalValue, [loadingKey]: false } as any)
            logger.error(`Failed to update ${String(key)}, rolled back:`, error)
          }
        }

        return {
          ...store,
          // Basic Actions with optimistic updates
          toggleAutoConnect: async () => {
            if (get().isAutoConnectLoading) return
            const newValue = !get().isAutoConnectEnabled
            await updateSettingOptimistic(
              'autoConnect',
              newValue,
              'isAutoConnectLoading',
              'isAutoConnectEnabled'
            )
          },

          toggleAutoPan: async () => {
            if (get().isAutoPanLoading) return
            const newValue = !get().isAutoPanEnabled
            await updateSettingOptimistic(
              'autoPan',
              newValue,
              'isAutoPanLoading',
              'isAutoPanEnabled'
            )
          },

          toggleConsoleExpandedByDefault: async () => {
            if (get().isConsoleExpandedByDefaultLoading) return
            const newValue = !get().isConsoleExpandedByDefault
            await updateSettingOptimistic(
              'consoleExpandedByDefault',
              newValue,
              'isConsoleExpandedByDefaultLoading',
              'isConsoleExpandedByDefault'
            )
          },

          toggleDebugMode: () => {
            set({ isDebugModeEnabled: !get().isDebugModeEnabled })
          },

          setTheme: async (theme) => {
            // Apply the theme to the UI INSTANTLY and persist in the background. The switch must
            // never be gated by the settings API (it can take seconds) — gating it behind
            // `isThemeLoading` made the theme feel stuck and blocked rapid re-clicks.
            //
            // Also never roll the visible theme back if the persist fails or is slow: a flaky
            // request used to silently revert the user's just-picked theme several seconds later,
            // which read as "the theme switch doesn't work." The choice still persists to
            // localStorage via this store's persist middleware, so it survives a reload even if
            // the server sync failed — the background persist can simply retry/catch up later.
            set({ theme })
            try {
              await get().updateSetting('theme', theme)
            } catch (error) {
              logger.error('Failed to persist theme to the server (kept locally):', error)
            }
          },

          setTelemetryEnabled: async (enabled) => {
            // Apply instantly + persist in the background (never gate the toggle on the API).
            const previous = get().telemetryEnabled
            set({ telemetryEnabled: enabled })
            try {
              await get().updateSetting('telemetryEnabled', enabled)
            } catch (error) {
              if (get().telemetryEnabled === enabled) set({ telemetryEnabled: previous })
              logger.error('Failed to persist telemetry setting, rolled back:', error)
            }
          },

          setTelemetryNotifiedUser: (notified) => {
            set({ telemetryNotifiedUser: notified })
            get().updateSetting('telemetryNotifiedUser', notified)
          },

          setEmailPreference: async (key, value) => {
            // Apply instantly, persist the FULL preferences object (the PATCH replaces it).
            const previous = get().emailPreferences
            const next = { ...previous, [key]: value }
            set({ emailPreferences: next })
            try {
              await get().updateSetting('emailPreferences', next)
            } catch (error) {
              set({ emailPreferences: previous })
              logger.error('Failed to persist email preference, rolled back:', error)
            }
          },

          // Local-only preferences — persisted to localStorage via the persist middleware (no server
          // field yet), so the choice survives reloads even though it isn't synced server-side.
          setTimezone: (timezone) => set({ timezone }),
          setAutoSave: (autoSave) => set({ autoSave }),
          setConfirmations: (confirmations) => set({ confirmations }),

          // API Actions
          loadSettings: async (force = false) => {
            // Skip loading if on a subdomain or chat path
            if (
              typeof window !== 'undefined' &&
              (window.location.pathname.startsWith('/chat/') ||
                (window.location.hostname !== 'zelaxy.in' &&
                  window.location.hostname !== 'localhost' &&
                  window.location.hostname !== '127.0.0.1' &&
                  !window.location.hostname.startsWith('www.')))
            ) {
              logger.debug('Skipping settings load - on chat or subdomain page')
              return
            }

            // Skip loading if settings were recently loaded (within 5 seconds)
            const now = Date.now()
            if (!force && now - lastLoadTime < CACHE_TIMEOUT) {
              logger.debug('Skipping settings load - recently loaded')
              return
            }

            try {
              set({ isLoading: true, error: null })

              const response = await fetch('/api/users/me/settings')

              if (!response.ok) {
                throw new Error('Failed to fetch settings')
              }

              const { data } = await response.json()

              set({
                isAutoConnectEnabled: data.autoConnect,
                isAutoPanEnabled: data.autoPan ?? true, // Default to true if undefined
                isConsoleExpandedByDefault: data.consoleExpandedByDefault ?? true, // Default to true if undefined
                theme: data.theme,
                telemetryEnabled: data.telemetryEnabled,
                telemetryNotifiedUser: data.telemetryNotifiedUser,
                emailPreferences: data.emailPreferences ?? {},
                isLoading: false,
              })

              lastLoadTime = now
              errorRetryCount = 0
            } catch (error) {
              logger.error('Error loading settings:', error)
              set({
                error: error instanceof Error ? error.message : 'Unknown error',
                isLoading: false,
              })
            }
          },

          updateSetting: async (key, value) => {
            if (
              typeof window !== 'undefined' &&
              (window.location.pathname.startsWith('/chat/') ||
                (window.location.hostname !== 'zelaxy.in' &&
                  window.location.hostname !== 'localhost' &&
                  window.location.hostname !== '127.0.0.1' &&
                  !window.location.hostname.startsWith('www.')))
            ) {
              logger.debug(`Skipping setting update for ${key} on chat or subdomain page`)
              return
            }

            try {
              const response = await fetch('/api/users/me/settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [key]: value }),
              })

              if (!response.ok) {
                throw new Error(`Failed to update setting: ${key}`)
              }

              set({ error: null })
              lastLoadTime = Date.now()
              errorRetryCount = 0
            } catch (error) {
              logger.error(`Error updating setting ${key}:`, error)
              set({ error: error instanceof Error ? error.message : 'Unknown error' })

              // Don't auto-retry on individual setting updates to avoid conflicts
              throw error
            }
          },
        }
      },
      {
        name: 'general-settings',
        storage: createSafeStorage(),
      }
    ),
    { name: 'general-store' }
  )
)
