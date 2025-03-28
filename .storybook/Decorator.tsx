import { DocsContainer } from '@storybook/blocks'
import React from 'react'

export const Decorator = (props: any, children: any) => {
    // const isDark = useDarkMode()
    const currentProps = { ...props }
    // currentProps.theme = isDark ? themes.dark : themes.light

    console.log('currentProps', currentProps)
    return <DocsContainer {...currentProps}>{children}</DocsContainer>
}
