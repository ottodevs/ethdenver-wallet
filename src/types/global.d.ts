interface Window {
    google?: {
        accounts?: {
            id: {
                initialize: (config: {
                    allowed_parent_origin?: string | string[]
                    auto_select?: boolean
                    callback?: (response: { credential: string; select_by: string; state?: string }) => void
                    cancel_on_tap_outside?: boolean
                    client_id: string
                    context?: 'signin' | 'signup' | 'use'
                    hd?: string
                    intermediate_iframe_close_callback?: () => void
                    itp_support?: boolean
                    login_hint?: string
                    login_uri?: string
                    native_callback?: (credential: { id: string; password: string }) => void
                    nonce?: string
                    prompt_parent_id?: string
                    state_cookie_domain?: string
                    use_fedcm_for_prompt?: boolean
                    ux_mode?: 'popup' | 'redirect'
                }) => void
                renderButton: (
                    container: HTMLElement,
                    options: {
                        type?: 'standard' | 'icon'
                        theme?: 'outline' | 'filled_blue' | 'filled_black'
                        size?: 'large' | 'medium' | 'small'
                        text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
                        shape?: 'rectangular' | 'pill' | 'circle' | 'square'
                        logo_alignment?: 'left' | 'center'
                        width?: string | number
                        locale?: string
                        click_listener?: () => void
                        state?: string
                    },
                ) => void
                prompt: (
                    momentListener?: (notification: {
                        isDisplayMoment: () => boolean
                        isDisplayed: () => boolean
                        isNotDisplayed: () => boolean
                        getNotDisplayedReason: () => string
                        isSkippedMoment: () => boolean
                        getSkippedReason: () => string
                        isDismissedMoment: () => boolean
                        getDismissedReason: () => string
                        getMomentType: () => string
                    }) => void,
                ) => void
                revoke: (hint: string, callback?: (response: { successful: boolean; error?: string }) => void) => void
                cancel: () => void
                disableAutoSelect: () => void
                storeCredential: (credential: { id: string; password: string }, callback?: () => void) => void
            }
        }
    }
    handleCredentialResponse: (response: { credential: string; select_by: string; state?: string }) => void
    initializeOktoWithGoogleToken: (token: string) => Promise<void>
    googleScriptLoaded: boolean
    onGoogleLibraryLoad?: () => void
}

// Extender los tipos para NextAuth
// declare module 'next-auth' {
//     interface Session {
//         id_token?: string
//     }

//     interface User {
//         id_token?: string
//     }
// }

// declare module 'next-auth/jwt' {
//     interface JWT {
//         id_token?: string
//     }
// }
