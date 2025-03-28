import { addons } from '@storybook/preview-api'
import React, { useEffect, useState } from 'react'

const DARK_MODE_EVENT_NAME = 'DARK_MODE'

export const ThemeDecorator = (Story, context) => {
    const [isDark, setIsDark] = useState(document.body.classList.contains('dark'))

    useEffect(() => {
        const chan = addons.getChannel()

        // Function to handle theme changes
        const handleThemeChange = darkMode => {
            setIsDark(darkMode)

            // Update classes in the body to react to the theme
            if (darkMode) {
                document.body.classList.add('dark')
                document.body.classList.remove('light')
            } else {
                document.body.classList.add('light')
                document.body.classList.remove('dark')
            }
        }

        // Listen for theme change events
        chan.on(DARK_MODE_EVENT_NAME, handleThemeChange)

        // Initialize theme
        handleThemeChange(isDark)

        return () => chan.off(DARK_MODE_EVENT_NAME, handleThemeChange)
    }, [])

    return (
        <div className={isDark ? 'dark' : 'light'}>
            <Story {...context} />
        </div>
    )
}
