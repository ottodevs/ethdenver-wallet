import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

describe('Card Components', () => {
    describe('Card', () => {
        it('should render correctly with default props', () => {
            render(<Card data-testid='card'>Card Content</Card>)

            const card = screen.getByTestId('card')
            expect(card).toBeInTheDocument()
            expect(card).toHaveClass('bg-card')
            expect(card).toHaveClass('text-card-foreground')
            expect(card).toHaveClass('rounded-xl')
            expect(card).toHaveClass('border')
            expect(card).toHaveClass('shadow')
            expect(card).toHaveTextContent('Card Content')
        })

        it('should apply custom className', () => {
            render(
                <Card data-testid='card' className='custom-class'>
                    Card Content
                </Card>,
            )

            const card = screen.getByTestId('card')
            expect(card).toHaveClass('custom-class')
        })

        it('should forward ref correctly', () => {
            const refCallback = (node: HTMLDivElement | null) => {
                if (node) {
                    node.dataset.refApplied = 'true'
                }
            }

            render(
                <Card ref={refCallback} data-testid='card'>
                    Card Content
                </Card>,
            )

            const card = screen.getByTestId('card')
            expect(card).toHaveAttribute('data-ref-applied', 'true')
        })
    })

    describe('CardHeader', () => {
        it('should render correctly with default props', () => {
            render(<CardHeader data-testid='card-header'>Header Content</CardHeader>)

            const header = screen.getByTestId('card-header')
            expect(header).toBeInTheDocument()
            expect(header).toHaveClass('flex')
            expect(header).toHaveClass('flex-col')
            expect(header).toHaveClass('space-y-1.5')
            expect(header).toHaveClass('p-6')
            expect(header).toHaveTextContent('Header Content')
        })

        it('should apply custom className', () => {
            render(
                <CardHeader data-testid='card-header' className='custom-class'>
                    Header Content
                </CardHeader>,
            )

            const header = screen.getByTestId('card-header')
            expect(header).toHaveClass('custom-class')
        })
    })

    describe('CardTitle', () => {
        it('should render correctly with default props', () => {
            render(<CardTitle data-testid='card-title'>Title Content</CardTitle>)

            const title = screen.getByTestId('card-title')
            expect(title).toBeInTheDocument()
            expect(title).toHaveClass('leading-none')
            expect(title).toHaveClass('font-semibold')
            expect(title).toHaveClass('tracking-tight')
            expect(title).toHaveTextContent('Title Content')
        })

        it('should apply custom className', () => {
            render(
                <CardTitle data-testid='card-title' className='custom-class'>
                    Title Content
                </CardTitle>,
            )

            const title = screen.getByTestId('card-title')
            expect(title).toHaveClass('custom-class')
        })
    })

    describe('CardDescription', () => {
        it('should render correctly with default props', () => {
            render(<CardDescription data-testid='card-description'>Description Content</CardDescription>)

            const description = screen.getByTestId('card-description')
            expect(description).toBeInTheDocument()
            expect(description).toHaveClass('text-muted-foreground')
            expect(description).toHaveClass('text-sm')
            expect(description).toHaveTextContent('Description Content')
        })

        it('should apply custom className', () => {
            render(
                <CardDescription data-testid='card-description' className='custom-class'>
                    Description Content
                </CardDescription>,
            )

            const description = screen.getByTestId('card-description')
            expect(description).toHaveClass('custom-class')
        })
    })

    describe('CardContent', () => {
        it('should render correctly with default props', () => {
            render(<CardContent data-testid='card-content'>Content</CardContent>)

            const content = screen.getByTestId('card-content')
            expect(content).toBeInTheDocument()
            expect(content).toHaveClass('p-6')
            expect(content).toHaveClass('pt-0')
            expect(content).toHaveTextContent('Content')
        })

        it('should apply custom className', () => {
            render(
                <CardContent data-testid='card-content' className='custom-class'>
                    Content
                </CardContent>,
            )

            const content = screen.getByTestId('card-content')
            expect(content).toHaveClass('custom-class')
        })
    })

    describe('CardFooter', () => {
        it('should render correctly with default props', () => {
            render(<CardFooter data-testid='card-footer'>Footer Content</CardFooter>)

            const footer = screen.getByTestId('card-footer')
            expect(footer).toBeInTheDocument()
            expect(footer).toHaveClass('flex')
            expect(footer).toHaveClass('items-center')
            expect(footer).toHaveClass('p-6')
            expect(footer).toHaveClass('pt-0')
            expect(footer).toHaveTextContent('Footer Content')
        })

        it('should apply custom className', () => {
            render(
                <CardFooter data-testid='card-footer' className='custom-class'>
                    Footer Content
                </CardFooter>,
            )

            const footer = screen.getByTestId('card-footer')
            expect(footer).toHaveClass('custom-class')
        })
    })

    it('should compose all card components correctly', () => {
        render(
            <Card data-testid='card'>
                <CardHeader data-testid='card-header'>
                    <CardTitle data-testid='card-title'>Card Title</CardTitle>
                    <CardDescription data-testid='card-description'>Card Description</CardDescription>
                </CardHeader>
                <CardContent data-testid='card-content'>Card Content</CardContent>
                <CardFooter data-testid='card-footer'>Card Footer</CardFooter>
            </Card>,
        )

        expect(screen.getByTestId('card')).toBeInTheDocument()
        expect(screen.getByTestId('card-header')).toBeInTheDocument()
        expect(screen.getByTestId('card-title')).toBeInTheDocument()
        expect(screen.getByTestId('card-description')).toBeInTheDocument()
        expect(screen.getByTestId('card-content')).toBeInTheDocument()
        expect(screen.getByTestId('card-footer')).toBeInTheDocument()

        expect(screen.getByTestId('card-title')).toHaveTextContent('Card Title')
        expect(screen.getByTestId('card-description')).toHaveTextContent('Card Description')
        expect(screen.getByTestId('card-content')).toHaveTextContent('Card Content')
        expect(screen.getByTestId('card-footer')).toHaveTextContent('Card Footer')
    })
})
