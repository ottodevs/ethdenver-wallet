'use client'

import { motion } from 'framer-motion'

export function LoadingScreen() {
    return (
        <div
            className='fixed inset-0 flex items-center justify-center'
            style={{
                background: 'linear-gradient(175deg, #211F2D 12.75%, #12111D 77.82%)',
            }}>
            {/* Spinner centered in the middle */}
            <motion.div
                className='h-16 w-16 rounded-full border-4 border-transparent border-t-blue-500 border-b-blue-500'
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
        </div>
    )
}
