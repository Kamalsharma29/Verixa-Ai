import { Pinecone } from '@pinecone-database/pinecone'
import { EmbeddingResult, CrawlResult } from '@/types'
import { generateQueryEmbedding, cosineSimilarity } from './embeddings'

// Initialize Pinecone only if API key is available
let pinecone: Pinecone | null = null
let indexName = ''

if (process.env.PINECONE_API_KEY) {
  pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
  })
  indexName = process.env.PINECONE_INDEX_NAME || 'verixa-ai'
}

export async function storeInVectorDB(
  embeddings: EmbeddingResult[],
  crawlResults: CrawlResult[]
): Promise<void> {
  try {
    if (pinecone && indexName) {
      const index = pinecone.index(indexName)
      
      const vectors = embeddings.map((embedding, i) => ({
        id: `doc-${Date.now()}-${i}`,
        values: embedding.embedding,
        metadata: {
          text: embedding.text,
          url: crawlResults[i]?.url || '',
          title: crawlResults[i]?.title || '',
          timestamp: Date.now()
        }
      }))

      await index.upsert(vectors)
    } else {
      // Fallback to in-memory storage
      await storeInMemoryVectorDB(embeddings, crawlResults)
    }
  } catch (error) {
    console.error('Vector DB storage error:', error)
    // Fallback to in-memory storage on error
    await storeInMemoryVectorDB(embeddings, crawlResults)
  }
}

export async function searchVectorDB(
  query: string,
  topK: number = 5
): Promise<Array<{ content: string; url: string; title: string; score: number }>> {
  try {
    if (pinecone && indexName) {
      const queryEmbedding = await generateQueryEmbedding(query)
      const index = pinecone.index(indexName)
      
      const searchResults = await index.query({
        vector: queryEmbedding,
        topK,
        includeMetadata: true
      })

      return searchResults.matches?.map(match => ({
        content: match.metadata?.text as string || '',
        url: match.metadata?.url as string || '',
        title: match.metadata?.title as string || '',
        score: match.score || 0
      })) || []
    } else {
      // Fallback to in-memory search
      return await searchInMemoryVectorDB(query, topK)
    }
  } catch (error) {
    console.error('Vector DB search error:', error)
    // Fallback to in-memory search on error
    return await searchInMemoryVectorDB(query, topK)
  }
}

// Fallback in-memory vector search when Pinecone is not available
class InMemoryVectorStore {
  private vectors: Array<{
    id: string
    embedding: number[]
    metadata: {
      text: string
      url: string
      title: string
      timestamp: number
    }
  }> = []

  store(embeddings: EmbeddingResult[], crawlResults: CrawlResult[]): void {
    const vectors = embeddings.map((embedding, i) => ({
      id: `doc-${Date.now()}-${i}`,
      embedding: embedding.embedding,
      metadata: {
        text: embedding.text,
        url: crawlResults[i]?.url || '',
        title: crawlResults[i]?.title || '',
        timestamp: Date.now()
      }
    }))

    this.vectors.push(...vectors)
    
    // Keep only the most recent 1000 vectors to prevent memory issues
    if (this.vectors.length > 1000) {
      this.vectors = this.vectors
        .sort((a, b) => b.metadata.timestamp - a.metadata.timestamp)
        .slice(0, 1000)
    }
  }

  async search(
    queryEmbedding: number[],
    topK: number = 5
  ): Promise<Array<{ content: string; url: string; title: string; score: number }>> {
    const similarities = this.vectors.map(vector => ({
      ...vector.metadata,
      content: vector.metadata.text,
      score: cosineSimilarity(queryEmbedding, vector.embedding)
    }))

    return similarities
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
  }
}

const inMemoryStore = new InMemoryVectorStore()

export async function storeInMemoryVectorDB(
  embeddings: EmbeddingResult[],
  crawlResults: CrawlResult[]
): Promise<void> {
  inMemoryStore.store(embeddings, crawlResults)
}

export async function searchInMemoryVectorDB(
  query: string,
  topK: number = 5
): Promise<Array<{ content: string; url: string; title: string; score: number }>> {
  try {
    const queryEmbedding = await generateQueryEmbedding(query)
    return await inMemoryStore.search(queryEmbedding, topK)
  } catch (error) {
    console.error('In-memory vector search error:', error)
    return []
  }
}