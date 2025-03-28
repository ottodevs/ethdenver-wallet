import { NFTSkeleton, Skeleton, TokenSkeleton, TransactionSkeleton } from '@/components/ui/skeleton'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

describe('Skeleton Components', () => {
    describe('Skeleton', () => {
        it('should render correctly with default props', () => {
            const { container } = render(<Skeleton />)

            const skeleton = container.firstChild as HTMLElement
            expect(skeleton).toBeInTheDocument()
            expect(skeleton).toHaveClass('animate-pulse')
            expect(skeleton).toHaveClass('rounded-md')
            expect(skeleton).toHaveClass('bg-gray-700/30')
        })

        it('should apply custom className', () => {
            const { container } = render(<Skeleton className='custom-class' />)

            const skeleton = container.firstChild as HTMLElement
            expect(skeleton).toHaveClass('custom-class')
            expect(skeleton).toHaveClass('animate-pulse')
        })
    })

    describe('TokenSkeleton', () => {
        it('should render correctly', () => {
            const { container } = render(<TokenSkeleton />)

            const tokenSkeleton = container.firstChild as HTMLElement
            expect(tokenSkeleton).toBeInTheDocument()
            expect(tokenSkeleton).toHaveClass('flex')
            expect(tokenSkeleton).toHaveClass('items-center')
            expect(tokenSkeleton).toHaveClass('justify-between')
            expect(tokenSkeleton).toHaveClass('border-b')
            expect(tokenSkeleton).toHaveClass('border-gray-800')
            expect(tokenSkeleton).toHaveClass('p-3')

            // Should contain multiple skeleton elements
            const skeletonElements = tokenSkeleton.querySelectorAll('.animate-pulse')
            expect(skeletonElements.length).toBeGreaterThan(0)
        })
    })

    describe('NFTSkeleton', () => {
        it('should render correctly', () => {
            const { container } = render(<NFTSkeleton />)

            const nftSkeleton = container.firstChild as HTMLElement
            expect(nftSkeleton).toBeInTheDocument()
            expect(nftSkeleton).toHaveClass('relative')
            expect(nftSkeleton).toHaveClass('overflow-hidden')
            expect(nftSkeleton).toHaveClass('rounded-lg')

            // Should contain multiple skeleton elements
            const skeletonElements = nftSkeleton.querySelectorAll('.animate-pulse')
            expect(skeletonElements.length).toBeGreaterThan(0)
        })
    })

    describe('TransactionSkeleton', () => {
        it('should render correctly', () => {
            const { container } = render(<TransactionSkeleton />)

            const transactionSkeleton = container.firstChild as HTMLElement
            expect(transactionSkeleton).toBeInTheDocument()
            expect(transactionSkeleton).toHaveClass('flex')
            expect(transactionSkeleton).toHaveClass('items-center')
            expect(transactionSkeleton).toHaveClass('justify-between')
            expect(transactionSkeleton).toHaveClass('border-b')
            expect(transactionSkeleton).toHaveClass('border-gray-800')
            expect(transactionSkeleton).toHaveClass('p-3')

            // Should contain multiple skeleton elements
            const skeletonElements = transactionSkeleton.querySelectorAll('.animate-pulse')
            expect(skeletonElements.length).toBeGreaterThan(0)
        })
    })

    it('should compose skeletons correctly in a loading state UI', () => {
        render(
            <div data-testid='loading-ui'>
                <div className='mb-4'>
                    <TokenSkeleton />
                    <TokenSkeleton />
                </div>
                <div className='mb-4 grid grid-cols-2 gap-4'>
                    <NFTSkeleton />
                    <NFTSkeleton />
                </div>
                <div>
                    <TransactionSkeleton />
                    <TransactionSkeleton />
                </div>
            </div>,
        )

        const loadingUI = screen.getByTestId('loading-ui')
        expect(loadingUI).toBeInTheDocument()

        // Should contain all skeleton types
        const tokenSkeletons = loadingUI.querySelectorAll('.border-b.border-gray-800.p-3')
        expect(tokenSkeletons.length).toBe(4) // 2 TokenSkeletons + 2 TransactionSkeletons

        const nftSkeletons = loadingUI.querySelectorAll('.relative.overflow-hidden.rounded-lg')
        expect(nftSkeletons.length).toBe(2)
    })
})
