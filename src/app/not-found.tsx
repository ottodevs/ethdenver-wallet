import Link from 'next/link'

export default function NotFound() {
    return (
        <div className='flex h-screen w-screen flex-col items-center justify-center'>
            <h1 className='text-4xl font-bold'>404 Not Found</h1>

            <Link href='/'>Go to Home</Link>
        </div>
    )
}
