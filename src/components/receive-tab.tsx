'use client'

import { useTokens } from '@/features/assets/hooks/use-tokens'
import { useOktoAccount } from '@/features/shared/hooks/use-okto-account'
import { ChevronDown, Copy, Share2 } from 'lucide-react'
import Image from 'next/image'
import QRCode from 'qrcode'
import { useEffect, useState } from 'react'

export function ReceiveTab() {
    const { selectedAccount } = useOktoAccount()
    const {
        chains = [],
        selectedChain,
        setSelectedChain,
        selectedToken,
        setSelectedToken,
        selectedTokenData,
        availableTokens,
        amount,
        setAmount,
    } = useTokens()

    const [copied, setCopied] = useState(false)
    const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('')
    const [addressCopied, setAddressCopied] = useState(false)
    const [showNetworkDropdown, setShowNetworkDropdown] = useState(false)
    const [showTokenDropdown, setShowTokenDropdown] = useState(false)

    const walletAddress = selectedAccount?.address || ''
    const shortAddress = walletAddress ? `${walletAddress.slice(0, 10)}...${walletAddress.slice(-7)}` : ''

    // Set default chain (Optimism) if none selected
    useEffect(() => {
        if (!selectedChain && chains && chains.length > 0) {
            // Find Optimism chain
            const optimismChain = chains.find(chain => chain.name.toLowerCase() === 'optimism')

            if (optimismChain) {
                setSelectedChain(String(optimismChain.id))
            } else if (chains.length > 0) {
                // Fallback to first chain if Optimism not available
                setSelectedChain(String(chains[0].id))
            }
        }
    }, [chains, selectedChain, setSelectedChain])

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement
            if (!target.closest('.network-dropdown') && !target.closest('.network-selector')) {
                setShowNetworkDropdown(false)
            }
            if (!target.closest('.token-dropdown') && !target.closest('.token-selector')) {
                setShowTokenDropdown(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    // Generate QR code data URL when wallet address or parameters change
    useEffect(() => {
        if (!walletAddress) return

        let qrData = walletAddress

        if (selectedTokenData) {
            // Get decimals directly from the selected token data
            const decimals = selectedTokenData.decimals || 18

            // Different format based on token type
            if (selectedTokenData.contractAddress) {
                // For ERC20 tokens
                const chainData = chains.find(c => String(c.id) === selectedChain)
                const chainId = chainData?.id || '1' // Default to Ethereum mainnet

                // Calculate amount in token's smallest units based on its decimals
                let amountInSmallestUnits = '0'
                if (amount) {
                    // Convert to token's smallest units using the correct decimals
                    const multiplier = Math.pow(10, decimals)
                    const amountValue = parseFloat(amount) * multiplier
                    amountInSmallestUnits = amountValue.toLocaleString('fullwide', {
                        useGrouping: false,
                    })
                }

                // Build the URI for ERC20 token transfer
                qrData = `ethereum:${selectedTokenData.contractAddress}@${chainId}/transfer?address=${walletAddress}&uint256=${amountInSmallestUnits}`
            } else {
                // For native currency (ETH, MATIC, etc.)
                const chainData = chains.find(c => String(c.id) === selectedChain)
                const chainId = chainData?.id || '1' // Default to Ethereum mainnet

                // Format: ethereum:<address>@<chainId>?value=<amountInWei>
                qrData = `ethereum:${walletAddress}@${chainId}`

                if (amount) {
                    // Convert to smallest units (wei for ETH, etc.)
                    const multiplier = Math.pow(10, decimals)
                    const valueInSmallestUnits = parseFloat(amount) * multiplier
                    qrData += `?value=${valueInSmallestUnits.toLocaleString('fullwide', {
                        useGrouping: false,
                    })}`
                }
            }
        }

        console.log('Generated QR data:', qrData) // For debugging

        // Generate QR code with error correction level Q (25%)
        QRCode.toDataURL(qrData, {
            errorCorrectionLevel: 'Q',
            margin: 1,
            width: 250,
            color: {
                dark: '#000000',
                light: '#ffffff',
            },
        })
            .then(url => {
                setQrCodeDataUrl(url)
            })
            .catch(err => {
                console.error('Error generating QR code:', err)
            })
    }, [walletAddress, amount, selectedToken, selectedChain, chains, selectedTokenData])

    const handleCopy = () => {
        if (walletAddress) {
            navigator.clipboard.writeText(walletAddress)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const handleCopyAddress = () => {
        if (walletAddress) {
            navigator.clipboard.writeText(walletAddress)
            setAddressCopied(true)
            setTimeout(() => setAddressCopied(false), 2000)
        }
    }

    const handleShare = async () => {
        if (!walletAddress) return

        try {
            if (navigator.share) {
                await navigator.share({
                    title: 'My Crypto Wallet Address',
                    text: `My wallet address is: ${walletAddress}`,
                    url: `ethereum:${walletAddress}`,
                })
            } else {
                // Fallback for browsers that don't support the Web Share API
                handleCopyAddress()
                alert('Sharing not supported by your browser. Address copied to clipboard instead.')
            }
        } catch (error) {
            console.error('Error sharing:', error)
        }
    }

    // Get current network name from selected chain
    const getSelectedNetwork = () => {
        if (!selectedChain || !chains || chains.length === 0) return 'Select Network'
        const chain = chains.find(c => String(c.id) === selectedChain)
        return chain ? chain.name : 'Select Network'
    }

    // Get display text for selected token
    const getSelectedTokenDisplay = () => {
        if (!selectedToken && !selectedTokenData) {
            return selectedChain ? 'Select Token' : 'Select Network First'
        }
        return selectedTokenData ? `${selectedTokenData.symbol}` : 'Select Token'
    }

    return (
        <div className='font-outfit space-y-3'>
            {/* Network Selector */}
            <div className='relative'>
                <div
                    className='network-selector flex cursor-pointer items-center justify-between border-b border-[#373747] pb-4'
                    onClick={() => setShowNetworkDropdown(!showNetworkDropdown)}>
                    <span className='text-[#9493ac]'>Network:</span>
                    <div className='flex items-center gap-2 text-white'>
                        <span>{getSelectedNetwork()}</span>
                        <ChevronDown className='ml-1 h-4 w-4' />
                    </div>
                </div>

                {/* Network Dropdown */}
                {showNetworkDropdown && (
                    <div className='network-dropdown absolute z-50 mt-1 max-h-[300px] w-full overflow-y-auto rounded-lg border border-[#373747] bg-[#1B1A27] shadow-lg'>
                        {chains.map(chain => (
                            <div
                                key={chain.id}
                                className='flex cursor-pointer items-center justify-between px-4 py-3 text-white hover:bg-[#252531]'
                                onClick={() => {
                                    setSelectedChain(String(chain.id))
                                    setShowNetworkDropdown(false)
                                }}>
                                <span>{chain.name}</span>
                                {selectedChain === String(chain.id) && (
                                    <div className='h-2.5 w-2.5 rounded-full bg-white' />
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* QR Code Area */}
            <div className='flex flex-col items-center rounded-2xl border border-[#373747] bg-[#1B1A27]/50 p-3 pt-6 pb-6'>
                <h2 className='mb-4 text-xl text-white'>Aeris Wallet</h2>
                <div className='mb-4 rounded-lg bg-white p-4'>
                    {qrCodeDataUrl ? (
                        <Image src={qrCodeDataUrl} alt='Wallet QR Code' width={250} height={250} />
                    ) : (
                        <div className='flex h-[250px] w-[250px] items-center justify-center bg-gray-200'>
                            <p className='text-sm text-gray-500'>Generating QR code...</p>
                        </div>
                    )}
                </div>

                {/* Address with Copy Button */}
                <div className='flex items-center justify-center space-x-2'>
                    <div className='text-white'>{shortAddress}</div>
                    <button onClick={handleCopy} className='text-white'>
                        {copied ? <span className='text-xs text-green-400'>✓</span> : <Copy className='h-4 w-4' />}
                    </button>
                </div>
            </div>

            {/* Amount Input and Token Selection */}
            <div className='relative h-20 w-full rounded-2xl border border-[#373747] bg-gradient-to-b from-[#252531] to-[#181826] backdrop-blur-[20px]'>
                <div className='flex h-12 w-full items-start justify-between px-4 pt-4'>
                    <div className='relative'>
                        <div className='font-outfit text-sm leading-tight font-normal text-[#9493ac]'>
                            Select Amount
                        </div>
                        <div
                            className='token-selector mt-1 flex cursor-pointer items-center gap-1'
                            onClick={() => setShowTokenDropdown(!showTokenDropdown)}>
                            <div className='font-outfit text-base leading-tight font-normal text-white'>
                                {getSelectedTokenDisplay()}
                            </div>
                            <ChevronDown className='h-3 w-3 text-white' />
                        </div>

                        {/* Token Dropdown */}
                        {showTokenDropdown && (
                            <div className='token-dropdown absolute bottom-full z-50 mb-2 max-h-[300px] w-[220px] overflow-y-auto rounded-lg border border-[#373747] bg-[#1B1A27] shadow-lg'>
                                {selectedChain ? (
                                    availableTokens.length > 0 ? (
                                        availableTokens.map(token => (
                                            <div
                                                key={token.id}
                                                className='flex cursor-pointer items-center justify-between px-4 py-3 text-white hover:bg-[#252531]'
                                                onClick={() => {
                                                    setSelectedToken(token.id)
                                                    setShowTokenDropdown(false)
                                                }}>
                                                <div className='flex items-center gap-2'>
                                                    {token.logoURI ? (
                                                        <Image
                                                            src={token.logoURI}
                                                            alt={token.symbol}
                                                            className='h-5 w-5 rounded-full'
                                                            width={20}
                                                            height={20}
                                                            unoptimized={true}
                                                        />
                                                    ) : (
                                                        <div className='flex h-5 w-5 items-center justify-center rounded-full bg-gray-700'>
                                                            <span className='text-[10px] text-white'>
                                                                {token.symbol.substring(0, 1)}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <span>{token.symbol}</span>
                                                </div>
                                                {selectedToken === token.id && (
                                                    <div className='h-2.5 w-2.5 rounded-full bg-white' />
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div className='px-4 py-3 text-[#9493ac]'>
                                            No tokens available for this network
                                        </div>
                                    )
                                ) : (
                                    <div className='px-4 py-3 text-[#9493ac]'>Please select a network first</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                <div className='absolute top-[17px] right-[17px] flex w-[110px] items-center justify-center rounded-2xl border border-[#373a46] p-2.5'>
                    <input
                        type='text'
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        className='font-outfit w-full bg-transparent text-center text-xl font-medium text-white outline-none'
                    />
                </div>
            </div>

            {/* Bottom Action Buttons */}
            <div className='mt-12 flex justify-center space-x-8'>
                <button
                    className='rounded-full border border-[#373747] bg-[#181826] p-4 text-white transition-colors hover:bg-[#21212f]'
                    onClick={handleCopyAddress}
                    aria-label='Copy address'>
                    <div className='relative'>
                        <Copy className='h-5 w-5' />
                        {addressCopied && (
                            <span className='absolute -top-8 left-1/2 -translate-x-1/2 transform rounded bg-green-500 px-2 py-1 text-xs whitespace-nowrap text-white'>
                                Copied!
                            </span>
                        )}
                    </div>
                </button>
                <button
                    className='rounded-full border border-[#373747] bg-[#181826] p-4 text-white transition-colors hover:bg-[#21212f]'
                    onClick={handleShare}
                    aria-label='Share address'>
                    <Share2 className='h-5 w-5' />
                </button>
            </div>
        </div>
    )
}
