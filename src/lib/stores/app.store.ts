import { computed, observable, observe } from '@legendapp/state'
import { ObservablePersistLocalStorage } from '@legendapp/state/persist-plugins/local-storage'
import { syncObservable } from '@legendapp/state/sync'

// Define the app state interface
interface AppState {
    ui: {
        theme: string
        isOnline: boolean
        modals: Record<string, unknown>
        notifications: unknown[]
        delegatedBannerDismissed: boolean
        delegationEnabled: boolean
        privacyMode: boolean
        activeTab: string
    }
    wallet: {
        selectedChain: string | null
        assets: Record<string, unknown>
        transactions: Record<string, unknown>
        pendingTransactions: Record<string, unknown>
    }
    auth: {
        session: unknown | null
        userKeys: unknown | null
        lastSync: number | null
    }
    sync: {
        pendingUpdates: Array<{
            type: string
            payload: unknown
            timestamp: number
            retryCount: number
        }>
        lastSyncAttempt: number | null
        syncErrors: string[]
    }
    isLoading: boolean
}

// Define the settings interface
interface Settings {
    theme: string
    privacyMode: boolean
    activeTab: string
    debugMode: boolean
}

// Global app state structure
export const appState$ = observable<AppState>({
    // UI State
    ui: {
        theme: 'dark',
        isOnline: true,
        modals: {},
        notifications: [],
        delegatedBannerDismissed: false,
        delegationEnabled: false,
        privacyMode: false,
        activeTab: 'assets',
    },

    // Wallet State
    wallet: {
        selectedChain: null,
        assets: {},
        transactions: {},
        pendingTransactions: {},
    },

    // Auth State
    auth: {
        session: null,
        userKeys: null,
        lastSync: null,
    },

    // Sync State
    sync: {
        pendingUpdates: [],
        lastSyncAttempt: null,
        syncErrors: [],
    },

    isLoading: false,
})

// Create a computed value for showBanner
const showBanner$ = computed(
    () => !appState$.ui.delegatedBannerDismissed.get() && !appState$.ui.delegationEnabled.get(),
)

// Settings observable (for backward compatibility)
export const settings$ = observable<Settings>({
    theme: appState$.ui.theme.get(),
    privacyMode: appState$.ui.privacyMode.get(),
    activeTab: appState$.ui.activeTab.get(),
    debugMode: false,
})

// Create a separate toggle function for privacyMode
export function togglePrivacyMode(): void {
    const newValue = !settings$.privacyMode.get()
    settings$.privacyMode.set(newValue)
    appState$.ui.privacyMode.set(newValue)
}

// Create a toggle function for debugMode
export function toggleDebugMode(): void {
    const newValue = !settings$.debugMode.get()
    settings$.debugMode.set(newValue)
}

// Set up sync between settings and appState
if (typeof window !== 'undefined') {
    // Sync settings theme with appState
    observe(() => {
        const theme = settings$.theme.get()
        if (theme !== appState$.ui.theme.get()) {
            appState$.ui.theme.set(theme)
        }
    })

    // Sync appState theme with settings
    observe(() => {
        const theme = appState$.ui.theme.get()
        if (theme !== settings$.theme.get()) {
            settings$.theme.set(theme)
        }
    })

    // Sync settings privacyMode with appState
    observe(() => {
        const privacyMode = settings$.privacyMode.get()
        if (privacyMode !== appState$.ui.privacyMode.get()) {
            appState$.ui.privacyMode.set(privacyMode)
        }
    })

    // Sync appState privacyMode with settings
    observe(() => {
        const privacyMode = appState$.ui.privacyMode.get()
        if (privacyMode !== settings$.privacyMode.get()) {
            settings$.privacyMode.set(privacyMode)
        }
    })

    // Sync settings activeTab with appState
    observe(() => {
        const activeTab = settings$.activeTab.get()
        if (activeTab !== appState$.ui.activeTab.get()) {
            appState$.ui.activeTab.set(activeTab)
        }
    })

    // Sync appState activeTab with settings
    observe(() => {
        const activeTab = appState$.ui.activeTab.get()
        if (activeTab !== settings$.activeTab.get()) {
            settings$.activeTab.set(activeTab)
        }
    })
}

// Export the showBanner computed value
export const showBanner = () => showBanner$.get()

// Configure persistence with LocalStorage
syncObservable(appState$, {
    persist: {
        name: 'okto-app-state',
        plugin: ObservablePersistLocalStorage,
    },
})

// Configure persistence for settings
syncObservable(settings$, {
    persist: {
        name: 'okto-settings',
        plugin: ObservablePersistLocalStorage,
    },
})
