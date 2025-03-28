'use client'

import { useCallback, useState } from 'react'

interface UseVoiceRecorderProps {
    onRecordingComplete?: (blob: Blob) => void
    onError?: (error: Error) => void
}

export function useVoiceRecorder({ onRecordingComplete, onError }: UseVoiceRecorderProps = {}) {
    const [isRecording, setIsRecording] = useState(false)
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)

    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const recorder = new MediaRecorder(stream)
            const chunks: Blob[] = []

            recorder.ondataavailable = e => {
                if (e.data.size > 0) {
                    chunks.push(e.data)
                }
            }

            recorder.onstop = () => {
                const audioBlob = new Blob(chunks, { type: 'audio/webm' })
                onRecordingComplete?.(audioBlob)
                stream.getTracks().forEach(track => track.stop())
            }

            recorder.start()
            setMediaRecorder(recorder)
            setIsRecording(true)
        } catch (error) {
            onError?.(error instanceof Error ? error : new Error('Failed to start recording'))
        }
    }, [onRecordingComplete, onError])

    const stopRecording = useCallback(() => {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop()
            setIsRecording(false)
            setMediaRecorder(null)
        }
    }, [mediaRecorder])

    return {
        isRecording,
        startRecording,
        stopRecording,
    }
}
