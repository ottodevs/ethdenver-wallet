import { Button } from '@/components/ui/button'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

describe('Button', () => {
    it('should render correctly with default props', () => {
        render(<Button>Click me</Button>)

        const button = screen.getByRole('button', { name: 'Click me' })
        expect(button).toBeInTheDocument()
        expect(button).toHaveClass('bg-primary')
        expect(button).toHaveClass('text-primary-foreground')
    })

    it('should apply different variants correctly', () => {
        const { rerender } = render(<Button variant='destructive'>Destructive</Button>)

        let button = screen.getByRole('button', { name: 'Destructive' })
        expect(button).toHaveClass('bg-destructive')
        expect(button).toHaveClass('text-white')

        rerender(<Button variant='outline'>Outline</Button>)
        button = screen.getByRole('button', { name: 'Outline' })
        expect(button).toHaveClass('border')
        expect(button).toHaveClass('bg-background')

        rerender(<Button variant='secondary'>Secondary</Button>)
        button = screen.getByRole('button', { name: 'Secondary' })
        expect(button).toHaveClass('bg-secondary')
        expect(button).toHaveClass('text-secondary-foreground')

        rerender(<Button variant='ghost'>Ghost</Button>)
        button = screen.getByRole('button', { name: 'Ghost' })
        expect(button).toHaveClass('hover:bg-accent')

        rerender(<Button variant='link'>Link</Button>)
        button = screen.getByRole('button', { name: 'Link' })
        expect(button).toHaveClass('text-primary')
        expect(button).toHaveClass('hover:underline')
    })

    it('should apply different sizes correctly', () => {
        const { rerender } = render(<Button size='default'>Default</Button>)

        let button = screen.getByRole('button', { name: 'Default' })
        expect(button).toHaveClass('h-9')
        expect(button).toHaveClass('px-4')

        rerender(<Button size='sm'>Small</Button>)
        button = screen.getByRole('button', { name: 'Small' })
        expect(button).toHaveClass('h-8')
        expect(button).toHaveClass('px-3')
        expect(button).toHaveClass('text-xs')

        rerender(<Button size='lg'>Large</Button>)
        button = screen.getByRole('button', { name: 'Large' })
        expect(button).toHaveClass('h-10')
        expect(button).toHaveClass('px-8')

        rerender(<Button size='icon'>Icon</Button>)
        button = screen.getByRole('button', { name: 'Icon' })
        expect(button).toHaveClass('size-9')
    })

    it('should apply custom className', () => {
        render(<Button className='custom-class'>Custom</Button>)

        const button = screen.getByRole('button', { name: 'Custom' })
        expect(button).toHaveClass('custom-class')
    })

    it('should handle click events', () => {
        const handleClick = vi.fn()

        render(<Button onClick={handleClick}>Click me</Button>)

        const button = screen.getByRole('button', { name: 'Click me' })
        fireEvent.click(button)

        expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('should be disabled when disabled prop is true', () => {
        render(<Button disabled>Disabled</Button>)

        const button = screen.getByRole('button', { name: 'Disabled' })
        expect(button).toBeDisabled()
        expect(button).toHaveClass('disabled:opacity-50')
    })

    it('should render as a child component when asChild is true', () => {
        render(
            <Button asChild>
                <a href='https://example.com'>Link Button</a>
            </Button>,
        )

        const link = screen.getByRole('link', { name: 'Link Button' })
        expect(link).toBeInTheDocument()
        expect(link).toHaveAttribute('href', 'https://example.com')
        expect(link).toHaveClass('bg-primary')
    })

    it('should forward ref correctly', () => {
        const ref = vi.fn()

        render(<Button ref={ref}>Ref Button</Button>)

        expect(ref).toHaveBeenCalledWith(expect.any(HTMLButtonElement))
    })
})
