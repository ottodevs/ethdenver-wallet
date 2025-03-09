type Props = {
    activeTab: string
    onTabChange: (tab: string) => void
    hasPendingTransactions: boolean
}

export function TabNavigation({ activeTab, onTabChange, hasPendingTransactions }: Props) {
    return (
        <div className='mb-4 flex justify-center'>
            <div className='flex w-full max-w-[400px] rounded-full bg-[#1A1A24] p-1'>
                <button
                    className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                        activeTab === 'assets' ? 'bg-[#4364F9] text-white' : 'text-gray-400 hover:text-white'
                    }`}
                    onClick={() => onTabChange('assets')}>
                    Assets
                </button>
                <button
                    className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                        activeTab === 'activity' ? 'bg-[#4364F9] text-white' : 'text-gray-400 hover:text-white'
                    }`}
                    onClick={() => onTabChange('activity')}>
                    Activity
                    {hasPendingTransactions && (
                        <span className='ml-2 inline-flex h-2 w-2 animate-pulse items-center justify-center rounded-full bg-yellow-500' />
                    )}
                </button>
                <button
                    className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                        activeTab === 'nfts' ? 'bg-[#4364F9] text-white' : 'text-gray-400 hover:text-white'
                    }`}
                    onClick={() => onTabChange('nfts')}>
                    NFTs
                </button>
            </div>
        </div>
    )
}
