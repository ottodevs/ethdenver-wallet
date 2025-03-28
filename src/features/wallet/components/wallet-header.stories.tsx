import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import { WalletHeader } from './wallet-header'

const meta = {
    title: 'Wallet/WalletHeader',
    component: WalletHeader,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {
        onQrCodeClick: { action: 'QR code clicked' },
    },
} satisfies Meta<typeof WalletHeader>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithQrCodeAction: Story = {
    args: {
        onQrCodeClick: fn(),
    },
}

export const LightTheme: Story = {
    args: {
        onQrCodeClick: fn(),
    },
    parameters: {
        backgrounds: { default: 'light' },
        theme: 'light',
    },
    decorators: [
        Story => (
            <div className='light'>
                <Story />
            </div>
        ),
    ],
}

export const DarkTheme: Story = {
    args: {
        onQrCodeClick: fn(),
    },
    parameters: {
        backgrounds: { default: 'dark' },
        theme: 'dark',
    },
    decorators: [
        Story => (
            <div className='dark'>
                <Story />
            </div>
        ),
    ],
}
