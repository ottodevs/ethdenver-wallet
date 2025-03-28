// Tipos para FedCM y Google Identity Services
interface CredentialResponse {
    credential: string
    select_by: string
    client_id: string
}

interface GoogleIdentityConfig {
    client_id: string
    callback: (response: CredentialResponse) => void
    auto_select?: boolean
    cancel_on_tap_outside?: boolean
    prompt_parent_id?: string
    nonce?: string
    context?: string
    state_cookie_domain?: string
    ux_mode?: 'popup' | 'redirect'
    login_uri?: string
    native_callback?: (response: CredentialResponse) => void
    intermediate_iframe_close_callback?: () => void
    itp_support?: boolean
    use_fedcm_for_prompt?: boolean
}

interface GoogleButtonConfig {
    type?: 'standard' | 'icon'
    theme?: 'outline' | 'filled_blue' | 'filled_black'
    size?: 'large' | 'medium' | 'small'
    text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
    shape?: 'rectangular' | 'pill' | 'circle' | 'square'
    logo_alignment?: 'left' | 'center'
    width?: string
    locale?: string
}

interface GoogleIdentityServices {
    initialize: (config: GoogleIdentityConfig) => void
    renderButton: (parent: HTMLElement, options?: GoogleButtonConfig) => void
    prompt: (momentListener?: (notification: object) => void) => void
    revoke: (hint: string, callback?: (response: object) => void) => void
    disableAutoSelect: () => void
    storeCredential: (credential: object, callback: () => void) => void
    cancel: () => void
}
