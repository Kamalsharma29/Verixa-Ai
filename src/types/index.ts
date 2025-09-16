export interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
  sources?: Source[]
}

export interface Source {
  title: string
  url: string
  snippet: string
  favicon?: string
}

export interface SearchResult {
  response: string
  sources: Source[]
}

export interface CrawlResult {
  url: string
  title: string
  content: string
  error?: string
}

export interface EmbeddingResult {
  embedding: number[]
  text: string
}

export interface SearchRequest {
  query: string
  maxResults?: number
}

export interface CrawlRequest {
  urls: string[]
}

export interface EmbedRequest {
  texts: string[]
}