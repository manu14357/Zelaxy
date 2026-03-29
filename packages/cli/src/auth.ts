import { ZelaxyClient } from 'zelaxy-ts-sdk'
import { getActiveProfile, setActiveProfile, setProfile, type ZelaxyProfile } from './config.js'

const DEFAULT_BASE_URL = 'http://localhost:3000'

export function getClient(): ZelaxyClient {
  const profile = getActiveProfile()
  if (!profile) {
    throw new Error('Not authenticated. Run `zelaxy auth login` first.')
  }
  return new ZelaxyClient({
    apiKey: profile.apiKey,
    baseUrl: profile.baseUrl,
  })
}

export function getClientFromKey(apiKey: string, baseUrl?: string): ZelaxyClient {
  return new ZelaxyClient({
    apiKey,
    baseUrl: baseUrl || DEFAULT_BASE_URL,
  })
}

export async function loginWithApiKey(
  apiKey: string,
  baseUrl: string = DEFAULT_BASE_URL,
  profileName = 'default'
): Promise<{ user: any; profile: ZelaxyProfile }> {
  const client = new ZelaxyClient({ apiKey, baseUrl })

  // Validate the key by fetching the current user
  const user = await client.auth.me()

  const profile: ZelaxyProfile = {
    name: profileName,
    apiKey,
    baseUrl,
  }

  setProfile(profileName, profile)
  setActiveProfile(profileName)

  return { user, profile }
}

export function isAuthenticated(): boolean {
  return getActiveProfile() !== null
}
