import Conf from 'conf'

export interface ZelaxyProfile {
  name: string
  apiKey: string
  baseUrl: string
  organizationId?: string
  workspaceId?: string
}

interface ConfigSchema {
  activeProfile: string
  profiles: Record<string, ZelaxyProfile>
}

const config = new Conf<ConfigSchema>({
  projectName: 'zelaxy',
  defaults: {
    activeProfile: 'default',
    profiles: {},
  },
})

export function getActiveProfile(): ZelaxyProfile | null {
  const name = config.get('activeProfile')
  const profiles = config.get('profiles')
  return profiles[name] || null
}

export function getProfile(name: string): ZelaxyProfile | null {
  const profiles = config.get('profiles')
  return profiles[name] || null
}

export function setProfile(name: string, profile: ZelaxyProfile): void {
  const profiles = config.get('profiles')
  profiles[name] = profile
  config.set('profiles', profiles)
}

export function deleteProfile(name: string): void {
  const profiles = config.get('profiles')
  delete profiles[name]
  config.set('profiles', profiles)
  if (config.get('activeProfile') === name) {
    const remaining = Object.keys(profiles)
    config.set('activeProfile', remaining[0] || 'default')
  }
}

export function setActiveProfile(name: string): void {
  config.set('activeProfile', name)
}

export function listProfiles(): Record<string, ZelaxyProfile> {
  return config.get('profiles')
}

export function getActiveProfileName(): string {
  return config.get('activeProfile')
}

export function getConfigValue(key: string): unknown {
  return config.get(key as keyof ConfigSchema)
}

export function setConfigValue(key: string, value: unknown): void {
  config.set(key as keyof ConfigSchema, value as any)
}

export function getConfigPath(): string {
  return config.path
}

export function clearConfig(): void {
  config.clear()
}
