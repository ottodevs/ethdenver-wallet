'use client'
import { ObservablePersistLocalStorage } from '@legendapp/state/persist-plugins/local-storage'
import { Memo, observer, useObservable } from '@legendapp/state/react'
import { $React } from '@legendapp/state/react-web'
import { useObservableSyncedQuery } from '@legendapp/state/sync-plugins/tanstack-react-query'
import { useRef } from 'react'

import type { Profile } from '@/profile'

// import { Input } from '@/app/test/input'
import { Button } from '@/components/ui/button'

function EditProfile({ profile }: { profile: Profile }) {
    const serverState = useRef<Record<string, string>>({ ...profile })
    const formState$ = useObservable({ ...profile })
    const state$ = useObservableSyncedQuery<Profile>({
        query: {
            queryKey: ['profile'],
            queryFn: async () => {
                console.log('Fetching from server...')
                return fetch(`/api/profile`).then(v => v.json())
            },
            initialData: { ...profile },
            refetchOnMount: true,
            refetchOnWindowFocus: true,
            staleTime: 60000,
            refetchInterval: 300000,
            refetchIntervalInBackground: false,
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
            onSuccess: data => {
                console.log('Mutation success, updating from server:', data)
                serverState.current = { ...data }
                formState$.assign({ ...data })
            },
        },
        transform: {
            load: (data: Profile) => {
                console.log('Loading data from server:', data)
                formState$.assign({ ...data })
                serverState.current = { ...data }
                return data
            },
        },
        persist: {
            plugin: ObservablePersistLocalStorage,
            retrySync: true,
            name: 'profile',
            options: {
                priority: 'remote',
                merge: false,
            },
        },
    })

    return (
        <div className='flex flex-col gap-2'>
            <$React.input $value={formState$.name} placeholder='Name' />
            {/* <Input value={formState$.email} placeholder='Email' />
            <Input value={formState$.phone} placeholder='Phone' />
            <Input value={formState$.address} placeholder='Address' /> */}

            <Button
                onClick={() => {
                    state$.assign(formState$.get())
                }}>
                Save
            </Button>

            <h3 className='text-lg font-medium'>Profile</h3>
            <Memo>
                {() => (
                    <div className='flex flex-col gap-2'>
                        <p>Name: {state$.get().name}</p>
                        <p>Email: {state$.get().email}</p>
                        <p>Phone: {state$.get().phone}</p>
                        <p>Address: {state$.get().address}</p>
                    </div>
                )}
            </Memo>
        </div>
    )
}

export default observer(EditProfile)
