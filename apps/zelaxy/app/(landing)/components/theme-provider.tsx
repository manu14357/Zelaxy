'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

type Theme = 'dark' | 'light' | 'system'

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: 'dark' | 'light'
}

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
  resolvedTheme: 'light',
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

function resolveTheme(theme: Theme): 'dark' | 'light' {
  if (theme === 'system') {
    if (typeof window === 'undefined') return 'light'
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return theme
}

function applyThemeToDOM(resolved: 'dark' | 'light') {
  const root = document.documentElement
  root.classList.remove('light', 'dark')
  root.classList.add(resolved)
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'zelaxy-theme',
  ...props
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme)
  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>('light')
  const initialized = useRef(false)

  // Single effect: read stored preference on mount, then apply theme to DOM
  useEffect(() => {
    let activeTheme = theme

    if (!initialized.current) {
      initialized.current = true
      try {
        const stored = localStorage.getItem(storageKey) as Theme | null
        if (stored && (stored === 'dark' || stored === 'light' || stored === 'system')) {
          activeTheme = stored
          setThemeState(stored)
        }
      } catch {}
    }

    const resolved = resolveTheme(activeTheme)
    applyThemeToDOM(resolved)
    setResolvedTheme(resolved)
  }, [theme, storageKey])

  const setTheme = useCallback(
    (newTheme: Theme) => {
      try {
        localStorage.setItem(storageKey, newTheme)
      } catch {}
      // Apply immediately to DOM so there's zero delay
      const resolved = resolveTheme(newTheme)
      applyThemeToDOM(resolved)
      setResolvedTheme(resolved)
      setThemeState(newTheme)
    },
    [storageKey]
  )

  const value = { theme, setTheme, resolvedTheme }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)
  if (context === undefined) throw new Error('useTheme must be used within a ThemeProvider')
  return context
}
