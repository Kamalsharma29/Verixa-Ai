import { NextRequest, NextResponse } from 'next/server'
import { searchWeb } from '@/lib/serpapi'
import { crawlUrls } from '@/lib/crawler'
import { generateEmbeddings } from '@/lib/embeddings'
import { storeInVectorDB, searchVectorDB } from '@/lib/vectordb'
import { generateResponse } from '@/lib/llm'
import { SearchRequest, SearchResult } from '@/types'

// Function to optimize content for better AI responses
function optimizeContentForResponse(content: string, query: string): string {
  // Remove excessive whitespace and normalize
  let optimized = content
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .replace(/class="[^"]*"/gi, '') // Remove class attributes
    .replace(/div|span|section|article/gi, '') // Remove HTML element names
    .trim()

  // Check if this is a weather query
  const isWeatherQuery = /weather|temperature|forecast|climate|rain|sunny|cloudy/i.test(query)
  
  if (isWeatherQuery) {
    return extractWeatherInfo(optimized, query)
  }

  // Extract sentences that are most relevant to the query
  const queryWords = query.toLowerCase().split(/\s+/)
  const sentences = optimized.split(/[.!?]+/).filter(s => s.trim().length > 20)
  
  // Score sentences based on query relevance
  const scoredSentences = sentences.map(sentence => {
    const lowerSentence = sentence.toLowerCase()
    const score = queryWords.reduce((acc, word) => {
      return acc + (lowerSentence.includes(word) ? 1 : 0)
    }, 0)
    return { sentence: sentence.trim(), score }
  })

  // Sort by relevance and take top sentences
  const topSentences = scoredSentences
    .filter(item => item.score > 0 || scoredSentences.length < 3)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(item => item.sentence)

  // If we have relevant sentences, use them; otherwise use first part of content
  if (topSentences.length > 0) {
    optimized = topSentences.join('. ') + '.'
  } else {
    // Fallback to first 800 characters
    optimized = optimized.substring(0, 800)
    if (optimized.length === 800) {
      optimized += '...'
    }
  }

  return optimized
}

// Extract weather-specific information
function extractWeatherInfo(content: string, query: string): string {
  const weatherInfo = []
  const location = extractLocationFromQuery(query)
  
  // Enhanced temperature extraction (supports Celsius, Fahrenheit, and Indian formats)
  const tempMatches = content.match(/(\d+)°[CF]?|temperature[^\d]*(\d+)[^\d]*°?[CF]?|(\d+)[^\d]*degrees?/gi)
  if (tempMatches) {
    const temp = tempMatches[0].replace(/[^\d°CF]/g, '')
    weatherInfo.push(`Temperature: ${temp}`)
  }
  
  // Enhanced weather conditions (including Indian weather terms)
  const conditionMatches = content.match(/(sunny|cloudy|rainy|stormy|clear|overcast|partly cloudy|thunderstorm|snow|fog|mist|drizzle|hot|warm|cool|cold|humid|dry|pleasant|moderate|extreme)/gi)
  if (conditionMatches) {
    weatherInfo.push(`Condition: ${conditionMatches[0]}`)
  }
  
  // Enhanced humidity extraction
  const humidityMatches = content.match(/humidity[^\d]*(\d+)%|(\d+)%[^\w]*humidity/gi)
  if (humidityMatches) {
    const humidity = humidityMatches[0].match(/\d+/)?.[0]
    if (humidity) weatherInfo.push(`Humidity: ${humidity}%`)
  }
  
  // Enhanced wind extraction (supports km/h, mph, and Indian formats)
  const windMatches = content.match(/wind[^\d]*(\d+)[^\d]*(mph|kmh|km\/h|kph)|wind.*?(\d+).*?(mph|kmh|km\/h|kph)/gi)
  if (windMatches) {
    weatherInfo.push(`Wind: ${windMatches[0]}`)
  }
  
  // Extract feels like temperature
  const feelsLikeMatches = content.match(/feels like[^\d]*(\d+)°?[CF]?/gi)
  if (feelsLikeMatches) {
    weatherInfo.push(`Feels like: ${feelsLikeMatches[0]}`)
  }
  
  // Extract visibility
  const visibilityMatches = content.match(/visibility[^\d]*(\d+)[^\d]*(km|miles?)/gi)
  if (visibilityMatches) {
    weatherInfo.push(`Visibility: ${visibilityMatches[0]}`)
  }
  
  // Extract UV index
  const uvMatches = content.match(/uv[^\d]*(\d+)|uv index[^\d]*(\d+)/gi)
  if (uvMatches) {
    weatherInfo.push(`UV Index: ${uvMatches[0]}`)
  }
  
  // Add location if found
  if (location && weatherInfo.length > 0) {
    weatherInfo.unshift(`Weather in ${location}:`)
  }
  
  if (weatherInfo.length > 0) {
    return weatherInfo.join('. ')
  }
  
  // Enhanced fallback - look for any weather-related content
  const weatherKeywords = /(temperature|weather|forecast|climate|°|degrees|celsius|fahrenheit|sunny|cloudy|rain|wind|humidity)/gi
  const sentences = content.split(/[.!?]+/)
  const weatherSentences = sentences.filter(sentence => 
    weatherKeywords.test(sentence) && sentence.trim().length > 10
  ).slice(0, 3)
  
  if (weatherSentences.length > 0) {
    return weatherSentences.join('. ').trim() + '.'
  }
  
  // Final fallback
  return content.substring(0, 500) + (content.length > 500 ? '...' : '')
}

// Extract location from weather query
function extractLocationFromQuery(query: string): string | null {
  // Common patterns for location extraction
  const locationPatterns = [
    /weather\s+(?:in|of|for)\s+([^\s,]+(?:\s+[^\s,]+)*)/i,
    /([^\s,]+(?:\s+[^\s,]+)*)\s+weather/i,
    /(meerut|delhi|mumbai|bangalore|chennai|kolkata|hyderabad|pune|ahmedabad|jaipur|lucknow|kanpur|nagpur|indore|bhopal|visakhapatnam|patna|vadodara|ghaziabad|ludhiana|agra|nashik|faridabad|rajkot|meerut)/gi
  ]
  
  for (const pattern of locationPatterns) {
    const match = query.match(pattern)
    if (match && match[1]) {
      return match[1].trim()
    }
  }
  
  return null
}

export async function POST(request: NextRequest) {
  try {
    // Check if request is already aborted
    if (request.signal?.aborted) {
      console.log('🚨 Request already aborted before processing')
      return NextResponse.json(
        { error: 'Request was cancelled' },
        { status: 499 }
      )
    }

    let requestBody
    try {
      requestBody = await request.json()
    } catch (jsonError) {
      console.error('❌ JSON parsing error:', jsonError)
      return NextResponse.json(
        { error: 'Invalid JSON format' },
        { status: 400 }
      )
    }
    
    const { query, maxResults = 5 }: SearchRequest = requestBody
    
    // Quick response for simple greetings
    const lowerQuery = query.toLowerCase().trim()
    if (['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening'].includes(lowerQuery)) {
      return NextResponse.json({
        response: `Hello! I'm Verixa AI, your intelligent search assistant. How can I help you today? 🤖✨`,
        sources: []
      })
    }

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    // Step 1: Search the web for relevant URLs
    const searchResults = await searchWeb(query, maxResults)
    
    // Check if request was aborted during web search
    if (request.signal?.aborted) {
      console.log('🚨 Request aborted during web search')
      return NextResponse.json(
        { error: 'Request was cancelled' },
        { status: 499 }
      )
    }
    
    if (searchResults.length === 0) {
      return NextResponse.json({
        response: "I couldn't find any relevant information for your query. Please try rephrasing your question.",
        sources: []
      })
    }

    // Step 2: Crawl the URLs to get content
    const urls = searchResults.map(result => result.url)
    const crawledContent = await crawlUrls(urls)

    // Check if request was aborted during crawling
    if (request.signal?.aborted) {
      console.log('🚨 Request aborted during content crawling')
      return NextResponse.json(
        { error: 'Request was cancelled' },
        { status: 499 }
      )
    }

    // Step 3: Generate embeddings for the content
    const validContent = crawledContent.filter(content => !content.error)
    if (validContent.length === 0) {
      return NextResponse.json({
        response: "I found some relevant sources but couldn't access their content. Please try a different query.",
        sources: searchResults
      })
    }

    const embeddings = await generateEmbeddings(
      validContent.map(content => content.content)
    )

    // Check if request was aborted during embedding generation
    if (request.signal?.aborted) {
      console.log('🚨 Request aborted during embedding generation')
      return NextResponse.json(
        { error: 'Request was cancelled' },
        { status: 499 }
      )
    }

    // Step 4: Store in vector database
    await storeInVectorDB(embeddings, validContent)

    // Step 5: Search vector database for most relevant content
    const relevantContent = await searchVectorDB(query, 3)

    // Step 6: Filter and optimize content for better responses
    const filteredContent = relevantContent
      .filter(item => item.content && item.content.length > 50) // Filter out very short content
      .map(item => ({
        ...item,
        content: optimizeContentForResponse(item.content, query)
      }))

    // Step 7: Generate AI response with optimized context and API-level timeout
    const contextText = filteredContent
      .map(item => `**${item.title}**\n${item.content}`)
      .join('\n\n---\n\n')
    
    const sources = filteredContent.map(item => ({
      title: item.title,
      url: item.url
    }))
    
    // Add API-level timeout to prevent hanging (40 seconds)
    const aiResponse = await Promise.race([
      generateResponse(query, contextText, sources),
      new Promise<string>((_, reject) => 
        setTimeout(() => reject(new Error('API timeout: Response generation took too long')), 40000)
      )
    ]).catch(error => {
      console.error('🚨 API-level timeout or error:', error)
      return `I found relevant information about "${query}" but couldn't generate a complete response due to high server load. Here's what I found:\n\n${contextText.substring(0, 500)}...\n\n**Sources:**\n${sources.slice(0, 3).map(s => `• ${s.title}`).join('\n')}\n\nPlease try again in a moment.`
    })

    const result: SearchResult = {
      response: aiResponse,
      sources: searchResults
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}