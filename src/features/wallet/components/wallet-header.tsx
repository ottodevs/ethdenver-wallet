'use client'

import { OptionsDropdown } from '@/components/options-dropdown'
import { Button } from '@/components/ui/button'
import { QrCode } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function WalletHeader() {
    const router = useRouter()
    return (
        <div className='mb-4 flex items-center justify-between'>
            <OptionsDropdown />
            <div className='w-8' /> {/* Empty space to maintain layout */}
            <Button variant='ghost' size='icon' className='h-8 w-8 text-white' onClick={() => router.push('/receive')}>
                <QrCode className='h-5 w-5' />
            </Button>
        </div>
    )
}
