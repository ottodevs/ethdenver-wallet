import type { StorybookConfig } from '@storybook/nextjs'

const config: StorybookConfig = {
    stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
    addons: [
        '@storybook/addon-essentials',
        '@storybook/addon-onboarding',
        '@chromatic-com/storybook',
        'storybook-dark-mode',
        // "@storybook/experimental-addon-test"
    ],
    framework: '@storybook/nextjs',
    staticDirs: ['../public'],
}
export default config
