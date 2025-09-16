import { NextRequest, NextResponse } from 'next/server'
import { crawlUrls } from '@/lib/crawler'
import { CrawlRequest } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const { urls }: CrawlRequest = await request.json()

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { error: 'URLs array is required' },
        { status: 400 }
      )
    }

    // Limit the number of URLs to prevent abuse
    const limitedUrls = urls.slice(0, 10)

    const results = await crawlUrls(limitedUrls)

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Crawl API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}