declare module 'google-search-results-nodejs' {
  export class GoogleSearch {
    constructor(apiKey: string)
    
    json(
      params: {
        q: string
        num?: number
        hl?: string
        gl?: string
        tbm?: string
        [key: string]: any
      },
      callback: (data: any) => void
    ): void
  }

  export interface SearchResult {
    organic_results?: Array<{
      title: string
      link: string
      snippet: string
      favicon?: string
    }>
    news_results?: Array<{
      title: string
      link: string
      snippet: string
      thumbnail?: string
    }>
    error?: string
  }
}