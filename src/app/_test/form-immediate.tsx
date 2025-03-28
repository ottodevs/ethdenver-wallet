import { getProfile } from '@/profile'
import EditProfile from './edit-profile'

export default async function FormImmediate() {
    const profile = await getProfile()

    return <EditProfile profile={profile} />
}
