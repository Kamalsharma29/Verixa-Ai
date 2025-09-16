import Exa from 'exa-js'
import { Source } from '@/types'

const exa = new Exa(process.env.EXA_API_KEY || '')

export async function searchWithExa(
  query: string,
  maxResults: number = 10
): Promise<Source[]> {
  try {
    const searchResults = await exa.searchAndContents(query, {
      numResults: maxResults,
      text: true,
      highlights: true,
      summary: true
    })

    return searchResults.results.map(result => ({
      title: result.title || '',
      url: result.url || '',
      snippet: result.summary || result.text?.substring(0, 200) + '...' || '',
      favicon: `https://www.google.com/s2/favicons?domain=${new URL(result.url).hostname}`
    }))
  } catch (error) {
    console.error('Exa search error:', error)
    return []
  }
}

export async function findSimilarContent(
  url: string,
  maxResults: number = 5
): Promise<Source[]> {
  try {
    const searchResults = await exa.findSimilarAndContents(url, {
      numResults: maxResults,
      text: true,
      summary: true
    })

    return searchResults.results.map(result => ({
      title: result.title || '',
      url: result.url || '',
      snippet: result.summary || result.text?.substring(0, 200) + '...' || '',
      favicon: `https://www.google.com/s2/favicons?domain=${new URL(result.url).hostname}`
    }))
  } catch (error) {
    console.error('Exa similar content error:', error)
    return []
  }
}

export async function getContentFromExa(urls: string[]): Promise<Array<{
  url: string
  title: string
  content: string
  error?: string
}>> {
  try {
    const results = await exa.getContents(urls, {
      text: true,
      summary: true
    })

    return results.results.map(result => ({
      url: result.url || '',
      title: result.title || '',
      content: result.text || result.summary || '',
    }))
  } catch (error) {
    console.error('Exa content retrieval error:', error)
    return urls.map(url => ({
      url,
      title: '',
      content: '',
      error: error instanceof Error ? error.message : 'Unknown error'
    }))
  }
}

// Enhanced search that combines neural and keyword search
export async function enhancedSearch(
  query: string,
  maxResults: number = 10
): Promise<Source[]> {
  try {
    // Use neural search for better semantic understanding
    const neuralResults = await exa.searchAndContents(query, {
      numResults: Math.ceil(maxResults / 2),
      text: true,
      summary: true,
      useAutoprompt: true, // Let Exa optimize the query
      type: 'neural'
    })

    // Use keyword search for exact matches
    const keywordResults = await exa.searchAndContents(query, {
      numResults: Math.floor(maxResults / 2),
      text: true,
      summary: true,
      type: 'keyword'
    })

    // Combine and deduplicate results
    const allResults = [...neuralResults.results, ...keywordResults.results]
    const uniqueResults = allResults.filter((result, index, self) => 
      index === self.findIndex(r => r.url === result.url)
    )

    return uniqueResults.slice(0, maxResults).map(result => ({
      title: result.title || '',
      url: result.url || '',
      snippet: result.summary || result.text?.substring(0, 200) + '...' || '',
      favicon: `https://www.google.com/s2/favicons?domain=${new URL(result.url).hostname}`
    }))
  } catch (error) {
    console.error('Enhanced search error:', error)
    // Fallback to simple search
    return await searchWithExa(query, maxResults)
  }
}