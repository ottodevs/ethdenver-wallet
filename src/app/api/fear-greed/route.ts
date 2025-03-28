import { NextResponse } from 'next/server'

/**
 * Proxy endpoint for the Fear & Greed Index API
 * This avoids Content Security Policy issues by proxying requests through our own server
 */
export async function GET(request: Request) {
    try {
        // Get the URL parameters
        const url = new URL(request.url)
        const limit = url.searchParams.get('limit')

        // Construct the API URL based on parameters
        let apiUrl = 'https://api.alternative.me/fng/'
        if (limit) {
            apiUrl += `?limit=${limit}`
        }

        // Fetch data from the external API
        const response = await fetch(apiUrl)

        if (!response.ok) {
            throw new Error(`Failed to fetch Fear & Greed data: ${response.status} ${response.statusText}`)
        }

        // Get the JSON data
        const data = await response.json()

        // Return the data
        return NextResponse.json(data)
    } catch (error) {
        console.error('Error in Fear & Greed proxy:', error)
        return NextResponse.json({ error: 'Failed to fetch Fear & Greed data' }, { status: 500 })
    }
}
