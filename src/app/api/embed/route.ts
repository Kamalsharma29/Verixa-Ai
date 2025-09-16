import { NextRequest, NextResponse } from 'next/server'
import { generateEmbeddings } from '@/lib/embeddings'
import { EmbedRequest } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const { texts }: EmbedRequest = await request.json()

    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return NextResponse.json(
        { error: 'Texts array is required' },
        { status: 400 }
      )
    }

    // Limit the number of texts to prevent abuse
    const limitedTexts = texts.slice(0, 50)

    const embeddings = await generateEmbeddings(limitedTexts)

    return NextResponse.json({ embeddings })
  } catch (error) {
    console.error('Embed API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}