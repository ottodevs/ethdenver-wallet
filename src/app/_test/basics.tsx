'use client'

import { Memo, observer, useObservable } from '@legendapp/state/react'

function Basics() {
    const name$ = useObservable({
        first: 'John',
        last: 'Doe',
        full: () => `${name$.first.get()} ${name$.last.get()}`,
    })
    return (
        <div className='container flex h-screen w-screen flex-col justify-center gap-4'>
            <h1 className='text-2xl font-bold'>Basics</h1>
            <input
                className='rounded border border-gray-300 p-2'
                value={name$.first.get()}
                onChange={e => name$.first.set(e.target.value)}
                placeholder='First Name'
            />

            {/* <ReactiveInput
                className='rounded border border-gray-300 p-2'
                $value={name$.last}
                onChange={e => name$.last.set(e?.target.value)}
                $defaultValue={''}
                placeholder='Last Name'
            /> */}

            <p>Full Name: {name$.full.get()}</p>
            <Memo>
                <p>First Name: {name$.first.get()}</p>
            </Memo>
        </div>
    )
}

export default observer(Basics)
