import { useWallet } from '@/features/wallet/hooks/use-wallet'
import Image from 'next/image'

type TokenItemProps = {
    token: {
        id: string
        name: string
        symbol: string
        balance: number
        valueUsd: number
        icon?: string
    }
    onClick: () => void
}

export function TokenItem({ token, onClick }: TokenItemProps) {
    const { privacyMode } = useWallet()

    return (
        <div
            className='hover:bg-muted/50 mb-4 flex cursor-pointer items-center justify-between rounded-md border-b border-[#272A3B] p-2 pb-4'
            onClick={onClick}>
            <div className='flex items-center gap-3'>
                <div className='bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full'>
                    {token.icon ? (
                        <Image src={token.icon} alt={token.symbol} width={24} height={24} />
                    ) : (
                        token.symbol.charAt(0)
                    )}
                </div>
                <div>
                    <div className='font-medium'>{token.name}</div>
                    <div className='text-muted-foreground text-xs'>
                        {privacyMode ? '••••••' : `${token.balance} ${token.symbol}`}
                    </div>
                </div>
            </div>
            <div className='text-right'>
                <div className='font-medium'>{privacyMode ? '••••••' : `$${token.valueUsd.toFixed(2)}`}</div>
                <div className='text-muted-foreground text-xs'>
                    {privacyMode ? '••••••' : `$${(token.valueUsd / token.balance).toFixed(2)}`}
                </div>
            </div>
        </div>
    )
}
