import type { Meta, StoryObj } from '@storybook/react'
import { OptionsDropdown } from './options-dropdown'

const meta: Meta<typeof OptionsDropdown> = {
    title: 'Components/OptionsDropdown',
    component: OptionsDropdown,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof OptionsDropdown>

export const Default: Story = {}

export const LightTheme: Story = {
    parameters: {
        theme: 'light',
    },
}

export const DarkTheme: Story = {
    parameters: {
        theme: 'dark',
    },
}
