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
            <Button
                variant='ghost'
                size='icon'
                className='text-foreground size-8'
                onClick={() => router.push('/receive')}>
                <QrCode className='size-5' />
            </Button>
        </div>
    )
}
