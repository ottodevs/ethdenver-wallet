import { DocsContainer } from '@storybook/blocks'
import { addons } from '@storybook/preview-api'
import { themes } from '@storybook/theming'
import React, { useEffect, useState } from 'react'

const DARK_MODE_EVENT_NAME = 'DARK_MODE'

export default ({ children, ...props }) => {
    const [isDark, setIsDark] = useState(document.body.classList.contains('dark'))

    useEffect(() => {
        const chan = addons.getChannel()
        chan.on(DARK_MODE_EVENT_NAME, setIsDark)
        return () => chan.off(DARK_MODE_EVENT_NAME, setIsDark)
    }, [])

    return (
        <DocsContainer {...props} context={props.context} theme={isDark ? themes.dark : themes.light}>
            {children}
        </DocsContainer>
    )
}
