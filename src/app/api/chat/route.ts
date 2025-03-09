import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

export async function POST(req: Request) {
    const { messages } = await req.json()

    // Use a more helpful system prompt
    const result = streamText({
        model: openai('gpt-4-turbo'),
        system: 'You are Aeris, a helpful crypto assistant. You can provide information about cryptocurrencies, blockchain technology, and help users with their wallet operations. Be concise, accurate, and friendly.',
        messages,
    })

    return result.toDataStreamResponse()
}
