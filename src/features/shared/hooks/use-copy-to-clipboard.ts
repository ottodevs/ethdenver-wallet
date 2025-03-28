import { useToast } from '@/components/hooks/use-toast'
import { useState } from 'react'

export function useCopyToClipboard() {
    const { toast } = useToast()
    const [copying, setCopying] = useState(false)

    const copyToClipboard = async (text: string, label: string = 'Text') => {
        if (!text) return

        try {
            await navigator.clipboard.writeText(text)
            console.log(`Copied to clipboard: ${text}`)

            // Set copying state for UI feedback
            setCopying(true)

            // Show toast notification
            toast({
                title: `${label} Copied`,
                description: text.length > 30 ? `${text.substring(0, 6)}...${text.substring(text.length - 4)}` : text,
                variant: 'default',
            })

            // Reset copying state after a short delay
            setTimeout(() => setCopying(false), 2000)
        } catch (error) {
            console.error(`Failed to copy ${label.toLowerCase()}:`, error)

            toast({
                title: 'Copy Failed',
                description: `Could not copy ${label.toLowerCase()} to clipboard. Please try again.`,
                variant: 'destructive',
            })
        }
    }

    return { copyToClipboard, copying }
}
