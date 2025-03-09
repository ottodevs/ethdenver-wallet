'use client'

import { signIn } from 'next-auth/react'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function SignInContent() {
    const searchParams = useSearchParams()
    const callbackUrl = searchParams.get('callbackUrl') || '/'
    const error = searchParams.get('error')

    const handleGoogleSignIn = () => {
        signIn('google', { callbackUrl })
    }

    return (
        <div className='relative flex min-h-screen w-full flex-col items-center justify-between bg-[#141419]'>
            {/* Background SVG */}
            <div className='absolute inset-0 flex items-center justify-center'>
                <Image
                    src='/onboarding.svg'
                    alt='Aeris Onboarding'
                    fill
                    priority
                    crossOrigin='anonymous'
                    className='object-cover'
                />
            </div>

            {/* Error message */}
            {error && (
                <div className='bg-destructive/10 text-destructive absolute top-4 left-1/2 z-10 mb-4 w-full max-w-md -translate-x-1/2 transform rounded-md p-3 text-sm'>
                    {error === 'OAuthSignin' && 'Error starting the sign in process. Please try again.'}
                    {error === 'OAuthCallback' && 'Error during the sign in callback. Please try again.'}
                    {error === 'OAuthAccountNotLinked' && 'This account is already linked to another user.'}
                    {error === 'Callback' && 'Error during the callback process. Please try again.'}
                    {error === 'Default' && 'An unexpected error occurred. Please try again.'}
                    {!['OAuthSignin', 'OAuthCallback', 'OAuthAccountNotLinked', 'Callback', 'Default'].includes(
                        error,
                    ) && 'An error occurred during sign in. Please try again.'}
                </div>
            )}

            {/* Empty space to push the button down */}
            <div className='flex-grow' />

            {/* Sign in button */}
            <div className='z-10 mb-12 w-full max-w-md px-4'>
                <button
                    onClick={handleGoogleSignIn}
                    className='flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-medium text-black shadow-sm hover:bg-gray-100'>
                    <Image src='/google-logo.svg' alt='Google' width={20} height={20} className='h-5 w-5' />
                    Sign in with Google
                </button>
            </div>
        </div>
    )
}

export default function SignIn() {
    return (
        <Suspense fallback={<div className='min-h-screen bg-[#141419]' />}>
            <SignInContent />
        </Suspense>
    )
}
