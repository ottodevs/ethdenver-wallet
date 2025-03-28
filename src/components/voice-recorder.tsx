import { Button } from '@/components/ui/button'
import { useVoiceRecorder } from '@/hooks/use-voice-recorder'
import { cn } from '@/lib/utils'
import { Mic, MicOff } from 'lucide-react'

interface VoiceRecorderProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    onTranscript: (text: string) => void
}

export default function VoiceRecorder({ className, disabled, ...props }: VoiceRecorderProps) {
    const { isRecording, startRecording, stopRecording } = useVoiceRecorder({})

    const handleClick = async () => {
        if (isRecording) {
            stopRecording()
        } else {
            await startRecording()
        }
    }

    return (
        <Button
            type='button'
            size='icon'
            variant={isRecording ? 'destructive' : 'outline'}
            className={cn('h-10 w-10', className)}
            onClick={handleClick}
            disabled={disabled}
            title={'Record voice message'}
            {...props}>
            {isRecording ? <MicOff className='h-4 w-4 animate-pulse' /> : <Mic className='h-4 w-4' />}
            <span className='sr-only'>{isRecording ? 'Stop recording' : 'Start recording'}</span>
        </Button>
    )
}
