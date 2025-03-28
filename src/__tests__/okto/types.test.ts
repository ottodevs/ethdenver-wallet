import type { OktoPortfolioData, OktoTokenGroup, OktoWallet } from '@/okto/types'
import { describe, expect, it } from 'vitest'

describe('Okto Types', () => {
    it('should have OktoWallet type properly defined', () => {
        const wallet: OktoWallet = {
            id: '1',
            caip_id: 'eip155:1',
            network_name: 'Ethereum',
            address: '0x123',
            network_id: '1',
            network_symbol: 'ETH',
        }

        expect(wallet).toHaveProperty('caip_id')
        expect(wallet).toHaveProperty('network_name')
        expect(wallet).toHaveProperty('address')
        expect(wallet).toHaveProperty('network_id')
        expect(wallet).toHaveProperty('network_symbol')
    })

    it('should have OktoTokenGroup type properly defined', () => {
        const token: OktoTokenGroup = {
            id: 'token1',
            name: 'Ethereum',
            symbol: 'ETH',
            short_name: 'ETH',
            token_image: 'eth.png',
            token_address: '0x123',
            network_id: 'ethereum',
            precision: '18',
            network_name: 'Ethereum',
            is_primary: true,
            balance: '0.5',
            holdings_price_usdt: '1000.00',
            holdings_price_inr: '83000.00',
        }

        expect(token).toHaveProperty('id')
        expect(token).toHaveProperty('name')
        expect(token).toHaveProperty('symbol')
        expect(token).toHaveProperty('balance')
        expect(token).toHaveProperty('holdings_price_usdt')
    })

    it('should have OktoPortfolioData type properly defined', () => {
        const portfolio: OktoPortfolioData = {
            aggregated_data: {
                holdings_count: '5',
                holdings_price_inr: '100000.00',
                holdings_price_usdt: '1200.00',
                total_holding_price_inr: '100000.00',
                total_holding_price_usdt: '1200.00',
            },
            group_tokens: [],
        }

        expect(portfolio).toHaveProperty('aggregated_data')
        expect(portfolio).toHaveProperty('group_tokens')
        expect(portfolio.aggregated_data).toHaveProperty('holdings_count')
        expect(portfolio.aggregated_data).toHaveProperty('holdings_price_usdt')
    })
})
