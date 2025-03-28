'use client'

import { useGoogleAuth } from '@/hooks/useGoogleAuth'
import googleLogo from '@/public/google-logo.svg'
import onboarding from '@/public/onboarding.svg'
import { Loader2 } from 'lucide-react'
import Image from 'next/image'
import Script from 'next/script'
import { Suspense } from 'react'

function LoginContent() {
    // const { initializeOktoWithSession } = useOktoAuth()
    // const isAuthenticated = useObservable(oktoState.auth.isAuthenticated)
    // const isLoading = useObservable(oktoState.auth.loading)
    // const { data: session, status } = useSession()
    // const initializationAttempted = useRef(false)

    // Convert the session to the expected type
    //         const typedSession: Session = {
    //             ...session,
    //             user: session.user || { name: null, email: null, image: null },
    //         }

    //         initializeOktoWithSession(typedSession)
    //             .then(() => {
    //                 console.log('Okto initialized successfully with NextAuth session')
    //                 // Let SessionSync handle the redirect
    //             })
    //             .catch(error => {
    //                 console.error('Failed to initialize Okto with NextAuth session:', error)
    //                 // Reset the flag after a delay to allow for retry
    //                 setTimeout(() => {
    //                     initializationAttempted.current = false
    //                 }, 5000)
    //             })

    const { isFedCMAvailable, authenticateWithFedCM, signInWithGoogle, isAuthenticating } = useGoogleAuth()

    return (
        <div className='relative flex min-h-screen w-full flex-col items-center justify-between bg-[#141419]'>
            {/* Background SVG */}
            <div className='absolute inset-0 flex items-center justify-center'>
                <Image src={onboarding} alt='Aeris Onboarding' fill crossOrigin='anonymous' className='object-cover' />
            </div>

            {/* Empty space to push the button down */}
            <div className='flex-grow' />

            {/* Google Sign-In button container */}
            <div className='z-10 mb-12 flex w-full max-w-md flex-col gap-4 px-4'>
                {/* FedCM button - shown when FedCM is available */}
                <button
                    onClick={isFedCMAvailable ? authenticateWithFedCM : signInWithGoogle}
                    className='relative flex h-12 items-center justify-center overflow-hidden rounded-full bg-blue-600 text-white transition-all duration-500 ease-in-out hover:bg-blue-700 active:bg-blue-800'
                    disabled={isAuthenticating}>
                    <div
                        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ease-in-out ${isAuthenticating ? 'opacity-100' : 'opacity-0'}`}>
                        <span className='flex items-center gap-2'>
                            <Loader2 className='animate-spin' />
                            <span className='transition-all duration-500 ease-in-out'>Signing you in...</span>
                        </span>
                    </div>
                    <div
                        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ease-in-out ${isAuthenticating ? 'opacity-0' : 'opacity-100'}`}>
                        <span className='flex items-center gap-2'>
                            <Image
                                src={googleLogo}
                                alt='Google Logo'
                                className='size-6 transition-transform duration-500 ease-in-out'
                            />
                            <span className='transition-all duration-500 ease-in-out'>Use Google to sign in</span>
                        </span>
                    </div>
                </button>
            </div>
        </div>
    )
}

export default function LoginPage() {
    return (
        <>
            <Suspense fallback={<div className='min-h-screen bg-[#141419]' />}>
                <LoginContent />
            </Suspense>

            {/* Load Google Identity Services library */}
            <Script
                src='https://accounts.google.com/gsi/client'
                strategy='afterInteractive'
                onLoad={() => {
                    console.log('🔐 [LoginPage] Google Identity Services library loaded')
                    window.dispatchEvent(new Event('googleScriptLoaded'))
                }}
                async
                defer
            />
        </>
    )
}
