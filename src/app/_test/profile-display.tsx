'use client'
import { Memo, useIsMounted } from '@legendapp/state/react'
import { useEffect, useState } from 'react'

import { useProfile } from './profile-context'

export default function ProfileDisplay() {
    const { state$, isHydrated } = useProfile()
    const isMounted = useIsMounted()
    const [isClient, setIsClient] = useState(false)

    // Set isClient to true after first render
    useEffect(() => {
        setIsClient(true)
    }, [])

    // Don't render anything during SSR or until hydration is complete
    if (!isMounted || !isClient || !isHydrated) return null

    return (
        <>
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
        </>
    )
}
