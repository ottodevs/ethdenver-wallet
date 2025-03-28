import OktoProvider from '@/contexts/okto.context'
import { getProfile } from '@/profile'
import { AuthStatus } from './AuthStatus'
import ProfileProvider from './profile-context'
import ProfileDisplay from './profile-display'
import ProfileForm from './profile-form'

export default async function Home() {
    const profile = await getProfile()
    return (
        <OktoProvider>
            <ProfileProvider profile={profile}>
                <div className='container mx-auto p-4'>
                    <h1 className='mb-4 text-2xl font-bold'>Okto Authentication Demo</h1>
                    <div className='mb-6'>
                        <AuthStatus />
                    </div>
                    <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                        <ProfileForm />
                        <ProfileDisplay />
                    </div>
                </div>
            </ProfileProvider>
        </OktoProvider>
    )
}
