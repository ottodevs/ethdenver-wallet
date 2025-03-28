import type { Preview } from '@storybook/react'
import '../src/app/globals.css'
import ThemedContainer from './ThemedContainer'
import { ThemeDecorator } from './ThemeDecorator'

const preview: Preview = {
    parameters: {
        actions: { argTypesRegex: '^on[A-Z].*' },
        controls: {
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/,
            },
        },
        darkMode: {
            stylePreview: true,
        },
        docs: {
            container: ThemedContainer,
        },
        options: {
            storySort: {
                order: ['Design System', ['Introduction', 'Animations', 'Backgrounds', 'Borders & Radii', 'Colors']],
            },
        },
        backgrounds: {
            disable: true, // Disable backgrounds from Storybook, use our own styles
        },
    },
    decorators: [ThemeDecorator],
}

export default preview
