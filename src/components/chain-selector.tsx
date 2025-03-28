'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useOktoNetworks } from '@/features/shared/hooks/use-okto-networks'
import Image from 'next/image'
import { useEffect, useState } from 'react'

interface ChainSelectorProps {
    value?: string
    onValueChange?: (value: string) => void
    disabled?: boolean
    placeholder?: string
    className?: string
}

export function ChainSelector({
    value,
    onValueChange,
    disabled = false,
    placeholder = 'Select network',
    className = 'w-[180px]',
}: ChainSelectorProps) {
    const { networks, isLoading } = useOktoNetworks()
    const [selectedChain, setSelectedChain] = useState(value || '')

    // Update selected chain when value prop changes
    useEffect(() => {
        if (value) {
            setSelectedChain(value)
        } else if (networks.length > 0 && !selectedChain) {
            // Set default selected chain if none provided
            // Convert chain_id to string since our state expects a string
            setSelectedChain(String(networks[0].chain_id))
            if (onValueChange) {
                onValueChange(String(networks[0].chain_id))
            }
        }
    }, [value, networks, selectedChain, onValueChange])

    const handleChainChange = (value: string) => {
        setSelectedChain(value)
        if (onValueChange) {
            onValueChange(value)
        }
    }

    if (isLoading || networks.length === 0) {
        return null
    }

    return (
        <Select value={selectedChain} onValueChange={handleChainChange} disabled={disabled}>
            <SelectTrigger className={className}>
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                {networks.map(chain => (
                    <SelectItem key={chain.chain_id} value={String(chain.chain_id)}>
                        <div className='flex items-center'>
                            <Image
                                src={chain.logo}
                                alt={chain.network_name}
                                width={16}
                                height={16}
                                className='mr-2 h-4 w-4'
                                onError={e => {
                                    e.currentTarget.src = '/chain-icons/default.svg'
                                }}
                            />
                            {chain.network_name}
                        </div>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}
