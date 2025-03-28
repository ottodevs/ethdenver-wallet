import { OptionsDropdown } from '@/components/options-dropdown'
import { Button } from '@/components/ui/button'
import { QrCodeIcon } from 'lucide-react'

export interface WalletHeaderProps {
    onQrCodeClick?: () => void
}

export function WalletHeader({ onQrCodeClick }: WalletHeaderProps) {
    return (
        <div className='text-foreground flex items-center justify-between'>
            <OptionsDropdown />
            <Button variant='ghost' size='icon' className='size-8' onClick={onQrCodeClick}>
                <QrCodeIcon className='size-5' />
            </Button>
        </div>
    )
}
