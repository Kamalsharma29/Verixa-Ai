import { GoogleSearch } from 'google-search-results-nodejs'
import { Source } from '@/types'

// Initialize SERPAPI only if API key is available
let search: GoogleSearch | null = null

if (process.env.SERPAPI_KEY) {
  search = new GoogleSearch(process.env.SERPAPI_KEY)
}

export async function searchWeb(query: string, maxResults: number = 10): Promise<Source[]> {
  try {
    if (!search) {
      // Fallback to mock search results when SERPAPI is not available
      return await fallbackSearch(query, maxResults)
    }

    const searchResults = await Promise.race([
      new Promise<any>((resolve, reject) => {
        search!.json({
          q: query,
          num: maxResults,
          hl: 'en',
          gl: 'us'
        }, (data) => {
          if (data.error) {
            reject(new Error(data.error))
          } else {
            resolve(data)
          }
        })
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('SerpAPI timeout after 10 seconds')), 10000)
      )
    ])

    const sources: Source[] = []

    if (searchResults.organic_results) {
      for (const result of searchResults.organic_results) {
        sources.push({
          title: result.title || '',
          url: result.link || '',
          snippet: result.snippet || '',
          favicon: result.favicon || `https://www.google.com/s2/favicons?domain=${new URL(result.link).hostname}`
        })
      }
    }

    return sources
  } catch (error) {
    console.error('SerpAPI search error:', error)
    
    // Fallback to a simple search if SerpAPI fails
    return await fallbackSearch(query, maxResults)
  }
}

// Fallback search method using mock data when APIs are not available
async function fallbackSearch(query: string, maxResults: number): Promise<Source[]> {
  try {
    // If Google Custom Search API is available, use it
    if (process.env.GOOGLE_SEARCH_API_KEY && process.env.GOOGLE_SEARCH_ENGINE_ID) {
      const encodedQuery = encodeURIComponent(query)
      const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_SEARCH_API_KEY}&cx=${process.env.GOOGLE_SEARCH_ENGINE_ID}&q=${encodedQuery}&num=${maxResults}`
      
      const response = await Promise.race([
        fetch(searchUrl),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Google Search API timeout after 8 seconds')), 8000)
        )
      ]) as Response
      const data = await response.json()
      
      if (data.items) {
        return data.items.map((item: any) => ({
          title: item.title || '',
          url: item.link || '',
          snippet: item.snippet || '',
          favicon: `https://www.google.com/s2/favicons?domain=${new URL(item.link).hostname}`
        }))
      }
    }
    
    // Return mock search results when no API keys are available
    return [
      {
        title: `Search Results for "${query}"`,
        url: 'https://example.com',
        snippet: `This is a demo result for your search query: "${query}". Please configure your API keys in .env.local to get real search results.`,
        favicon: 'https://www.google.com/s2/favicons?domain=example.com'
      },
      {
        title: 'Configure API Keys',
        url: 'https://docs.example.com/setup',
        snippet: 'To get real search results, please add your SERPAPI_KEY, OPENAI_API_KEY, and other required API keys to your .env.local file.',
        favicon: 'https://www.google.com/s2/favicons?domain=docs.example.com'
      }
    ].slice(0, maxResults)
  } catch (error) {
    console.error('Fallback search error:', error)
    return [
      {
        title: 'Search Error',
        url: 'https://example.com/error',
        snippet: 'An error occurred while searching. Please check your API configuration.',
        favicon: 'https://www.google.com/s2/favicons?domain=example.com'
      }
    ]
  }
}

export async function searchNews(query: string, maxResults: number = 5): Promise<Source[]> {
  try {
    if (!search) {
      // Fallback to mock news results when SERPAPI is not available
      return await fallbackSearch(query, maxResults)
    }

    const searchResults = await new Promise<any>((resolve, reject) => {
      search!.json({
        q: query,
        tbm: 'nws', // News search
        num: maxResults,
        hl: 'en',
        gl: 'us'
      }, (data) => {
        if (data.error) {
          reject(new Error(data.error))
        } else {
          resolve(data)
        }
      })
    })

    const sources: Source[] = []

    if (searchResults.news_results) {
      for (const result of searchResults.news_results) {
        sources.push({
          title: result.title || '',
          url: result.link || '',
          snippet: result.snippet || '',
          favicon: result.thumbnail || `https://www.google.com/s2/favicons?domain=${new URL(result.link).hostname}`
        })
      }
    }

    return sources
  } catch (error) {
    console.error('News search error:', error)
    return []
  }
}