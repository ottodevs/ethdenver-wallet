import { cn } from '@/lib/utils/tailwind'
import { Loader2 } from 'lucide-react'

interface SpinnerProps {
    className?: string
    size?: number
}

export function Spinner({ className, size = 16 }: SpinnerProps) {
    return <Loader2 className={cn('animate-spin text-blue-500', className)} size={size} />
}
