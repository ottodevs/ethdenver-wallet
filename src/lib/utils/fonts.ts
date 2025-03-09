import { Outfit } from 'next/font/google'

const outfit = Outfit({
    subsets: ['latin'],
    variable: '--font-outfit',
    display: 'swap',
})

export { outfit }
