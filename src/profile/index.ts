export interface Profile {
    name: string
    email: string
    phone: string
    address: string
}

// const DATABASE_PATH = './src/profile/data/profile.json'

export const getProfile = async (): Promise<Profile> => {
    // const profile = await fs.readFile(DATABASE_PATH, 'utf8')
    // return JSON.parse(profile)
    return {
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        address: '123 Main St, Anytown, USA',
    }
}

export const updateProfile = async (profile: Partial<Profile>): Promise<Profile> => {
    console.log('updating profile with', profile)
    const existingProfile = await getProfile()
    const updatedProfile = { ...existingProfile, ...profile }
    // await fs.writeFile(DATABASE_PATH, JSON.stringify(updatedProfile, null, 2))
    return updatedProfile
}
