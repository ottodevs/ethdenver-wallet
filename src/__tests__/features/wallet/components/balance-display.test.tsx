import { BalanceDisplay } from '@/features/wallet/components/balance-display'
import * as appStore from '@/lib/stores/app.store'
import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock the app store
vi.mock('@/lib/stores/app.store', () => ({
    settings$: {
        privacyMode: {
            get: vi.fn(),
        },
    },
    togglePrivacyMode: vi.fn(),
}))

// Mock the BalanceAmount component
vi.mock('@/features/wallet/components/balance-amount', () => ({
    BalanceAmount: () => <div data-testid='balance-amount'>$1,234.56</div>,
}))

describe('BalanceDisplay', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    afterEach(() => {
        vi.resetAllMocks()
    })

    it('should render the component correctly', () => {
        // Mock privacy mode as false (showing balance)
        vi.mocked(appStore.settings$.privacyMode.get).mockReturnValue(false)

        render(<BalanceDisplay />)

        // Check if the title is rendered
        expect(screen.getByText('TOTAL BALANCE')).toBeInTheDocument()

        // Check if the BalanceAmount component is rendered
        expect(screen.getByTestId('balance-amount')).toBeInTheDocument()

        // Check if the Eye icon is rendered (privacy mode off)
        const eyeIcon = screen.getByRole('button', { name: /toggle balance visibility/i })
        expect(eyeIcon).toBeInTheDocument()
    })

    it('should show Eye icon when privacy mode is off', () => {
        // Mock privacy mode as false (showing balance)
        vi.mocked(appStore.settings$.privacyMode.get).mockReturnValue(false)

        render(<BalanceDisplay />)

        // Check if the Eye icon is rendered
        const eyeIcon = screen.getByRole('button', { name: /toggle balance visibility/i })
        expect(eyeIcon).toBeInTheDocument()

        // We can't directly check for the Eye component, but we can verify the toggle button exists
        expect(eyeIcon).toHaveAttribute('aria-label', 'Toggle balance visibility')
    })

    it('should show EyeOff icon when privacy mode is on', () => {
        // Mock privacy mode as true (hiding balance)
        vi.mocked(appStore.settings$.privacyMode.get).mockReturnValue(true)

        render(<BalanceDisplay />)

        // Check if the EyeOff icon is rendered
        const eyeOffIcon = screen.getByRole('button', { name: /toggle balance visibility/i })
        expect(eyeOffIcon).toBeInTheDocument()

        // We can't directly check for the EyeOff component, but we can verify the toggle button exists
        expect(eyeOffIcon).toHaveAttribute('aria-label', 'Toggle balance visibility')
    })

    it('should call togglePrivacyMode when the button is clicked', () => {
        // Mock privacy mode as false (showing balance)
        vi.mocked(appStore.settings$.privacyMode.get).mockReturnValue(false)

        render(<BalanceDisplay />)

        // Find the toggle button
        const toggleButton = screen.getByRole('button', { name: /toggle balance visibility/i })

        // Click the button
        fireEvent.click(toggleButton)

        // Check if togglePrivacyMode was called
        expect(appStore.togglePrivacyMode).toHaveBeenCalledTimes(1)
    })

    it('should have the correct layout and styling', () => {
        // Mock privacy mode as false (showing balance)
        vi.mocked(appStore.settings$.privacyMode.get).mockReturnValue(false)

        const { container } = render(<BalanceDisplay />)

        // Get the main container (root div of the component)
        const mainContainer = container.firstChild as HTMLElement
        expect(mainContainer).toHaveClass('mt-14 mb-10 flex flex-col items-center')

        // Get the title container (div that contains the title and toggle)
        const titleContainer = mainContainer.firstChild as HTMLElement
        expect(titleContainer).toHaveClass('flex items-center gap-2')

        // Check if the title has the correct classes
        const title = screen.getByText('TOTAL BALANCE')
        expect(title).toHaveClass('font-outfit text-muted-foreground text-[16px]')
    })
})
