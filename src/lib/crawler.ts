import { CrawlResult } from '@/types'

export async function crawlUrls(urls: string[]): Promise<CrawlResult[]> {
  const results: CrawlResult[] = []

  for (const url of urls) {
    try {
      const result = await crawlSingleUrl(url)
      results.push(result)
    } catch (error) {
      console.error(`Error crawling ${url}:`, error)
      results.push({
        url,
        title: '',
        content: '',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  return results
}

export async function crawlSingleUrl(url: string): Promise<CrawlResult> {
  try {
    // Create AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort('Crawler timeout: 10 seconds exceeded'), 10000) // 10 second timeout
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      signal: controller.signal,
      mode: 'cors',
      credentials: 'omit'
    })
    
    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const html = await response.text()
    const { title, content } = extractContentFromHtml(html)

    return {
      url,
      title: title || new URL(url).hostname,
      content: content || 'No content extracted'
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout: ${url} took longer than 10 seconds to respond`)
      }
      throw new Error(`Failed to crawl ${url}: ${error.message}`)
    }
    throw new Error(`Failed to crawl ${url}: Unknown error`)
  }
}

function extractContentFromHtml(html: string): { title: string; content: string } {
  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  const title = titleMatch ? titleMatch[1].trim().replace(/&[^;]+;/g, '').replace(/\s+/g, ' ') : ''

  // Try to extract main content first
  let content = extractMainContent(html)
  
  if (!content || content.length < 100) {
    // Fallback to general content extraction
    content = extractGeneralContent(html)
  }

  // Clean and limit content
  content = cleanContent(content)
  
  // Limit content length to avoid overwhelming responses
  if (content.length > 3000) {
    content = content.substring(0, 3000) + '...'
  }

  return { title, content }
}

function extractMainContent(html: string): string {
  // First try weather-specific content extraction
  const weatherContent = extractWeatherContent(html)
  if (weatherContent) {
    return weatherContent
  }

  // Try to find main content areas
  const contentSelectors = [
    /<article[^>]*>([\s\S]*?)<\/article>/gi,
    /<main[^>]*>([\s\S]*?)<\/main>/gi,
    /<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    /<div[^>]*class="[^"]*article[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    /<div[^>]*class="[^"]*post[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    /<section[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/section>/gi
  ]

  for (const selector of contentSelectors) {
    const matches = html.match(selector)
    if (matches && matches.length > 0) {
      return matches.map(match => {
        const contentMatch = match.match(/>([\s\S]*)</)
        return contentMatch ? contentMatch[1] : ''
      }).join(' ')
    }
  }

  return ''
}

function extractWeatherContent(html: string): string {
  // Enhanced weather patterns including Indian formats
  const weatherPatterns = [
    // Temperature patterns (supports Indian formats)
    /temperature[^\d]*(\d+)°?[CF]?/gi,
    /(\d+)°[CF]?/g,
    /temp[^\d]*(\d+)/gi,
    /(\d+)\s*degrees?/gi,
    /feels like[^\d]*(\d+)°?[CF]?/gi,
    
    // Weather conditions (expanded for Indian weather)
    /(sunny|cloudy|rainy|stormy|clear|overcast|partly cloudy|thunderstorm|snow|fog|mist|drizzle|hot|warm|cool|cold|humid|dry|pleasant|moderate|extreme|hazy|dusty)/gi,
    
    // Humidity and wind (enhanced patterns)
    /humidity[^\d]*(\d+)%/gi,
    /(\d+)%[^\w]*humidity/gi,
    /wind[^\d]*(\d+)[^\d]*(mph|kmh|km\/h|kph)/gi,
    /wind.*?(\d+).*?(mph|kmh|km\/h|kph)/gi,
    
    // Forecast information
    /(today|tomorrow|tonight)[^.]*?(\d+)°?[CF]?/gi,
    /(high|low)[^\d]*(\d+)°?[CF]?/gi,
    /(morning|afternoon|evening|night)[^.]*?(\d+)°?[CF]?/gi,
    
    // Indian weather specific patterns
    /(monsoon|pre-monsoon|post-monsoon)/gi,
    /air quality[^\d]*(\d+)/gi,
    /aqi[^\d]*(\d+)/gi,
    /visibility[^\d]*(\d+)[^\d]*(km|miles?)/gi,
    /uv[^\d]*(\d+)|uv index[^\d]*(\d+)/gi,
    
    // Location-specific patterns for Indian cities
    /(meerut|delhi|mumbai|bangalore|chennai|kolkata|hyderabad|pune|ahmedabad|jaipur|lucknow|kanpur|nagpur|indore|bhopal)[^.]*?(\d+)°?[CF]?/gi
  ]
  
  const matches = []
  
  for (const pattern of weatherPatterns) {
    const found = html.match(pattern)
    if (found) {
      matches.push(...found)
    }
  }
  
  // Also extract weather-related sentences
  const sentences = html.split(/[.!?]+/)
  const weatherSentences = sentences.filter(sentence => {
    const lowerSentence = sentence.toLowerCase()
    return (
      (lowerSentence.includes('temperature') || 
       lowerSentence.includes('weather') ||
       lowerSentence.includes('°') ||
       lowerSentence.includes('degrees') ||
       lowerSentence.includes('humidity') ||
       lowerSentence.includes('wind') ||
       /\d+°[CF]?/.test(sentence)) &&
      sentence.trim().length > 15 &&
      sentence.trim().length < 200
    )
  }).slice(0, 5)
  
  if (matches.length > 0 || weatherSentences.length > 0) {
    const combinedContent = [...matches.slice(0, 10), ...weatherSentences].join(' ')
    return combinedContent.substring(0, 1000) // Limit content length
  }
  
  return ''
}

function extractGeneralContent(html: string): string {
  // Remove unwanted elements and extract meaningful text
  let content = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
    .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    // Remove class and id attributes that contain meaningless data
    .replace(/class="[^"]*DaybreakLargeScreen[^"]*"/gi, '')
    .replace(/class="[^"]*Card--[^"]*"/gi, '')
    .replace(/class="[^"]*region[^"]*"/gi, '')
    .replace(/data-testid="[^"]*"/gi, '')
    .replace(/aria-label="[^"]*"/gi, '')
    // Extract text content
    .replace(/<[^>]+>/g, ' ')
    // Clean up extra spaces and meaningless text
    .replace(/\s+/g, ' ')
    .replace(/div|class|aria|label|main|section|removeIfEmpty/gi, '')
    .trim()

  return content
}

function cleanContent(content: string): string {
  return content
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-zA-Z0-9#]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .replace(/[^\w\s.,!?;:()\[\]{}"'-]/g, ' ')
    .trim()
}

// Extract main content from common article structures
export function extractArticleContent(html: string): string {
  const articleSelectors = [
    'article',
    '[role="main"]',
    '.content',
    '.article-content',
    '.post-content',
    '.entry-content',
    'main'
  ]

  for (const selector of articleSelectors) {
    const regex = new RegExp(`<${selector}[^>]*>([\s\S]*?)<\/${selector}>`, 'i')
    const match = html.match(regex)
    if (match) {
      return extractContentFromHtml(match[1]).content
    }
  }

  // Fallback to full HTML extraction
  return extractContentFromHtml(html).content
}