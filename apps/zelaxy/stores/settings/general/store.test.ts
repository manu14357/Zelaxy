import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useGeneralStore } from '@/stores/settings/general/store'

describe('useGeneralStore.setTheme', () => {
  beforeEach(() => {
    useGeneralStore.setState({ theme: 'system' })
    vi.stubGlobal('fetch', vi.fn())
  })

  it('applies the theme immediately, before the persist request resolves', async () => {
    let resolveFetch: (value: Response) => void = () => {}
    ;(fetch as any).mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = resolve
      })
    )

    const promise = useGeneralStore.getState().setTheme('dark')

    // The theme must already be applied synchronously - the switch is never
    // gated behind the network request.
    expect(useGeneralStore.getState().theme).toBe('dark')

    resolveFetch(new Response(JSON.stringify({ success: true }), { status: 200 }))
    await promise
    expect(useGeneralStore.getState().theme).toBe('dark')
  })

  it('does NOT roll the theme back when the persist request fails', async () => {
    ;(fetch as any).mockRejectedValue(new Error('network error'))

    await useGeneralStore.getState().setTheme('dark')

    // A failed/slow persist must never silently revert the user's choice -
    // this is exactly the "select dark, it reverts back to light a few
    // seconds later" bug: rolling back on failure made the switch look broken.
    expect(useGeneralStore.getState().theme).toBe('dark')
  })

  it('does NOT roll the theme back when the server responds with an error status', async () => {
    ;(fetch as any).mockResolvedValue(
      new Response(JSON.stringify({ error: 'oops' }), { status: 500 })
    )

    await useGeneralStore.getState().setTheme('dark')

    expect(useGeneralStore.getState().theme).toBe('dark')
  })

  it('sends the new theme to the settings endpoint', async () => {
    ;(fetch as any).mockResolvedValue(
      new Response(JSON.stringify({ success: true }), { status: 200 })
    )

    await useGeneralStore.getState().setTheme('light')

    expect(fetch).toHaveBeenCalledWith(
      '/api/users/me/settings',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ theme: 'light' }),
      })
    )
  })
})
