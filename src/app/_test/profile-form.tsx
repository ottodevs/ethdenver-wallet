'use client'
import { observer, useIsMounted } from '@legendapp/state/react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'

import { Input } from '@/components/ui/input'
import { useProfile } from './profile-context'

function EditProfile() {
    const isMounted = useIsMounted()
    const { formState$, state$, onSave, isHydrated } = useProfile()
    const [isClient, setIsClient] = useState(false)

    // Set isClient to true after first render
    useEffect(() => {
        setIsClient(true)
    }, [])

    // Reset form to match server state
    const onReset = () => {
        formState$.assign(state$.get())
    }

    // Sync form with server state when server state changes
    useEffect(() => {
        const subscription = state$.onChange(({ value, isFromSync, isFromPersist }) => {
            // Only update form with server changes, not from our own saves
            if (isFromSync || isFromPersist) {
                formState$.assign(value)
            }
        })

        return () => subscription()
    }, [state$, formState$])

    // Don't render anything during SSR or until hydration is complete
    if (!isMounted || !isClient || !isHydrated) return null

    return (
        <div className='flex flex-col gap-2'>
            {/* <Input $value={formState$.name} placeholder='Name' reactive /> */}
            <Input value={formState$.name.get()} placeholder='Name' readOnly />
            {/* <Input value={formState$.email} placeholder='Email' />
            <Input value={formState$.phone} placeholder='Phone' />
            <Input value={formState$.address} placeholder='Address' /> */}
            <div className='flex gap-2'>
                <Button onClick={onSave}>Save</Button>
                <Button variant='outline' onClick={onReset}>
                    Reset
                </Button>
            </div>
        </div>
    )
}

export default observer(EditProfile)
