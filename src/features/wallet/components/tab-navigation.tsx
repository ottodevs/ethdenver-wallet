type Props = {
    activeTab: string
    onTabChange: (tab: string) => void
    hasPendingTransactions: boolean
}

export function TabNavigation({ activeTab, onTabChange, hasPendingTransactions }: Props) {
    return (
        <div className='mb-4 flex justify-center'>
            <div className='bg-muted flex w-full max-w-[400px] rounded-full p-1'>
                <button
                    className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                        activeTab === 'assets'
                            ? 'bg-[#4364F9] text-white'
                            : 'text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => onTabChange('assets')}>
                    Assets
                </button>
                <button
                    className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                        activeTab === 'activity'
                            ? 'bg-[#4364F9] text-white'
                            : 'text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => onTabChange('activity')}>
                    Activity
                    {hasPendingTransactions && (
                        <span className='ml-2 inline-flex h-2 w-2 animate-pulse items-center justify-center rounded-full bg-yellow-500' />
                    )}
                </button>
                <button
                    className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                        activeTab === 'nfts' ? 'bg-[#4364F9] text-white' : 'text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => onTabChange('nfts')}>
                    NFTs
                </button>
            </div>
        </div>
    )
}
