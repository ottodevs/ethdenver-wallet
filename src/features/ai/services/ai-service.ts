import type { Message } from '../types'

export async function getAiCompletion(messages: Message[]): Promise<string> {
    // This would typically call an external AI API like OpenAI
    // For now, we'll simulate a response

    // Extract the last user message
    const lastUserMessage =
        messages
            .filter(m => m.role === 'user')
            .pop()
            ?.content.toLowerCase() || ''

    // Simple pattern matching for demo purposes
    if (lastUserMessage.includes('hello') || lastUserMessage.includes('hi')) {
        return 'Hello! How can I help you with your crypto questions today?'
    }

    if (lastUserMessage.includes('what is bitcoin')) {
        return 'Bitcoin is a decentralized digital currency created in 2009. It follows the ideas set out in a whitepaper by the pseudonymous Satoshi Nakamoto. Bitcoin offers lower transaction fees than traditional online payment mechanisms and, unlike government-issued currencies, it is operated by a decentralized authority.'
    }

    if (lastUserMessage.includes('ethereum') || lastUserMessage.includes('eth')) {
        return 'Ethereum is a decentralized, open-source blockchain with smart contract functionality. Ether (ETH) is the native cryptocurrency of the platform. It is the second-largest cryptocurrency by market capitalization, after Bitcoin. Ethereum is used for decentralized applications (dApps) and executing smart contracts.'
    }

    if (lastUserMessage.includes('wallet') || lastUserMessage.includes('how to use')) {
        return "Your Aeris Wallet allows you to store, send, and receive cryptocurrencies. To use it:\n\n1. **View your balance** on the main dashboard\n2. **Send crypto** by clicking the SEND button\n3. **Receive crypto** by sharing your wallet address\n4. **Swap tokens** using the SWAP feature\n5. **Buy crypto** directly in the app\n\nIs there a specific feature you'd like to learn more about?"
    }

    // Default response
    return "I'm your crypto assistant. I can help with information about cryptocurrencies, blockchain technology, and how to use your wallet. What would you like to know?"
}
