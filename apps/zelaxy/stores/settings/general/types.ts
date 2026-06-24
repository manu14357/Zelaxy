/** Email opt-OUT flags as stored in the DB (`true` = unsubscribed from that category). */
export interface EmailPreferences {
  unsubscribeAll?: boolean
  unsubscribeMarketing?: boolean
  unsubscribeUpdates?: boolean
  unsubscribeNotifications?: boolean
}

export interface General {
  isAutoConnectEnabled: boolean
  isAutoPanEnabled: boolean
  isConsoleExpandedByDefault: boolean
  isDebugModeEnabled: boolean
  theme: 'system' | 'light' | 'dark'
  telemetryEnabled: boolean
  telemetryNotifiedUser: boolean
  emailPreferences: EmailPreferences
  // Local preferences (persisted to localStorage; no server field yet).
  timezone: string
  autoSave: boolean
  confirmations: boolean
  isLoading: boolean
  error: string | null
  // Individual loading states for optimistic updates
  isAutoConnectLoading: boolean
  isAutoPanLoading: boolean
  isConsoleExpandedByDefaultLoading: boolean
  isThemeLoading: boolean
  isTelemetryLoading: boolean
}

export interface GeneralActions {
  toggleAutoConnect: () => Promise<void>

  toggleAutoPan: () => Promise<void>
  toggleConsoleExpandedByDefault: () => Promise<void>
  toggleDebugMode: () => void
  setTheme: (theme: 'system' | 'light' | 'dark') => Promise<void>
  setTelemetryEnabled: (enabled: boolean) => Promise<void>
  setTelemetryNotifiedUser: (notified: boolean) => void
  setEmailPreference: (key: keyof EmailPreferences, value: boolean) => Promise<void>
  setTimezone: (timezone: string) => void
  setAutoSave: (enabled: boolean) => void
  setConfirmations: (enabled: boolean) => void
  loadSettings: (force?: boolean) => Promise<void>
  updateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => Promise<void>
}

export type GeneralStore = General & GeneralActions

export type UserSettings = {
  theme: 'system' | 'light' | 'dark'
  autoConnect: boolean
  autoPan: boolean
  consoleExpandedByDefault: boolean
  telemetryEnabled: boolean
  telemetryNotifiedUser: boolean
  emailPreferences: EmailPreferences
}
