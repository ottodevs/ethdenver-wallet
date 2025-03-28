import { useGoogleAuth } from '@/hooks/useGoogleAuth'
import type { GoogleAuthState } from '@/lib/auth/GoogleAuthService'
import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock de la clase GoogleAuthService
vi.mock('@/lib/auth/GoogleAuthService', () => {
    const mockState = {
        isFedCMAvailable: false,
        isOneTapAvailable: false,
        isGoogleScriptLoaded: false,
        error: null,
        isAuthenticating: false,
    }

    return {
        GoogleAuthService: vi.fn().mockImplementation(() => ({
            onStateChange: vi.fn(callback => {
                // Guardar el callback para usarlo más tarde
                mockCallbacks.push(callback)
            }),
            getState: vi.fn(() => mockState),
            isGoogleInitialized: vi.fn(() => false),
            initializeGoogleIdentity: vi.fn(),
            authenticateWithFedCM: vi.fn(),
            signInWithGoogle: vi.fn(),
            cleanup: vi.fn(),
        })),
    }
})

// Almacenar callbacks para simular cambios de estado
const mockCallbacks: Array<(state: GoogleAuthState) => void> = []

describe('useGoogleAuth', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockCallbacks.length = 0
    })

    it('should initialize with default state', () => {
        const { result } = renderHook(() => useGoogleAuth())

        expect(result.current.isFedCMAvailable).toBe(false)
        expect(result.current.isOneTapAvailable).toBe(false)
        expect(result.current.isGoogleScriptLoaded).toBe(false)
        expect(result.current.error).toBeNull()
        expect(result.current.isAuthenticating).toBe(false)
        expect(typeof result.current.initializeGoogleIdentity).toBe('function')
        expect(typeof result.current.authenticateWithFedCM).toBe('function')
        expect(typeof result.current.signInWithGoogle).toBe('function')
        expect(result.current.googleInitialized).toBe(false)
    })

    it('should update state when state changes', async () => {
        const { result } = renderHook(() => useGoogleAuth())

        // Verificar estado inicial
        expect(result.current.isFedCMAvailable).toBe(false)

        // Simular cambio de estado
        await act(async () => {
            // Llamar al callback con un nuevo estado
            if (mockCallbacks.length > 0) {
                mockCallbacks[0]({
                    isFedCMAvailable: true,
                    isOneTapAvailable: true,
                    isGoogleScriptLoaded: true,
                    error: null,
                    isAuthenticating: false,
                })
            }
        })

        // Verificar que el estado se actualizó
        expect(result.current.isFedCMAvailable).toBe(true)
        expect(result.current.isOneTapAvailable).toBe(true)
        expect(result.current.isGoogleScriptLoaded).toBe(true)
    })

    it('should handle authentication error state', async () => {
        const { result } = renderHook(() => useGoogleAuth())

        // Simular error de autenticación
        await act(async () => {
            if (mockCallbacks.length > 0) {
                mockCallbacks[0]({
                    isFedCMAvailable: true,
                    isOneTapAvailable: true,
                    isGoogleScriptLoaded: true,
                    error: 'Authentication failed',
                    isAuthenticating: false,
                })
            }
        })

        // Verificar que el estado de error se actualizó
        expect(result.current.error).toBe('Authentication failed')
    })

    it('should handle authentication in progress state', async () => {
        const { result } = renderHook(() => useGoogleAuth())

        // Simular autenticación en progreso
        await act(async () => {
            if (mockCallbacks.length > 0) {
                mockCallbacks[0]({
                    isFedCMAvailable: true,
                    isOneTapAvailable: true,
                    isGoogleScriptLoaded: true,
                    error: null,
                    isAuthenticating: true,
                })
            }
        })

        // Verificar que el estado de autenticación en progreso se actualizó
        expect(result.current.isAuthenticating).toBe(true)
    })
})
