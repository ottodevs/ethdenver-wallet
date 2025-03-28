import { observable } from '@legendapp/state'

export type Theme = 'light' | 'dark' | 'system'

// Global application state
export const appState$ = observable({
    isLoading: true,
    error: null as string | null,
    theme: {
        current: 'system' as Theme,
        // Get the effective theme (dark or light) based on system preference
        effective: () => {
            const theme = appState$.theme.current.get()
            if (theme !== 'system') return theme

            // Default to dark theme during SSR
            if (typeof window === 'undefined') return 'dark'
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
        },
    },
})

// Initialize theme from localStorage and watch for system changes
if (typeof window !== 'undefined') {
    // Get stored theme preference
    const storedTheme = localStorage.getItem('theme') as Theme | null
    if (storedTheme) {
        appState$.theme.current.set(storedTheme)
    }

    // Watch for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const updateSystemTheme = () => {
        if (appState$.theme.current.get() === 'system') {
            // Force a recompute of effective theme
            appState$.theme.current.set('system')
        }
    }
    mediaQuery.addEventListener('change', updateSystemTheme)
}

// Theme management functions
export const themeActions = {
    /** Set theme and save to localStorage */
    setTheme: (theme: Theme) => {
        appState$.theme.current.set(theme)
        localStorage.setItem('theme', theme)
    },

    /** Toggle between system -> light -> dark -> system */
    toggleTheme: () => {
        const current = appState$.theme.current.get()

        // Cycle through themes
        const nextTheme: Theme = current === 'system' ? 'light' : current === 'light' ? 'dark' : 'system'

        themeActions.setTheme(nextTheme)
        return nextTheme
    },

    /** Get current theme mode */
    getThemeMode: () => {
        return {
            current: appState$.theme.current.get(),
            effective: appState$.theme.effective.get(),
        }
    },
}
