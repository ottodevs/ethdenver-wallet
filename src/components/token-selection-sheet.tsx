'use client'

import { Drawer, DrawerClose, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { useTokens } from '@/features/assets/hooks/use-tokens'
import { X } from 'lucide-react'
import Image from 'next/image'

interface TokenSelectionSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function TokenSelectionSheet({ open, onOpenChange }: TokenSelectionSheetProps) {
    const { selectedChain, selectedToken, setSelectedToken, availableTokens } = useTokens()

    const handleTokenSelect = (tokenId: string) => {
        setSelectedToken(tokenId)
        onOpenChange(false)
    }

    return (
        <Drawer open={open} onOpenChange={onOpenChange} shouldScaleBackground snapPoints={[0.8]}>
            <DrawerContent className='max-h-[80vh] border-t border-[#373747] bg-gradient-to-br from-[#252531] to-[#13121E]'>
                <div className='absolute top-4 right-4 z-50'>
                    <DrawerClose asChild>
                        <button className='rounded-full bg-[#373747] p-1.5 text-white hover:bg-[#444458] focus:outline-none'>
                            <X className='h-4 w-4' />
                        </button>
                    </DrawerClose>
                </div>

                <DrawerHeader className='cursor-grab active:cursor-grabbing'>
                    <DrawerTitle className='text-center text-xl text-white'>Tokens</DrawerTitle>
                </DrawerHeader>

                <div className='p-6'>
                    <div className='rounded-2xl border border-[#373747] bg-[#1B1A27]/50 p-6'>
                        {!selectedChain ? (
                            <p className='mb-4 text-center text-white'>Please select a network first</p>
                        ) : availableTokens.length === 0 ? (
                            <p className='mb-4 text-center text-white'>No tokens available for this network</p>
                        ) : (
                            <>
                                <p className='mb-4 text-center text-white'>Select a token to receive</p>

                                <div className='space-y-4'>
                                    {availableTokens.map(token => {
                                        const isSelected = token.id === selectedToken

                                        return (
                                            <div
                                                key={token.id}
                                                className={`flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-colors ${
                                                    isSelected
                                                        ? 'border-[#373747] bg-[#25252F]'
                                                        : 'border-[#373747]/50 bg-[#25252F]/50 hover:bg-[#25252F]/80'
                                                }`}
                                                onClick={() => handleTokenSelect(token.id)}>
                                                <div className='flex items-center gap-3'>
                                                    {token.logoURI ? (
                                                        <Image
                                                            src={token.logoURI}
                                                            alt={token.symbol}
                                                            className='h-8 w-8 rounded-full'
                                                        />
                                                    ) : (
                                                        <div className='flex h-8 w-8 items-center justify-center rounded-full bg-gray-500 text-xs text-white'>
                                                            {token.symbol.substring(0, 2)}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div
                                                            className={`${
                                                                isSelected ? 'text-white' : 'text-white/70'
                                                            }`}>
                                                            {token.symbol}
                                                        </div>
                                                        <div className='text-xs text-[#9493ac]'>{token.name}</div>
                                                    </div>
                                                </div>
                                                <div
                                                    className={`h-4 w-4 rounded-full border-2 ${
                                                        isSelected
                                                            ? 'flex items-center justify-center border-white'
                                                            : 'border-white/30'
                                                    }`}>
                                                    {isSelected && <div className='h-2 w-2 rounded-full bg-white' />}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    )
}
