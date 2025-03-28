import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url))

// More info at: https://storybook.js.org/docs/writing-tests/test-addon
export default defineConfig({
    resolve: {
        alias: {
            '@': path.resolve(dirname, './src'),
        },
    },
    test: {
        environment: 'jsdom',
        globals: true,
        pool: 'forks', // Use forks instead of threads to avoid segmentation errors
        setupFiles: ['src/__tests__/setup.ts'],
        include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
        exclude: ['**/*.stories.*', '**/.storybook/**/*'],
        typecheck: {
            enabled: true, // Disable type checking during tests
        },
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            reportsDirectory: './coverage',
            include: ['src/**/*.{ts,tsx}'],
            exclude: ['node_modules/', 'test/', '**/*.stories.*', '**/.storybook/**/*'],
        },
    },
})
