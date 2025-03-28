'use client'
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

import { useObservable } from '@legendapp/state/react'
import { useObservableSyncedQuery } from '@legendapp/state/sync-plugins/tanstack-react-query'

import type { Profile } from '@/profile'

function useFormState(profile: Profile) {
    // Add a hydration state to prevent client-side rendering until we're ready
    const [isHydrated, setIsHydrated] = useState(false)
    const serverState = useRef<Record<string, string>>({ ...profile })
    const formState$ = useObservable({ ...profile })
    const state$ = useObservableSyncedQuery<Profile>({
        query: {
            queryKey: ['profile'],
            queryFn: async () => {
                return fetch(`/api/profile`).then(v => v.json())
            },
            initialData: { ...profile },
            refetchOnMount: true,
            refetchInterval: 30000,
            networkMode: 'online',
            staleTime: 10000,
        },
        mutation: {
            mutationFn: async function <Profile>(variables: Profile) {
                const sendData: Partial<Profile> = {}
                for (const k in serverState.current) {
                    const key = k as keyof Profile
                    if (variables[key] !== serverState.current[key as string]) {
                        sendData[key] = variables[key]
                    }
                }
                return fetch(`/api/profile`, {
                    method: 'POST',
                    body: JSON.stringify(sendData),
                }).then(v => v.json())
            },
        },
        transform: {
            load: (data: Profile) => {
                formState$.assign({ ...data })
                serverState.current = { ...data }
                return data
            },
        },
        // persist: {
        //     plugin: ObservablePersistLocalStorage,
        //     retrySync: true,
        //     name: 'profile',
        //     options: {
        //         priority: 'server',
        //         shouldLoad: () => isHydrated,
        //     },
        //     // Disable loading from persistence during initial hydration
        // },
    })

    // Critical: Initialize with server data and mark as hydrated after mount
    useEffect(() => {
        // Force state to match server data on initial load
        state$.set({ ...profile })
        formState$.set({ ...profile })
        serverState.current = { ...profile }

        // Mark as hydrated after initial render
        setIsHydrated(true)
    }, [profile, formState$, state$])

    const onSave = useCallback(() => {
        state$.assign(formState$.get())
    }, [state$, formState$])

    return { formState$, state$, onSave, isHydrated }
}

export const ProfileContext = createContext<ReturnType<typeof useFormState> | null>(null)

export default function ProfileProvider({ children, profile }: { children: React.ReactNode; profile: Profile }) {
    const formState = useFormState(profile)
    return <ProfileContext.Provider value={formState}>{children}</ProfileContext.Provider>
}

export function useProfile() {
    const context = useContext(ProfileContext)
    if (!context) {
        throw new Error('useProfile must be used within a ProfileProvider')
    }
    return context
}
