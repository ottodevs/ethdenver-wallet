import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import React from 'react'
import { afterEach, beforeEach, vi } from 'vitest'

// Global React configuration
global.React = React

// Cleanup after each test
afterEach(() => {
    cleanup()
})

// Mock of fetch
global.fetch = vi.fn()

// Mock of localStorage
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
}
global.localStorage = localStorageMock as unknown as Storage

// Mock of sessionStorage
const sessionStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
}
global.sessionStorage = sessionStorageMock as unknown as Storage

// Mock of window.matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
})

// Mock of ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}))

// Mock environment variables
vi.mock('@t3-oss/env-nextjs', () => ({
    createEnv: () => ({
        NEXT_PUBLIC_OKTO_CLIENT_PRIVATE_KEY: 'test-private-key',
        NEXT_PUBLIC_OKTO_CLIENT_SWA: 'test-swa',
        NEXT_PUBLIC_ENVIRONMENT: 'sandbox',
        NEXT_PUBLIC_SERVER_URL: 'http://localhost:3000',
        NEXT_PUBLIC_GOOGLE_CLIENT_ID: 'test-google-client-id',
    }),
}))

// Mock console methods to reduce noise in test output
const originalConsoleError = console.error
const originalConsoleWarn = console.warn
const originalConsoleLog = console.log

beforeEach(() => {
    console.error = vi.fn()
    console.warn = vi.fn()
    console.log = vi.fn()
})

afterEach(() => {
    console.error = originalConsoleError
    console.warn = originalConsoleWarn
    console.log = originalConsoleLog
})

// Mock window object
if (typeof window === 'undefined') {
    vi.stubGlobal('window', {
        location: {
            origin: 'http://localhost:3000',
        },
    })
}

// Mock IntersectionObserver
if (typeof IntersectionObserver === 'undefined') {
    vi.stubGlobal(
        'IntersectionObserver',
        vi.fn().mockImplementation(() => ({
            observe: vi.fn(),
            unobserve: vi.fn(),
            disconnect: vi.fn(),
        })),
    )
}
