import { useOktoActivity } from '@/features/shared/hooks/use-okto-activity'
import { observer } from '@legendapp/state/react'
import { memo, useEffect, useState } from 'react'

// Optimized tab button component
const TabButton = memo(function TabButton({
    tab,
    activeTab,
    onClick,
    children,
}: {
    tab: string
    activeTab: string
    onClick: (tab: string) => void
    children: React.ReactNode
}) {
    return (
        <button
            className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab ? 'bg-[#4364F9] text-white' : 'text-muted-foreground hover:text-foreground'
            } `}
            onClick={() => onClick(tab)}>
            {children}
        </button>
    )
})

// Memoized pending transactions indicator
const PendingIndicator = observer(function PendingIndicator() {
    return (
        <span className='ml-2 inline-flex h-2 w-2 animate-pulse items-center justify-center rounded-full bg-yellow-500' />
    )
})

// Memoized activity tab content
const ActivityTab = observer(function ActivityTab() {
    const { activities } = useOktoActivity()
    const [hasNewActivity, setHasNewActivity] = useState(false)

    // Check for new activity
    useEffect(() => {
        // Get the last viewed timestamp from localStorage
        const lastViewedTimestamp = localStorage.getItem('lastViewedActivityTimestamp')

        if (activities && activities.length > 0) {
            // Get the timestamp of the most recent activity
            const mostRecentActivity = activities[0]
            const mostRecentTimestamp = mostRecentActivity.timestamp

            // If there's no last viewed timestamp or the most recent activity is newer, show the indicator
            if (!lastViewedTimestamp || parseInt(lastViewedTimestamp) < mostRecentTimestamp) {
                setHasNewActivity(true)
            } else {
                setHasNewActivity(false)
            }
        }
    }, [activities])

    return (
        <>
            Activity
            {hasNewActivity && <PendingIndicator />}
        </>
    )
})

// Main component
export const TabNavigation = memo(function TabNavigation({
    activeTab = 'assets',
    onTabChange,
}: {
    activeTab: string
    onTabChange: (tab: string) => void
}) {
    // When switching to the activity tab, update the last viewed timestamp
    const handleTabChange = (tab: string) => {
        if (tab === 'activity') {
            // Store the current timestamp as the last viewed time
            localStorage.setItem('lastViewedActivityTimestamp', Math.floor(Date.now() / 1000).toString())
        }
        onTabChange(tab)
    }

    return (
        <div className='mb-4 flex justify-center'>
            <div className='bg-muted flex w-full max-w-[400px] rounded-full p-1'>
                <TabButton tab='assets' activeTab={activeTab} onClick={handleTabChange}>
                    Assets
                </TabButton>
                <TabButton tab='activity' activeTab={activeTab} onClick={handleTabChange}>
                    <ActivityTab />
                </TabButton>
                <TabButton tab='nfts' activeTab={activeTab} onClick={handleTabChange}>
                    NFTs
                </TabButton>
            </div>
        </div>
    )
})
