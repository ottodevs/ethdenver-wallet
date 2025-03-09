type Props = {
    accountLoading?: boolean
    isAuthenticated?: boolean
}

export function LoadingScreen({ accountLoading, isAuthenticated }: Props) {
    return (
        <div className='bg-background/95 fixed inset-0 z-50 flex flex-col items-center justify-center backdrop-blur-sm'>
            <div className='flex max-w-md flex-col items-center justify-center p-8 text-center'>
                <div className='relative mb-6 h-24 w-24'>
                    {/* Outer spinning ring */}
                    <div className='absolute inset-0 animate-spin rounded-full border-t-2 border-b-2 border-blue-500' />

                    {/* Middle pulsing ring */}
                    <div className='absolute inset-2 animate-pulse rounded-full border-r-2 border-l-2 border-blue-500/60' />

                    {/* Inner spinning ring (opposite direction) */}
                    <div className='animate-reverse absolute inset-4 animate-spin rounded-full border-t-2 border-b-2 border-blue-500/40' />

                    {/* Center wallet icon */}
                    <div className='absolute inset-0 flex items-center justify-center'>
                        <span className='animate-bounce text-2xl'>💼</span>
                    </div>
                </div>

                <h2 className='mb-4 animate-pulse text-2xl font-bold text-white'>
                    {accountLoading && !isAuthenticated ? 'Verifying authentication...' : 'Loading Your Wallet'}
                </h2>

                <div className='mb-6 space-y-3'>
                    <p className='font-outfit animate-fade-in-1 text-gray-300'>
                        {accountLoading && !isAuthenticated
                            ? 'Connecting with your account...'
                            : 'Connecting to the blockchain...'}
                    </p>
                    <p className='font-outfit animate-fade-in-2 text-gray-400'>
                        {accountLoading && !isAuthenticated
                            ? 'Verifying credentials...'
                            : 'Fetching your latest assets...'}
                    </p>
                    <p className='font-outfit animate-fade-in-3 text-gray-500'>
                        {accountLoading && !isAuthenticated
                            ? 'Preparing your wallet...'
                            : 'Retrieving transaction history...'}
                    </p>
                </div>

                <div className='mt-2 flex space-x-1'>
                    <div
                        className='h-2 w-2 animate-bounce rounded-full bg-blue-500'
                        style={{ animationDelay: '0ms' }}
                    />
                    <div
                        className='h-2 w-2 animate-bounce rounded-full bg-blue-500'
                        style={{ animationDelay: '50ms' }}
                    />
                    <div
                        className='h-2 w-2 animate-bounce rounded-full bg-blue-500'
                        style={{ animationDelay: '100ms' }}
                    />
                </div>
            </div>
        </div>
    )
}
