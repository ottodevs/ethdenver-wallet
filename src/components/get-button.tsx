'use client'
import type { OktoClient } from '@okto_web3/react-sdk'
import { useOkto } from '@okto_web3/react-sdk'
import React, { useState } from 'react'

interface GetButtonProps {
    title: string
    apiFn: (oktoClient: OktoClient) => Promise<unknown>
}

const GetButton: React.FC<GetButtonProps> = ({ title, apiFn }) => {
    const [modalVisible, setModalVisible] = useState(false)
    const [resultData, setResultData] = useState('')
    const oktoClient = useOkto()

    const handleButtonClick = () => {
        apiFn(oktoClient)
            .then((result: unknown) => {
                console.log(`${title}:`, result)
                const resultData = JSON.stringify(result, null, 2)
                setResultData(resultData !== 'null' ? resultData : 'No result')
                setModalVisible(true)
            })
            .catch((error: unknown) => {
                console.error(`${title} error:`, error)
                setResultData(`error: ${error}`)
                setModalVisible(true)
            })
    }

    const handleClose = () => setModalVisible(false)

    return (
        <div className='text-center text-white'>
            <button className='w-full rounded bg-blue-500 px-4 py-2 text-white' onClick={handleButtonClick}>
                {title}
            </button>

            {modalVisible && (
                <div className='bg-opacity-50 fixed inset-0 flex items-center justify-center bg-gray-800'>
                    <div className='w-11/12 max-w-2xl rounded-lg bg-black p-6'>
                        <div className='mb-4 flex items-center justify-between border-b pb-2'>
                            <h2 className='text-lg font-semibold'>{title} Result</h2>
                            <button className='text-gray-500 hover:text-gray-700' onClick={handleClose}>
                                ×
                            </button>
                        </div>
                        <div className='max-h-96 overflow-y-auto text-left text-white'>
                            <pre className='break-words whitespace-pre-wrap text-white'>{resultData}</pre>
                        </div>
                        <div className='mt-4 text-right'>
                            <button className='rounded bg-gray-500 px-4 py-2 text-white' onClick={handleClose}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default GetButton
