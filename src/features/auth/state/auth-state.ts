import { batch, observable, syncState } from '@legendapp/state'
import { ObservablePersistLocalStorage } from '@legendapp/state/persist-plugins/local-storage'
import { syncObservable } from '@legendapp/state/sync'
import type { OktoClient } from '@okto_web3/react-sdk'

// Interfaz para el estado de autenticación
interface AuthState {
    isAuthenticated: boolean
    isLoading: boolean
    error: string | null
    authStatus: string
    isAuthenticating: boolean
    lastChecked: number
}

// Crear el observable con estado inicial
export const authState$ = observable<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    error: null,
    authStatus: '',
    isAuthenticating: false,
    lastChecked: 0,
})

// Configurar la persistencia local
syncObservable(authState$, {
    persist: {
        name: 'okto-auth',
        plugin: ObservablePersistLocalStorage,
    },
})

// Estado de sincronización para verificar si los datos están cargados
export const authSyncState$ = syncState(authState$)

// Constantes para los intervalos
const MIN_CHECK_INTERVAL = 30 * 1000 // 30 segundos

// Función para verificar el estado de autenticación
export async function checkAuthStatus(oktoClient: OktoClient): Promise<boolean> {
    if (!oktoClient) return false

    try {
        const now = Date.now()
        const lastChecked = authState$.lastChecked.get()

        // Solo verificar si ha pasado suficiente tiempo desde la última verificación
        if (now - lastChecked < MIN_CHECK_INTERVAL) {
            return authState$.isAuthenticated.get()
        }

        authState$.lastChecked.set(now)
        const authStatus = oktoClient.isLoggedIn()

        if (authStatus !== authState$.isAuthenticated.get()) {
            authState$.isAuthenticated.set(authStatus)

            if (authStatus) {
                authState$.authStatus.set('Authenticated with Okto')
            }
        }

        return authStatus
    } catch (err) {
        console.error('Auth check failed:', err)
        batch(() => {
            authState$.error.set('Failed to verify authentication')
            authState$.isAuthenticated.set(false)
        })
        return false
    } finally {
        authState$.isLoading.set(false)
    }
}

// Función para autenticar con Okto
export async function handleAuthenticate(oktoClient: OktoClient, idToken: string | null): Promise<unknown> {
    if (!idToken || !oktoClient) {
        console.error('Okto client not available')
        authState$.error.set('Okto client not available')
        return { result: false, error: 'Okto client not available' }
    }

    // Prevenir múltiples intentos de autenticación
    if (authState$.isAuthenticating.get()) {
        return { result: false, error: 'Authentication already in progress' }
    }

    try {
        authState$.isAuthenticating.set(true)
        authState$.authStatus.set('Authenticating with Okto...')

        // Verificar si ya está autenticado
        const isLoggedIn = oktoClient.isLoggedIn()
        if (isLoggedIn) {
            console.log('Already authenticated with Okto')
            batch(() => {
                authState$.authStatus.set('Already authenticated')
                authState$.isAuthenticated.set(true)
                authState$.lastChecked.set(Date.now())
            })
            return { result: true }
        }

        // Autenticar con OAuth
        const user = await oktoClient.loginUsingOAuth(
            {
                idToken: idToken,
                provider: 'google',
            },
            sessionKey => {
                // Almacenar la clave de sesión de forma segura
                localStorage.setItem('okto_session_key', sessionKey.sessionPrivKey)
            },
        )

        batch(() => {
            authState$.authStatus.set('Authentication successful')
            authState$.isAuthenticated.set(true)
            authState$.error.set(null)
            authState$.lastChecked.set(Date.now())
        })
        return { result: true, user: JSON.stringify(user) }
    } catch (error) {
        console.error('Authentication attempt failed:', error)

        // Verificar si ya estamos autenticados a pesar del error
        try {
            const isLoggedIn = oktoClient.isLoggedIn()
            if (isLoggedIn) {
                batch(() => {
                    authState$.authStatus.set('Authentication successful')
                    authState$.isAuthenticated.set(true)
                })
                return { result: true }
            }
        } catch (e) {
            console.error('Failed to check login status:', e)
        }

        batch(() => {
            authState$.authStatus.set('Authentication failed')
            authState$.error.set(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
        })
        return { result: false, error: 'Authentication failed' }
    } finally {
        authState$.isAuthenticating.set(false)
    }
}

// Función para limpiar el estado
export function clearAuthState() {
    batch(() => {
        authState$.isAuthenticated.set(false)
        authState$.isLoading.set(true)
        authState$.error.set(null)
        authState$.authStatus.set('')
        authState$.isAuthenticating.set(false)
        authState$.lastChecked.set(0)
    })
}
